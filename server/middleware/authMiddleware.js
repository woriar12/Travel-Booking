// Security removed: Pass-through middleware (all routes are now public)
const protect = (req, res, next) => {
  // Default mock user if needed
  req.user = req.user || {
    id: "1",
    name: "Guest User",
    email: "guest@example.com"
  };
  next();
};

module.exports = { protect };

