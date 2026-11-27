# Web Installer Guide (`/install`)

## 1. What Is `/install`?
The **Guided Web Installer** (`/install`) lets non-technical buyers or shared-hosting users set up a fresh copy of the script through a browser wizard without running CLI commands.

## 2. Installer Steps
1. **Requirements & Permissions Check**: Verifies PHP version, required extensions, and writable `storage/` & `bootstrap/cache/`.
2. **Database Test (`POST /install/test-db`)**: Validates MySQL/SQLite host, port, database name, username, and password before writing `.env`.
3. **Save Environment (`POST /install/save-env`)**: Writes `.env` configuration (`APP_NAME`, `APP_URL`, DB credentials, mail settings).
4. **Run Installation (`POST /install/run`)**: Generates `APP_KEY`, runs migrations, seeds `RbacSeeder`, `EssentialSeeder`, `SettingsSeeder`, and creates `storage:link`.
5. **Create Store Owner (`POST /install/owner`)**: Creates the initial `super-admin` user and locks `/install` permanently via `EnsureNotInstalled` middleware.

## 3. Important Notes
- Once installation completes, visiting `/install` redirects away or blocks access automatically (`EnsureNotInstalled`) so nobody can re-run the installer on a live site.
- After installation, log in at `/admin/login` and verify `/admin/system/health`.
