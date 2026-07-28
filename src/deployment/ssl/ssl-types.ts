export type SslProviderKind = "" | "CERTBOT" | "EXTERNAL";

export type SslProvisionResult = {
  configured: boolean;
  provider: SslProviderKind;
  domain: string;
  reason?: string;
};
