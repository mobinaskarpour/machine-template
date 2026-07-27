# Deployment

## Local

```bash
npm install
npm run validate-demo
npm run typecheck
npm run lint
npm run test
npm run build
npm start
```

## Docker (Ubuntu / any host)

```bash
docker compose up -d --build
curl -fsS http://localhost:3000/api/health
```

Image uses Next.js `output: "standalone"`. Healthcheck hits `/api/health`.

## Demo Factory

When orchestrated by the Demo Factory control plane:

1. Clone this template (read-only remote `machine-template`)
2. Codex edits `demo.config.json`, `branding/`, `config/`, `industries/`, `mock-data/`
3. Factory runs `lint` → `test` → `build`
4. Factory commits to the **customer demo** repo and deploys via Docker Compose

Do not push customer changes back to the template repository.
