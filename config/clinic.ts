// Dados reais do negócio. Campos vazios simplesmente não aparecem no site,
// então nada falso é exibido enquanto você não preencher.

export const clinic = {
  name: "STRIAÉ",
  tagline: "Dermatologia estética avançada",

  doctor: {
    name: "Dra. Julia",
    title: "Dermatologista",
    // Coloque a foto em public/ e aponte aqui (ex.: "/doutora.jpg").
    // Vazio = monograma com as iniciais, sem requisição quebrada.
    photo: "/doutora.jpg",
    // Ex.: "CRM-SP 123456". Vazio = o selo de registro não é exibido.
    crm: "",
  },

  // Só números, com DDI. Ex.: "5511999999999". Vazio = botão oculto.
  whatsapp: "",

  // Valor riscado, usado como referência nos dois planos. A porcentagem
  // exibida é calculada daqui contra o preço real de cada plano, então
  // mexer neste número muda o desconto anunciado:
  // 67 contra 36,80 dá 45%.
  price: {
    original: 67,
  },

  // Cada plano aponta para uma oferta real do IronPay. O preço aqui tem
  // que bater com o da oferta lá, senão a cobrança sai errada.
  // "resgate" é liberado quando ela decide ficar no aviso de saída — só
  // prometemos desconto extra porque ele existe de verdade.
  plans: {
    padrao: {
      offerHash: "4mom34ozin",
      productHash: "aup67qyv90",
      productTitle: "APP STRIAÉ",
      price: 36.8,
    },
    // Dormente: o aviso de saída que liberava este preço foi removido.
    // Continua aqui porque a oferta segue ativa no IronPay, mas nenhuma
    // requisição consegue selecioná-la (veja resolvePlan em api/payment).
    resgate: {
      offerHash: "0oahyxn15j",
      productHash: "ybcfqettui",
      productTitle: "STRIAÉ",
      price: 19.9,
    },
  },

  // ID do pixel do Facebook (só números, como 1234567890123456).
  // Vazio = nenhum script de rastreamento é carregado.
  facebookPixelId: "624262646647561",

  // Vídeo de apresentação, enviado pela doutora como primeira mensagem.
  // src vazio = a conversa começa direto pela pergunta do nome.
  vsl: {
    src: "/video/video VSL.mp4.mp4",
    // Capa exibida antes do play. Sem ela o player abre no primeiro quadro.
    poster: "",
    intro:
      "Gravei este vídeo rápido explicando o que eu oriento quem já tentou de tudo e não viu resultado:",
  },

  guaranteeDays: 7,

  // Vagas reais que a clínica consegue atender no período da campanha.
  // 0 = a linha de vagas não aparece. Nunca coloque um número que você
  // não consiga sustentar se alguém perguntar.
  spotsLeft: 0,

  // O que a cliente recebe ao comprar. Ajuste conforme a entrega real
  // do método — é isso que ela lê antes de decidir pagar.
  includes: [
    "Método STRIAÉ completo, passo a passo, para fazer em casa",
    "Rotina diária com orientação dermatológica",
    "Lista do que usar e do que evitar na sua pele",
    "Acompanhamento com a doutora durante o processo",
    "Suporte direto pelo WhatsApp",
  ],

  // Carrossel exibido no chat, junto da mensagem que explica o método.
  // Coloque os arquivos em public/resultados/ e descomente a lista abaixo.
  // Leia public/resultados/LEIA-ME.md antes de publicar: só entra material
  // de clientes suas, com autorização de uso de imagem assinada.
  // Vazio = o carrossel não aparece e a mensagem não menciona resultados.
  socialProof: {
    // Vídeos têm prioridade: se houver algum, o carrossel não aparece.
    // Dois ficam lado a lado no computador e empilhados no celular.
    // Use sempre .mp4 (H.264/AAC): .mov falha em parte dos Androids.
    videos: [
      "/video/video.mp4.mp4",
      "/video/Conversor MP4 - FreeConvert.com(1).mov",
    ],
    // Imagem de capa mostrada antes do play. Sem ela o player abre num
    // quadro preto — vale exportar um frame do próprio vídeo.
    poster: "",

    images: [] as { src: string; caption?: string }[],
    // images: [
    //   { src: "/resultados/resultado-1.jpg" },
    //   { src: "/resultados/resultado-2.jpg" },
    //   { src: "/resultados/resultado-3.jpg" },
    // ],

    // Frase da doutora logo antes dos vídeos ou das imagens.
    intro: "Olha esses dois vídeos incríveis abaixo:",
  },

  // Depoimentos reais de clientes. Vazio = a seção não aparece.
  // Ex.: { name: "Juliana M.", text: "...", result: "3 meses de tratamento" }
  testimonials: [] as { name: string; text: string; result: string }[],
};

export type PlanId = keyof typeof clinic.plans;

export const planFor = (rescue: boolean): PlanId => (rescue ? "resgate" : "padrao");

export const plan = (id: PlanId) => clinic.plans[id];

export const priceOf = (id: PlanId) => clinic.plans[id].price;

export const savingsOf = (id: PlanId) =>
  clinic.price.original - clinic.plans[id].price;

export const finalPrice = clinic.plans.padrao.price;

export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
