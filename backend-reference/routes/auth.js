// backend-reference/routes/auth.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

router.post("/login", async (req, res, next) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) return res.status(400).json({ error: "Informe e-mail e senha" });
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET não configurado no servidor" });
    }

    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, nome: user.nome, role: user.role },
    });

  } catch (err) {
    next(err);
  }
});

router.post("/patient-login", async (req, res, next) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) return res.status(400).json({ error: "Informe e-mail e senha" });
    const [rows] = await pool.query(
      "SELECT id, nome, email, senha_hash FROM pacientes WHERE email = ?",
      [email],
    );
    const patient = rows[0];
    if (!patient?.senha_hash || !(await bcrypt.compare(senha, patient.senha_hash))) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET não configurado no servidor" });
    }
    const token = jwt.sign(
      { id: patient.id, patientId: patient.id, email: patient.email, role: "paciente" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );
    res.json({
      token,
      user: { id: patient.id, email: patient.email, nome: patient.nome, role: "paciente" },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
