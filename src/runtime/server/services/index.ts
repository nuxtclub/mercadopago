import type { H3Event } from "h3";
import { useRuntimeConfig } from "#imports";
import mercadopago from "mercadopago";
import { MercadoPago } from "mercadopago/interface";

export const serverMercadopagoClient = (event: H3Event): MercadoPago => {
  const {
    mercadopago: {
      accessToken,
      platformId,
      corporationId,
      integratorId,
      sandbox,
    },
  } = useRuntimeConfig();

  // Make sure access token is set
  if (!accessToken) {
    throw new Error("Missing `MERCADOPAGO_ACCESS_TOKEN` in `.env`");
  }

  if (!event.context._mercadopago) {
    mercadopago.configure({
      access_token: accessToken,
      platform_id: platformId,
      corporation_id: corporationId,
      integrator_id: integratorId,
      sandbox,
    });

    event.context._mercadopago = mercadopago;
  }

  return event.context._mercadopago;
};
