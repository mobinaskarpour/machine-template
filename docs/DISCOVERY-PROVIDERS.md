# Discovery providers

## SearchProvider

- Tavily (`TAVILY_API_KEY`) preferred
- Serper (`SERPER_API_KEY`) supported
- Never scrape Google HTML SERPs

## WebsiteFetcher

Safe fetch with SSRF checks, redirect revalidation, size/time limits, content-type allowlist.

## KnowledgeSynthesisProvider

- `deterministic` (default/auto): builds knowledge from extracted metadata/text
- `codex`: optional CLI adapter via absolute `/usr/local/bin/codex`, ephemeral temp dir, read-only sandbox, JSON output

Set `DISCOVERY_SYNTHESIS_PROVIDER=deterministic|codex|auto`.
