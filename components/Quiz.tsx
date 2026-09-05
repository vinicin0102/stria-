import { useState } from "react";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import DoctorAvatar from "./DoctorAvatar";
import { clinic } from "../config/clinic";

interface QuizProps {
  onComplete: (answers: any) => void;
}

const questions = [
  {
    id: "issues",
    recapLabel: "Principal queixa",
    question: "Qual é a sua principal queixa hoje?",
    options: [
      { label: "Estrias", value: "estrias" },
      { label: "Celulite", value: "celulite" },
      { label: "Flacidez", value: "flacidez" },
      { label: "As três combinadas", value: "estrias, celulite e flacidez" },
    ],
  },
  {
    id: "duration",
    recapLabel: "Tempo de convivência",
    question: "Há quanto tempo você convive com isso?",
    options: [
      { label: "Menos de 1 ano", value: "menos de 1 ano" },
      { label: "Entre 1 e 3 anos", value: "de 1 a 3 anos" },
      { label: "Mais de 3 anos", value: "mais de 3 anos" },
    ],
  },
  {
    id: "treatments",
    recapLabel: "Tratamentos anteriores",
    question: "Você já tentou tratar antes?",
    options: [
      { label: "Sim, vários tratamentos", value: "vários tratamentos sem resultado" },
      { label: "Sim, alguns", value: "alguns tratamentos" },
      { label: "Não, seria a primeira vez", value: "nenhum tratamento ainda" },
    ],
  },
  {
    id: "goals",
    recapLabel: "Seu objetivo",
    question: "O que você mais deseja alcançar?",
    options: [
      { label: "Reduzir bastante a aparência", value: "reduzir a aparência" },
      { label: "O resultado mais completo possível", value: "o resultado mais completo" },
      { label: "Voltar a me sentir bem comigo", value: "recuperar a autoestima" },
    ],
  },
  {
    id: "sentiment",
    recapLabel: "Como você se sente",
    question: "Como você se sente com a sua pele hoje?",
    options: [
      { label: "Muito incomodada, evito me expor", value: "muito incomodada" },
      { label: "Incomodada com frequência", value: "incomodada" },
      { label: "Convivo, mas gostaria de melhorar", value: "disposta a melhorar" },
    ],
  },
];

export default function Quiz({ onComplete }: QuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showRecap, setShowRecap] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAnswer = (value: string) => {
    const next = { ...answers, [questions[step].id]: value };
    setAnswers(next);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowRecap(true);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return setError("Por favor, informe seu nome.");
    setError("");
    onComplete({ ...answers, name: name.trim() });
  };

  const labelFor = (q: (typeof questions)[number]) =>
    q.options.find((o) => o.value === answers[q.id])?.label ?? "—";

  if (showRecap) {
    return (
      <div className="animate-fade-up rounded-card border border-line bg-surface p-7 shadow-soft sm:p-10">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft">
            <Check size={22} className="text-gold" strokeWidth={2.5} />
          </span>
          <p className="eyebrow mt-5">Avaliação concluída</p>
          <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
            Você tem o perfil indicado para o Método {clinic.name}
          </h2>
          <p className="mt-4 max-w-md text-muted">
            Analisamos suas respostas e seu caso se encaixa no protocolo que
            desenvolvemos. Veja o resumo abaixo.
          </p>
        </div>

        <dl className="mt-9 divide-y divide-line overflow-hidden rounded-lg border border-line">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="animate-fade-up flex flex-col gap-1 bg-cream/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <dt className="eyebrow">{q.recapLabel}</dt>
              <dd className="font-medium text-ink sm:text-right">{labelFor(q)}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-9 flex items-start gap-4 rounded-lg bg-rose-soft/40 p-5">
          <DoctorAvatar size={52} />
          <div>
            <p className="font-medium text-ink">
              {clinic.doctor.name} vai conversar com você agora
            </p>
            <p className="mt-1 text-sm text-muted">
              Uma conversa rápida para entender seu caso antes de indicar o
              protocolo. Sem compromisso.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="eyebrow mb-2 block">
              Seu nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Como podemos te chamar?"
              className="field"
            />
          </div>

          {error && <p className="text-sm text-rose-deep">{error}</p>}

          <button onClick={handleSubmit} className="btn-primary w-full">
            Conversar agora com a doutora
            <ArrowRight size={18} />
          </button>

          <p className="flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck size={14} className="text-gold" />
            Seus dados são usados apenas para o seu atendimento.
          </p>
        </div>
      </div>
    );
  }

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div className="animate-fade-up rounded-card border border-line bg-surface p-7 shadow-soft sm:p-10">
      <div className="flex items-center justify-between">
        <span className="eyebrow">
          Pergunta {step + 1} de {questions.length}
        </span>
        <span className="eyebrow tabular">{Math.round(progress)}%</span>
      </div>

      <div className="mt-3 h-px w-full bg-line">
        <div
          className="h-px bg-gold transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div key={step} className="animate-slide-right">
        <h2 className="mt-8 font-display text-3xl leading-snug text-ink sm:text-4xl">
          {current.question}
        </h2>

        <div className="mt-8 flex flex-col gap-3">
          {current.options.map((option, i) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className="group animate-fade-up flex items-center justify-between gap-4 rounded-lg
                         border border-line bg-white px-5 py-4 text-left text-ink
                         transition-all duration-200
                         hover:-translate-y-0.5 hover:border-rose hover:shadow-soft"
              style={{ animationDelay: `${i * 60}ms`, minHeight: "56px" }}
            >
              <span className="font-medium">{option.label}</span>
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
