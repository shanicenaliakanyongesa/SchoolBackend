// Middleware to authorize based on role
export const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "authentication required" });
  if (req.user.role !== role) return res.status(403).json({ message: "forbidden" });
  next();
};

