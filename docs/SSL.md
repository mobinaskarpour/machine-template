# SSL

Supported providers: `EXTERNAL`, `CERTBOT`.

## Variable names

```text
SSL_PROVIDER
CERTBOT_EMAIL
```

## Rules

- For external/Cloudflare-managed SSL, verify the actual HTTPS endpoint; do not assume origin SSL
- Certbot: noninteractive, require email, exact domain, validate Nginx first, preserve prior config on failure
- Never expose or print certificate private keys
- If HTTPS cannot be verified, do not report an HTTPS public URL as healthy
