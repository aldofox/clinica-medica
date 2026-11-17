// backend-reference/routes/pacientes.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { authRequired, adminOnly, staffOnly } = require("../middleware/auth");
const { logAudit } = require("../utils/audit");

router.use(authRequired);

router.get("/me", async (req, res, next) => {
  try {
    if (req.user.role !== "paciente") {
      return res.status(403).json({ error: "Acesso restrito a pacientes" });
    }
    const [rows] = await pool.query(
      "SELECT id, nome, cpf, telefone, email, data_nascimento FROM pacientes WHERE id = ?",
      [req.user.patientId],
    );
    if (!rows[0]) return res.status(404).json({ error: "Paciente não encontrado" });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.put("/me", async (req, res, next) => {
  try {
    if (req.user.role !== "paciente") {
      return res.status(403).json({ error: "Acesso restrito a pacientes" });
    }
    const { telefone, email, data_nascimento } = req.body || {};
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Informe um e-mail válido" });
    }
    if (data_nascimento && new Date(`${data_nascimento}T00:00:00`) > new Date()) {
      return res.status(400).json({ error: "A data de nascimento não pode estar no futuro" });
    }
    await pool.query(
      "UPDATE pacientes SET telefone = ?, email = ?, data_nascimento = ? WHERE id = ?",
      [telefone || null, email || null, data_nascimento || null, req.user.patientId],
    );
    const [rows] = await pool.query(
      "SELECT id, nome, cpf, telefone, email, data_nascimento FROM pacientes WHERE id = ?",
      [req.user.patientId],
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.patch("/me/password", async (req, res, next) => {
  try {
    if (req.user.role !== "paciente") {
      return res.status(403).json({ error: "Acesso restrito a pacientes" });
    }
    const { senha_atual, nova_senha } = req.body || {};
    if (!senha_atual || !nova_senha || nova_senha.length < 8) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 8 caracteres" });
    }
    const [rows] = await pool.query(
      "SELECT senha_hash FROM pacientes WHERE id = ?",
      [req.user.patientId],
    );
    if (!rows[0]?.senha_hash || !(await bcrypt.compare(senha_atual, rows[0].senha_hash))) {
      return res.status(401).json({ error: "A senha atual está incorreta" });
    }
    const senhaHash = await bcrypt.hash(nova_senha, 10);
    await pool.query("UPDATE pacientes SET senha_hash = ? WHERE id = ?", [
      senhaHash,
      req.user.patientId,
    ]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get("/", staffOnly, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nome, cpf, telefone, email, data_nascimento, (senha_hash IS NOT NULL) AS acesso_ativo FROM pacientes ORDER BY nome",
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.post("/", staffOnly, async (req, res, next) => {
  try {
    const { nome, cpf, telefone, email, senha, data_nascimento } = req.body;
    if (!nome || !cpf) return res.status(400).json({ error: "Nome e CPF são obrigatórios" });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Informe um e-mail válido" });
    }
    if (senha && senha.length < 8) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres" });
    }
    const senhaHash = senha ? await bcrypt.hash(senha, 10) : null;
    const [r] = await pool.query(
      "INSERT INTO pacientes (nome, cpf, telefone, email, senha_hash, data_nascimento) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, cpf, telefone, email, senhaHash, data_nascimento || null],
    );
    await logAudit(req.user, "criou", "paciente", r.insertId, { nome, cpf });
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});

router.put("/:id", staffOnly, async (req, res, next) => {
  try {
    const { nome, cpf, telefone, email, data_nascimento, senha } = req.body;
    if (!nome || !cpf) return res.status(400).json({ error: "Nome e CPF são obrigatórios" });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Informe um e-mail válido" });
    }
    if (senha && senha.length < 8) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres" });
    }
    if (senha) {
      const senhaHash = await bcrypt.hash(senha, 10);
      await pool.query(
        "UPDATE pacientes SET nome=?, cpf=?, telefone=?, email=?, data_nascimento=?, senha_hash=? WHERE id=?",
        [nome, cpf, telefone || null, email || null, data_nascimento || null, senhaHash, req.params.id],
      );
      await logAudit(req.user, "editou", "paciente", req.params.id, { nome, cpf, acesso: "atualizado" });
      return res.json({ ok: true });
    }
    await pool.query(
      "UPDATE pacientes SET nome=?, cpf=?, telefone=?, email=?, data_nascimento=? WHERE id=?",
      [nome, cpf, telefone || null, email || null, data_nascimento || null, req.params.id],
    );
    await logAudit(req.user, "editou", "paciente", req.params.id, { nome, cpf });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM pacientes WHERE id=?", [req.params.id]);
    await logAudit(req.user, "excluiu", "paciente", req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
