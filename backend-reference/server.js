// backend-reference/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const especialidadesRoutes = require("./routes/especialidades");
const medicosRoutes = require("./routes/medicos");
const pacientesRoutes = require("./routes/pacientes");
const consultasRoutes = require("./routes/consultas");
const notificacoesRoutes = require("./routes/notificacoes");
const auditoriaRoutes = require("./routes/auditoria");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : "http://localhost:5173",
  }),
);
app.use(express.json());

app.get("/", (_req, res) => res.json({ name: "ClínicaSaúde API", status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/especialidades", especialidadesRoutes);
app.use("/api/medicos", medicosRoutes);
app.use("/api/pacientes", pacientesRoutes);
app.use("/api/consultas", consultasRoutes);
app.use("/api/notificacoes", notificacoesRoutes);
app.use("/api/auditoria", auditoriaRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: "Endpoint não encontrado" }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || (err.code === "ER_DUP_ENTRY" ? 409 : 500);
  res.status(status).json({
    error: {
      code: err.code || (status === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
      message: status === 500 ? "Erro interno do servidor" : err.message,
    },
  });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => console.log(`✅ API rodando em http://localhost:${PORT}`));
}

module.exports = app;
