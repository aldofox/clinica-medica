const pool = require("../config/db");

async function logAudit(user, action, entity, entityId, details = {}) {
  await pool.query(
    `INSERT INTO auditoria
     (usuario_id, usuario_nome, usuario_role, acao, entidade, entidade_id, detalhes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.nome || user.email || "Usuário",
      user.role,
      action,
      entity,
      entityId || null,
      JSON.stringify(details),
    ],
  );
}

module.exports = { logAudit };
