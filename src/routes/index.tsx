import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import Banner from "@/components/Banner";
import EspecialistaCard from "@/components/EspecialistaCard";
import EspecialidadeGrid from "@/components/EspecialidadeGrid";
import { especialidadesApi, medicosApi } from "@/lib/apiClient";
import type { Especialidade, Medico } from "@/lib/models";
import { normalizeMedico } from "@/lib/models";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClínicaSaúde — Agende sua consulta online" },
      {
        name: "description",
        content: "Encontre especialistas e agende consultas em poucos cliques.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [filtroEsp, setFiltroEsp] = useState<Especialidade | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([especialidadesApi.list(), medicosApi.list()])
      .then(([esp, doctors]) => {
        setEspecialidades(esp);
        setMedicos(doctors);
      })
      .catch((error: Error) => setErro(error.message));
  }, []);

  const medicosFiltrados = filtroEsp
    ? medicos.filter((medico) => medico.especialidade_id === filtroEsp.id)
    : [];

  return (
    <main>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-badge">
              <i className="fa-solid fa-shield-heart"></i> Atendimento confiável e humano
            </span>
            <h1>
              Sua saúde em <span>boas mãos</span>
            </h1>
            <p>
              Agende consultas com os melhores especialistas da região, online e sem complicação.
            </p>
            <SearchBar />
            <div className="hero-features">
              <span>
                <i className="fa-solid fa-calendar-check"></i> Agendamento em minutos
              </span>
              <span>
                <i className="fa-solid fa-user-doctor"></i> Especialistas qualificados
              </span>
            </div>
          </div>
          <div className="hero-panel" aria-label="Resumo da clínica">
            <div className="hero-panel-card">
              <small>Atendimento hoje</small>
              <strong>{Math.min(72, medicos.length * 6 + 18)}</strong>
              <span>consultas confirmadas</span>
            </div>
            <div className="hero-panel-list">
              <div>
                <span className="dot dot-primary"></span>
                <span>Cardiologia</span>
              </div>
              <div>
                <span className="dot dot-success"></span>
                <span>Clínica geral</span>
              </div>
              <div>
                <span className="dot dot-warning"></span>
                <span>Dermatologia</span>
              </div>
            </div>
          </div>
          <div className="hero-stats">
            <div>
              <strong>+{medicos.length}</strong>
              <span>Médicos</span>
            </div>
            <div>
              <strong>{especialidades.length}+</strong>
              <span>Especialidades</span>
            </div>
            <div>
              <strong>30k</strong>
              <span>Pacientes atendidos</span>
            </div>
          </div>
        </div>
      </section>
      <Banner />
      {erro && <p className="container api-error">Não foi possível carregar os dados: {erro}</p>}
      <section id="especialistas" className="section">
        <div className="container">
          <div className="section-head">
            <h2>Nossos especialistas em destaque</h2>
            <p>Profissionais qualificados e prontos para te atender.</p>
          </div>
          <div className="medicos-grid">
            {medicos.slice(0, 4).map((medico) => {
              const especialidade = especialidades.find(
                (item) => item.id === medico.especialidade_id,
              );
              return (
                <EspecialistaCard
                  key={medico.id}
                  medico={normalizeMedico(medico)}
                  especialidade={especialidade}
                  onAgendar={() =>
                    especialidade &&
                    navigate({
                      to: "/especialidade/$slug",
                      params: { slug: especialidade.slug },
                    })
                  }
                />
              );
            })}
          </div>
        </div>
      </section>
      <section id="especialidades" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>Escolha a especialidade</h2>
            <p>Clique em uma especialidade para ver os profissionais disponíveis.</p>
          </div>
          <EspecialidadeGrid items={especialidades} />
        </div>
      </section>
      <section id="prevencao" className="section">
        <div className="container">
          <div className="section-head">
            <h2>Prevenção que faz a diferença</h2>
            <p>
              Atendimento humano, diagnóstico precoce e acompanhamento para cuidar da sua saúde.
            </p>
          </div>
          <div className="benefit-grid">
            <article className="benefit-card">
              <span className="benefit-icon">
                <i className="fa-solid fa-stethoscope"></i>
              </span>
              <h3>Check-up completo</h3>
              <p>
                Programas personalizados para avaliar pressão, exames laboratoriais e rotina em um
                só lugar.
              </p>
            </article>
            <article className="benefit-card">
              <span className="benefit-icon">
                <i className="fa-solid fa-heart-circle-check"></i>
              </span>
              <h3>Monitoramento contínuo</h3>
              <p>
                Retorno inteligente e cuidado preventivo para quem quer manter a saúde em dia com
                segurança.
              </p>
            </article>
            <article className="benefit-card">
              <span className="benefit-icon">
                <i className="fa-solid fa-video"></i>
              </span>
              <h3>Telemedicina simples</h3>
              <p>
                Conecte-se com especialistas por vídeo quando a consulta presencial não for o melhor
                momento.
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="section section-alt">
        <div className="container">
          <div className="cta-band">
            <div>
              <span className="cta-eyebrow">Agende com facilidade</span>
              <h2>Seu cuidado começa com uma conversa.</h2>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() =>
                document
                  .getElementById("especialidades")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Ver especialistas
            </button>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Seleção rápida de profissional</h2>
            <p>Selecione abaixo a especialidade e veja os médicos cadastrados.</p>
          </div>
          <div className="quick-select">
            <label htmlFor="qs-esp">Especialidade:</label>
            <select
              id="qs-esp"
              className="form-control"
              value={filtroEsp?.id ?? ""}
              onChange={(event) =>
                setFiltroEsp(
                  especialidades.find((item) => item.id === Number(event.target.value)) ?? null,
                )
              }
            >
              <option value="">— Selecione —</option>
              {especialidades.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </div>
          {filtroEsp && (
            <div className="medicos-grid" style={{ marginTop: 28 }}>
              {medicosFiltrados.map((medico) => (
                <EspecialistaCard
                  key={medico.id}
                  medico={normalizeMedico(medico)}
                  especialidade={filtroEsp}
                />
              ))}
              {medicosFiltrados.length === 0 && (
                <p>Nenhum profissional cadastrado para {filtroEsp.nome}.</p>
              )}
            </div>
          )}
        </div>
      </section>
      <style>{`
        .hero {
          background: radial-gradient(circle at top left, rgba(255,255,255,0.18), transparent 24%),
            linear-gradient(135deg, #0a8fb0 0%, #0d6d85 30%, #18b89d 100%);
          color: #fff;
          padding: 80px 0 88px;
        }
        .hero-inner {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(220px, 0.9fr);
          gap: 28px;
          align-items: center;
        }
        .hero-copy {
          text-align: left;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          margin-bottom: 18px;
        }
        .hero h1 {
          font-size: clamp(2.3rem, 4vw, 4rem);
          color: #fff;
          margin: 0 0 16px;
          line-height: 1.05;
        }
        .hero h1 span { color: #fef3c7; }
        .hero p {
          font-size: 1.08rem;
          opacity: .96;
          margin: 0 0 28px;
          max-width: 620px;
        }
        .hero-features {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
        }
        .hero-features span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 0.82rem;
          font-weight: 600;
        }
        .hero-panel {
          background: rgba(8, 38, 48, 0.28);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 18px 40px rgba(5, 22, 28, 0.18);
        }
        .hero-panel-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 20px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          margin-bottom: 18px;
        }
        .hero-panel-card small,
        .hero-panel-card span {
          color: rgba(255,255,255,0.8);
        }
        .hero-panel-card strong {
          font-size: 2.2rem;
          line-height: 1;
          color: #fff;
        }
        .hero-panel-list {
          display: grid;
          gap: 12px;
        }
        .hero-panel-list div {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
          font-weight: 500;
        }
        .dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot-primary { background: #8fe6ff; }
        .dot-success { background: #7ae0b0; }
        .dot-warning { background: #ffd36e; }
        .hero-stats {
          grid-column: 1 / -1;
          display: flex;
          gap: 36px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 18px;
        }
        .hero-stats div {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 125px;
        }
        .hero-stats strong { font-size: 1.8rem; }
        .hero-stats span { opacity: .85; font-size: .85rem; }
        .section { padding: 70px 0; }
        .section-alt { background: var(--color-bg-soft); }
        .section-head { text-align: center; margin-bottom: 36px; }
        .section-head h2 { font-size: 1.9rem; }
        .section-head p { color: var(--color-text-muted); }
        .benefit-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }
        .benefit-card {
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 28px 22px;
          box-shadow: var(--shadow-sm);
          text-align: left;
        }
        .benefit-icon {
          width: 54px;
          height: 54px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(18, 150, 170, 0.1);
          color: var(--color-primary);
          font-size: 1.35rem;
          margin-bottom: 18px;
        }
        .benefit-card h3 {
          margin: 0 0 10px;
          font-size: 1.18rem;
          color: var(--color-text);
        }
        .benefit-card p {
          margin: 0;
          color: var(--color-text-muted);
          line-height: 1.6;
        }
        .cta-band {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          background: linear-gradient(135deg, #0e3d4d 0%, #117a8c 100%);
          border-radius: 24px;
          padding: 28px 30px;
          color: #fff;
          box-shadow: var(--shadow-md);
        }
        .cta-eyebrow {
          display: inline-block;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.8);
          margin-bottom: 8px;
        }
        .cta-band h2 {
          margin: 0;
          font-size: clamp(1.6rem, 2vw, 2.3rem);
          color: #fff;
        }
        .medicos-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
        .quick-select { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }
        .quick-select label { font-weight: 600; }
        .api-error { color: var(--color-danger); padding-top: 20px; }
        @media (max-width: 1000px) { .medicos-grid { grid-template-columns: repeat(3, 1fr); } .benefit-grid { grid-template-columns: 1fr; } .hero-inner { grid-template-columns: 1fr; } .hero-copy { text-align: center; } .hero p { margin-left: auto; margin-right: auto; } .hero-features { justify-content: center; } .cta-band { flex-direction: column; align-items: flex-start; } }
        @media (max-width: 760px) { .medicos-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .medicos-grid { grid-template-columns: 1fr; } .hero { padding-top: 56px; } .hero h1 { font-size: 2.2rem; } .hero-panel-card strong { font-size: 1.7rem; } .cta-band { padding: 22px 18px; } }
      `}</style>
    </main>
  );
}
