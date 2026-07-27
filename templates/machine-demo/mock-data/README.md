# mock-data/

Narrative datasets for demos. Prefer editing these JSON files (and industry mirrors under `industries/<pack>/mock-data/`) instead of hardcoding in React components.

| Path | Content |
|------|---------|
| `projects/command-center.json` | Home brief, projects, insights |
| `projects/project-map.json` | Site map twin |
| `documents/evidence-hub.json` | Evidence media/docs |
| `workflows/runtime.json` | Workflow run snapshots |
| `ai/workspace.json` | Chat history / follow-ups |
| `finance/` | Finance notes |
| `notifications/` | Inbox stubs |

Some loaders in `src/mock/` still embed richly typed TS for complex map/evidence schemas; JSON mirrors exist for Codex to edit, then sync via `npm run generate-mock-data` (stub).
