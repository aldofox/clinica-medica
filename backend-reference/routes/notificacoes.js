const router = require("express").Router();
const pool = require("../config/db");
const { authRequired } = require("../middleware/auth");

router.use(authRequired);

async function syncNotifications(req) {
  const isPatient = req.user.role === "paciente";
  const recipientType = isPatient ? "paciente" : "usuario";
  const recipientId = isPatient ? req.user.patientId : req.user.id;
  const params = [];
  const filter = isPatient ? "c.paciente_id = ?" : "c.status IN ('agendada', 'cancelada')";
  if (isPatient) params.push(recipientId);

  const [appointments] = await pool.query(
    `SELECT c.id, c.data_hora, c.status, m.nome AS medico_nome,
            e.nome AS especialidade_nome
     FROM consultas c
     JOIN medicos m ON m.id = c.medico_id
     JOIN especialidades e ON e.id = m.especialidade_id
     WHERE ${filter}
     ORDER BY c.data_hora DESC`,
    params,
  );

  for (const appointment of appointments) {
    const events = [];
    if (isPatient) {
      if (["agendada", "confirmada"].includes(appointment.status) &&
          new Date(appointment.data_hora) > new Date()) {
        events.push(["upcoming", "Próxima consulta", `Consulta de ${appointment.especialidade_nome} com ${appointment.medico_nome} em ${new Date(appointment.data_hora).toLocaleString("pt-BR")}.`, "info"]);
      }
      if (appointment.status === "confirmada") {
        events.push(["confirmed", "Consulta confirmada", `Sua consulta de ${appointment.especialidade_nome} foi confirmada.`, "success"]);
      }
      if (appointment.status === "cancelada") {
        events.push(["cancelled", "Consulta cancelada", `Sua consulta de ${appointment.especialidade_nome} foi cancelada.`, "danger"]);
      }
    } else {
      if (appointment.status === "agendada") {
        events.push(["pending", "Consulta aguardando confirmação", `A consulta de ${appointment.especialidade_nome} com ${appointment.medico_nome} aguarda confirmação.`, "warning"]);
      }
      if (appointment.status === "cancelada") {
        events.push(["cancelled", "Consulta cancelada", `A consulta de ${appointment.especialidade_nome} com ${appointment.medico_nome} foi cancelada.`, "danger"]);
      }
    }
    for (const [event, title, message, type] of events) {
      await pool.query(
        `INSERT IGNORE INTO notificacoes
         (destinatario_tipo, destinatario_id, consulta_id, evento, titulo, mensagem, tipo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [recipientType, recipientId, appointment.id, event, title, message, type],
      );
    }
  }

  return { recipientType, recipientId };
}

router.get("/", async (req, res, next) => {
  try {
    const { recipientType, recipientId } = await syncNotifications(req);
    const [rows] = await pool.query(
      `SELECT id, titulo, mensagem, tipo, lida, criado_em
       FROM notificacoes
       WHERE destinatario_tipo = ? AND destinatario_id = ?
       ORDER BY lida ASC, criado_em DESC
       LIMIT 50`,
      [recipientType, recipientId],
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    const isPatient = req.user.role === "paciente";
    const [result] = await pool.query(
      `UPDATE notificacoes SET lida = 1, lida_em = NOW()
       WHERE id = ? AND destinatario_tipo = ? AND destinatario_id = ?`,
      [req.params.id, isPatient ? "paciente" : "usuario", isPatient ? req.user.patientId : req.user.id],
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Notificação não encontrada" });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.patch("/read-all", async (req, res, next) => {
  try {
    const isPatient = req.user.role === "paciente";
    await pool.query(
      `UPDATE notificacoes SET lida = 1, lida_em = NOW()
       WHERE destinatario_tipo = ? AND destinatario_id = ? AND lida = 0`,
      [isPatient ? "paciente" : "usuario", isPatient ? req.user.patientId : req.user.id],
    );
    res.json({ ok: true });
  } catch (error) { next(error); }
});

module.exports = router;
