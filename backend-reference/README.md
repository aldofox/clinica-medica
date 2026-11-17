# Backend — ClínicaSaúde (Node.js + Express + MySQL)

Backend completo para o sistema de agendamento médico, com autenticação JWT, CRUD de médicos/especialidades/pacientes/consultas e relacionamentos via Foreign Keys.

> Este backend roda separadamente do frontend React/Vite e fornece os dados reais do MySQL.

---

## Passo 1 — Estrutura de diretórios

```
backend-reference/
├── package.json
├── server.js                  ← ponto de entrada Express
├── config/
│   └── db.js                  ← conexão MySQL (pool)
├── middleware/
│   └── auth.js                ← verificação de JWT
├── routes/
│   ├── auth.js                ← /api/auth/login
│   ├── especialidades.js      ← CRUD /api/especialidades
│   ├── medicos.js             ← CRUD /api/medicos
│   ├── pacientes.js           ← CRUD /api/pacientes
│   └── consultas.js           ← CRUD /api/consultas
└── db/
    ├── schema.sql             ← CREATE DATABASE + TABLES + FKs
    └── seed.sql               ← dados iniciais (admin + especialidades)
```

## Passo 2 — Pré-requisitos

- Node.js 18+
- MySQL 8+ instalado e rodando

## Passo 3 — Criar o banco de dados

No terminal, dentro de `backend-reference/`:

```bash
mysql -u root -p < db/schema.sql
mysql -u root -p < db/seed.sql
```

Isso cria o banco `clinica_saude`, todas as tabelas com seus relacionamentos e insere um usuário admin padrão (`admin@clinica.com` / `admin123`) + especialidades de exemplo.

## Passo 4 — Configurar variáveis de ambiente

Crie um arquivo `.env` em `backend-reference/`:

```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=sua_senha_mysql
DB_NAME=clinica_saude
JWT_SECRET=troque_por_uma_string_aleatoria_longa
```

## Passo 5 — Instalar e rodar

```bash
cd backend-reference
npm install
npm run dev      # com nodemon
# ou
npm start        # produção
```

A API ficará em `http://localhost:3001`.

## Passo 6 — Configurar o frontend

Crie um arquivo `.env` na raiz do projeto frontend com:

```
VITE_API_URL=http://localhost:3001/api
```

O frontend já usa os endpoints desta API para login, especialidades, médicos,
pacientes e consultas. O backend aceita requisições de `http://localhost:5173`
por padrão.

---

## Modelo de Dados (Relacionamentos)

```
usuarios (id, email, senha_hash, role)
   └── role: 'admin' | 'secretaria'

especialidades (id, nome, slug, descricao, icone)
   └── 1 ──┐
           │
medicos (id, nome, crm, especialidade_id FK, email, telefone, bio, foto)
           │
           └─── N

pacientes (id, nome, cpf, telefone, email, data_nascimento)

consultas (id, medico_id FK, paciente_id FK, data_hora, status, observacoes,
           forma_pagamento, status_pagamento, valor_consulta, criada_por FK)
   ├── medico_id    → medicos.id     ON DELETE RESTRICT
   ├── paciente_id  → pacientes.id   ON DELETE RESTRICT
   └── criada_por   → usuarios.id    ON DELETE SET NULL

Pagamentos usam `forma_pagamento` (`pix`, `cartao_credito` ou `convenio`),
`status_pagamento` (`pendente`, `pago` ou `vencido`) e `valor_consulta`.
Para bancos já criados, aplique `db/migrations/001_consulta_pagamentos.sql`.
```

## Endpoints

| Método | Rota                    | Auth | Descrição                               |
| ------ | ----------------------- | ---- | --------------------------------------- |
| POST   | /api/auth/login         | -    | Login (retorna JWT)                     |
| GET    | /api/especialidades     | -    | Lista todas                             |
| POST   | /api/especialidades     | ✓    | Cria especialidade                      |
| PUT    | /api/especialidades/:id | ✓    | Atualiza                                |
| DELETE | /api/especialidades/:id | ✓    | Exclui                                  |
| GET    | /api/medicos            | -    | Lista (com filtro `?especialidade_id=`) |
| GET    | /api/medicos/:id        | -    | Detalhe                                 |
| POST   | /api/medicos            | ✓    | Cria                                    |
| PUT    | /api/medicos/:id        | ✓    | Atualiza                                |
| DELETE | /api/medicos/:id        | ✓    | Exclui                                  |
| GET    | /api/pacientes          | ✓    | Lista                                   |
| POST   | /api/pacientes          | ✓    | Cria                                    |
| GET    | /api/consultas          | ✓    | Lista (join médico/paciente)            |
| POST   | /api/consultas          | ✓    | Cria consulta                           |
| PUT    | /api/consultas/:id      | ✓    | Atualiza (ex. mudar status)             |
| DELETE | /api/consultas/:id      | ✓    | Cancela/exclui                          |

Auth → enviar header `Authorization: Bearer <token>`.
