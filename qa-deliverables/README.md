# QA Deliverables

All files in `qa-deliverables/` are **exact copies** of the automated test suites executed in this project:
- `backend/`: Copies of `tests/Feature/*.php` (`CommercialFeaturesSuiteTest.php`, `CommercialTransformationTest.php`, `SystemLogsAndToolsTest.php`, `RealtimeNotificationsTest.php`, `ProEcommerceEnhancementsTest.php`, `PaymentHardeningTest.php`, `AuthorizationMatrixTest.php`, `SecurityHardeningTest.php`).
- `frontend/`: Copies of `resources/js/__tests__/*.ts(x)`.
- `e2e/`: Copies of `tests/e2e/*.spec.ts` (if present).

## How to Run
```bash
php artisan test --exclude-group=mysql
./vendor/bin/pint --test
npx tsc --noEmit
npm test
npm run build
```
