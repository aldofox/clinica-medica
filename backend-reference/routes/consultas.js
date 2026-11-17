// backend-reference/routes/consultas.js
const router = require("express").Router();
const pool = require("../config/db");
const { authRequired, adminOnly, staffOnly } = require("../middleware/auth");
const { logAudit } = require("../utils/audit");

router.use(authRequired);

router.get("/minhas", async (req, res, next) => {
  try {
    if (req.user.role !== "paciente") {
      return res.status(403).json({ error: "Acesso restrito a pacientes" });
    }
    const [rows] = await pool.query(
      `
      SELECT c.id, c.data_hora, c.status, c.observacoes,
             c.forma_pagamento, c.status_pagamento, c.valor_consulta,
             m.nome AS medico_nome, e.nome AS especialidade_nome
      FROM consultas c
      JOIN medicos m ON m.id = c.medico_id
      JOIN especialidades e ON e.id = m.especialidade_id
      WHERE c.paciente_id = ?
      ORDER BY c.data_hora DESC
      LIMIT 20
    `,
      [req.user.patientId],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.put("/minhas/:id/cancelar", async (req, res, next) => {
  try {
    if (req.user.role !== "paciente") {
      return res.status(403).json({ error: "Acesso restrito a pacientes" });
    }
    const [result] = await pool.query(
      `UPDATE consultas
       SET status = 'cancelada'
       WHERE id = ? AND paciente_id = ?
         AND status IN ('agendada', 'confirmada')
         AND data_hora > NOW()`,
      [req.params.id, req.user.patientId],
    );
    if (result.affectedRows === 0) {
      const error = new Error(
        "A consulta não existe, não pertence ao paciente ou não pode mais ser cancelada.",
      );
      error.status = 409;
      error.code = "CANCELLATION_NOT_ALLOWED";
      throw error;
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const pacienteId = Number(req.query.pacienteId);
    const params = [];
    const filter = pacienteId ? "WHERE c.paciente_id = ?" : "";
    if (pacienteId) params.push(pacienteId);
    const limit = pacienteId ? "LIMIT 10" : "";
    const [rows] = await pool.query(
      `
      SELECT c.*,
             m.nome AS medico_nome, m.crm,
             e.id AS especialidade_id, e.nome AS especialidade_nome,
             p.nome AS paciente_nome, p.cpf AS paciente_cpf, p.telefone AS paciente_telefone
      FROM consultas c
      JOIN medicos m     ON m.id = c.medico_id
      JOIN especialidades e ON e.id = m.especialidade_id
      JOIN pacientes p   ON p.id = c.paciente_id
      ${filter}
      ORDER BY c.data_hora DESC
      ${limit}
    `,
      params,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/", staffOnly, async (req, res, next) => {
  try {
    const {
      medico_id,
      paciente_id,
      data_hora,
      status = "agendada",
      observacoes,
      forma_pagamento = null,
      status_pagamento = "pendente",
      valor_consulta = null,
    } = req.body;
    if (
      !Number.isInteger(medico_id) ||
      medico_id <= 0 ||
      !Number.isInteger(paciente_id) ||
      paciente_id <= 0 ||
      !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(data_hora)
    ) {
      const error = new Error("Informe médico, paciente e data/hora válidos.");
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    if (!["agendada", "confirmada"].includes(status)) {
      const error = new Error("O status inicial da consulta é inválido.");
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    if (
      (forma_pagamento !== null &&
        !["pix", "cartao_credito", "convenio"].includes(forma_pagamento)) ||
      !["pendente", "pago", "vencido"].includes(status_pagamento) ||
      (valor_consulta !== null &&
        (typeof valor_consulta !== "number" ||
          !Number.isFinite(valor_consulta) ||
          valor_consulta < 0))
    ) {
      const error = new Error("Os dados de pagamento informados são inválidos.");
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    if (new Date(data_hora.replace(" ", "T")) <= new Date()) {
      const error = new Error("A consulta deve ser agendada para uma data futura.");
      error.status = 400;
      error.code = "PAST_APPOINTMENT";
      throw error;
    }
    const [[available]] = await pool.query(
      `SELECT id
       FROM horarios_disponiveis
       WHERE medico_id = ?
         AND dia_semana = DAYOFWEEK(?) - 1
         AND TIME(?) >= hora_inicio
         AND TIME(?) < hora_fim
         AND MINUTE(?) % 30 = 0
       LIMIT 1`,
      [medico_id, data_hora.slice(0, 10), data_hora, data_hora, data_hora],
    );
    if (!available) {
      const error = new Error("O horário não está disponível para este profissional.");
      error.status = 409;
      error.code = "TIME_SLOT_UNAVAILABLE";
      throw error;
    }
    const [[doctor]] = await pool.query("SELECT id, especialidade_id FROM medicos WHERE id = ?", [
      medico_id,
    ]);
    const [[patient]] = await pool.query("SELECT id FROM pacientes WHERE id = ?", [paciente_id]);
    if (!doctor) {
      const error = new Error("Profissional não encontrado.");
      error.status = 404;
      error.code = "DOCTOR_NOT_FOUND";
      throw error;
    }
    if (!patient) {
      const error = new Error("Paciente não encontrado.");
      error.status = 404;
      error.code = "PATIENT_NOT_FOUND";
      throw error;
    }
    const [r] = await pool.query(
      `INSERT INTO consultas
       (medico_id, paciente_id, data_hora, status, observacoes, forma_pagamento,
        status_pagamento, valor_consulta, criada_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medico_id,
        paciente_id,
        data_hora,
        status,
        observacoes || null,
        forma_pagamento,
        status_pagamento,
        valor_consulta,
        req.user.id,
      ],
    );
    await logAudit(req.user, "criou", "consulta", r.insertId, {
      medico_id,
      paciente_id,
      data_hora,
      status,
      forma_pagamento,
      status_pagamento,
      valor_consulta,
    });
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      e.status = 409;
      e.code = "APPOINTMENT_CONFLICT";
      e.message = "O profissional já possui um agendamento nesse horário.";
    }
    next(e);
  }
});

router.put("/:id", staffOnly, async (req, res, next) => {
  try {
    const { data_hora, status, observacoes, forma_pagamento, status_pagamento, valor_consulta } =
      req.body;
    if (
      (forma_pagamento !== undefined &&
        !["pix", "cartao_credito", "convenio"].includes(forma_pagamento)) ||
      (status_pagamento !== undefined &&
        !["pendente", "pago", "vencido"].includes(status_pagamento)) ||
      (valor_consulta !== undefined &&
        (typeof valor_consulta !== "number" ||
          !Number.isFinite(valor_consulta) ||
          valor_consulta < 0))
    ) {
      const error = new Error("Os dados de pagamento informados são inválidos.");
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    const [beforeRows] = await pool.query(
      "SELECT status, data_hora, forma_pagamento, status_pagamento, valor_consulta FROM consultas WHERE id=?",
      [req.params.id],
    );
    await pool.query(
      `UPDATE consultas
       SET data_hora = COALESCE(?, data_hora),
           status = COALESCE(?, status),
           observacoes = COALESCE(?, observacoes),
           forma_pagamento = COALESCE(?, forma_pagamento),
           status_pagamento = COALESCE(?, status_pagamento),
           valor_consulta = COALESCE(?, valor_consulta)
       WHERE id=?`,
      [
        data_hora || null,
        status || null,
        observacoes || null,
        forma_pagamento ?? null,
        status_pagamento ?? null,
        valor_consulta ?? null,
        req.params.id,
      ],
    );
    await logAudit(req.user, "editou", "consulta", req.params.id, {
      anterior: beforeRows[0] || null,
      alteracoes: {
        data_hora,
        status,
        observacoes,
        forma_pagamento,
        status_pagamento,
        valor_consulta,
      },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM consultas WHERE id=?", [req.params.id]);
    await logAudit(req.user, "excluiu", "consulta", req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
