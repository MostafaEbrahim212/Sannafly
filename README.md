<p align="center">
  <h1 align="center">⚡ Sannafly</h1>
  <p align="center">
    منصة كتالوج منتجات وتجارة إلكترونية متكاملة مبنية بـ Laravel 13 + React 19 + TypeScript + Inertia.js 3
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" />
    <img src="https://img.shields.io/badge/PHP-8.3+-777BB4?style=for-the-badge&logo=php&logoColor=white" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/TypeScript-7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
    <img src="https://img.shields.io/badge/Inertia.js-3-9553E9?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Pest-4-F5A623?style=for-the-badge" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
  </p>
</p>

---

## 📋 نظرة عامة

**Sannafly** هو نظام إدارة كتالوج منتجات وتجارة إلكترونية مصمم للسوق المصري والعربي، ويعمل في وضعين:

| الوضع | الوصف |
|---|---|
| 🗂️ **وضع الكتالوج** | عرض المنتجات، المعارض، التسعير المتعدد، المتغيرات، الاستفسارات، WhatsApp |
| 🛒 **وضع التجارة الإلكترونية** | سلة التسوق، الدفع، الطلبات، حسابات العملاء، بوابات الدفع (Fawry & MyFatoorah) |

---

## ✨ المميزات الرئيسية

- **Modular Monolith:** فصل واضح إلى Services، Policies، Form Requests، وصفحات Inertia React.
- **دقة مالية بـ BCMath:** جميع العمليات المالية تستخدم `App\Support\Money` على سلاسل نصية `DECIMAL(15,4)` (تقريب half-up إلى 4 خانات داخلياً وخانتين لبوابات الدفع).
- **ثنائي اللغة والاتجاه:** دعم كامل للعربية والإنجليزية (`RTL`/`LTR`) في لوحة التحكم والمتجر وقوالب الطباعة.
- **أمان محصّن:** RBAC تفصيلي، حماية من تصعيد الصلاحيات، سجل تدقيق محمي على مستوى النموذج وقاعدة البيانات، ورؤوس أمان HTTP (`CSP`, `COOP`, `HSTS`).

---

## 🛠️ متطلبات النظام

| المتطلب | الإصدار الأدنى |
|---|---|
| PHP | 8.3+ (`bcmath`, `gd`, `mbstring`) |
| Composer | 2.x |
| Node.js | 20+ |
| قاعدة البيانات | MySQL 8+ **أو** SQLite 3.39+ |

---

## 🚀 التثبيت والإعداد

```bash
# إعداد المشروع بالكامل
composer run setup

# أو يدوياً:
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run build
```

تشغيل بيئة التطوير:

```bash
composer run dev
```

---

## 🧩 الوحدات الأساسية

- **المستخدمون والصلاحيات:** نظام RBAC (`roles`, `permissions`), قيود منع تصعيد الصلاحيات وحماية آخر Super Admin، وسجل تدقيق محمي بـ Model events وTriggers في قاعدة البيانات.
- **الكتالوج والمخزون:** فئات متداخلة، ماركات، منتجات، صور WebP متعددة، تسعير متعدد الكميات، متغيرات Cartesian بـ `combination_hash`، وحركات مخزون مع `lockForUpdate()`.
- **الطلبات وبوابات الدفع:** تكامل `Fawry` و`MyFatoorah` مع استثناء CSRF لـ `payments/callback/*` فقط، التحقق من المبلغ والعملة (`EGP` افتراضياً)، `orders:expire-unpaid` كل 5 دقائق، وإدارة `refund_pending`. راجع [docs/PAYMENTS.md](docs/PAYMENTS.md).
- **الاستيراد والطباعة والتخصيص:** استيراد/تصدير CSV وXLSX مع تعقيم formula injection، قوالب طباعة RTL/LTR، ومخصص واجهة المتجر.

---

## 🧪 الاختبارات والتحليل الثابت

يحتوي المشروع على 5 مجموعات اختبارات Pest (`Unit`, `Feature`, `Integration`, `Security`, `Concurrency`) بالإضافة إلى Vitest + React Testing Library + `vitest-axe` وPlaywright E2E:

```bash
# اختبارات Pest (SQLite)
php artisan test --exclude-group=mysql

# اختبارات التزامن على MySQL 8
php artisan test --group=mysql

# اختبارات الواجهة الأمامية
npm test

# فحص الأنواع والأسلوب والتحليل الثابت
npx tsc --noEmit
composer run lint
composer run analyse
```

للتفاصيل الكاملة راجع:
- [docs/TESTING.md](docs/TESTING.md)
- [docs/PAYMENTS.md](docs/PAYMENTS.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/HARDENING_REPORT.md](docs/HARDENING_REPORT.md)
- [DECISIONS.md](DECISIONS.md)

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).
