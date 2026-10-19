import { useEffect, useRef, useState } from "react";
import axios from "axios";

type Exemplo = { cliente: string; doutora: string };

type Dados = {
  chave: string | null;
  origemChave: "painel" | "ambiente" | null;
  modelo: string;
  instrucoes: string;
  conhecimento: string;
  exemplos: Exemplo[];
  instrucoesPadrao: string;
  modelos: { id: string; nome: string }[];
};

type Fala = { role: "user" | "assistant"; content: string };

export default function PainelCerebro({ onSair }: { onSair: () => void }) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");

  const [novaChave, setNovaChave] = useState("");
  const [modelo, setModelo] = useState("");
  const [instrucoes, setInstrucoes] = useState("");
  const [conhecimento, setConhecimento] = useState("");
  const [exemplos, setExemplos] = useState<Exemplo[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");

  const carregar = (d: Dados) => {
    setDados(d);
    setModelo(d.modelo);
    setInstrucoes(d.instrucoes);
    setConhecimento(d.conhecimento);
    setExemplos(d.exemplos);
    setNovaChave("");
  };

  useEffect(() => {
    axios
      .get("/api/admin/cerebro")
      .then(({ data }) => carregar(data))
      .catch((err) => {
        if (err?.response?.status === 401) return onSair();
        setErro(err?.response?.data?.error ?? "Não consegui carregar o cérebro");
      });
  }, [onSair]);

  const salvar = async (extra: { removerChave?: boolean } = {}) => {
    setSalvando(true);
    setAviso("");
    setErro("");
    try {
      const { data } = await axios.put("/api/admin/cerebro", {
        apiKey: novaChave,
        modelo,
        instrucoes,
        conhecimento,
        exemplos,
        ...extra,
      });
      carregar(data);
      setAviso("Salvo. Em até 30 segundos a doutora já responde assim.");
    } catch (err: any) {
      if (err?.response?.status === 401) return onSair();
      setErro(err?.response?.data?.error ?? "Não consegui salvar");
    } finally {
      setSalvando(false);
    }
  };

  const mudarExemplo = (i: number, campo: keyof Exemplo, valor: string) =>
    setExemplos((lista) =>
      lista.map((e, j) => (j === i ? { ...e, [campo]: valor } : e))
    );

  if (!dados) {
    return (
      <p className={`mt-6 text-sm ${erro ? "text-rose-deep" : "text-muted"}`}>
        {erro || "Carregando…"}
      </p>
    );
  }

  const rascunho = { apiKey: novaChave, modelo, instrucoes, conhecimento, exemplos };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div className="flex flex-col gap-5">
        <Bloco
          titulo="Chave da API"
          dica="A chave da Anthropic (começa com sk-ant-). Pegue em console.anthropic.com → API Keys."
        >
          <p className="text-sm text-muted">
            {dados.chave ? (
              <>
                Em uso: <span className="font-mono text-ink">{dados.chave}</span>{" "}
                {dados.origemChave === "ambiente" && "(da Vercel)"}
              </>
            ) : (
              <span className="text-rose-deep">
                Nenhuma chave cadastrada — o chat não responde sem ela.
              </span>
            )}
          </p>
          <input
            type="password"
            value={novaChave}
            onChange={(e) => setNovaChave(e.target.value)}
            placeholder={dados.chave ? "Colar nova chave para trocar" : "sk-ant-..."}
            autoComplete="off"
            className="field mt-3 font-mono text-sm"
          />
          {dados.origemChave === "painel" && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Apagar a chave salva no painel?")) {
                  salvar({ removerChave: true });
                }
              }}
              className="mt-2 text-xs text-muted underline hover:text-rose-deep"
            >
              apagar chave do painel
            </button>
          )}
        </Bloco>

        <Bloco titulo="Modelo" dica="Qual IA responde as clientes.">
          <select
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className="field"
          >
            {dados.modelos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </Bloco>

        <Bloco
          titulo="Como ela deve responder"
          dica="Quem ela é, o que vende, o tom, o tamanho das respostas, o que perguntar e o que nunca dizer. Escreva como se estivesse explicando para uma atendente nova."
        >
          <textarea
            value={instrucoes}
            onChange={(e) => setInstrucoes(e.target.value)}
            rows={16}
            className="field text-sm leading-relaxed"
          />
          {instrucoes !== dados.instrucoesPadrao && (
            <button
              type="button"
              onClick={() => setInstrucoes(dados.instrucoesPadrao)}
              className="mt-2 text-xs text-muted underline hover:text-rose-deep"
            >
              voltar ao texto original
            </button>
          )}
        </Bloco>

        <Bloco
          titulo="O que ela precisa saber"
          dica="Fatos sobre o produto e respostas para dúvidas comuns: o que vem no método, preço, garantia, como recebe o acesso, perguntas frequentes."
        >
          <textarea
            value={conhecimento}
            onChange={(e) => setConhecimento(e.target.value)}
            rows={8}
            placeholder={"Ex.:\nO acesso chega no e-mail logo após o pagamento.\nTem garantia de 7 dias.\nFunciona para estrias brancas e vermelhas."}
            className="field text-sm leading-relaxed"
          />
        </Bloco>

        <Bloco
          titulo="Exemplos de resposta"
          dica="O jeito mais forte de treinar: mostre uma mensagem da cliente e a resposta exata que você gostaria. Ela copia o tom e o tamanho."
        >
          <div className="flex flex-col gap-3">
            {exemplos.map((e, i) => (
              <div key={i} className="rounded-lg border border-line bg-cream/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Exemplo {i + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExemplos((lista) => lista.filter((_, j) => j !== i))
                    }
                    className="text-xs text-muted hover:text-rose-deep"
                  >
                    remover
                  </button>
                </div>
                <textarea
                  value={e.cliente}
                  onChange={(ev) => mudarExemplo(i, "cliente", ev.target.value)}
                  rows={2}
                  placeholder="A cliente diz…"
                  className="field mt-2 text-sm"
                />
                <textarea
                  value={e.doutora}
                  onChange={(ev) => mudarExemplo(i, "doutora", ev.target.value)}
                  rows={3}
                  placeholder="A doutora responde…"
                  className="field mt-2 text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setExemplos((lista) => [...lista, { cliente: "", doutora: "" }])
              }
              className="btn-ghost"
            >
              + Adicionar exemplo
            </button>
          </div>
        </Bloco>

        <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 bg-cream/95 px-1 py-3 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => salvar()}
            disabled={salvando}
            className="btn-primary"
          >
            {salvando ? "Salvando…" : "Salvar cérebro"}
          </button>
          {aviso && <span className="text-sm text-emerald-700">{aviso}</span>}
          {erro && <span className="text-sm text-rose-deep">{erro}</span>}
        </div>
      </div>

      <Teste rascunho={rascunho} onSair={onSair} />
    </div>
  );
}

// Conversa de teste com o que está na tela, antes mesmo de salvar.
function Teste({ rascunho, onSair }: { rascunho: object; onSair: () => void }) {
  const [falas, setFalas] = useState<Fala[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [erro, setErro] = useState("");
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "nearest" });
  }, [falas, pensando]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem || pensando) return;
    setTexto("");
    setErro("");
    setFalas((f) => [...f, { role: "user", content: mensagem }]);
    setPensando(true);
    try {
      const { data } = await axios.post("/api/admin/cerebro-teste", {
        rascunho,
        historico: falas,
        mensagem,
      });
      setFalas((f) => [...f, { role: "assistant", content: data.resposta }]);
    } catch (err: any) {
      if (err?.response?.status === 401) return onSair();
      setErro(err?.response?.data?.error ?? "Falha no teste");
      // A mensagem sem resposta sai do histórico para não confundir a próxima.
      setFalas((f) => f.slice(0, -1));
      setTexto(mensagem);
    } finally {
      setPensando(false);
    }
  };

  return (
    <div className="flex h-fit flex-col rounded-card border border-line bg-surface lg:sticky lg:top-4">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="font-display text-lg text-ink">Testar</p>
          <p className="text-xs text-muted">Usa o que está na tela, mesmo sem salvar</p>
        </div>
        {falas.length > 0 && (
          <button
            type="button"
            onClick={() => setFalas([])}
            className="text-xs text-muted underline hover:text-rose-deep"
          >
            recomeçar
          </button>
        )}
      </div>

      <div className="flex max-h-[55vh] min-h-[16rem] flex-col gap-3 overflow-y-auto p-4">
        {falas.length === 0 && (
          <p className="text-sm text-muted">
            Escreva como se fosse uma cliente e veja como a doutora responde.
          </p>
        )}
        {falas.map((f, i) => (
          <div
            key={i}
            className={`flex ${f.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
                f.role === "user"
                  ? "bg-rose text-white"
                  : "border border-line bg-cream/70 text-ink"
              }`}
            >
              {f.content}
            </div>
          </div>
        ))}
        {pensando && <p className="text-sm text-muted">digitando…</p>}
        {erro && <p className="text-sm text-rose-deep">{erro}</p>}
        <div ref={fim} />
      </div>

      <form onSubmit={enviar} className="flex gap-2 border-t border-line p-3">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Mensagem da cliente…"
          className="field flex-1 py-2.5"
        />
        <button
          type="submit"
          disabled={pensando || !texto.trim()}
          className="rounded-lg bg-rose px-4 text-sm font-medium text-white disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

function Bloco({
  titulo,
  dica,
  children,
}: {
  titulo: string;
  dica: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="font-display text-xl text-ink">{titulo}</h2>
      <p className="mb-3 mt-1 text-sm text-muted">{dica}</p>
      {children}
    </section>
  );
}
