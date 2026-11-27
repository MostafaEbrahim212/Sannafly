# Troubleshooting Guide

- **Installer returns 404:** The application is already installed (`storage/installed` or a `super-admin` user already exists).
- **Database test fails in Installer:** Verify MySQL host (`127.0.0.1` vs `localhost`), port (`3306`), database name, and user privileges.
- **Images not loading:** Ensure `public/storage` symlink points to `storage/app/public` (`php artisan storage:link` or cPanel symlink).
- **Maintenance mode stuck:** Visit `https://yourdomain.com/{your-secret}` (default `maintenance-bypass`) or run `php artisan up`.
- **Emails not sending:** Configure `MAIL_MAILER=smtp`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, and `MAIL_FROM_ADDRESS` in `.env`, then clear config cache in **System Tools**.
- **Payment callback rejected (403/419/mismatch):** Ensure HTTPS is active, `APP_URL` matches your domain, and the gateway secret/HMAC key matches your provider dashboard.
- **Queue jobs stuck:** Run `php artisan queue:work` via Supervisor or Cron, and inspect failed jobs in **Admin → System Tools**.
