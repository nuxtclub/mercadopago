import { fileURLToPath } from "url";
import { defineNuxtModule, createResolver, addTemplate } from "@nuxt/kit";
import { defu } from "defu";

export interface ModuleOptions {
  /**
   * MercadoPago Public Key
   * @default process.env.MERCADOPAGO_PUBLIC_KEY
   * @type string
   */
  publicKey: string;
  /**
   * MercadoPago Access Token
   * @default process.env.MERCADOPAGO_ACCESS_TOKEN
   * @type string
   */
  accessToken: string;
  /**
   * MercadoPago Platform ID
   * @default process.env.MERCADOPAGO_PLATFORM_ID (undefined)
   * @type string | undefined
   */
  platformId: string | undefined;
  /**
   * MercadoPago Corporation ID
   * @default process.env.MERCADOPAGO_CORPORATION_ID (undefined)
   * @type string | undefined
   */
  corporationId: string | undefined;
  /**
   * MercadoPago Integrator ID
   * @default process.env.MERCADOPAGO_INTEGRATOR_ID (undefined)
   * @type string | undefined
   */
  integratorId: string | undefined;
  /**
   * MercadoPago Sandbox Mode
   * @default process.env.MERCADOPAGO_MODE
   * @type boolean
   */
  sandbox: boolean;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-mercadopago",
    configKey: "mercadopago",
    compatibility: {
      nuxt: "^3.0.0",
    },
  },
  defaults: {
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY as string,
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string,
    platformId: process.env.MERCADOPAGO_PLATFORM_ID,
    corporationId: process.env.MERCADOPAGO_CORPORATION_ID,
    integratorId: process.env.MERCADOPAGO_INTEGRATOR_ID,
    sandbox: process.env.MERCADOPAGO_MODE === "sandbox",
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    // Make sure Public Key and Access Token are set
    if (!options.publicKey) {
      console.warn("Missing `MERCADOPAGO_PUBLIC_KEY` in `.env`");
    }
    if (!options.accessToken) {
      console.warn("Missing `MERCADOPAGO_ACCESS_TOKEN` in `.env`");
    }

    // Public runtimeConfig
    nuxt.options.runtimeConfig.public.mercadopago = defu(
      nuxt.options.runtimeConfig.public.mercadopago,
      {
        publicKey: options.publicKey,
      }
    );

    // Private runtimeConfig
    nuxt.options.runtimeConfig.mercadopago = defu(
      nuxt.options.runtimeConfig.mercadopago,
      {
        accessToken: options.accessToken,
        platformId: options.platformId,
        corporationId: options.corporationId,
        integratorId: options.integratorId,
        sandbox: options.sandbox,
      }
    );

    // Transpile runtime
    const runtimeDir = fileURLToPath(new URL("./runtime", import.meta.url));
    nuxt.options.build.transpile.push(runtimeDir);

    // Transpile mercadopago package
    nuxt.options.build.transpile.push("mercadopago");

    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {};

      nitroConfig.externals = defu(
        typeof nitroConfig.externals === "object" ? nitroConfig.externals : {},
        {
          inline: [resolve("./runtime")],
        }
      );

      nitroConfig.alias["#mercadopago/server"] = resolve(
        runtimeDir,
        "server",
        "services"
      );
    });

    addTemplate({
      filename: "types/mercadopago.d.ts",
      getContents: () =>
        [
          "declare module '#mercadopago/server' {",
          ` const serverMercadopagoClient: typeof import('${resolve(
            "./runtime/server/services"
          )}').serverMercadopagoClient`,
          "}",
        ].join("\n"),
    });

    nuxt.hook("prepare:types", (options) => {
      options.references.push({
        path: resolve(nuxt.options.buildDir, "types/mercadopago.d.ts"),
      });
    });
  },
});
