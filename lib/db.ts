import { Pool } from "pg";
import { ETAPA } from "./etapas";

// O "Postgres" da Vercel virou um marketplace: pode ser Neon, Supabase,
// Prisma e outros. Driver que fala TCP funciona com todos; o HTTP do
// Neon só com o Neon, e falhava com "fetch failed" nos demais.
const bruta =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "";

// O driver lê o sslmode de dentro da string e ele vence a opção `ssl`
// passada ao pool — foi por isso que a conexão morria com
// "self-signed certificate in certificate chain". Os poolers gerenciados
// costumam apresentar cadeia que não fecha nas CAs embutidas do Node.
// `no-verify` mantém o tráfego cifrado e dispensa só a verificação.
function normalizarSsl(cs: string) {
  if (!cs) return cs;
  try {
    const u = new URL(cs);
    if (u.searchParams.get("sslmode") === "disable") return cs;
    u.searchParams.set("sslmode", "no-verify");
    return u.toString();
  } catch {
    return cs;
  }
}

const connectionString = normalizarSsl(bruta);

export const dbConfigurado = Boolean(connectionString);

let pool: Pool | null = null;

function obterPool() {
  if (!pool) {
    pool = new Pool({
      connectionString,
      // Uma conexão por instância: função serverless multiplica processos,
      // e um pool grande em cada um estoura o limite do banco.
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      // O SSL vem do sslmode já normalizado na string; repetir aqui só
      // reintroduz o conflito que quebrava a conexão.
    });
    pool.on("error", (e) => console.error("Pool do Postgres:", e.message));
  }
  return pool;
}

// Mantém a forma sql`...` de todas as consultas e continua parametrizando:
// os valores viram $1, $2… e nunca entram concatenados no texto.
type Consulta = (
  strings: TemplateStringsArray,
  ...valores: any[]
) => Promise<any[]>;

const sql: Consulta | null = dbConfigurado
  ? async (strings, ...valores) => {
      const texto = strings.reduce(
        (acc, parte, i) => acc + parte + (i < valores.length ? `$${i + 1}` : ""),
        ""
      );
      const { rows } = await obterPool().query(texto, valores);
      return rows;
    }
  : null;

export { ETAPA, ETAPAS } from "./etapas";

let schemaPronto = false;

// Criado sob demanda: são duas tabelas e nenhuma migração pendente, então
// ferramenta de migração aqui seria peso morto.
async function garantirSchema() {
  if (!sql || schemaPronto) return;

  await sql`
    create table if not exists conversas (
      id uuid primary key,
      criada_em timestamptz not null default now(),
      atualizada_em timestamptz not null default now(),
      nome text,
      email text,
      telefone text,
      documento text,
      etapa smallint not null default 0,
      pix_hash text,
      valor numeric
    )
  `;
  await sql`
    create table if not exists mensagens (
      id bigserial primary key,
      conversa_id uuid not null references conversas(id) on delete cascade,
      papel text not null,
      conteudo text not null,
      criada_em timestamptz not null default now()
    )
  `;
  await sql`
    create index if not exists mensagens_por_conversa
      on mensagens (conversa_id, id)
  `;
  await sql`
    create index if not exists conversas_recentes
      on conversas (atualizada_em desc)
  `;

  schemaPronto = true;
}

// Nenhuma falha de gravação pode derrubar a venda: se o banco cair, o
// funil continua vendendo e só perdemos o registro daquela conversa.
export async function comBanco<T>(
  fn: (q: NonNullable<typeof sql>) => Promise<T>
): Promise<T | null> {
  if (!sql) return null;
  try {
    await garantirSchema();
    return await fn(sql);
  } catch (erro: any) {
    console.error("Banco indisponível:", erro.message);
    return null;
  }
}

// Fonte única das consultas do painel. O diagnóstico executa estas
// mesmas funções: testar uma cópia do SQL não provaria nada, porque a
// cópia pode divergir da que roda de verdade.
//
// Diferente das gravações, estas propagam o erro: numa consulta do
// painel, falhar calado viraria uma tela vazia que parece "sem vendas".
function exigirBanco() {
  if (!sql) throw new Error("Banco não configurado");
  return sql;
}

export async function listarConversas() {
  const q = exigirBanco();
  await garantirSchema();
  return await q`
      select c.id, c.criada_em, c.atualizada_em, c.nome, c.email,
             c.telefone, c.etapa, c.valor,
             count(m.id)::int as total_mensagens,
             (select conteudo from mensagens
               where conversa_id = c.id and papel = 'cliente'
               order by id desc limit 1) as ultima_da_cliente
        from conversas c
        left join mensagens m on m.conversa_id = c.id
       group by c.id
       order by c.atualizada_em desc
       limit 200
  `;
}

export async function contarFunil() {
  const q = exigirBanco();
  await garantirSchema();
  const linhas = await q`
      select
        count(*)::int as total,
        count(*) filter (where etapa >= ${ETAPA.viuOferta})::int as viram_oferta,
        count(*) filter (where etapa >= ${ETAPA.preencheuDados})::int as deram_dados,
        count(*) filter (where etapa >= ${ETAPA.pixGerado})::int as geraram_pix,
        count(*) filter (where etapa >= ${ETAPA.pagou})::int as pagaram,
        coalesce(sum(valor) filter (where etapa >= ${ETAPA.pagou}), 0) as faturado
      from conversas
  `;
  return linhas[0];
}

export async function buscarConversa(id: string) {
  const q = exigirBanco();
  await garantirSchema();

  const [conversa] = await q`
    select id, criada_em, atualizada_em, nome, email, telefone,
           documento, etapa, pix_hash, valor
      from conversas where id = ${id}
  `;
  if (!conversa) return { conversa: null, mensagens: [] };

  const mensagens = await q`
    select papel, conteudo, criada_em
      from mensagens where conversa_id = ${id}
     order by id asc
  `;
  return { conversa, mensagens };
}

async function consultasDoPainel() {
  await listarConversas();
  await contarFunil();
  // Um id inexistente exercita o caminho sem depender de dado real.
  await buscarConversa("00000000-0000-4000-8000-000000000000");
}

// Como comBanco engole os próprios erros de propósito, sem isto não há
// como saber de fora se o banco respondeu — só o log da Vercel diria.
// Reporta se conecta, se as tabelas existem e quantas linhas há, nunca
// o conteúdo de nenhuma delas.
export async function checarBanco() {
  if (!sql) return { configurado: false, conecta: false, conversas: null };

  try {
    await sql`select 1`;
  } catch (erro: any) {
    return {
      configurado: true,
      conecta: false,
      erro: String(erro?.message ?? erro).slice(0, 200),
      conversas: null,
    };
  }

  try {
    await garantirSchema();
    const [linha] = await sql`select count(*)::int as n from conversas`;

    // Roda as mesmas consultas do painel para que um erro de SQL apareça
    // aqui, e não na cara de quem abriu a página. Só o "deu certo" sai.
    await consultasDoPainel();

    return {
      configurado: true,
      conecta: true,
      conversas: linha.n,
      consultasDoPainel: true,
    };
  } catch (erro: any) {
    return {
      configurado: true,
      conecta: true,
      erro: String(erro?.message ?? erro).slice(0, 200),
      conversas: null,
    };
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const idValido = (v: unknown) => typeof v === "string" && UUID.test(v);

export async function registrarEtapa(conversaId: string, etapa: number) {
  await comBanco(async (q) => {
    await q`
      insert into conversas (id, etapa) values (${conversaId}, ${etapa})
      on conflict (id) do update
        set etapa = greatest(conversas.etapa, ${etapa}),
            atualizada_em = now()
    `;
  });
}

export async function registrarMensagem(
  conversaId: string,
  papel: "doutora" | "cliente",
  conteudo: string
) {
  await comBanco(async (q) => {
    await q`
      insert into conversas (id) values (${conversaId})
      on conflict (id) do update set atualizada_em = now()
    `;
    await q`
      insert into mensagens (conversa_id, papel, conteudo)
      values (${conversaId}, ${papel}, ${conteudo})
    `;
  });
}

// Só guarda os campos; a etapa é decidida por quem chama. O nome chega
// logo na primeira fala e não significa que ela preencheu o checkout.
export async function registrarDados(
  conversaId: string,
  dados: { nome?: string; email?: string; telefone?: string; documento?: string }
) {
  await comBanco(async (q) => {
    await q`
      insert into conversas (id, nome, email, telefone, documento)
      values (${conversaId}, ${dados.nome ?? null}, ${dados.email ?? null},
              ${dados.telefone ?? null}, ${dados.documento ?? null})
      on conflict (id) do update
        set nome = coalesce(excluded.nome, conversas.nome),
            email = coalesce(excluded.email, conversas.email),
            telefone = coalesce(excluded.telefone, conversas.telefone),
            documento = coalesce(excluded.documento, conversas.documento),
            atualizada_em = now()
    `;
  });
}

export async function registrarPix(
  conversaId: string,
  pixHash: string,
  valor: number
) {
  await comBanco(async (q) => {
    await q`
      update conversas
         set pix_hash = ${pixHash},
             valor = ${valor},
             etapa = greatest(etapa, ${ETAPA.pixGerado}),
             atualizada_em = now()
       where id = ${conversaId}
    `;
  });
}

// O webhook conhece a transação, não a conversa — daí buscar pelo hash.
export async function marcarPagoPorHash(pixHash: string) {
  await comBanco(async (q) => {
    await q`
      update conversas
         set etapa = greatest(etapa, ${ETAPA.pagou}), atualizada_em = now()
       where pix_hash = ${pixHash}
    `;
  });
}
