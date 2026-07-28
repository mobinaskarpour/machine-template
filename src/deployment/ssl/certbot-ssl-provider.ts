import { AppError } from "../../shared/errors.js";
import type { SslProvisionResult, SslProviderKind } from "./ssl-types.js";

export type SslConfig = {
  sslProvider: SslProviderKind;
  certbotEmail: string;
};

/**
 * SSL provisioning stub. Real certbot automation requires public DNS + port
 * 80/443 reachability this loopback-first deployment model does not
 * guarantee, so this provider validates configuration and reports intent
 * without invoking certbot itself. When SSL_PROVIDER=EXTERNAL, termination is
 * assumed to happen upstream (e.g. a load balancer) and this is a no-op.
 */
export class CertbotSslProvider {
  constructor(private readonly config: SslConfig) {}

  isConfigured(): boolean {
    if (this.config.sslProvider === "EXTERNAL") return true;
    return this.config.sslProvider === "CERTBOT" && Boolean(this.config.certbotEmail);
  }

  async provision(domain: string): Promise<SslProvisionResult> {
    if (!this.isConfigured()) {
      throw new AppError(
        "DEPLOYMENT_PUBLIC_NOT_CONFIGURED",
        "SSL is not configured — set SSL_PROVIDER to CERTBOT (with CERTBOT_EMAIL) or EXTERNAL",
      );
    }
    if (this.config.sslProvider === "EXTERNAL") {
      return {
        configured: true,
        provider: "EXTERNAL",
        domain,
        reason: "External SSL termination assumed (e.g. upstream load balancer)",
      };
    }
    return {
      configured: false,
      provider: "CERTBOT",
      domain,
      reason: "Certbot automation is not wired in this release; provision the certificate manually for this domain",
    };
  }
}
