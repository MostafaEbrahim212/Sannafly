# Troubleshooting Guide

## 1. Installation & Database Issues
- **`/install` shows 403 or redirects away:** The application is already installed (`EnsureNotInstalled` locks `/install` once setup completes).
- **Database connection fails during `/install`:** Verify DB host (`127.0.0.1` vs `localhost`), port (`3306`), database exists, and user has privileges using **Test Database** before saving `.env`.

## 2. Image & Storage Issues
- **Product images show broken icons:** Run `php artisan storage:link` (or check **Storage Symlink** in `/admin/system/health`) and verify `APP_URL` matches your domain.
- **Large images fail to upload:** Increase `upload_max_filesize` and `post_max_size` in PHP settings, or lower `image_max_width` in `/admin/settings`.

## 3. Permissions & 403 Errors
- **Staff user sees 403 on a dashboard page:** Edit their role in `/admin/roles` and ensure they have both `dashboard.access` and the required module permission (e.g., `orders.view`), and that their account is `active` in `/admin/users`.
- **Customer account gets 403 on `/admin`:** Intentional security isolation—customers use the `customer` guard and must log out and use `/admin/login` with a staff account.

## 4. Payments & Checkout
- **Online payment callback does not mark order as paid:** Ensure your site is publicly reachable over HTTPS (webhooks cannot reach `127.0.0.1`), gateway secret keys match Sandbox/Live mode, and check `/admin/system-logs` for callback errors.

## 5. Backups, Updates & Support
- **Full ZIP backup times out on Shared Hosting:** Switch to **Database** backup type in `/admin/system/backups`.
- **Need help diagnosing a client's server?** Generate and download an anonymized bundle from `/admin/system/support` and inspect the included health report and logs.
