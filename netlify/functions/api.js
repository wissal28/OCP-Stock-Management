// Fonction Netlify unique qui sert toute l'API (/api/*) — enveloppe handleRequest (server/requestHandler.js,
// identique au serveur Node persistent utilisé en local) via serverless-http, sans dupliquer la logique
// de routage. netlify.toml redirige /api/* vers cette fonction ; le chemin d'origine (/api/...) est
// restauré ci-dessous avant d'appeler handleRequest, qui route sur des chemins littéraux "/api/...".
import serverless from "serverless-http";
import { handleRequest } from "../../server/requestHandler.js";
import { runMigrations } from "../../server/migrate.js";
import { loadEnvFile } from "../../server/loadEnv.js";

loadEnvFile();

// Les migrations (création des tables si absentes, seed initial) sont idempotentes — voir migrate.js.
// Réexécutées une fois par démarrage à froid de la fonction (jamais dans le corps d'une requête).
let migrationsReady = null;
function ensureMigrated() {
  if (!migrationsReady) migrationsReady = runMigrations();
  return migrationsReady;
}

const wrapped = serverless(handleRequest);

export async function handler(event, context) {
  await ensureMigrated();
  // event.path arrive préfixé par le chemin de la fonction (ex. "/.netlify/functions/api/auth/login")
  // à cause de la redirection /api/* -> /.netlify/functions/api/:splat — restaure le chemin "/api/..."
  // que handleRequest attend, sans changer sa logique de routage.
  const restoredPath = event.path.replace(/^.*?\/api(\/|$)/, "/api$1");
  const restoredEvent = { ...event, path: restoredPath };
  return wrapped(restoredEvent, context);
}
