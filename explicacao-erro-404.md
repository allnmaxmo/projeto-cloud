# Explicacao do erro 404

Este arquivo explica como o projeto trata uma rota que nao existe, sem quebrar a pagina.

## Ideia geral

Quando alguem chama uma rota desconhecida, o Worker precisa avisar que aquela rota nao foi encontrada.

Esse aviso usa o codigo HTTP `404`.

No projeto, isso acontece em duas partes:

- no `worker.js`, que devolve a resposta `404`;
- no `index.html`, que verifica se a resposta deu certo antes de tentar ler os dados.

## Onde fica no Worker

No `worker.js`, o Worker le o caminho da URL:

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

Se o caminho nao for nenhuma dessas rotas, o codigo cai no `else` final.

## Rota desconhecida

O trecho responsavel pela rota desconhecida e este:

```js
return new Response("Rota não encontrada", { status: 404 });
```

Isso significa:

- o corpo da resposta sera o texto `Rota não encontrada`;
- o codigo HTTP sera `404`.

O `404` indica que o servidor recebeu a chamada, mas nao encontrou uma rota correspondente.

## Por que nao retorna JSON

As rotas validas do projeto retornam JSON.

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

Por isso a pagina nao deve tentar executar `resposta.json()` quando a resposta nao deu certo.

## Como a pagina verifica o erro

No `index.html`, antes de ler o JSON, a pagina verifica:

```js
if (!resposta.ok) {
  status.textContent = "Não encontrei essa rota. Tente novamente em alguns instantes.";
  return;
}
```

O `resposta.ok` so e verdadeiro quando o status HTTP esta na faixa de sucesso, como `200`.

Quando a resposta vem com `404`, o `resposta.ok` e falso.

## O que acontece na pratica

Se a pagina tentar chamar uma rota errada:

```txt
/teste
```

o fluxo fica assim:

1. O navegador chama o Worker.
2. O Worker le o caminho `/teste`.
3. O Worker percebe que essa rota nao existe.
4. O Worker devolve `Rota não encontrada` com status `404`.
5. A pagina verifica `resposta.ok`.
6. Como a resposta nao deu certo, a pagina mostra uma mensagem amigavel.
7. A pagina nao tenta ler JSON e nao quebra.

## Mensagem para o usuario

Quando a resposta nao esta correta, o usuario ve:

```txt
Não encontrei essa rota. Tente novamente em alguns instantes.
```

Assim o projeto reage bem ao erro.

## Resumo

O desafio 4 garante que rotas desconhecidas sejam tratadas corretamente.

O Worker devolve status `404`, e a pagina usa `resposta.ok` para decidir se pode ler JSON ou se deve mostrar uma mensagem de erro amigavel.

Com isso, a pagina nao trava e nao fica em branco quando algo da errado.
