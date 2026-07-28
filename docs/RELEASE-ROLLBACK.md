# Release Rollback

Rollback restores a previous healthy deployment without deleting releases.

## Steps

1. Resolve previous healthy deployment
2. Verify release files still exist
3. Allocate or reuse its safe port
4. Start previous candidate
5. Verify health
6. Switch proxy only after health (when configured)
7. Mark failed/current deployment as `ROLLED_BACK`
8. Preserve logs and manifests

Never delete either release automatically. Never destroy a healthy live process before the rollback candidate passes health.

CLI: `npm run deployment:rollback -- "<company-name>" --yes`
