require("dotenv").config();

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const mysql = require("mysql2/promise");
const app = require("../server");
const applicationPool = require("../config/db");

let server;
let baseUrl;
let token;
let database;
let createdAppointmentId;

function futureWeekday() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json();
  return { response, body };
}

before(async () => {
  database = await mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@clinica.com", senha: "admin123" }),
  });
  assert.equal(login.response.status, 200);
  token = login.body.token;
});

after(async () => {
  if (createdAppointmentId) {
    await database.query("DELETE FROM consultas WHERE id = ?", [createdAppointmentId]);
  }
  await database.end();
  await applicationPool.end();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("recusa consultas sem autenticação", async () => {
  const previousToken = token;
  token = null;
  const result = await request("/consultas");
  token = previousToken;
  assert.equal(result.response.status, 401);
});

test("retorna horários disponíveis para um médico", async () => {
  const result = await request(`/medicos/1/horarios?data=${futureWeekday()}`);
  assert.equal(result.response.status, 200);
  assert.ok(Array.isArray(result.body.horarios));
  assert.ok(result.body.horarios.includes("08:00"));
});

test("recusa consulta com data passada", async () => {
  const result = await request("/consultas", {
    method: "POST",
    body: JSON.stringify({
      medico_id: 1,
      paciente_id: 1,
      data_hora: "2000-01-01 08:00:00",
    }),
  });
  assert.equal(result.response.status, 400);
  assert.equal(result.body.error.code, "PAST_APPOINTMENT");
});

test("cria consulta e recusa conflito no mesmo horário", async () => {
  const date = futureWeekday();
  const payload = {
    medico_id: 1,
    paciente_id: 1,
    data_hora: `${date} 08:00:00`,
  };
  const created = await request("/consultas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  assert.equal(created.response.status, 201);
  createdAppointmentId = created.body.id;

  const conflict = await request("/consultas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  assert.equal(conflict.response.status, 409);
  assert.equal(conflict.body.error.code, "APPOINTMENT_CONFLICT");
});
