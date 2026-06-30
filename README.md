# Projeto Olá, Nuvem

Projeto de estudo para testar Cloudflare Pages, Cloudflare Workers, rotas de API e armazenamento com Cloudflare KV.

A pagina principal fica no `index.html` e consome uma API publicada em um Worker. O Worker fica no `worker.js` e responde as rotas usadas pela pagina.

## Objetivo

O projeto foi criado para praticar pequenos desafios de backend e frontend na Cloudflare:

- exibir uma frase do dia retornada pelo Worker;
- enviar um nome pela pagina e receber uma saudacao personalizada;
- separar rotas para hora e sorteio;
- tratar rotas desconhecidas com erro `404`;
- salvar um contador de visitas no Cloudflare KV.

## Arquivos principais

- `index.html`: pagina publicada no Cloudflare Pages.
- `worker.js`: API publicada no Cloudflare Workers.
- `explicacao-frase-do-dia.md`: explicacao do desafio 1.
- `explicacao-saudacao.md`: explicacao do desafio 2.
- `explicacao-rotas-worker.md`: explicacao do desafio 3.
- `explicacao-erro-404.md`: explicacao do desafio 4.
- `explicacao-contador-visitas.md`: explicacao do desafio 5.

## Como a pagina funciona

Quando o `index.html` abre, ele chama o Worker configurado nesta URL:

```txt
https://projetinhoestudocloud-api.allnmaxmo.workers.dev/
```

A pagina busca a hora do servidor, mostra uma frase do dia, atualiza o titulo com o nome digitado no formulario e carrega o contador de visitas.

Tambem existe uma area de desafios. Ao clicar em cada desafio, a pagina carrega o arquivo `.md` correspondente e mostra uma previa formatada do conteudo.

## Rotas do Worker

### `/` e `/hora`

Retornam um JSON com:

- `mensagem`: saudacao com o nome enviado ou uma mensagem padrao;
- `horaDoServidor`: data e hora do servidor;
- `fraseDoDia`: frase sorteada pelo Worker.

Exemplo:

```json
{
  "mensagem": "Olá, Anne!",
  "horaDoServidor": "29/06/2026, 22:27:29",
  "fraseDoDia": "Acordei disposto... disposto a voltar a dormir."
}
```

### `/sorteio`

Retorna um numero aleatorio de 1 a 100.

Exemplo:

```json
{
  "mensagem": "Numero sorteado!",
  "numeroSorteado": 42
}
```

### `/api/contador`

Incrementa o contador de visitas salvo no Cloudflare KV e retorna o novo total.

Exemplo:

```json
{
  "visitas": 16
}
```

### Rotas desconhecidas

Qualquer caminho nao configurado retorna:

```txt
Rota não encontrada
```

com status HTTP `404`.

## Cloudflare KV

O contador usa o binding KV existente:

```js
env.kv_key
```

A chave usada para salvar o total de visitas e:

```txt
contador_de_visitas
```

O projeto nao cria namespace novo. Ele usa o KV ja configurado na Cloudflare.

## Como testar

Para testar a API publicada, abra as rotas no navegador:

```txt
https://projetinhoestudocloud-api.allnmaxmo.workers.dev/hora?nome=Anne
https://projetinhoestudocloud-api.allnmaxmo.workers.dev/sorteio
https://projetinhoestudocloud-api.allnmaxmo.workers.dev/api/contador
https://projetinhoestudocloud-api.allnmaxmo.workers.dev/teste
```

A rota `/teste` deve retornar status `404`.

Para testar a pagina, use o Cloudflare Pages ou um servidor local simples. Isso ajuda o navegador a carregar os arquivos `.md` do indice de desafios corretamente.

## Como publicar

1. Publique o `worker.js` no Cloudflare Workers.
2. Confirme que o Worker tem o binding KV chamado `kv_key`.
3. Publique o `index.html` e os arquivos `.md` no Cloudflare Pages ou no repositorio usado pelo Pages.
4. Abra a URL do Pages e teste os botoes `Buscar hora`, `Sortear numero` e o contador de visitas.

## Desafios documentados

- Desafio 1: frase do dia.
- Desafio 2: saudacao com nome.
- Desafio 3: rotas `/hora` e `/sorteio`.
- Desafio 4: erro `404` para rota desconhecida.
- Desafio 5: contador de visitas com KV.
