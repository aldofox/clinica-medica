import { useNavigate } from "@tanstack/react-router";
import type { Medico, Especialidade } from "@/lib/models";
import "./EspecialistaCard.css";

interface Props {
  medico: Medico;
  especialidade?: Especialidade;
  onAgendar?: (m: Medico) => void;
}

export default function EspecialistaCard({ medico, especialidade, onAgendar }: Props) {
  const navigate = useNavigate();

  function handleAgendar() {
    if (onAgendar) {
      onAgendar(medico);
      return;
    }

    if (especialidade) {
      navigate({ to: "/paciente/login" });
      return;
    }

    navigate({ to: "/" });
  }

  return (
    <article className="esp-card">
      <div className="esp-photo">
        <img src={medico.foto ?? "https://i.pravatar.cc/300"} alt={medico.nome} loading="lazy" />
      </div>
      <div className="esp-body">
        <h3>{medico.nome}</h3>
        {especialidade && (
          <span className="esp-tag">
            <i className={especialidade.icone}></i> {especialidade.nome}
          </span>
        )}
        <p className="esp-bio">{medico.bio ?? ""}</p>
        <div className="esp-meta">
          <span>
            <i className="fa-solid fa-id-badge"></i> {medico.crm}
          </span>
        </div>
        <button className="btn btn-primary esp-btn" onClick={handleAgendar}>
          <i className="fa-solid fa-calendar-plus"></i> Agendar consulta
        </button>
      </div>
    </article>
  );
}
