import { AppError } from "../../shared/errors.js";
import { renderDomainForSlug } from "./domain-validator.js";

export type ProxyConfig = {
  publicEnabled: boolean;
  nginxConfigRoot: string;
  domainPattern: string;
};

export type ProxyRouteResult = {
  configured: boolean;
  domain: string;
};

/**
 * Reverse-proxy stub. THE MACHINE only ever binds the generated app to
 * 127.0.0.1; exposing it publicly requires an operator-managed nginx (or
 * equivalent) reverse proxy pointed at that loopback port. This provider
 * validates configuration and computes the target domain, but does not write
 * nginx vhosts itself — until DEPLOYMENT_PUBLIC_ENABLED, NGINX_CONFIG_ROOT,
 * and DEPLOYMENT_DOMAIN_PATTERN are all set, any public-route request fails
 * closed with DEPLOYMENT_PUBLIC_NOT_CONFIGURED.
 */
export class NginxProxyProvider {
  constructor(private readonly config: ProxyConfig) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.publicEnabled && this.config.nginxConfigRoot && this.config.domainPattern,
    );
  }

  async ensurePublicRoute(input: { slug: string; port: number }): Promise<ProxyRouteResult> {
    if (!this.isConfigured()) {
      throw new AppError(
        "DEPLOYMENT_PUBLIC_NOT_CONFIGURED",
        "Reverse proxy is not configured — set DEPLOYMENT_PUBLIC_ENABLED, NGINX_CONFIG_ROOT, and DEPLOYMENT_DOMAIN_PATTERN",
      );
    }
    const domain = renderDomainForSlug(this.config.domainPattern, input.slug);
    void input.port;
    return { configured: true, domain };
  }

  async removePublicRoute(_slug: string): Promise<void> {
    void _slug;
  }
}
