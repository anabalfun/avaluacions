// cf delegates bundling to Wrangler; runtime settings live in cloudflare.config.ts.
import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig({ assetsDirectory: "./docs" });
