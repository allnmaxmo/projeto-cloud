# Explicação da saudação

Este arquivo explica como a página `index.html` conversa com o Worker `worker.js` para enviar um nome e receber uma saudação personalizada.

## Campo de nome na página

No `index.html`, existe um campo de texto:

```html
<input id="nome" type="text" placeholder="Digite seu nome">
```

Esse campo permite digitar um nome antes de clicar no botão **Buscar hora**.

O `id="nome"` é importante porque o JavaScript usa esse identificador para encontrar o campo na página.

## Pegando o nome digitado

Dentro da função `buscarHora()`, o código pega o valor digitado:

```js
const nome = document.getElementById("nome").value.trim();
```

Essa linha faz o seguinte:

- `document.getElementById("nome")` encontra o input na página;
- `.value` pega o texto digitado;
- `.trim()` remove espaços no começo e no fim.

Exemplo:

```txt
"   Maria   "
```

vira:

```txt
"Maria"
```

## Montando a URL do Worker

A página usa a função `montarUrl()` para criar uma URL completa a partir da URL base do Worker:

```js
const url = montarUrl("/hora");
```

Se tiver nome, a função `buscarHora()` adiciona esse valor como parâmetro da URL:

```js
if (nome) {
  url.searchParams.set("nome", nome);
}
```

Com o nome `Maria`, a chamada fica assim:

```txt
https://exemplo-worker.seu-subdominio.workers.dev/hora?nome=Maria
```

Se o campo estiver vazio, a página chama apenas a rota `/hora`, sem parâmetro `nome`.

## Chamando o Worker

A página chama o Worker com:

```js
const resposta = await fetch(url.toString());
```

Antes de ler o JSON, a página verifica se a resposta deu certo:

```js
if (!resposta.ok) {
  status.textContent = "Não encontrei essa rota. Tente novamente em alguns instantes.";
  return;
}
```

Isso evita que a página tente ler JSON quando o Worker respondeu com erro, como em uma rota inexistente.

Depois, a resposta é convertida para JSON:

```js
const dados = await resposta.json();
```

Agora a variável `dados` contém os campos enviados pelo Worker:

```js
dados.mensagem
dados.horaDoServidor
dados.fraseDoDia
```

## Lendo o nome no Worker

No `worker.js`, o Worker lê o parâmetro `nome` da URL:

```js
const nome = url.searchParams.get("nome");
const nomeTratado = nome ? nome.trim() : "";
```

Se veio nome, o Worker remove espaços extras. Se não veio nome, usa uma string vazia.

## Montando a mensagem

A mensagem é criada dentro do objeto `corpo`:

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

Se estiver vazio, aparece a mensagem padrão:

```txt
Olá estranho!
```

## Mostrando a saudação na tela

No `index.html`, a saudação recebida do Worker atualiza o título principal:

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

## Hora e frase junto da saudação

A mesma rota `/hora` também retorna:

- `horaDoServidor`, com data e hora no formato brasileiro;
- `fraseDoDia`, com uma frase sorteada pelo Worker.

Esses dois valores aparecem no elemento `status`, com a hora em uma linha e a frase do dia abaixo.

## Fluxo completo

1. Você digita um nome na página.
2. Clica em **Buscar hora**.
3. A página monta a URL `/hora`.
4. Se houver nome, adiciona `?nome=...`.
5. O Worker lê o nome recebido.
6. O Worker monta a saudação, a hora e a frase do dia.
7. O Worker envia tudo em JSON.
8. A página atualiza o `h1#titulo` com a saudação.
9. A página mostra a hora e a frase no `#status`.

Se nenhum nome for digitado, a página continua funcionando e o Worker responde com `Olá estranho!`.
