# Explicacao da saudacao

Este arquivo explica como a pagina `index.html` conversa com o Worker `worker.js` para enviar um nome e receber uma saudacao personalizada.

## Campo de nome na pagina

No `index.html`, existe um campo de texto:

```html
<input id="nome" type="text" placeholder="Digite seu nome">
```

Esse campo permite digitar um nome antes de clicar no botao **Buscar hora**.

O `id="nome"` e importante porque o JavaScript usa esse identificador para encontrar o campo na pagina.

## Pegando o nome digitado

Dentro da funcao `buscarHora()`, o codigo pega o valor digitado:

```js
const nome = document.getElementById("nome").value.trim();
```

Essa linha faz o seguinte:

- `document.getElementById("nome")` encontra o input na pagina;
- `.value` pega o texto digitado;
- `.trim()` remove espacos no comeco e no fim.

Exemplo:

```txt
"   Maria   "
```

vira:

```txt
"Maria"
```

## Montando a URL do Worker

A pagina usa a funcao `montarUrl()` para criar uma URL completa a partir da URL base do Worker:

```js
const url = montarUrl("/hora");
```

Se tiver nome, a funcao `buscarHora()` adiciona esse valor como parametro da URL:

```js
if (nome) {
  url.searchParams.set("nome", nome);
}
```

Com o nome `Maria`, a chamada fica assim:

```txt
https://projetinhoestudocloud-api.allnmaxmo.workers.dev/hora?nome=Maria
```

Se o campo estiver vazio, a pagina chama apenas a rota `/hora`, sem parametro `nome`.

## Chamando o Worker

A pagina chama o Worker com:

```js
const resposta = await fetch(url.toString());
```

Antes de ler o JSON, a pagina verifica se a resposta deu certo:

```js
if (!resposta.ok) {
  status.textContent = "Não encontrei essa rota. Tente novamente em alguns instantes.";
  return;
}
```

Isso evita que a pagina tente ler JSON quando o Worker respondeu com erro, como em uma rota inexistente.

Depois, a resposta e convertida para JSON:

```js
const dados = await resposta.json();
```

Agora a variavel `dados` contem os campos enviados pelo Worker:

```js
dados.mensagem
dados.horaDoServidor
dados.fraseDoDia
```

## Lendo o nome no Worker

No `worker.js`, o Worker le o parametro `nome` da URL:

```js
const nome = url.searchParams.get("nome");
const nomeTratado = nome ? nome.trim() : "";
```

Se veio nome, o Worker remove espacos extras. Se nao veio nome, usa uma string vazia.

## Montando a mensagem

A mensagem e criada dentro do objeto `corpo`:

```js
corpo = {
  mensagem: nomeTratado ? "Olá, " + nomeTratado + "!" : "Olá estranho!",
  horaDoServidor: horaDoServidor,
  fraseDoDia: fraseDoDia,
};
```

Se `nomeTratado` tiver valor, a mensagem fica personalizada:

```txt
Olá, Maria!
```

Se estiver vazio, aparece a mensagem padrao:

```txt
Olá estranho!
```

## Mostrando a saudacao na tela

No `index.html`, a saudacao recebida do Worker atualiza o titulo principal:

```js
document.getElementById("titulo").textContent = dados.mensagem;
```

Assim, o texto inicial:

```txt
Olá, Nuvem
```

vira, por exemplo:

```txt
Olá, Maria!
```

## Hora e frase junto da saudacao

A mesma rota `/hora` tambem retorna:

- `horaDoServidor`, com data e hora no formato brasileiro;
- `fraseDoDia`, com uma frase sorteada pelo Worker.

Esses dois valores aparecem no elemento `status`, com a hora em uma linha e a frase do dia abaixo.

## Fluxo completo

1. Voce digita um nome na pagina.
2. Clica em **Buscar hora**.
3. A pagina monta a URL `/hora`.
4. Se houver nome, adiciona `?nome=...`.
5. O Worker le o nome recebido.
6. O Worker monta a saudacao, a hora e a frase do dia.
7. O Worker envia tudo em JSON.
8. A pagina atualiza o `h1#titulo` com a saudacao.
9. A pagina mostra a hora e a frase no `#status`.

Se nenhum nome for digitado, a pagina continua funcionando e o Worker responde com `Olá estranho!`.
