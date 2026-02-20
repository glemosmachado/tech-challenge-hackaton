import AppShell from "../components/AppShell";
import "../styles/roadmap.css";

type Status = "Depois" | "Futuro";

type Item = {
  title: string;
  status: Status;
  summary: string;
  deliverables: string[];
};

const ITEMS: Item[] = [
  {
    title: "Área do aluno (visualização e respostas)",
    status: "Futuro",
    summary:
      "Permitir que o aluno acesse a prova e registre respostas, com autenticação e rastreabilidade.",
    deliverables: [
      "Listagem de provas disponíveis para o aluno",
      "Registro de respostas (MCQ e discursivas)",
      "Controle de tentativa e status (em andamento/finalizada)",
      "Acesso seguro por JWT"
    ]
  },
  {
    title: "Gestão de turmas",
    status: "Futuro",
    summary:
      "Criar turmas, vincular alunos e distribuir provas por turma.",
    deliverables: [
      "CRUD de turmas",
      "Vínculo aluno ↔ turma",
      "Atribuição de provas por turma",
      "Visão rápida de distribuição e pendências"
    ]
  },
  {
    title: "Estatísticas e desempenho",
    status: "Futuro",
    summary:
      "Relatórios de acertos, tópicos mais difíceis e evolução por turma/aluno.",
    deliverables: [
      "Percentual de acertos por prova",
      "Dificuldade por tópico e por questão",
      "Ranking e evolução por período",
      "Exportação simples (CSV/PDF)"
    ]
  },
  {
    title: "Criação assistida de questões",
    status: "Futuro",
    summary:
      "Gerar rascunhos de questões com apoio de IA e revisão obrigatória do professor.",
    deliverables: [
      "Sugestão de enunciados e alternativas",
      "Validação de formato e consistência",
      "Revisão manual antes de salvar no banco",
      "Tag de origem e histórico de edição"
    ]
  }
];

function tagClass(s: Status) {
  if (s === "Depois") return "roadmap-tag depois";
  return "roadmap-tag futuro";
}

export default function TeacherRoadmapPage() {
  return (
    <AppShell>
      <div className="roadmap-wrap">
        <div className="roadmap-head">
          <div>
            <h1 className="roadmap-title">Plano de evolução</h1>
            <div className="roadmap-sub">
              Melhorias planejadas para ampliar o controle do professor,
              qualidade das avaliações e capacidade analítica do sistema.
            </div>
          </div>
        </div>

        <section className="roadmap-panel">
          <div className="roadmap-meta">
            <span className="roadmap-pill">Itens: {ITEMS.length}</span>
            <span className="roadmap-pill">
              Foco: estabilidade, usabilidade e impressão
            </span>
            <span className="roadmap-pill">
              Público: professor (administração e controle)
            </span>
          </div>

          <div className="roadmap-grid roadmap-grid-4">
            {ITEMS.map((i) => (
              <div key={i.title} className="roadmap-card">
                <div className="roadmap-top">
                  <div className="roadmap-card-title">{i.title}</div>
                  <span className={tagClass(i.status)}>{i.status}</span>
                </div>

                <div className="roadmap-card-desc">{i.summary}</div>

                <ul className="roadmap-list">
                  {i.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}