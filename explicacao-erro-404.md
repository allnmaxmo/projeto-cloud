# Explicação do erro 404

Este arquivo explica como o projeto trata uma rota que não existe, sem quebrar a página.

## Ideia geral

Quando alguém chama uma rota desconhecida, o Worker precisa avisar que aquela rota não foi encontrada.

Esse aviso usa o código HTTP `404`.

No projeto, isso acontece em duas partes:

- no `worker.js`, que devolve a resposta `404`;
- no `index.html`, que verifica se a resposta deu certo antes de tentar ler os dados.

## Onde fica no Worker

No `worker.js`, o Worker lê o caminho da URL:

```js
const url = new URL(request.url);
const caminho = url.pathname;
```

Depois ele compara esse caminho com as rotas conhecidas:

```txt
/
/hora
/sorteio
/api/contador
```

Se o caminho não for nenhuma dessas rotas, o código cai no `else` final.

## Rota desconhecida

O trecho responsável pela rota desconhecida é este:

```js
return new Response("Rota não encontrada", { status: 404 });
```

Isso significa:

- o corpo da resposta será o texto `Rota não encontrada`;
- o código HTTP será `404`.

O `404` indica que o servidor recebeu a chamada, mas não encontrou uma rota correspondente.

## Por que não retorna JSON

As rotas válidas do projeto retornam JSON.

Exemplo da rota `/hora`:

```json
{
  "mensagem": "Olá, Maria!",
  "horaDoServidor": "...",
  "fraseDoDia": "..."
}
```

Mas a rota desconhecida retorna texto simples:

```txt
Rota não encontrada
```

Por isso, a página não deve tentar executar `resposta.json()` quando a resposta não deu certo.

## Como a página verifica o erro

No `index.html`, antes de ler o JSON, a página verifica:

```js
if (!resposta.ok) {
  status.textContent = "Não encontrei essa rota. Tente novamente em alguns instantes.";
  return;
}
```

O `resposta.ok` só é verdadeiro quando o status HTTP está na faixa de sucesso, como `200`.

Quando a resposta vem com `404`, o `resposta.ok` é falso.

## O que acontece na prática

Se a página tentar chamar uma rota errada:

```txt
/teste
```

o fluxo fica assim:

1. O navegador chama o Worker.
2. O Worker lê o caminho `/teste`.
3. O Worker percebe que essa rota não existe.
4. O Worker devolve `Rota não encontrada` com status `404`.
5. A página verifica `resposta.ok`.
6. Como a resposta não deu certo, a página mostra uma mensagem amigável.
7. A página não tenta ler JSON e não quebra.

## Mensagem para o usuário

Quando a resposta não está correta, o usuário vê:

```txt
Não encontrei essa rota. Tente novamente em alguns instantes.
```

Assim, o projeto reage bem ao erro.

## Resumo

O desafio 4 garante que rotas desconhecidas sejam tratadas corretamente.

O Worker devolve status `404`, e a página usa `resposta.ok` para decidir se pode ler JSON ou se deve mostrar uma mensagem de erro amigável.

Com isso, a página não trava e não fica em branco quando algo dá errado.
