# Project structure

```
machine/
  demo.config.json          # Single entry for Codex / demo generation
  branding/                 # Logo, favicon, brand company/theme mirrors
  config/                   # Runtime JSON (company, theme, nav, AI, packs)
  mock-data/                # Narrative datasets by domain
  industries/               # Vertical packs (construction default)
  templates/                # Content scaffolds for agents
  scripts/                  # generate-* / validate-demo stubs
  assets/                   # Non-brand shared media
  documentation/            # Human docs
  public/                   # Next.js static (favicon, logo)
  src/                      # Reusable application core
    app/                    # Routes
    components/             # UI (do not customer-fork)
    config/                 # Thin TS loaders over JSON
    mock/                   # Thin TS loaders over mock-data JSON
    lib/demo/               # demo.config + JSON imports
    lib/intelligence/       # Engines (keep)
    store/                  # Zustand (session loads company.json)
  .factory/                 # Demo Factory orchestration metadata
```

## Source of truth

| Concern | Path |
|---------|------|
| Company / persona | `config/company.json` (+ `branding/company.json`) |
| Colors | `config/theme.json` |
| Navigation / labels | `config/navigation.json` |
| Dashboards catalog | `config/dashboards.json` |
| Workflows catalog | `config/workflows.json` |
| AI persona pointer | `config/ai.json` |
| Connections | `config/connections.json` |
| Construction content | `industries/construction/**` |
| Mock narratives | `mock-data/**` |
