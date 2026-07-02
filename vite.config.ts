import { spawn, type ChildProcess } from "node:child_process";
import { createConnection } from "node:net";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const envPort = Number((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.PORT);
const apiPort = 3001;

function isPortInUse(port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

// Lance automatiquement l'API CSV (server/index.js) avec `npm run dev`,
// sauf si elle tourne déjà sur le port 3001.
function csvApiServer(): Plugin {
  let child: ChildProcess | undefined;

  return {
    name: "csv-api-server",
    apply: "serve",
    async configureServer() {
      if (await isPortInUse(apiPort)) {
        console.log(`[csv-api] API déjà active sur le port ${apiPort}, réutilisation.`);
        return;
      }
      child = spawn(process.execPath, ["server/index.js"], {
        stdio: "inherit",
        env: { ...process.env, API_PORT: String(apiPort) }
      });
      const stop = () => {
        if (child && !child.killed) child.kill();
      };
      process.once("exit", stop);
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
    }
  };
}

export default defineConfig({
  plugins: [react(), csvApiServer()],
  server: {
    port: Number.isNaN(envPort) ? 5173 : envPort,
    proxy: {
      "/api": `http://localhost:${apiPort}`
    }
  },
});
