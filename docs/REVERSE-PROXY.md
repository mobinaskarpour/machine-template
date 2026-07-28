# Reverse Proxy

Public exposure is optional and configuration-dependent.

## Variable names

```text
DEPLOYMENT_BASE_DOMAIN
DEPLOYMENT_DOMAIN_PATTERN
DEPLOYMENT_PUBLIC_ENABLED
NGINX_CONFIG_ROOT
```

When unset: deploy PM2 loopback-only, verify internal health, persist **no** public URL.

When configured:

1. Derive domain from a validated pattern
2. Validate DNS
3. Backup existing proxy configuration
4. Write company-specific config
5. Validate Nginx before reload
6. Reload only after validation
7. Verify HTTP routing

Never overwrite unrelated virtual hosts. Never claim DNS ownership without verification.
