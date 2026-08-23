// Équivalent Netlify du setInterval de server/stockRolloverJob.js (impossible à faire tourner tel
// quel dans une fonction serverless — rien n'y reste "long-running" entre deux invocations). Netlify
// déclenche cette fonction selon le planning cron défini dans netlify.toml (toutes les heures) ;
// runRollover() est idempotent (voir stockRolloverJob.js), donc un déclenchement fréquent est sans
// risque — il garantit juste qu'un passage a bien lieu après 7h, quel que soit le fuseau exact.
import { runRollover } from "../../server/stockRolloverJob.js";
import { runMigrations } from "../../server/migrate.js";
import { loadEnvFile } from "../../server/loadEnv.js";

loadEnvFile();

export async function handler() {
  await runMigrations();
  await runRollover();
  return { statusCode: 200, body: "ok" };
}
