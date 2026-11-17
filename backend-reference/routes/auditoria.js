const router = require("express").Router();
const pool = require("../config/db");
const { authRequired, staffOnly } = require("../middleware/auth");

router.use(authRequired, staffOnly);

router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
    const [rows] = await pool.query(
      `SELECT id, usuario_nome, usuario_role, acao, entidade, entidade_id, detalhes, criado_em
       FROM auditoria ORDER BY criado_em DESC LIMIT ?`,
      [limit],
    );
    res.json(rows.map((row) => ({
      ...row,
      detalhes: typeof row.detalhes === "string"
        ? JSON.parse(row.detalhes)
        : (row.detalhes || {}),
    })));
  } catch (error) { next(error); }
});

module.exports = router;
