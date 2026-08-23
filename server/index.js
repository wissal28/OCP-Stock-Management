// Point d'entrée "serveur persistant" (dev local, ou hébergeur avec process Node long-running type
// Render/Railway/Fly.io) — écoute en continu sur un port et fait tourner la tâche planifiée
// quotidienne. Le routage lui-même (handleRequest) vit dans requestHandler.js, réutilisé tel quel
// par netlify/functions/api.js (fonction serverless, sans écoute réseau ni tâche planifiée locale).
import http from "node:http";
import { handleRequest } from "./requestHandler.js";
import { exportNaviresToCsv, exportTrainsToCsv } from "./csvExport.js";
import { runMigrations } from "./migrate.js";
import { scheduleStockRollover } from "./stockRolloverJob.js";
import { loadEnvFile } from "./loadEnv.js";
import { listTrains } from "./trainRepository.js";
import { listNavires } from "./navireRepository.js";

loadEnvFile();
await runMigrations();
scheduleStockRollover();
// Les CSV database/trains.csv et database/navires.csv sont ensuite tenus à jour automatiquement à
// chaque écriture (voir trainRepository.js / navireRepository.js) — génération initiale ici pour
// qu'ils reflètent l'état actuel dès le démarrage, sans attendre la première modification.
Promise.all([listTrains(), listNavires()]).then(([trains, navires]) => {
  exportTrainsToCsv(trains);
  exportNaviresToCsv(navires);
});

const port = Number(process.env.API_PORT || 3001);

http.createServer(handleRequest).listen(port, () => {
  console.log(`API SQLite listening on http://localhost:${port}`);
});
