import AppShell from "../components/AppShell";

type Item = {
  title: string;
  desc: string;
  status: "Agora" | "Depois" | "Futuro";
};

const ITEMS: Item[] = [
  { title: "Abrir prova em página dedicada", desc: "Selecionar prova e abrir em /teacher/exams/:id com navegação A/B e ações.", status: "Agora" },
  { title: "Editar prova (substituir questões)", desc: "Escolher questões para substituir sem quebrar a versão A/B.", status: "Depois" },
  { title: "Exportar prova em PDF", desc: "Gerar PDF da versão A e B (com/sem gabarito).", status: "Depois" },
  { title: "Área do aluno", desc: "Visualizar prova e responder (persistir respostas).", status: "Futuro" },
  { title: "Turmas", desc: "Criar turmas, vincular alunos e provas.", status: "Futuro" },
  { title: "Estatísticas", desc: "Desempenho por aluno/turma e dificuldade.", status: "Futuro" },
  { title: "Geração de questões", desc: "Assistida por IA, com revisão do professor.", status: "Futuro" }
];

export default function TeacherRoadmapPage() {
  return (
    <AppShell>
      <div className="page-head">
        <div>
          <h1 className="page-title">Desenvolvimentos futuros</h1>
          <div className="page-sub">Backlog do projeto</div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Roadmap</h2>
          <span className="panel-meta">Itens: {ITEMS.length}</span>
        </div>

        <div className="roadmap">
          {ITEMS.map((i) => (
            <div key={i.title} className="roadmap-item">
              <div className="roadmap-top">
                <div className="roadmap-title">{i.title}</div>
                <span className={`tag ${i.status.toLowerCase()}`}>{i.status}</span>
              </div>
              <div className="roadmap-desc">{i.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}