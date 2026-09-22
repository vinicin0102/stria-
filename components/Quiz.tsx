import { useState } from "react";
import { ArrowRight, Check, Lock } from "lucide-react";
import DoctorAvatar from "./DoctorAvatar";
import { clinic } from "../config/clinic";
import { track } from "../lib/pixel";

interface QuizProps {
  onComplete: (respostas: any) => void;
}

const perguntas = [
  {
    id: "queixa",
    resumo: "Principal queixa",
    pergunta: "O que mais te incomoda hoje?",
    opcoes: [
      { label: "Odor forte", value: "odor forte" },
      { label: "Corrimento diferente do normal", value: "corrimento diferente" },
      { label: "Coceira ou ardência", value: "coceira ou ardência" },
      { label: "Mais de um desses", value: "odor, corrimento e coceira juntos" },
    ],
  },
  {
    id: "frequencia",
    resumo: "Com que frequência",
    pergunta: "Com que frequência isso aparece?",
    opcoes: [
      { label: "Praticamente todos os dias", value: "praticamente todos os dias" },
      { label: "Quase toda semana", value: "quase toda semana" },
      { label: "Vem e volta durante o mês", value: "vem e volta durante o mês" },
      { label: "De vez em quando", value: "de vez em quando" },
    ],
  },
  {
    id: "gatilho",
    resumo: "Quando piora",
    pergunta: "Você nota que piora em algum momento?",
    opcoes: [
      { label: "Depois da relação", value: "piora depois da relação" },
      { label: "Perto da menstruação", value: "piora perto da menstruação" },
      { label: "No calor ou com roupa apertada", value: "piora no calor ou com roupa apertada" },
      { label: "Não percebo um padrão", value: "sem padrão identificado" },
    ],
  },
  {
    id: "tentativas",
    resumo: "O que já tentou",
    pergunta: "O que você já tentou para resolver?",
    opcoes: [
      { label: "Sabonete ou ducha íntima", value: "sabonete ou ducha íntima" },
      { label: "Remédio por conta própria", value: "remédio por conta própria" },
      { label: "Já consultei, melhorou e voltou", value: "consultou, melhorou e voltou" },
      { label: "Nunca tentei nada", value: "nunca tentou nada" },
    ],
  },
  {
    id: "impacto",
    resumo: "Como isso te afeta",
    pergunta: "O quanto isso afeta o seu dia a dia?",
    opcoes: [
      { label: "Evito a intimidade por causa disso", value: "evita a intimidade" },
      { label: "Fico insegura o dia inteiro", value: "insegura o dia inteiro" },
      { label: "Me incomoda em momentos específicos", value: "incomoda às vezes" },
    ],
  },
];

export default function Quiz({ onComplete }: QuizProps) {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [mostrarResumo, setMostrarResumo] = useState(false);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");

  const responder = (valor: string) => {
    if (passo === 0) track("QuizStart");

    const proximas = { ...respostas, [perguntas[passo].id]: valor };
    setRespostas(proximas);

    if (passo < perguntas.length - 1) {
      setPasso(passo + 1);
    } else {
      track("QuizComplete", { queixa: proximas.queixa });
      setMostrarResumo(true);
    }
  };

  const enviar = () => {
    if (!nome.trim()) return setErro("Por favor, informe seu nome.");
    setErro("");
    track("Lead", { content_name: clinic.name });
    onComplete({ ...respostas, name: nome.trim() });
  };

  const rotuloDe = (p: (typeof perguntas)[number]) =>
    p.opcoes.find((o) => o.value === respostas[p.id])?.label ?? "—";

  if (mostrarResumo) {
    return (
      <div className="animate-fade-up rounded-card border border-line bg-surface p-7 shadow-soft sm:p-10">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft">
            <Check size={22} className="text-gold" strokeWidth={2.5} />
          </span>
          <p className="eyebrow mt-5">Suas respostas</p>
          <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
            O que você descreveu tem solução
          </h2>
          <p className="mt-4 max-w-md text-muted">
            É mais comum do que parece, e quase ninguém fala sobre. A{" "}
            {clinic.doctor.name} vai olhar o seu caso agora.
          </p>
        </div>

        <dl className="mt-9 divide-y divide-line overflow-hidden rounded-lg border border-line">
          {perguntas.map((p, i) => (
            <div
              key={p.id}
              className="animate-fade-up flex flex-col gap-1 bg-cream/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <dt className="eyebrow">{p.resumo}</dt>
              <dd className="font-medium text-ink sm:text-right">{rotuloDe(p)}</dd>
            </div>
          ))}
        </dl>

        {/* Odor persistente tem causas diferentes, que se tratam de formas
            diferentes. Chamar isto de diagnóstico seria errado e poderia
            adiar um atendimento que ela precisa. */}
        <p className="mt-5 rounded-lg bg-cream/60 px-4 py-3 text-xs leading-relaxed text-muted">
          Isto é uma orientação, não um diagnóstico. Sintomas que persistem,
          vêm com dor, febre ou sangramento, ou que aparecem na gravidez,
          precisam de consulta presencial.
        </p>

        <div className="mt-7 flex items-start gap-4 rounded-lg bg-rose-soft/40 p-5">
          <DoctorAvatar size={52} />
          <div>
            <p className="font-medium text-ink">
              {clinic.doctor.name} vai conversar com você agora
            </p>
            <p className="mt-1 text-sm text-muted">
              Conversa reservada, só entre vocês duas.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4">
          <div>
            <label htmlFor="nome" className="eyebrow mb-2 block">
              Seu nome
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder="Como podemos te chamar?"
              className="field"
            />
          </div>

          {erro && <p className="text-sm text-rose-deep">{erro}</p>}

          <button onClick={enviar} className="btn-primary w-full">
            Conversar agora com a doutora
            <ArrowRight size={18} />
          </button>

          <p className="flex items-center justify-center gap-2 text-xs text-muted">
            <Lock size={13} className="text-gold" />
            Suas respostas ficam entre você e a doutora.
          </p>
        </div>
      </div>
    );
  }

  const atual = perguntas[passo];
  const progresso = ((passo + 1) / perguntas.length) * 100;

  return (
    <div className="animate-fade-up rounded-card border border-line bg-surface p-7 shadow-soft sm:p-10">
      <div className="flex items-center justify-between">
        <span className="eyebrow">
          Pergunta {passo + 1} de {perguntas.length}
        </span>
        <span className="eyebrow tabular">{Math.round(progresso)}%</span>
      </div>

      <div className="mt-3 h-px w-full bg-line">
        <div
          className="h-px bg-gold transition-all duration-700 ease-out"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <div key={passo} className="animate-slide-right">
        <h2 className="mt-8 font-display text-3xl leading-snug text-ink sm:text-4xl">
          {atual.pergunta}
        </h2>

        <div className="mt-8 flex flex-col gap-3">
          {atual.opcoes.map((opcao, i) => (
            <button
              key={opcao.value}
              onClick={() => responder(opcao.value)}
              className="group animate-fade-up flex items-center justify-between gap-4 rounded-lg
                         border border-line bg-white px-5 py-4 text-left text-ink
                         transition-all duration-200
                         hover:-translate-y-0.5 hover:border-rose hover:shadow-soft"
              style={{ animationDelay: `${i * 60}ms`, minHeight: "56px" }}
            >
              <span className="font-medium">{opcao.label}</span>
              <ArrowRight
                size={18}
                className="shrink-0 text-line transition-colors duration-200 group-hover:text-rose"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
