// The deploy command supplies ./docs as the static asset directory.
// No Worker script or server-side runtime is needed.
export default {
  worker: {
    name: "avaluacions",
    compatibilityDate: "2026-11-19",
    workersDev: true,
    previewUrls: false,
  },
};
