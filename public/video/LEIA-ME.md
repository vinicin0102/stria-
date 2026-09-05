# Vídeo da tela de pagamento

O vídeo colocado aqui aparece na tela do PIX, logo abaixo da chave, depois
que a cliente clica em gerar o código.

## Como adicionar

1. Copie o arquivo para esta pasta, por exemplo `doutora-pagamento.mp4`.

2. Abra `config/clinic.ts` e preencha `paymentVideo`:

   ```ts
   paymentVideo: {
     src: "/video/doutora-pagamento.mp4",
     poster: "/video/capa.jpg",
     title: "Um recado da Dra. Sarah",
     description: "Assista enquanto faz o pagamento.",
   },
   ```

   `poster` é a imagem de capa antes do play — opcional, mas sem ela o
   player mostra um quadro preto.

## Formato

MP4 com codec H.264 e áudio AAC. É o que toca em iPhone, Android e todos
os navegadores; outros codecs falham em parte dos aparelhos.

Deixe o arquivo abaixo de 10 MB. O vídeo é servido junto com a página, e
nesta tela a cliente está prestes a pagar — um vídeo pesado que demora a
carregar derruba a conversão justamente no pior momento. Para algo mais
longo ou mais pesado, o certo é hospedar em serviço de vídeo e embutir o
player, em vez de deixar o arquivo aqui.

O vídeo não começa sozinho: quem decide dar play é a cliente.
