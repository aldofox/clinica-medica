-- =====================================================================
-- ClínicaSaúde — Schema MySQL
-- Cria o banco, todas as tabelas e seus relacionamentos (Foreign Keys)
-- Rodar:  mysql -u root -p < db/schema.sql
-- =====================================================================

DROP DATABASE IF EXISTS clinica_saude;
CREATE DATABASE clinica_saude
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clinica_saude;

-- ---------------------------------------------------------------------
-- USUARIOS (admin / secretaria)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(120)  NOT NULL,
  email         VARCHAR(160)  NOT NULL UNIQUE,
  senha_hash    VARCHAR(255)  NOT NULL,
  role          ENUM('admin','secretaria') NOT NULL DEFAULT 'secretaria',
  ativo         TINYINT(1)    NOT NULL DEFAULT 1,
  criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ESPECIALIDADES
-- ---------------------------------------------------------------------
CREATE TABLE especialidades (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100)  NOT NULL UNIQUE,
  slug          VARCHAR(120)  NOT NULL UNIQUE,
  descricao     VARCHAR(255),
  icone         VARCHAR(80)   NOT NULL DEFAULT 'fa-solid fa-stethoscope',
  criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- MEDICOS  (N especialidades → 1)
-- ---------------------------------------------------------------------
CREATE TABLE medicos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nome              VARCHAR(160) NOT NULL,
  crm               VARCHAR(40)  NOT NULL UNIQUE,
  especialidade_id  INT          NOT NULL,
  email             VARCHAR(160) NOT NULL,
  telefone          VARCHAR(30),
  bio               TEXT,
  foto              VARCHAR(500),
  criado_em         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_medico_especialidade
    FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_medicos_especialidade ON medicos(especialidade_id);

-- ---------------------------------------------------------------------
-- PACIENTES
-- ---------------------------------------------------------------------
CREATE TABLE pacientes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nome              VARCHAR(160) NOT NULL,
  cpf               VARCHAR(20)  NOT NULL UNIQUE,
  telefone          VARCHAR(30),
  email             VARCHAR(160),
  senha_hash        VARCHAR(255),
  data_nascimento   DATE,
  criado_em         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- HORARIOS DISPONIVEIS (opcional - agenda do médico)
-- ---------------------------------------------------------------------
CREATE TABLE horarios_disponiveis (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  medico_id     INT          NOT NULL,
  dia_semana    TINYINT      NOT NULL,  -- 0=Domingo ... 6=Sábado
  hora_inicio   TIME         NOT NULL,
  hora_fim      TIME         NOT NULL,
  CONSTRAINT fk_horario_medico
    FOREIGN KEY (medico_id) REFERENCES medicos(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CONSULTAS (agendamentos)
-- ---------------------------------------------------------------------
CREATE TABLE consultas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  medico_id     INT          NOT NULL,
  paciente_id   INT          NOT NULL,
  data_hora     DATETIME     NOT NULL,
  status        ENUM('agendada','confirmada','cancelada','realizada')
                NOT NULL DEFAULT 'agendada',
  observacoes   TEXT,
  forma_pagamento ENUM('pix','cartao_credito','convenio') NULL,
  status_pagamento ENUM('pendente','pago','vencido')
                NOT NULL DEFAULT 'pendente',
  valor_consulta DECIMAL(10,2) NULL,
  criada_por    INT          NULL,  -- usuário (secretaria/admin) que agendou
  criado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_consulta_medico
    FOREIGN KEY (medico_id) REFERENCES medicos(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_consulta_paciente
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_consulta_usuario
    FOREIGN KEY (criada_por) REFERENCES usuarios(id)
    ON DELETE SET NULL,
  CONSTRAINT uq_consulta_slot
    UNIQUE (medico_id, data_hora)  -- evita 2 consultas no mesmo horário p/ o mesmo médico
) ENGINE=InnoDB;

CREATE INDEX idx_consultas_data ON consultas(data_hora);
CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);

CREATE TABLE auditoria (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT NOT NULL,
  usuario_nome  VARCHAR(160) NOT NULL,
  usuario_role  ENUM('admin','secretaria') NOT NULL,
  acao          VARCHAR(30) NOT NULL,
  entidade      VARCHAR(30) NOT NULL,
  entidade_id   INT NULL,
  detalhes      JSON NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auditoria_data (criado_em),
  INDEX idx_auditoria_usuario (usuario_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- NOTIFICACOES (avisos persistentes por usuario)
-- ---------------------------------------------------------------------
CREATE TABLE notificacoes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  destinatario_tipo ENUM('usuario','paciente') NOT NULL,
  destinatario_id   INT NOT NULL,
  consulta_id       INT NULL,
  evento            VARCHAR(40) NOT NULL,
  titulo            VARCHAR(160) NOT NULL,
  mensagem          VARCHAR(500) NOT NULL,
  tipo              ENUM('info','success','warning','danger') NOT NULL DEFAULT 'info',
  lida              TINYINT(1) NOT NULL DEFAULT 0,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lida_em           DATETIME NULL,
  CONSTRAINT fk_notificacao_consulta
    FOREIGN KEY (consulta_id) REFERENCES consultas(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_notificacao_evento
    (destinatario_tipo, destinatario_id, consulta_id, evento),
  INDEX idx_notificacao_destinatario
    (destinatario_tipo, destinatario_id, lida, criado_em)
) ENGINE=InnoDB;
