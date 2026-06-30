# Explicação da `fraseDoDia`

Este arquivo explica como funciona a parte do código que sorteia uma frase no `worker.js` e envia essa frase para a página.

## Onde fica

A lógica principal está no arquivo `worker.js`.

Primeiro, o Worker cria uma lista de frases:

```js
const frases = [
  "Bom dia! Que hoje o café seja forte e a paciência também.",
  "Acordei disposto... disposto a voltar a dormir.",
  "Hoje eu acordei lindo. O espelho que lute.",
];
```

Essa lista é um array. Um array guarda vários valores em sequência.

Cada frase tem uma posição:

```js
frases[0] // primeira frase
frases[1] // segunda frase
frases[2] // terceira frase
```

## Como a frase é sorteada

A frase é escolhida com esta linha:

```js
const fraseDoDia = frases[Math.floor(Math.random() * frases.length)];
```

O `Math.random()` gera um número aleatório entre `0` e quase `1`.

O `frases.length` representa a quantidade de frases no array.

Quando multiplicamos:

```js
Math.random() * frases.length
```

o resultado vira um número aleatório dentro do tamanho da lista.

Depois, `Math.floor()` arredonda esse número para baixo, transformando em uma posição válida do array.

Exemplo:

```js
Math.random() * 4 // pode gerar 2.73
Math.floor(2.73) // vira 2
frases[2] // pega a terceira frase
```

## Como a frase vai para a página

Depois de sortear a frase, o Worker coloca esse valor dentro do objeto `corpo` da rota `/hora`:

```js
corpo = {
  mensagem: nomeTratado ? "Olá, " + nomeTratado + "!" : "Olá estranho!",
  horaDoServidor: horaDoServidor,
  fraseDoDia: fraseDoDia,
};
```

Esse objeto é transformado em JSON e enviado para a página pela função `responderJson`.

Na página, o `index.html` recebe o JSON:

```js
const dados = await resposta.json();
```

Depois, ele acessa a frase com:

```js
dados.fraseDoDia
```

## Como aparece na tela

No código atual, a frase do dia aparece abaixo da hora do servidor.

O `index.html` monta o conteúdo do `#status` com duas linhas:

```js
status.innerHTML =
  '<span class="linha-status"><span class="rotulo-status">Hora do servidor:</span> ' +
  dados.horaDoServidor +
  '</span><span class="linha-status frase-dia"><span class="rotulo-status">Frase do dia:</span> ' +
  dados.fraseDoDia +
  "</span>";
```

Na tela, a ideia fica assim:

```txt
Hora do servidor: 29/06/2026, 22:27:29
Frase do dia: Acordei disposto... disposto a voltar a dormir.
```

## Quando a frase muda

Cada vez que você clica em **Buscar hora**, uma nova chamada ao Worker acontece.

Como o Worker sorteia uma frase em cada chamada, outra frase pode aparecer.

## Resumo

O Worker guarda várias frases em um array, sorteia uma delas com `Math.random()`, envia no JSON como `fraseDoDia`, e a página mostra esse valor abaixo da hora usando `dados.fraseDoDia`.
