import { Link } from "@tanstack/react-router";
import type { Especialidade } from "@/lib/models";
import "./EspecialidadeGrid.css";

export default function EspecialidadeGrid({ items }: { items: Especialidade[] }) {
  return (
    <div className="esp-grid">
      {items.map((e) => (
        <Link to="/especialidade/$slug" params={{ slug: e.slug }} key={e.id} className="esp-tile">
          <div className="esp-tile-icon">
            <i className={e.icone}></i>
          </div>
          <h3>{e.nome}</h3>
          <p>{e.descricao}</p>
          <span className="esp-tile-link">
            Ver médicos <i className="fa-solid fa-arrow-right"></i>
          </span>
        </Link>
      ))}
    </div>
  );
}
