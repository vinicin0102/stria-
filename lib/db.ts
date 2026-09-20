import { neon } from "@neondatabase/serverless";
import { ETAPA } from "./etapas";

// A Vercel injeta POSTGRES_URL ao criar o banco pelo painel; a integração
// direta do Neon usa DATABASE_URL. Aceitar as duas evita um passo manual.
const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const dbConfigurado = Boolean(connectionString);

const sql = dbConfigurado ? neon(connectionString) : null;

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
    return { configurado: true, conecta: true, conversas: linha.n };
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
