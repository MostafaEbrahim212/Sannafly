# Remaining Issues & Post-Release Notes

1. **Remote License & Update Servers:** `LicenseService` and `UpdateService` implement the client integration layer (`LICENSE_SERVER_URL`, `PRODUCT_UPDATE_URL`) with offline/grace-period fallback. A hosted license/update server endpoint must be deployed separately if online key verification is desired.
2. **cPanel / VPS Live Smoke Test:** The release ZIP was built and verified locally on Windows; before marketplace submission, perform a clean extract + `/install` smoke test on a real cPanel account and an Ubuntu Nginx VPS.
3. **Custom CSS & Favicon UI Fields:** Settings keys (`brand_logo`, `brand_logo_dark`, `favicon_path`, `custom_css`, `social_*`) are seeded and supported in layouts; dedicated file-upload inputs for logo/favicon can be added to `Settings/Index.tsx` or `Customizer.tsx` as an optional UX enhancement.
