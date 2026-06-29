const URL_DO_WORKER = "https://projetinhoestudocloud-api.allnmaxmo.workers.dev/";

export async function onRequest(context) {
  const urlDaPagina = new URL(context.request.url);
  const urlDaHora = new URL("/hora", URL_DO_WORKER);
  urlDaHora.search = urlDaPagina.search;

  return fetch(urlDaHora.toString());
}
