import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock, Sparkles } from "lucide-react";
import DoctorAvatar from "./DoctorAvatar";
import { clinic } from "../config/clinic";
import { track } from "../lib/pixel";

interface QuizProps {
  onComplete: (respostas: any) => void;
}

const perguntas = [
  {
    id: "queixa",
    emoji: "🌸",
    resumo: "Principal queixa",
    categoria: "O que te trouxe aqui",
    pergunta: "O que mais te incomoda hoje?",
    opcoes: [
      // 💨 e não 🌫️: a névoa é quase branca e some dentro do círculo claro.
      { emoji: "💨", label: "Odor forte", value: "odor forte" },
      { emoji: "💧", label: "Corrimento diferente do normal", value: "corrimento diferente" },
      { emoji: "🔥", label: "Coceira ou ardência", value: "coceira ou ardência" },
      { emoji: "😣", label: "Mais de um desses", value: "odor, corrimento e coceira juntos" },
    ],
  },
  {
    id: "frequencia",
    emoji: "📆",
    resumo: "Com que frequência",
    categoria: "Frequência",
    pergunta: "Com que frequência isso aparece?",
    opcoes: [
      { emoji: "🔁", label: "Praticamente todos os dias", value: "praticamente todos os dias" },
      { emoji: "📅", label: "Quase toda semana", value: "quase toda semana" },
      { emoji: "🌙", label: "Vem e volta durante o mês", value: "vem e volta durante o mês" },
      { emoji: "⏳", label: "De vez em quando", value: "de vez em quando" },
    ],
  },
  {
    id: "gatilho",
    emoji: "🔎",
    resumo: "Quando piora",
    categoria: "Padrão",
    pergunta: "Você nota que piora em algum momento?",
    opcoes: [
      { emoji: "💞", label: "Depois da relação", value: "piora depois da relação" },
      { emoji: "🩸", label: "Perto da menstruação", value: "piora perto da menstruação" },
      { emoji: "☀️", label: "No calor ou com roupa apertada", value: "piora no calor ou com roupa apertada" },
      { emoji: "🤔", label: "Não percebo um padrão", value: "sem padrão identificado" },
    ],
  },
  {
    id: "tentativas",
    emoji: "🧪",
    resumo: "O que já tentou",
    categoria: "Histórico",
    pergunta: "O que você já tentou para resolver?",
    opcoes: [
      { emoji: "🧼", label: "Sabonete ou ducha íntima", value: "sabonete ou ducha íntima" },
      { emoji: "💊", label: "Remédio por conta própria", value: "remédio por conta própria" },
      { emoji: "🩺", label: "Já consultei, melhorou e voltou", value: "consultou, melhorou e voltou" },
      { emoji: "🚫", label: "Nunca tentei nada", value: "nunca tentou nada" },
    ],
  },
  {
    id: "impacto",
    emoji: "💗",
    resumo: "Como isso te afeta",
    categoria: "Impacto",
    pergunta: "O quanto isso afeta o seu dia a dia?",
    opcoes: [
      { emoji: "💔", label: "Evito a intimidade por causa disso", value: "evita a intimidade" },
      { emoji: "😔", label: "Fico insegura o dia inteiro", value: "insegura o dia inteiro" },
      { emoji: "😐", label: "Me incomoda em momentos específicos", value: "incomoda às vezes" },
    ],
  },
];

// O que a tela de análise mostra enquanto monta o resumo. São as etapas
// que realmente acontecem — inventar "comparando com 12 mil casos" seria
// mentira, e mentira em tela de saúde é o tipo de coisa que destrói a
// confiança que o funil inteiro depende.
const etapasAnalise = [
  { emoji: "📋", texto: "Organizando suas respostas" },
  { emoji: "🧩", texto: "Montando o seu resumo" },
  { emoji: "👩‍⚕️", texto: `Chamando a ${clinic.doctor.name}` },
];

const ANALISE_MS = 2800;
const SELECAO_MS = 460;

export default function Quiz({ onComplete }: QuizProps) {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [fase, setFase] = useState<"perguntas" | "analisando" | "resultado">(
    "perguntas"
  );
  const [etapaAtiva, setEtapaAtiva] = useState(-1);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");

  const responder = (valor: string) => {
    // Uma resposta por vez: sem isto, dois toques rápidos pulam a pergunta
    // seguinte e a resposta cai no campo errado.
    if (selecionada) return;
    if (passo === 0) track("QuizStart");
    setSelecionada(valor);

    // A pausa é o ponto: ela vê a opção marcar antes da tela virar, e a
    // escolha parece dela em vez de um formulário que já pulou adiante.
    setTimeout(() => {
      const proximas = { ...respostas, [perguntas[passo].id]: valor };
      setRespostas(proximas);
      setSelecionada(null);

      if (passo < perguntas.length - 1) {
        setPasso(passo + 1);
      } else {
        track("QuizComplete", { queixa: proximas.queixa });
        setFase("analisando");
      }
    }, SELECAO_MS);
  };

  const voltar = () => {
    if (passo === 0 || selecionada) return;
    setPasso(passo - 1);
  };

  // Análise: a barra anda e as etapas marcam uma a uma.
  useEffect(() => {
    if (fase !== "analisando") return;

    const marcas = etapasAnalise.map((_, i) =>
      setTimeout(() => setEtapaAtiva(i), 250 + i * (ANALISE_MS / 3.4))
    );
    const fim = setTimeout(() => setFase("resultado"), ANALISE_MS);

    return () => {
      clearTimeout(fim);
      marcas.forEach(clearTimeout);
    };
  }, [fase]);

  const enviar = () => {
    if (!nome.trim()) return setErro("Por favor, informe seu nome.");
    setErro("");
    track("Lead", { content_name: clinic.name });
    onComplete({ ...respostas, name: nome.trim() });
  };

  const opcaoDe = (p: (typeof perguntas)[number]) =>
    p.opcoes.find((o) => o.value === respostas[p.id]);

  /* ---------------------------------------------------------------- */

  // key por fase: sem isso o React reaproveita os nós de uma tela na
  // outra e leva junto estado que não é mais daquele elemento — foi assim
  // que a barra de análise herdou a largura da barra das perguntas.
  if (fase === "analisando") {
    return (
      <div
        key="analisando"
        className="animate-fade-up rounded-card border border-line bg-surface p-7 shadow-soft sm:p-10"
      >
        <div className="flex flex-col items-center text-center">
          <span className="relative flex items-center justify-center">
            <span className="absolute h-20 w-20 animate-pulse-soft rounded-full bg-rose-soft/60" />
            <DoctorAvatar size={64} />
          </span>

          <p className="eyebrow mt-6">Só um instante</p>
          <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
            Analisando o que você respondeu
          </h2>
        </div>

        <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-line">
          <div
            className="barra-analise h-full rounded-full bg-gold"
            style={{ "--dur": `${ANALISE_MS}ms` } as React.CSSProperties}
          />
        </div>

        <ul className="mt-7 flex flex-col gap-3">
          {etapasAnalise.map((etapa, i) => {
            const feita = i < etapaAtiva;
            const agora = i === etapaAtiva;
            return (
              <li
                key={etapa.texto}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  i <= etapaAtiva ? "opacity-100" : "translate-y-1 opacity-30"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm
                              transition-colors duration-300 ${
                                feita ? "bg-gold-soft" : "bg-cream"
                              }`}
                >
                  {feita ? (
                    <Check size={13} className="text-gold" strokeWidth={3} />
                  ) : (
                    etapa.emoji
                  )}
                </span>
                <span
                  className={`text-sm ${agora ? "text-ink" : "text-muted"}`}
                >
                  {etapa.texto}
                  {agora && <span className="ml-1 animate-pulse-soft">…</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */

  if (fase === "resultado") {
    return (
      <div
        key="resultado"
        className="animate-fade-up rounded-card border border-line bg-surface p-7 shadow-soft sm:p-10"
      >
        <div className="flex flex-col items-center text-center">
          <span className="animate-scale-in flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft">
            <Check size={26} className="text-gold" strokeWidth={2.5} />
          </span>

          <span className="animate-fade-up mt-5 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft/40 px-3 py-1">
            <Sparkles size={12} className="text-gold" />
            <span className="eyebrow !text-ink">Resumo pronto</span>
          </span>

          <h2 className="mt-4 font-display text-3xl text-ink sm:text-4xl">
            O que você descreveu tem solução
          </h2>
          <p className="mt-3 max-w-md text-muted">
            É mais comum do que parece, e quase ninguém fala sobre. A{" "}
            {clinic.doctor.name} vai olhar o seu caso agora.
          </p>
        </div>

        <dl className="mt-8 flex flex-col gap-2">
          {perguntas.map((p, i) => {
            const escolha = opcaoDe(p);
            return (
              <div
                key={p.id}
                className="animate-fade-up flex items-center gap-3 rounded-lg border border-line bg-cream/40 px-4 py-3"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base">
                  {escolha?.emoji ?? p.emoji}
                </span>
                <div className="min-w-0">
                  <dt className="eyebrow">{p.resumo}</dt>
                  {/* Sem truncar: no celular "Evito a intimidade por causa
                      disso" virava "…por causa …", e é justamente a resposta
                      mais pesada do quiz. */}
                  <dd className="font-medium leading-snug text-ink">
                    {escolha?.label ?? "—"}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>

        {/* Odor persistente tem causas diferentes, que se tratam de formas
            diferentes. Chamar isto de diagnóstico seria errado e poderia
            adiar um atendimento que ela precisa. */}
        <p className="mt-5 rounded-lg bg-cream/60 px-4 py-3 text-xs leading-relaxed text-muted">
          Isto é uma orientação, não um diagnóstico. Sintomas que persistem,
          vêm com dor, febre ou sangramento, ou que aparecem na gravidez,
          precisam de consulta presencial.
        </p>

        <div className="animate-fade-up mt-7 flex items-start gap-4 rounded-lg bg-rose-soft/40 p-5">
          <span className="relative shrink-0">
            <DoctorAvatar size={52} />
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          <div>
            <p className="font-medium text-ink">
              {clinic.doctor.name} está online agora
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

  /* ---------------------------------------------------------------- */

  const atual = perguntas[passo];
  const progresso = ((passo + (selecionada ? 1 : 0)) / perguntas.length) * 100;

  return (
    <div
      key="perguntas"
      className="animate-fade-up rounded-card border border-line bg-surface p-6 shadow-soft sm:p-10"
    >
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={voltar}
          disabled={passo === 0 || Boolean(selecionada)}
          aria-label="Voltar para a pergunta anterior"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                     text-muted transition-colors hover:bg-cream hover:text-rose
                     disabled:pointer-events-none disabled:opacity-0"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Bolinhas em vez de porcentagem: ela enxerga de relance quanto
            falta, e cinco pontos parecem menos que "20% concluído". */}
        <div className="flex items-center gap-1.5">
          {perguntas.map((p, i) => (
            <span
              key={p.id}
              className={`rounded-full transition-all duration-500 ${
                i < passo
                  ? "h-1.5 w-1.5 bg-gold"
                  : i === passo
                    ? "h-1.5 w-6 bg-rose"
                    : "h-1.5 w-1.5 bg-line"
              }`}
            />
          ))}
        </div>

        <span className="eyebrow tabular shrink-0">
          {passo + 1}/{perguntas.length}
        </span>
      </div>

      <div className="mt-4 h-px w-full bg-line">
        <div
          className="h-px bg-gold transition-all duration-700 ease-out"
          style={{ width: `${progresso}%` }}
        />
      </div>

      {/* key no passo: remonta o bloco e a animação de entrada roda a cada
          pergunta, em vez de só na primeira. */}
      <div key={passo} className="animate-slide-right">
        <div className="mt-7 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-soft/50 text-lg">
            {atual.emoji}
          </span>
          <span className="eyebrow">{atual.categoria}</span>
        </div>

        <h2 className="mt-4 font-display text-2xl leading-snug text-ink sm:text-4xl">
          {atual.pergunta}
        </h2>

        <div className="mt-6 flex flex-col gap-2.5">
          {atual.opcoes.map((opcao, i) => {
            // Marcada tanto no instante da escolha quanto ao voltar: sem a
            // segunda parte, o botão de voltar abre a pergunta em branco e
            // ela não lembra o que tinha respondido.
            const marcada =
              selecionada === opcao.value ||
              (!selecionada && respostas[atual.id] === opcao.value);
            const outraMarcada = Boolean(selecionada) && selecionada !== opcao.value;
            return (
              <button
                key={opcao.value}
                onClick={() => responder(opcao.value)}
                aria-pressed={marcada}
                className={`group flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left
                            transition-all duration-300
                            ${
                              marcada
                                ? "scale-[1.02] border-rose bg-rose-soft/40 shadow-soft"
                                : "animate-fade-up border-line bg-white hover:-translate-y-0.5 hover:border-rose hover:shadow-soft"
                            }
                            ${outraMarcada ? "opacity-40" : ""}`}
                style={marcada ? undefined : { animationDelay: `${i * 70}ms` }}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg
                              transition-colors duration-300 ${
                                marcada ? "bg-white" : "bg-cream"
                              }`}
                >
                  {opcao.emoji}
                </span>

                <span className="min-w-0 flex-1 font-medium text-ink">
                  {opcao.label}
                </span>

                {/* Vira check ao ser escolhida: é o retorno que faz parecer
                    uma escolha marcada, e não um link que mudou de página. */}
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border
                              transition-all duration-300 ${
                                marcada
                                  ? "animate-scale-in border-rose bg-rose"
                                  : "border-line group-hover:border-rose"
                              }`}
                >
                  {marcada && (
                    <Check size={12} className="text-white" strokeWidth={3.5} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted/80">
        🔒 Ninguém além da doutora vê suas respostas
      </p>
    </div>
  );
}
