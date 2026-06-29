const URL_DO_WORKER = "https://projetinhoestudocloud-api.allnmaxmo.workers.dev/";

export async function onRequest() {
  const urlDoSorteio = new URL("/sorteio", URL_DO_WORKER);

  return fetch(urlDoSorteio.toString());
}
