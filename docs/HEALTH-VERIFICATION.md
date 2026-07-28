# Health Verification

After PM2 start, health verification requires:

1. PM2 reports the process online
2. Port listening on `127.0.0.1`
3. `GET /api/health` returns expected status with matching `companySlug` and `generationId`
4. Main page renders
5. One representative application route renders
6. No immediate restart loop
7. Restart count within policy
8. Sanitized logs contain no startup exception

`/api/health` returns only safe fields (`status`, `companySlug`, `generationId`). No secrets or paths.

CLI: `npm run deployment:health -- "<company-name>"`
