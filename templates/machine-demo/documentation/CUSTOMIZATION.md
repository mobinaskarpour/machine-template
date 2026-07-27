# Customization guide

Codex CLI (and humans) should customize demos via configuration — not by rewriting React components.

## Change company name / persona

Edit [`config/company.json`](../config/company.json) (and mirror in [`branding/company.json`](../branding/company.json)):

- `productName`, `legalName`
- `session.orgName`, `userName`, `role`
- `gate.*` copy
- `metadata.title` / `description`

Also update top-level [`demo.config.json`](../demo.config.json) `companyName`.

## Change logo

1. Replace `branding/logo.svg` and `branding/favicon.png` / `favicon.svg`
2. Copy into `public/` (or run `npm run replace-branding` when implemented)
3. Point `demo.config.json` → `logo` / `favicon`

## Change theme / primary color

Edit [`config/theme.json`](../config/theme.json):

- `tokens.primary`, `tokens.accent`, chart colors
- Layout injects CSS variables from this file at runtime

Update `demo.config.json` `primaryColor` / `accentColor` to match.

## Change navigation labels

Edit [`config/navigation.json`](../config/navigation.json) `pageLabels`, `uiLabels`, `railItems`.

## Change dashboards / workflows

- Catalog: `config/dashboards.json`, `config/workflows.json`
- Industry pack: `industries/<industry>/dashboards/pack.json`, `.../workflows/pack.json`

## Change mock data

Edit files under `mock-data/` (and keep industry copies in sync under `industries/<industry>/mock-data/`).

Thin loaders in `src/mock/*` re-export these JSON files — UI stays unchanged.

## Change AI scenarios

- Persona pointer: `config/ai.json`
- Scenarios pack: `industries/<industry>/ai/scenarios.json`
- Matcher logic stays in `src/lib/ai-engine.ts` (extend data, not control flow, when possible)

## Switch industry

1. Fill `industries/<name>/` pack
2. Set `demo.config.json` → `industry` and pack paths
3. Set `config/industry.json` → `id`
4. Run `npm run generate-demo` (stub) / copy packs into `config/` + `mock-data/`
