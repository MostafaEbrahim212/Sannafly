# Update System Guide

- **Route:** `/admin/system/updates` (`system.updates.view`, `system.updates.execute`)
- **Architecture:** `UpdateService` queries `PRODUCT_UPDATE_URL` when configured. When unconfigured, it operates in offline/self-hosted mode without faking available updates.
- **Workflow:** Compatibility check -> Pre-update SQL backup -> Migrations (`migrate --force`) -> Cache clear -> `system_updates` history log.
- **Recovery:** Non-destructive pre-update SQL backup is always created prior to executing migrations.
