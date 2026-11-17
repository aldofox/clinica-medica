// backend-reference/routes/especialidades.js
const router = require("express").Router();
const pool = require("../config/db");
const { authRequired, adminOnly, staffOnly } = require("../middleware/auth");
const { logAudit } = require("../utils/audit");

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM especialidades ORDER BY nome");
    res.json(rows);
  } catch (e) { next(e); }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM especialidades WHERE slug = ?", [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ error: "Não encontrada" });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.post("/", staffOnly, async (req, res, next) => {
  try {
    const { nome, descricao, icone } = req.body;
    const [r] = await pool.query(
      "INSERT INTO especialidades (nome, slug, descricao, icone) VALUES (?, ?, ?, ?)",
      [nome, slugify(nome), descricao, icone],
    );
    await logAudit(req.user, "criou", "especialidade", r.insertId, { nome });
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});

router.put("/:id", staffOnly, async (req, res, next) => {
  try {
    const { nome, descricao, icone } = req.body;
    await pool.query(
      "UPDATE especialidades SET nome=?, slug=?, descricao=?, icone=? WHERE id=?",
      [nome, slugify(nome), descricao, icone, req.params.id],
    );
    await logAudit(req.user, "editou", "especialidade", req.params.id, { nome });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM especialidades WHERE id=?", [req.params.id]);
    await logAudit(req.user, "excluiu", "especialidade", req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
