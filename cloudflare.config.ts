import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "avaluacions",
    entrypoint: "./cloudflare/worker.mjs",
    compatibilityDate: "2026-11-19",
    workersDev: true,
    previewUrls: false,
    env: { ASSETS: bindings.assets() },
    assets: { runWorkerFirst: true },
    observability: {
      enabled: true,
      redactQueryString: true,
      logs: {
        enabled: true,
        headSamplingRate: 1,
        invocationLogs: false,
        persist: true,
      },
      // Automatic traces can include request metadata; custom error logs suffice.
      traces: { enabled: false },
    },
  },
});
