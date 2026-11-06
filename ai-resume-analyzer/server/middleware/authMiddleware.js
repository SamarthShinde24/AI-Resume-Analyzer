import { verifyToken } from "../services/authService.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Please provide a valid Bearer token." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Session expired or invalid token. Please log in again." });
  }

  req.user = decoded;
  next();
}

/**
 * Role-Based Access Control (RBAC) middleware.
 * Restricts access to users holding one of the required roles (e.g. "recruiter", "admin").
 * Returns 401 when unauthenticated and 403 when user lacks the required role.
 *
 * @param  {...string|string[]} roles Allowed roles (e.g. requireRole("recruiter", "admin"))
 */
export function requireRole(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    // If req.user is not yet decoded by preceding requireAuth, verify Bearer token
    if (!req.user) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Authentication required. Please provide a valid Bearer token.",
        });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          error: "Session expired or invalid token. Please log in again.",
        });
      }
      req.user = decoded;
    }

    const userRole = req.user.role || "job_seeker";
    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. This endpoint is restricted to [${allowed.join(
          ", "
        )}] accounts. Current role: ${userRole}.`,
        requiredRoles: allowed,
        currentRole: userRole,
      });
    }

    next();
  };
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}
