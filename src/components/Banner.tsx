import "./Banner.css";

const dicas = [
  {
    icon: "fa-solid fa-droplet",
    title: "Hidrate-se",
    text: "Beba pelo menos 2 litros de água por dia.",
  },
  {
    icon: "fa-solid fa-person-running",
    title: "Movimente-se",
    text: "30 minutos de atividade física diária.",
  },
  {
    icon: "fa-solid fa-apple-whole",
    title: "Coma bem",
    text: "Inclua frutas e vegetais em todas as refeições.",
  },
  { icon: "fa-solid fa-bed", title: "Durma 8 horas", text: "Um bom sono fortalece a imunidade." },
];

export default function Banner() {
  return (
    <section id="prevencao" className="banner">
      <div className="container">
        <div className="banner-head">
          <span className="eyebrow">
            <i className="fa-solid fa-shield-heart"></i> Prevenção em primeiro lugar
          </span>
          <h2>Pequenos hábitos, grandes resultados</h2>
          <p>Confira nossas dicas diárias para manter sua saúde em dia.</p>
        </div>

        <div className="banner-grid">
          {dicas.map((d) => (
            <div className="dica-card" key={d.title}>
              <div className="dica-icon">
                <i className={d.icon}></i>
              </div>
              <h3>{d.title}</h3>
              <p>{d.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
