import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    pool: "@cloudflare/vitest-pool-workers",
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            ARCANE_API_KEY: "test-api-key",
          },
        },
      },
    },
  } as any,
});
