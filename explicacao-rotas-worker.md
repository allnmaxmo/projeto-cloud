# Explicacao das rotas do projeto Ola, Nuvem

Este arquivo explica o que acontece no codigo atual do projeto e como a pagina `index.html` conversa com o Worker `worker.js`.

## Estrutura atual do projeto

No workspace atual, os arquivos principais sao:

```txt
Projeto Ola nuvem/
+-- index.html
+-- worker.js
```

A pasta `functions/` nao existe no projeto local neste momento. Por isso, a pagina esta chamando o Worker diretamente pela URL configurada no JavaScript.

## `index.html`

O `index.html` e a pagina visual que o usuario acessa.

Ela mostra:

- o titulo `Ola, Nuvem`;
- uma area de status para exibir a resposta;
- um campo para digitar o nome;
- um botao `Buscar hora`;
- um botao `Sortear numero`.

No JavaScript da pagina existe esta constante:

```js
const URL_DO_WORKER = "https://projetinhoestudocloud-api.allnmaxmo.workers.dev/";
```

Essa URL e usada como base para montar as chamadas para o Worker.

## Como a pagina monta as rotas

A funcao `montarUrl` recebe um caminho, como `/hora` ou `/sorteio`, e cria uma URL completa usando a base do Worker:

```js
function montarUrl(caminho) {
  return new URL(caminho, URL_DO_WORKER);
}
```

Exemplos:

```txt
/hora    -> https://projetinhoestudocloud-api.allnmaxmo.workers.dev/hora
/sorteio -> https://projetinhoestudocloud-api.allnmaxmo.workers.dev/sorteio
/api/contador -> https://projetinhoestudocloud-api.allnmaxmo.workers.dev/api/contador
```

## Botao `Buscar hora`

Quando o usuario clica em `Buscar hora`, a pagina executa a funcao `buscarHora`.

Ela faz o seguinte:

1. Pega o valor digitado no campo `nome`.
2. Monta a URL `/hora`.
3. Se o nome foi preenchido, adiciona `?nome=...` na URL.
4. Chama o Worker com `fetch`.
5. Verifica se a resposta deu certo usando `resposta.ok`.
6. Se a resposta estiver errada, mostra uma mensagem amigavel.
7. Se a resposta estiver certa, le o JSON e mostra mensagem, hora e frase do dia.

O tratamento de erro HTTP fica assim:

```js
if (!resposta.ok) {
  status.textContent = "Não encontrei essa rota. Tente novamente em alguns instantes.";
  return;
}
```

Isso evita que a pagina tente ler JSON quando a resposta do servidor veio com erro, como em um `404`.

## Botao `Sortear numero`

Quando o usuario clica em `Sortear numero`, a pagina executa a funcao `buscarSorteio`.

Ela faz o seguinte:

1. Monta a URL `/sorteio`.
2. Chama o Worker com `fetch`.
3. Verifica `resposta.ok`.
4. Se a resposta estiver errada, mostra uma mensagem amigavel.
5. Se a resposta estiver certa, le o JSON e mostra o numero sorteado.

A protecao contra erro HTTP tambem existe nessa funcao:

```js
if (!resposta.ok) {
  status.textContent = "Não encontrei essa rota. Tente novamente em alguns instantes.";
  return;
}
```

## Erros de rede ou URL inacessivel

As duas funcoes, `buscarHora` e `buscarSorteio`, usam `try/catch`.

Se acontecer um erro de rede, problema de CORS, URL errada ou falha ao falar com o Worker, a pagina mostra:

```txt
Nao consegui falar com o Worker. Confira a URL.
```

Assim a pagina nao trava nem fica em branco.

## `worker.js`

O `worker.js` e o backend principal.

Ele recebe a requisicao, le o caminho da URL e decide qual resposta devolver.

A parte que le a URL e esta:

```js
const url = new URL(request.url);
const caminho = url.pathname;
const nome = url.searchParams.get("nome");
const nomeTratado = nome ? nome.trim() : "";
```

O `caminho` identifica a rota chamada.

Exemplos:

```txt
/
/hora
/sorteio
/api/contador
/teste
```

O parametro `nome` vem da URL quando a pagina envia algo como:

```txt
/hora?nome=Maria
```

## Rota `/`

A rota `/` responde igual a rota `/hora`.

Isso permite que o Worker tambem funcione quando alguem acessa apenas a URL principal, sem informar um caminho.

## Rota `/hora`

Quando o caminho e `/hora`, o Worker devolve um JSON com:

- uma mensagem de saudacao;
- a hora atual do servidor;
- uma frase do dia sorteada.

O objeto de resposta fica assim:

```js
corpo = {
  mensagem: nomeTratado ? "Olá, " + nomeTratado + "!" : "Olá estranho!",
  horaDoServidor: horaDoServidor,
  fraseDoDia: fraseDoDia,
};
```

Se o usuario digitou `Maria`, a mensagem fica:

```txt
Olá, Maria!
```

Se nenhum nome foi enviado, a mensagem padrao fica:

```txt
Olá estranho!
```

## Rota `/sorteio`

Quando o caminho e `/sorteio`, o Worker sorteia um numero entre `1` e `100`.

O objeto de resposta fica assim:

```js
corpo = {
  mensagem: "Numero sorteado!",
  numeroSorteado: Math.floor(Math.random() * 100) + 1,
};
```

A conta funciona assim:

- `Math.random()` gera um numero entre `0` e quase `1`;
- multiplicar por `100` gera um numero entre `0` e quase `100`;
- `Math.floor()` arredonda para baixo;
- `+ 1` faz o resultado ficar entre `1` e `100`.

## Rota `/api/contador`

Quando o caminho e `/api/contador`, o Worker usa o KV da Cloudflare para incrementar o contador de visitas.

Antes de acessar o KV, o Worker verifica se o binding `kv_key` esta disponivel:

```js
if (!env || !env.kv_key) {
  return responderJson({ erro: "Binding KV kv_key nao encontrado." }, 500);
}
```

Se o binding existir, o Worker chama `incrementarContador(env)` e devolve o total atualizado:

```js
const visitas = await incrementarContador(env);
return responderJson({ visitas: visitas });
```

A resposta fica assim:

```json
{
  "visitas": 16
}
```

## Rota inexistente

Se alguem acessar uma rota que nao existe, como:

```txt
/teste
```

o Worker responde imediatamente com status `404`:

```js
return new Response("Rota não encontrada", { status: 404 });
```

Esse retorno nao e JSON. Ele e um texto simples.

O codigo `404` significa que a rota nao foi encontrada.

## Como a pagina reage a uma rota com erro

Quando o Worker devolve um erro HTTP, como `404`, o navegador ainda recebe uma resposta. Por isso, o `fetch` nao cai automaticamente no `catch`.

Para tratar isso corretamente, a pagina verifica:

```js
if (!resposta.ok) {
  status.textContent = "Não encontrei essa rota. Tente novamente em alguns instantes.";
  return;
}
```

Assim, se a resposta nao estiver dentro da faixa de sucesso, a pagina:

- avisa o usuario com clareza;
- nao tenta converter texto simples em JSON;
- nao quebra;
- nao fica em branco.

## Fluxo completo da rota `/hora`

1. O usuario digita um nome.
2. A pagina monta a URL `/hora`.
3. Se houver nome, adiciona `?nome=...`.
4. A pagina chama o Worker.
5. O Worker identifica a rota `/hora`.
6. O Worker monta saudacao, hora e frase do dia.
7. O Worker devolve JSON com status `200`.
8. A pagina verifica `resposta.ok`.
9. A pagina le o JSON e mostra o resultado.

## Fluxo completo da rota `/sorteio`

1. O usuario clica em `Sortear numero`.
2. A pagina monta a URL `/sorteio`.
3. A pagina chama o Worker.
4. O Worker identifica a rota `/sorteio`.
5. O Worker sorteia um numero de `1` a `100`.
6. O Worker devolve JSON com status `200`.
7. A pagina verifica `resposta.ok`.
8. A pagina le o JSON e mostra o numero sorteado.

## Fluxo completo da rota `/api/contador`

1. A pagina abre e chama `/api/contador`.
2. O Worker identifica a rota do contador.
3. O Worker le a chave `contador_de_visitas` no KV usando `env.kv_key`.
4. Se ainda nao existir valor, considera `0`.
5. O Worker soma `+1`.
6. O Worker salva o novo total no KV.
7. O Worker devolve JSON com o total atualizado.
8. A pagina mostra `Você é a visita número X`.

## Fluxo completo de uma rota inexistente

1. Alguem chama uma rota desconhecida, como `/teste`.
2. O Worker nao encontra essa rota.
3. O Worker devolve `Rota não encontrada` com status `404`.
4. A pagina verifica `resposta.ok`.
5. Como `resposta.ok` e falso, a pagina mostra uma mensagem amigavel.
6. A pagina nao tenta ler JSON e nao quebra.

## Resumo

O projeto atual tem duas partes principais:

- `index.html`, que mostra a interface e chama o Worker;
- `worker.js`, que responde as rotas `/`, `/hora`, `/sorteio`, `/api/contador` e devolve `404` para rotas desconhecidas.

As rotas validas retornam JSON. Rotas inexistentes retornam texto simples com status `404`. A pagina esta preparada para lidar com erro HTTP usando `resposta.ok`, entao o usuario recebe um aviso tranquilo em vez de ver a pagina quebrar.
