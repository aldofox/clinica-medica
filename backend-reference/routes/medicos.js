// backend-reference/routes/medicos.js
const router = require("express").Router();
const pool = require("../config/db");
const { authRequired, adminOnly, staffOnly } = require("../middleware/auth");
const { logAudit } = require("../utils/audit");

router.get("/", async (req, res, next) => {
  try {
    const especialidadeId = req.query.especialidadeId || req.query.especialidade_id;
    let sql = `
      SELECT m.*, e.nome AS especialidade_nome, e.slug AS especialidade_slug, e.icone AS especialidade_icone
      FROM medicos m
      JOIN especialidades e ON e.id = m.especialidade_id
    `;
    const params = [];
    if (especialidadeId) {
      sql += " WHERE m.especialidade_id = ?";
      params.push(especialidadeId);
    }
    sql += " ORDER BY m.nome";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

router.get("/:id/horarios", async (req, res, next) => {
  try {
    const { data } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Informe uma data válida." },
      });

    }
    const [schedule] = await pool.query(
      `SELECT hora_inicio, hora_fim
       FROM horarios_disponiveis
       WHERE medico_id = ? AND dia_semana = DAYOFWEEK(?) - 1`,
      [req.params.id, data],
    );
    const [booked] = await pool.query(
      `SELECT TIME_FORMAT(data_hora, '%H:%i') AS hora
       FROM consultas
       WHERE medico_id = ? AND DATE(data_hora) = ? AND status <> 'cancelada'`,
      [req.params.id, data],
    );
    const bookedTimes = new Set(booked.map((item) => item.hora));
    const slots = [];
    for (const range of schedule) {
      const start = Number(String(range.hora_inicio).slice(0, 2)) * 60 +
        Number(String(range.hora_inicio).slice(3, 5));
      const end = Number(String(range.hora_fim).slice(0, 2)) * 60 +
        Number(String(range.hora_fim).slice(3, 5));
      for (let minutes = start; minutes < end; minutes += 30) {
        const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
        const minute = String(minutes % 60).padStart(2, "0");
        const slot = `${hour}:${minute}`;
        if (!bookedTimes.has(slot)) slots.push(slot);
      }
    }
    res.json({ horarios: slots });
  } catch (e) { next(e); }
});

router.get("/:id/agenda", authRequired, staffOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, dia_semana, TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(hora_fim, '%H:%i') AS hora_fim
       FROM horarios_disponiveis
       WHERE medico_id = ? ORDER BY dia_semana, hora_inicio`,
      [req.params.id],
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.put("/:id/agenda", authRequired, staffOnly, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const horarios = Array.isArray(req.body?.horarios) ? req.body.horarios : [];
    const normalized = horarios.map((item) => ({
      dia_semana: Number(item.dia_semana),
      hora_inicio: item.hora_inicio,
      hora_fim: item.hora_fim,
    }));
    const timePattern = /^\d{2}:\d{2}$/;
    for (const item of normalized) {
      if (
        !Number.isInteger(item.dia_semana) || item.dia_semana < 0 || item.dia_semana > 6 ||
        !timePattern.test(item.hora_inicio) || !timePattern.test(item.hora_fim) ||
        item.hora_inicio >= item.hora_fim
      ) {
        const error = new Error("Informe dias e intervalos de horário válidos.");
        error.status = 400;
        error.code = "INVALID_SCHEDULE";
        throw error;
      }
    }
    for (let day = 0; day <= 6; day += 1) {
      const dayItems = normalized
        .filter((item) => item.dia_semana === day)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      for (let index = 1; index < dayItems.length; index += 1) {
        if (dayItems[index].hora_inicio < dayItems[index - 1].hora_fim) {
          const error = new Error("Os intervalos do mesmo dia não podem se sobrepor.");
          error.status = 400;
          error.code = "OVERLAPPING_SCHEDULE";
          throw error;
        }
      }
    }
    await connection.beginTransaction();
    await connection.query("DELETE FROM horarios_disponiveis WHERE medico_id = ?", [req.params.id]);
    for (const item of normalized) {
      await connection.query(
        `INSERT INTO horarios_disponiveis
         (medico_id, dia_semana, hora_inicio, hora_fim) VALUES (?, ?, ?, ?)`,
        [req.params.id, item.dia_semana, `${item.hora_inicio}:00`, `${item.hora_fim}:00`],
      );
    }
    await connection.commit();
    await logAudit(req.user, "editou", "agenda_medico", req.params.id, { horarios: normalized });
    res.json({ ok: true, horarios: normalized });
  } catch (e) {
    await connection.rollback();
    next(e);
  } finally {
    connection.release();
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM medicos WHERE id=?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Não encontrado" });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.post("/", staffOnly, async (req, res, next) => {
  try {
    const { nome, crm, especialidade_id, email, telefone, bio, foto } = req.body;
    const [r] = await pool.query(
      "INSERT INTO medicos (nome, crm, especialidade_id, email, telefone, bio, foto) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nome, crm, especialidade_id, email, telefone, bio, foto],
    );
    await logAudit(req.user, "criou", "medico", r.insertId, { nome, crm });
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});

router.put("/:id", staffOnly, async (req, res, next) => {
  try {
    const { nome, crm, especialidade_id, email, telefone, bio, foto } = req.body;
    await pool.query(
      "UPDATE medicos SET nome=?, crm=?, especialidade_id=?, email=?, telefone=?, bio=?, foto=? WHERE id=?",
      [nome, crm, especialidade_id, email, telefone, bio, foto, req.params.id],
    );
    await logAudit(req.user, "editou", "medico", req.params.id, { nome, crm });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM medicos WHERE id=?", [req.params.id]);
    await logAudit(req.user, "excluiu", "medico", req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
