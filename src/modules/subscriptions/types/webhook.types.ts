export interface MercadoPagoWebhookBody {
  id: number;
  live_mode: boolean;
  type: 'subscription_preapproval' | 'subscription_authorized_payment' | 'payment';
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}
