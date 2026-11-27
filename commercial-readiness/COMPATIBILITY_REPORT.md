# Compatibility & Packaging Report

## Verified Environments
- **PHP:** 8.4.12 (Windows / Laragon) — tested with Pint, Pest, and PHP runtime.
- **Database:** SQLite (`:memory:` for Pest suite) & MySQL (`sannafly` local instance).
- **Frontend Build:** Vite 8.3.8 + React 19 + TypeScript 7.

## Untested Environments (Require Target Verification Before Claiming)
- Live cPanel shared hosting (Apache/LiteSpeed with `symlink()` disabled).
- Live Ubuntu + Nginx + Supervisor + Certbot VPS.
- Live production webhooks for Fawry, MyFatoorah, Paymob, and Kashier over HTTPS.

## Packaging Exclusions Verified
`scripts/build-release.ps1` excludes `.env`, `.git`, `node_modules`, `storage/logs/*.log`, `storage/installed`, `.env.backup.*`, and test artifacts from `catalogflow-v2.0.0-ready-to-upload.zip` and `catalogflow-v2.0.0-developer.zip`.
