# Remaining Issues & Environment Notes

## 1. Known Environment Behaviors
1. **Vitest Working Directory with Windows Directory Junction:**
   - The workspace path `c:\laragon\www\catalogflow` is a directory junction/symlink pointing to `C:\laragon\www\Sannafly`. Running `npm test` (Vitest) directly from the junction path causes duplicate React module resolution between `../sannafly/node_modules/react` and `node_modules/react-dom` in `StorefrontComponents.test.tsx`.
   - **Workaround / Recommendation:** Run `npm test` from the canonical target directory `C:\laragon\www\Sannafly` (where all 3 Vitest tests pass cleanly).
2. **MySQL Test Group Excluded in Local Run:**
   - The automated PHP test suite was verified with `php artisan test --exclude-group=mysql` (209 passed, 982 assertions). MySQL-tagged tests should be run in CI or an environment with a dedicated MySQL test database configured.
3. **PHP Imagick Version Warning:**
   - Local PHP CLI emits a harmless startup warning (`Imagick was compiled against ImageMagick version 1808 but version 1810 is loaded`) unrelated to application code.

## 2. Commercial Deployment Checklist for Buyers
- Run `/install` on fresh deployments or configure `.env` database, mail, and payment gateway credentials.
- Keep `Demo Mode` disabled in production stores (`DemoModeService::setEnabled(false)`).
- Configure queue workers in production if asynchronous broadcasting/notifications are enabled, or rely on the built-in synchronous fallback on shared hosting.
