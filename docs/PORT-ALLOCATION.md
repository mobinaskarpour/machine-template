# Port Allocation

Centralized persistent allocation for deployment ports.

## Configuration

```env
DEPLOYMENT_PORT_MIN=3100
DEPLOYMENT_PORT_MAX=3999
DEPLOYMENT_BIND_ADDRESS=127.0.0.1
```

## Rules

- Allocate only within the configured range
- Detect listening ports and ports owned by deployment records
- Prevent duplicates with in-process + filesystem lock
- Persist ownership under `data/memory/ports/`
- Release only after verified decommission
- Support rollback without collision
- Never expose raw ports publicly
