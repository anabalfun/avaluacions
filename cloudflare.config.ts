import { defineConfig } from "cf/config";

// The temporary diagnostics window is complete: serve assets directly again.
export default defineConfig({
  worker: {
    name: "avaluacions",
    compatibilityDate: "2026-11-19",
    workersDev: true,
    previewUrls: false,
    // Explicitly disable persistence rather than inheriting deployed settings.
    observability: {
      enabled: false,
      logs: { enabled: false, invocationLogs: false },
      traces: { enabled: false },
    },
  },
});
