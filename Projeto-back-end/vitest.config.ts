import { defineConfig } from "vitest/config";
import { transformWithOxc } from "vite";

// Este teste importa um utilitário puro do módulo anterior, sem precisar do Expo.
const checkoutUtility = /\/Projeto-mobile\/utils\/pendingCheckout\.ts$/;
export default defineConfig({
  oxc: { exclude: checkoutUtility },
  plugins: [{
    name: "test-checkout-utility",
    enforce: "pre",
    async transform(code, id) {
      if (checkoutUtility.test(id.replace(/\\/g, "/"))) {
        return transformWithOxc(code, id, { lang: "ts", tsconfig: false });
      }
    },
  }],
  test: {
    // Valores exclusivos dos testes; não são credenciais de um banco real.
    env: { DB_NAME: "cinemax_test", DB_USER: "test", DB_PASS: "test" },
    environment: "node",
    include: ["**/*.test.ts"],
    globals: true,
  },
});
