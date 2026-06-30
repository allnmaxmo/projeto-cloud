# Explicacao do contador de visitas

Este arquivo explica como funciona o contador de visitas do projeto, usando o Cloudflare KV no `worker.js` e mostrando o resultado na pagina `index.html`.

## Ideia geral

O contador serve para guardar quantas vezes a pagina foi acessada.

Para isso, o projeto usa:

- o `index.html`, que chama a rota do contador e mostra o numero na tela;
- o `worker.js`, que recebe a chamada, soma mais `1` e salva o novo total;
- o KV da Cloudflare, que guarda o numero mesmo depois de recarregar a pagina ou fechar o navegador.

## Binding usado

O Worker acessa o KV pelo binding:

```js
env.kv_key
```

Esse nome precisa ser igual ao nome configurado no painel da Cloudflare.

O codigo nao cria um KV novo. Ele usa o binding que ja existe.

## Chave usada no KV

Dentro do KV, o contador fica salvo nesta chave:

```js
const chave = "contador_de_visitas";
```

Essa chave guarda o total atual de visitas como texto.

Exemplo:

```txt
contador_de_visitas -> "15"
```

Mesmo sendo um numero, ele e salvo como texto porque o KV guarda valores em formato de string.

## Funcao `incrementarContador`

No `worker.js`, a funcao principal do contador e esta:

```js
async function incrementarContador(env) {
  const chave = "contador_de_visitas";

  const valorAtual = await env.kv_key.get(chave);
  const visitasAtuais = valorAtual ? Number(valorAtual) : 0;
  const novoTotal = visitasAtuais + 1;

  await env.kv_key.put(chave, String(novoTotal));

  return novoTotal;
}
```

Ela faz o seguinte:

1. Define a chave `contador_de_visitas`.
2. Busca o valor atual no KV com `env.kv_key.get(chave)`.
3. Se ainda nao existir valor, considera `0`.
4. Converte o valor para numero com `Number(valorAtual)`.
5. Soma `+1`.
6. Salva o novo total no KV com `env.kv_key.put`.
7. Devolve o numero atualizado.

## Rota `/api/contador`

O contador fica disponivel na rota:

```txt
/api/contador
```

No `worker.js`, essa rota aparece antes das outras rotas:

```js
if (caminho === "/api/contador") {
  if (!env || !env.kv_key) {
    return responderJson({ erro: "Binding KV kv_key nao encontrado." }, 500);
  }

  const visitas = await incrementarContador(env);
  return responderJson({ visitas: visitas });
}
```

Quando alguem chama essa rota, o Worker:

1. Verifica se o binding `kv_key` existe.
2. Se o binding nao existir, devolve erro `500`.
3. Se o binding existir, chama `incrementarContador(env)`.
4. Retorna um JSON com o total atualizado.

A resposta esperada e assim:

```json
{
  "visitas": 16
}
```

## Funcao `responderJson`

O `worker.js` tambem tem uma funcao auxiliar para responder JSON:

```js
function responderJson(corpo, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

Ela evita repetir o mesmo codigo toda vez que o Worker precisa devolver JSON.

O cabecalho `Access-Control-Allow-Origin` permite que a pagina publicada no Pages consiga chamar o Worker.

## Onde aparece na pagina

No `index.html`, existe este elemento:

```html
<p id="contador-visitas">Carregando contador...</p>
```

Ele aparece dentro do `main`, junto com o titulo, a mensagem da hora, o campo de nome e os botoes.

Enquanto a chamada ao Worker ainda nao terminou, o texto mostrado e:

```txt
Carregando contador...
```

Depois que o Worker responde, esse texto e atualizado.

## Funcao `carregarContador`

No JavaScript do `index.html`, a funcao que busca o contador e esta:

```js
async function carregarContador() {
  const contador = document.getElementById("contador-visitas");
  const url = montarUrl("/api/contador");

  try {
    const resposta = await fetch(url.toString(), {
      cache: "no-store"
    });

    if (!resposta.ok) {
      contador.textContent = "Nao foi possivel carregar o contador de visitas.";
      return;
    }

    const dados = await resposta.json();
    contador.textContent = "Voce e a visita numero " + dados.visitas;
  } catch (erro) {
    contador.textContent = "Nao foi possivel carregar o contador de visitas.";
  }
}
```

Ela faz o seguinte:

1. Encontra o elemento `contador-visitas` na pagina.
2. Monta a URL `/api/contador`.
3. Chama o Worker usando `fetch`.
4. Usa `cache: "no-store"` para evitar resposta antiga em cache.
5. Verifica se a resposta deu certo com `resposta.ok`.
6. Le o JSON retornado pelo Worker.
7. Mostra o texto com o numero atualizado.

## Quando o contador carrega

No final do script do `index.html`, a funcao e chamada assim:

```js
carregarContador();
buscarHora();
```

Isso significa que, quando a pagina abre:

1. O contador de visitas e carregado.
2. A hora e a frase do dia tambem sao carregadas.

Cada carregamento da pagina chama `/api/contador`, entao o total aumenta.

## Fluxo completo

O fluxo completo fica assim:

```txt
Usuario abre a pagina
  -> index.html chama /api/contador
  -> worker.js recebe a rota /api/contador
  -> Worker le contador_de_visitas no KV
  -> Worker soma +1
  -> Worker salva o novo total no KV
  -> Worker devolve { "visitas": novoTotal }
  -> index.html mostra "Voce e a visita numero X"
```

## O que acontece se der erro

Se o binding `kv_key` nao estiver disponivel no Worker, a rota devolve:

```json
{
  "erro": "Binding KV kv_key nao encontrado."
}
```

com status `500`.

Se a pagina nao conseguir carregar o contador, ela mostra:

```txt
Nao foi possivel carregar o contador de visitas.
```

Assim a pagina continua funcionando, mesmo se o contador falhar.

## Resumo

O contador de visitas usa o KV da Cloudflare para guardar o total de acessos.

A rota `/api/contador` incrementa e devolve o numero atualizado.

O `index.html` chama essa rota quando a pagina abre e mostra o resultado para o usuario.

Como o valor fica salvo no KV, o contador continua existindo mesmo depois de recarregar a pagina ou fechar o navegador.
