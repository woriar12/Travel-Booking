/**
 * NatureTrails - Booking Cancellation & Refund Policy Engine
 * 
 * Policy:
 *  - Flat ₹100 cancellation fee deducted for every cancelled tour booking.
 *  - Remaining amount (Total Paid - ₹100) is refunded to the customer's source account.
 *  - If total paid amount <= ₹100, cancellation fee equals total paid and refund is ₹0.
 */

const CANCELLATION_FEE = 100;

const CANCELLATION_RULES = [
  {
    minHours: 0,
    maxHours: Infinity,
    cancellationFee: CANCELLATION_FEE,
    label: 'Standard Flat Cancellation Fee',
    description: `A flat cancellation fee of ₹${CANCELLATION_FEE} is deducted. The remaining balance is refunded to your account.`
  }
];

/**
 * Evaluates whether a booking can be cancelled and calculates refund eligibility.
 * 
 * @param {string|Date} travelDateInput - The travel date string (YYYY-MM-DD) or Date object
 * @param {number} totalPaidAmount - The total amount paid for the booking
 * @param {Date} [currentTime] - Optional server current time
 * @returns {object} Cancellation calculation summary
 */
const evaluateCancellation = (travelDateInput, totalPaidAmount = 0, currentTime = new Date()) => {
  const paid = Math.max(0, Number(totalPaidAmount) || 0);
  const fee = paid > 0 ? Math.min(CANCELLATION_FEE, paid) : 0;
  const refundAmount = Math.max(0, paid - fee);
  const refundPercentage = paid > 0 ? Math.round((refundAmount / paid) * 100) : 0;

  let daysBeforeTrip = 0;
  let hoursBeforeTrip = 0;

  if (travelDateInput) {
    try {
      const parts = String(travelDateInput).split('T')[0].split('-');
      let travelDate;
      if (parts.length === 3) {
        travelDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0);
      } else {
        travelDate = new Date(travelDateInput);
      }
      const now = new Date(currentTime);
      const diffMs = travelDate.getTime() - now.getTime();
      hoursBeforeTrip = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
      daysBeforeTrip = Math.max(0, Math.floor(hoursBeforeTrip / 24));
    } catch (e) {
      // ignore
    }
  }

  return {
    canCancel: true,
    isEligible: true,
    cancellationFee: fee,
    totalPaidAmount: paid,
    hoursBeforeTrip,
    daysBeforeTrip,
    refundPercentage,
    refundAmount,
    policyLabel: 'Flat ₹100 Cancellation Fee Policy',
    policyApplied: `Flat ₹${CANCELLATION_FEE} cancellation fee deducted. Remaining ₹${refundAmount.toLocaleString()} refunded.`,
    rules: CANCELLATION_RULES
  };
};

module.exports = {
  CANCELLATION_FEE,
  CANCELLATION_RULES,
  evaluateCancellation
};
