-- =====================================================================
-- ClínicaSaúde — Seed de dados iniciais
-- Rodar APÓS schema.sql:   mysql -u root -p < db/seed.sql
-- Senha do admin: admin123  (hash bcrypt já calculado)
-- =====================================================================
USE clinica_saude;

-- Usuário admin (senha: admin123)
INSERT INTO usuarios (nome, email, senha_hash, role) VALUES
('Administrador', 'admin@clinica.com',
 '$2a$10$540f6zzmgxK88hwOI7cDrOXesBo02X7jNhTekfrlLFzWiwSixMOBW', 'admin'),
('Secretária Joana', 'secretaria@clinica.com',
 '$2a$10$540f6zzmgxK88hwOI7cDrOXesBo02X7jNhTekfrlLFzWiwSixMOBW', 'secretaria');

-- Especialidades
INSERT INTO especialidades (nome, slug, descricao, icone) VALUES
('Cardiologia',   'cardiologia',   'Cuidados com o coração',         'fa-solid fa-heart-pulse'),
('Neurologia',    'neurologia',    'Cérebro e sistema nervoso',      'fa-solid fa-brain'),
('Pediatria',     'pediatria',     'Saúde de crianças e bebês',      'fa-solid fa-baby'),
('Ortopedia',     'ortopedia',     'Ossos, músculos e articulações', 'fa-solid fa-bone'),
('Dermatologia',  'dermatologia',  'Pele, cabelo e unhas',           'fa-solid fa-hand-dots'),
('Oftalmologia',  'oftalmologia',  'Saúde dos olhos',                'fa-solid fa-eye'),
('Ginecologia',   'ginecologia',   'Saúde da mulher',                'fa-solid fa-venus'),
('Clínica Geral', 'clinica-geral', 'Atendimento geral',              'fa-solid fa-stethoscope');

-- Médicos de exemplo
INSERT INTO medicos (nome, crm, especialidade_id, email, telefone, bio, foto) VALUES
('Dra. Ana Souza',    'CRM/SP 12345', 1, 'ana@clinica.com',    '(11) 99999-0001', 'Cardiologista com 15 anos de experiência.', 'https://i.pravatar.cc/300?img=47'),
('Dr. Carlos Lima',   'CRM/SP 23456', 2, 'carlos@clinica.com', '(11) 99999-0002', 'Neurologista, doutor pela USP.',            'https://i.pravatar.cc/300?img=12'),
('Dra. Beatriz Reis', 'CRM/SP 34567', 3, 'bia@clinica.com',    '(11) 99999-0003', 'Pediatra, especialista em neonatologia.',   'https://i.pravatar.cc/300?img=48'),
('Dr. Felipe Costa',  'CRM/SP 45678', 4, 'felipe@clinica.com', '(11) 99999-0004', 'Ortopedista e traumatologista.',            'https://i.pravatar.cc/300?img=15');

-- Pacientes de exemplo
INSERT INTO pacientes (nome, cpf, telefone, email) VALUES
('Maria da Silva', '111.222.333-44', '(11) 98888-1111', 'maria@email.com',
 '$2a$10$s5HCwGDyZvLFXPxaiV4fnej9ZFZVcg.a3UgD2FQgm6N6nMXfyvBjC'),
('José Oliveira',  '222.333.444-55', '(11) 98888-2222', 'jose@email.com');

-- Horários de atendimento: segunda a sexta, das 08:00 às 17:00.
INSERT INTO horarios_disponiveis (medico_id, dia_semana, hora_inicio, hora_fim)
SELECT id, dia, '08:00:00', '17:00:00'
FROM medicos
JOIN (
  SELECT 1 AS dia UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
  SELECT 4 UNION ALL SELECT 5
) dias;
