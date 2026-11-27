# Installation Guide — CatalogFlow Commerce

## Server Requirements
- **PHP:** 8.3 or higher
- **Database:** MySQL 8.0+ or MariaDB 10.6+
- **Required PHP Extensions:** `pdo`, `pdo_mysql`, `bcmath`, `mbstring`, `openssl`, `json`, `ctype`, `fileinfo`, `tokenizer`, `xml`, `zip`, and `gd` or `imagick`.
- **Writable Directories:** `storage/`, `storage/app/`, `storage/logs/`, `storage/framework/`, `bootstrap/cache/`, `public/`.

---

## 1. cPanel / Shared Hosting Installation (No Terminal Required)
1. **Upload & Extract:** Upload `catalogflow-ready-to-upload.zip` into a directory outside `public_html` (e.g. `/home/username/catalogflow`) or directly in your domain root, then extract it.
2. **Document Root:** Point your domain's Document Root to the `/public` folder (or copy `public/*` into `public_html` and update `index.php` paths).
3. **Create Database:** In cPanel → *MySQL Databases*, create a database, a database user, and assign `ALL PRIVILEGES`.
4. **SSL (HTTPS):** Enable AutoSSL / Let's Encrypt in cPanel before running payment gateways.
5. **Run Web Installer:** Visit `https://yourdomain.com/install`:
   - Step 1–2: Verify all server requirements pass.
   - Step 3: Enter your MySQL credentials and click **Test Connection**.
   - Step 4: Configure Store Name, URL, Environment (`production`), Language, Currency, and Timezone.
   - Step 5: Click **Run Installation Now** (runs migrations, `EssentialSeeder`, and optional Demo Catalog).
   - Step 6: Create your **Owner (Super Admin)** account. The installer automatically locks via `storage/installed` and DB guard.
6. **Storage Symlink (if `symlink()` is disabled):** Create a symlink from `public/storage` → `../storage/app/public` via cPanel Cron Job once (`ln -s /home/USER/catalogflow/storage/app/public /home/USER/catalogflow/public/storage`).
7. **Cron Job:** Add `* * * * * cd /home/USER/catalogflow && php artisan schedule:run >> /dev/null 2>&1` in cPanel Cron Jobs.

---

## 2. VPS Installation (Ubuntu 24.04 + Nginx + PHP 8.3 + MySQL)
```bash
sudo apt update && sudo apt install -y nginx mysql-server php8.3-fpm php8.3-mysql php8.3-bcmath php8.3-mbstring php8.3-xml php8.3-zip php8.3-gd php8.3-curl unzip
```
1. Clone/extract files to `/var/www/catalogflow`.
2. Set ownership: `sudo chown -R www-data:www-data /var/www/catalogflow/storage /var/www/catalogflow/bootstrap/cache`.
3. Configure Nginx root to `/var/www/catalogflow/public` with `try_files $uri $uri/ /index.php?$query_string;`.
4. Enable SSL with Certbot: `sudo certbot --nginx -d yourdomain.com`.
5. Run `https://yourdomain.com/install` or CLI:
   ```bash
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --force
   php artisan db:seed --class=Database\\Seeders\\EssentialSeeder --force
   php artisan storage:link
   php artisan optimize
   ```
6. Configure Supervisor for `php artisan queue:work --sleep=3 --tries=3` and crontab for `schedule:run`.

---

## 3. Local Development Installation
```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=Database\\Seeders\\EssentialSeeder
# Optional demo products:
php artisan db:seed --class=Database\\Seeders\\DemoCatalogSeeder
npm run build
php artisan serve
```
