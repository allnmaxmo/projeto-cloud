# Explicação do contador de visitas

Este arquivo explica como funciona o contador de visitas do projeto, usando o Cloudflare KV no `worker.js` e mostrando o resultado na página `index.html`.

## Ideia geral

O contador serve para guardar quantas vezes a página foi acessada.

Para isso, o projeto usa:

- o `index.html`, que chama a rota do contador e mostra o número na tela;
- o `worker.js`, que recebe a chamada, soma mais `1` e salva o novo total;
- o KV da Cloudflare, que guarda o número mesmo depois de recarregar a página ou fechar o navegador.

## Binding usado

O Worker acessa o KV por um binding configurado no painel da Cloudflare. Em documentação pública, use um nome fictício, como:

```js
env.EXEMPLO_KV
```

Esse nome precisa ser igual ao nome configurado no painel da Cloudflare para o seu projeto real.

O código não cria um KV novo. Ele usa o binding que já existe.

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

Mesmo sendo um número, ele é salvo como texto porque o KV guarda valores em formato de string.

## Função `incrementarContador`

No `worker.js`, a função principal do contador pode seguir esta ideia:

```js
async function incrementarContador(env) {
  const chave = "contador_de_visitas";

  const valorAtual = await env.EXEMPLO_KV.get(chave);
  const visitasAtuais = valorAtual ? Number(valorAtual) : 0;
  const novoTotal = visitasAtuais + 1;

  await env.EXEMPLO_KV.put(chave, String(novoTotal));

  return novoTotal;
}
```

Ela faz o seguinte:

1. Define a chave `contador_de_visitas`.
2. Busca o valor atual no KV com o binding configurado.
3. Se ainda não existir valor, considera `0`.
4. Converte o valor para número com `Number(valorAtual)`.
5. Soma `+1`.
6. Salva o novo total no KV.
7. Devolve o número atualizado.

## Rota `/api/contador`

O contador fica disponível na rota:

```txt
/api/contador
```

No `worker.js`, essa rota aparece antes das outras rotas. Exemplo fictício para documentação:

```js
if (caminho === "/api/contador") {
  if (!env || !env.EXEMPLO_KV) {
    return responderJson({ erro: "Binding KV de exemplo não encontrado." }, 500);
  }

  const visitas = await incrementarContador(env);
  return responderJson({ visitas: visitas });
}
```

Quando alguém chama essa rota, o Worker:

1. Verifica se o binding KV existe.
2. Se o binding não existir, devolve erro `500`.
3. Se o binding existir, chama `incrementarContador(env)`.
4. Retorna um JSON com o total atualizado.

A resposta esperada é assim:

```json
{
  "visitas": 16
}
```

## Função `responderJson`

O `worker.js` também tem uma função auxiliar para responder JSON:

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

Ela evita repetir o mesmo código toda vez que o Worker precisa devolver JSON.

O cabeçalho `Access-Control-Allow-Origin` permite que a página publicada no Pages consiga chamar o Worker.

## Onde aparece na página

No `index.html`, existe este elemento:

```html
<p id="contador-visitas">Carregando contador...</p>
```

Ele aparece dentro do `main`, junto com o título, a mensagem da hora, o campo de nome e os botões.

Enquanto a chamada ao Worker ainda não terminou, o texto mostrado é:

```txt
Carregando contador...
```

Depois que o Worker responde, esse texto é atualizado.

## Função `carregarContador`

No JavaScript do `index.html`, a função que busca o contador é esta:

```js
async function carregarContador() {
  const contador = document.getElementById("contador-visitas");
  const url = montarUrl("/api/contador");

  try {
    const resposta = await fetch(url.toString(), {
      cache: "no-store"
    });

    if (!resposta.ok) {
      contador.textContent = "Não foi possível carregar o contador de visitas.";
      return;
    }

    const dados = await resposta.json();
    contador.textContent = "Você é a visita número " + dados.visitas;
  } catch (erro) {
    contador.textContent = "Não foi possível carregar o contador de visitas.";
  }
}
```

Ela faz o seguinte:

1. Encontra o elemento `contador-visitas` na página.
2. Monta a URL `/api/contador`.
3. Chama o Worker usando `fetch`.
4. Usa `cache: "no-store"` para evitar resposta antiga em cache.
5. Verifica se a resposta deu certo com `resposta.ok`.
6. Lê o JSON retornado pelo Worker.
7. Mostra o texto com o número atualizado.

## Quando o contador carrega

No final do script do `index.html`, a função é chamada assim:

```js
carregarContador();
buscarHora();
```

Isso significa que, quando a página abre:

1. O contador de visitas é carregado.
2. A hora e a frase do dia também são carregadas.

Cada carregamento da página chama `/api/contador`, então o total aumenta.

## Fluxo completo

O fluxo completo fica assim:

```txt
Usuário abre a página
  -> index.html chama /api/contador
  -> worker.js recebe a rota /api/contador
  -> Worker lê contador_de_visitas no KV
  -> Worker soma +1
  -> Worker salva o novo total no KV
  -> Worker devolve { "visitas": novoTotal }
  -> index.html mostra "Você é a visita número X"
```

## O que acontece se der erro

Se o binding KV não estiver disponível no Worker, a rota devolve:

```json
{
  "erro": "Binding KV de exemplo não encontrado."
}
```

com status `500`.

Se a página não conseguir carregar o contador, ela mostra:

```txt
Não foi possível carregar o contador de visitas.
```

Assim, a página continua funcionando, mesmo se o contador falhar.

## Resumo

O contador de visitas usa o KV da Cloudflare para guardar o total de acessos.

A rota `/api/contador` incrementa e devolve o número atualizado.

O `index.html` chama essa rota quando a página abre e mostra o resultado para o usuário.

Como o valor fica salvo no KV, o contador continua existindo mesmo depois de recarregar a página ou fechar o navegador.
