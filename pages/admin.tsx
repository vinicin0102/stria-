import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import axios from "axios";
import { ETAPAS } from "../lib/etapas";
import { brl, clinic } from "../config/clinic";

const INTERVALO = 5000;

const horario = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const CORES = [
  "bg-line text-muted",
  "bg-gold-soft text-ink",
  "bg-rose-soft text-rose-deep",
  "bg-rose/15 text-rose-deep",
  "bg-emerald-100 text-emerald-800",
];

function Etapa({ n }: { n: number }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        CORES[n] ?? CORES[0]
      }`}
    >
      {ETAPAS[n] ?? ETAPAS[0]}
    </span>
  );
}

export default function Admin() {
  const [estado, setEstado] = useState<"carregando" | "fora" | "dentro">(
    "carregando"
  );
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState<any>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<any>(null);

  useEffect(() => {
    axios
      .get("/api/admin/login")
      .then(({ data }) => setEstado(data.logado ? "dentro" : "fora"))
      .catch(() => setEstado("fora"));
  }, []);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    try {
      await axios.post("/api/admin/login", { senha });
      setEstado("dentro");
    } catch (err: any) {
      setErro(err?.response?.data?.error ?? "Não consegui entrar");
    }
  };

  const buscarLista = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin/conversas");
      setDados(data);
      setErro("");
    } catch (err: any) {
      if (err?.response?.status === 401) return setEstado("fora");
      setErro(err?.response?.data?.error ?? "Falha ao consultar");
    }
  }, []);

  const buscarDetalhe = useCallback(async (id: string) => {
    try {
      const { data } = await axios.get("/api/admin/conversa", { params: { id } });
      setDetalhe(data);
    } catch {
      setDetalhe(null);
    }
  }, []);

  // Função serverless não sustenta conexão aberta, então "ao vivo" aqui
  // é consulta periódica mesmo.
  useEffect(() => {
    if (estado !== "dentro") return;
    buscarLista();
    const t = setInterval(buscarLista, INTERVALO);
    return () => clearInterval(t);
  }, [estado, buscarLista]);

  useEffect(() => {
    if (estado !== "dentro" || !aberta) return;
    buscarDetalhe(aberta);
    const t = setInterval(() => buscarDetalhe(aberta), INTERVALO);
    return () => clearInterval(t);
  }, [estado, aberta, buscarDetalhe]);

  if (estado === "carregando") {
    return <Casca>Carregando…</Casca>;
  }

  if (estado === "fora") {
    return (
      <Casca>
        <form
          onSubmit={entrar}
          className="mx-auto mt-16 w-full max-w-xs rounded-card border border-line bg-surface p-6 shadow-soft"
        >
          <h1 className="font-display text-2xl text-ink">
            Painel · {clinic.name}
          </h1>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            autoFocus
            className="field mt-4"
          />
          {erro && <p className="mt-2 text-sm text-rose-deep">{erro}</p>}
          <button type="submit" className="btn-primary mt-4 w-full">
            Entrar
          </button>
        </form>
      </Casca>
    );
  }

  const c = dados?.contagem;
  const lista = dados?.conversas ?? [];

  return (
    <Casca>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-2xl text-ink">Conversas</h1>
          <span className="text-xs text-muted">
            atualizando a cada {INTERVALO / 1000}s
          </span>
        </div>

        {erro && <p className="mt-3 text-sm text-rose-deep">{erro}</p>}

        {c && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
            <Numero rotulo="Entraram" valor={c.total} />
            <Numero rotulo="Viram a oferta" valor={c.viram_oferta} de={c.total} />
            <Numero rotulo="Deram dados" valor={c.deram_dados} de={c.total} />
            <Numero rotulo="Geraram PIX" valor={c.geraram_pix} de={c.total} />
            <Numero rotulo="Pagaram" valor={c.pagaram} de={c.total} />
            <Numero rotulo="Faturado" texto={brl(Number(c.faturado || 0))} />
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[22rem_1fr]">
          <div className="max-h-[70vh] overflow-y-auto rounded-card border border-line bg-surface">
            {lista.length === 0 && (
              <p className="p-5 text-sm text-muted">
                Nenhuma conversa ainda. Assim que alguém abrir o funil, ela
                aparece aqui.
              </p>
            )}
            {lista.map((v: any) => (
              <button
                key={v.id}
                onClick={() => setAberta(v.id)}
                className={`flex w-full flex-col gap-1 border-b border-line px-4 py-3 text-left transition-colors hover:bg-cream/60 ${
                  aberta === v.id ? "bg-cream" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-ink">
                    {v.nome || "sem nome ainda"}
                  </span>
                  <Etapa n={v.etapa} />
                </div>
                <span className="truncate text-xs text-muted">
                  {v.ultima_da_cliente || "—"}
                </span>
                <span className="text-[11px] text-muted/70">
                  {horario(v.atualizada_em)} · {v.total_mensagens} mensagens
                </span>
              </button>
            ))}
          </div>

          <div className="max-h-[70vh] overflow-y-auto rounded-card border border-line bg-surface p-5">
            {!detalhe && (
              <p className="text-sm text-muted">
                Escolha uma conversa à esquerda.
              </p>
            )}

            {detalhe && (
              <>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line pb-4 text-sm">
                  <span className="font-medium text-ink">
                    {detalhe.conversa.nome || "sem nome"}
                  </span>
                  <Etapa n={detalhe.conversa.etapa} />
                  {detalhe.conversa.email && (
                    <span className="text-muted">{detalhe.conversa.email}</span>
                  )}
                  {detalhe.conversa.telefone && (
                    <span className="text-muted">{detalhe.conversa.telefone}</span>
                  )}
                  {detalhe.conversa.valor && (
                    <span className="text-rose-deep">
                      {brl(Number(detalhe.conversa.valor))}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {detalhe.mensagens.map((m: any, i: number) => (
                    <div
                      key={i}
                      className={`flex ${
                        m.papel === "cliente" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
                          m.papel === "cliente"
                            ? "bg-rose text-white"
                            : "border border-line bg-cream/70 text-ink"
                        }`}
                      >
                        {m.conteudo}
                        <span
                          className={`mt-1 block text-[10px] ${
                            m.papel === "cliente" ? "text-white/70" : "text-muted"
                          }`}
                        >
                          {horario(m.criada_em)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Casca>
  );
}

function Numero({
  rotulo,
  valor,
  de,
  texto,
}: {
  rotulo: string;
  valor?: number;
  de?: number;
  texto?: string;
}) {
  const pct = de && de > 0 && valor != null ? Math.round((valor / de) * 100) : null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
      <p className="eyebrow">{rotulo}</p>
      <p className="mt-1 font-display text-2xl text-ink">{texto ?? valor}</p>
      {pct != null && <p className="text-[11px] text-muted">{pct}%</p>}
    </div>
  );
}

function Casca({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>{`Painel · ${clinic.name}`}</title>
        {/* Painel com dado pessoal não entra em buscador. */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-cream">{children}</div>
    </>
  );
}
