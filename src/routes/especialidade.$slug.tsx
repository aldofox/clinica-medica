import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import EspecialistaCard from "@/components/EspecialistaCard";
import { especialidadesApi, medicosApi } from "@/lib/apiClient";
import { normalizeMedico } from "@/lib/models";

export const Route = createFileRoute("/especialidade/$slug")({
  component: EspecialidadePage,
  notFoundComponent: () => (
    <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
      <h1>Especialidade não encontrada</h1>
      <Link to="/" className="btn btn-primary">
        Voltar ao início
      </Link>
    </div>
  ),
  loader: async ({ params }) => {
    try {
      const especialidade = await especialidadesApi.getBySlug(params.slug);
      const medicos = await medicosApi.list(especialidade.id);
      return { especialidade, medicos };
    } catch {
      throw notFound();
    }
  },
});

function EspecialidadePage() {
  const { especialidade, medicos } = Route.useLoaderData();

  return (
    <main className="especialidade-page">
      <section className="especialidade-hero">
        <div className="container especialidade-hero-inner">
          <div className="especialidade-badge">
            <i className="fa-solid fa-stethoscope"></i> Atendimento especializado
          </div>
          <div className="especialidade-icon">
            <i className={especialidade.icone}></i>
          </div>
          <h1>{especialidade.nome}</h1>
          <p>{especialidade.descricao}</p>
          <div className="especialidade-meta">
            <span>
              <i className="fa-solid fa-user-doctor"></i> {medicos.length} profissionais
            </span>
            <span>
              <i className="fa-solid fa-calendar-check"></i> Agendamento rápido
            </span>
            <span>
              <i className="fa-solid fa-shield-heart"></i> Cuidado humanizado
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="eyebrow">Especialistas</span>
              <h2>Profissionais disponíveis ({medicos.length})</h2>
            </div>
            <Link to="/" className="btn btn-secondary btn-sm">
              <i className="fa-solid fa-arrow-left"></i> Outras especialidades
            </Link>
          </div>

          {medicos.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-user-slash"></i>
              <p>Nenhum profissional cadastrado nesta especialidade.</p>
            </div>
          ) : (
            <div className="prof-grid">
              {medicos.map((medico) => (
                <EspecialistaCard
                  key={medico.id}
                  medico={normalizeMedico(medico)}
                  especialidade={especialidade}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <style>{`
        .especialidade-page {
          background: var(--color-bg-soft);
        }
        .especialidade-hero {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          color: #fff;
          padding: 72px 0 64px;
        }
        .especialidade-hero-inner {
          text-align: center;
        }
        .especialidade-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .especialidade-icon {
          width: 76px;
          height: 76px;
          margin: 0 auto 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          font-size: 2rem;
        }
        .especialidade-hero h1 {
          color: #fff;
          font-size: clamp(2.2rem, 4vw, 3.2rem);
          margin: 0 0 10px;
        }
        .especialidade-hero p {
          max-width: 700px;
          margin: 0 auto;
          opacity: 0.96;
          font-size: 1.08rem;
          line-height: 1.7;
        }
        .especialidade-meta {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
        }
        .especialidade-meta span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.11);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 0.86rem;
          font-weight: 600;
        }
        .section {
          padding: 60px 0;
        }
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .eyebrow {
          display: inline-block;
          color: var(--color-primary);
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .section-header-row h2 {
          margin: 0;
          font-size: clamp(1.7rem, 2vw, 2.4rem);
        }
        .prof-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
        }
        .empty-state {
          display: grid;
          place-items: center;
          text-align: center;
          padding: 50px 20px;
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          color: var(--color-text-muted);
          box-shadow: var(--shadow-sm);
        }
        .empty-state i {
          font-size: 2.1rem;
          color: var(--color-primary);
          margin-bottom: 12px;
        }
        .empty-state p {
          margin: 0;
          font-size: 1rem;
        }
        @media (max-width: 1000px) {
          .prof-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .prof-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 480px) {
          .prof-grid {
            grid-template-columns: 1fr;
          }
          .especialidade-hero {
            padding-top: 54px;
          }
        }
      `}</style>
    </main>
  );
}
