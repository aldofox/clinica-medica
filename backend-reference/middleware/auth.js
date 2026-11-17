// backend-reference/middleware/auth.js
const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token ausente" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Acesso restrito a administradores" });
  next();
}

function staffOnly(req, res, next) {
  if (!["admin", "secretaria"].includes(req.user?.role))
    return res.status(403).json({ error: "Acesso restrito à equipe administrativa" });
  next();
}

module.exports = { authRequired, adminOnly, staffOnly };
