export const MercadoPagoConfig = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  clientId: process.env.MERCADOPAGO_CLIENT_ID,

  preapprovalPlanUrl: 'https://api.mercadopago.com/preapproval_plan',
  preapprovalSubscriptionUrl: 'https://api.mercadopago.com/preapproval',
  cancelSubscriptionUrl: (id: string) => `https://api.mercadopago.com/preapproval/${id}`,
  paymentSearchUrl: (externalReference: string) =>
    `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(
      externalReference,
    )}`,
};
