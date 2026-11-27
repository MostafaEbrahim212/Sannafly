# License System Guide

- **Route:** `/admin/system/license` (`system.license.view`, `system.license.manage`)
- **Types:** `single`, `multi`, `developer`, `lifetime`, `subscription`.
- **Storage & Privacy:** License payloads are encrypted at rest (`Crypt::encryptString`). Only key, domain, product name, and version are transmitted when `LICENSE_SERVER_URL` is configured.
- **Grace Period:** 14-day offline grace period (`LICENSE_GRACE_DAYS`) prevents store disruption if the remote server is unreachable.
