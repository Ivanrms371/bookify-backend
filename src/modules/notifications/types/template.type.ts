export type EmailContent = {
  subject: string;
  text?: string;
  react: React.ReactNode;
};

export type InAppContent = {
  title: string;
  message: string;
};

export type WhatsAppContent = {
  body: string;
};

export type ChannelContentMap = {
  EMAIL: EmailContent;
  IN_APP: InAppContent;
  WHATSAPP: WhatsAppContent;
};
