/**
 * NatureTrails - Booking Cancellation & Refund Policy Engine
 * 
 * Policy Rules:
 *  - 7 or more days before trip (>= 168 hours): 90% refund
 *  - 3 to 6 days before trip (>= 72 hours and < 168 hours): 50% refund
 *  - Within 72 hours of trip (< 72 hours): 0% refund (Non-refundable)
 *  - Trip already started / passed: Cancellation not permitted
 */

const CANCELLATION_RULES = [
  {
    minHours: 168, // 7 days * 24h
    maxHours: Infinity,
    refundPercentage: 90,
    label: '7 or more days before trip',
    description: 'Eligible for 90% refund of the total booking amount.'
  },
  {
    minHours: 72, // 3 days * 24h
    maxHours: 168,
    refundPercentage: 50,
    label: '3 to 6 days before trip',
    description: 'Eligible for 50% refund of the total booking amount.'
  },
  {
    minHours: 0,
    maxHours: 72,
    refundPercentage: 0,
    label: 'Within 72 hours of trip',
    description: 'Non-refundable under the standard cancellation policy.'
  }
];

/**
 * Evaluates whether a booking can be cancelled and calculates refund eligibility.
 * 
 * @param {string|Date} travelDateInput - The travel date string (YYYY-MM-DD) or Date object
 * @param {number} totalPaidAmount - The total amount paid for the booking
 * @param {Date} [currentTime] - Optional server current time for testing
 * @returns {object} Cancellation calculation summary
 */
const evaluateCancellation = (travelDateInput, totalPaidAmount = 0, currentTime = new Date()) => {
  if (!travelDateInput) {
    return {
      canCancel: false,
      reason: 'Invalid travel date specified for this booking.',
      refundPercentage: 0,
      refundAmount: 0
    };
  }

  // Parse travel date to start of travel day (00:00:00 local time)
  let travelDate;
  if (typeof travelDateInput === 'string') {
    // If format is YYYY-MM-DD
    const parts = travelDateInput.split('T')[0].split('-');
    if (parts.length === 3) {
      travelDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0);
    } else {
      travelDate = new Date(travelDateInput);
    }
  } else {
    travelDate = new Date(travelDateInput);
  }

  const now = new Date(currentTime);
  const diffMs = travelDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.max(0, Math.floor(diffHours / 24));

  // If travel date has already passed or is today (trip in progress/finished)
  if (diffMs <= 0) {
    return {
      canCancel: false,
      reason: 'Cancellation is not allowed after the trip has already started or ended.',
      hoursBeforeTrip: 0,
      daysBeforeTrip: 0,
      refundPercentage: 0,
      refundAmount: 0,
      policyApplied: 'Trip Expired / In Progress'
    };
  }

  // Find matching rule
  let matchedRule = CANCELLATION_RULES.find(
    rule => diffHours >= rule.minHours && diffHours < rule.maxHours
  );

  if (!matchedRule) {
    matchedRule = CANCELLATION_RULES[CANCELLATION_RULES.length - 1];
  }

  const refundPercentage = matchedRule.refundPercentage;
  const rawRefundAmount = (Number(totalPaidAmount) * refundPercentage) / 100;
  const refundAmount = Math.round(rawRefundAmount * 100) / 100; // 2 decimal precision

  return {
    canCancel: true,
    isEligible: true,
    hoursBeforeTrip: Math.round(diffHours * 10) / 10,
    daysBeforeTrip: diffDays,
    refundPercentage,
    refundAmount,
    policyLabel: matchedRule.label,
    policyApplied: matchedRule.description,
    rules: CANCELLATION_RULES
  };
};

module.exports = {
  CANCELLATION_RULES,
  evaluateCancellation
};
