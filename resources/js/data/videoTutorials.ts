export type VideoCategory =
    | 'all'
    | 'getting-started'
    | 'products'
    | 'storefront'
    | 'orders'
    | 'payments'
    | 'reports'
    | 'productivity'
    | 'administration'
    | 'installation';

export interface StoryboardScene {
    scene: number;
    screen: string;
    action: string;
    duration: string;
}

export interface VideoTutorial {
    id: string;
    category: Exclude<VideoCategory, 'all'>;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: string;
    status: 'recorded' | 'ready_to_record';
    videoUrl?: string;
    screenshot: string;
    routePath: string;
    title: { en: string; ar: string };
    objective: { en: string; ar: string };
    script: { en: string; ar: string };
    storyboard: StoryboardScene[];
}

export const VIDEO_CATEGORIES: Array<{ id: VideoCategory; en: string; ar: string }> = [
    { id: 'all', en: 'All Tutorials', ar: 'جميع الدروس' },
    { id: 'getting-started', en: 'Getting Started', ar: 'البداية' },
    { id: 'products', en: 'Products', ar: 'المنتجات' },
    { id: 'storefront', en: 'Storefront & Themes', ar: 'المتجر والثيمات' },
    { id: 'orders', en: 'Orders & Customers', ar: 'الطلبات والعملاء' },
    { id: 'payments', en: 'Payments & Checkout', ar: 'الدفع والشحن' },
    { id: 'reports', en: 'Reports & Analytics', ar: 'التقارير' },
    { id: 'productivity', en: 'Import, Export & Print', ar: 'الاستيراد والطباعة' },
    { id: 'administration', en: 'Administration & Security', ar: 'الإدارة والأمان' },
    { id: 'installation', en: 'Installation & Deployment', ar: 'التثبيت والنشر' },
];

export const VIDEO_TUTORIALS: VideoTutorial[] = [
    {
        id: 'vid-01',
        category: 'getting-started',
        difficulty: 'beginner',
        duration: '2:15',
        status: 'recorded',
        videoUrl: '/docs/videos/vid-01-intro.webm',
        screenshot: '/docs/screenshots/product-landing.png',
        routePath: '/product',
        title: { en: '1. Introduction to Sannafly', ar: '1. مقدمة عن منصة Sannafly' },
        objective: {
            en: 'Understand the platform architecture, E-Commerce vs Catalog modes, and bilingual RTL/LTR support.',
            ar: 'فهم فكرة المنصة ووضعي التشغيل (متجر أو كتالوج) ودعم العربية والإنجليزية.',
        },
        script: {
            en: 'Welcome to Sannafly. In this short video we explore the commercial product landing page, the live storefront, and the sandboxed demo hub.',
            ar: 'أهلًا بيك في منصة Sannafly. في الفيديو ده هنتعرف سريعًا على الصفحة التعريفية للمنتج، واجهة المتجر، وبوابة الديمو التفاعلية.',
        },
        storyboard: [
            { scene: 1, screen: '/product', action: 'Scroll overview and toggle Dark/Light mode', duration: '0:45' },
            { scene: 2, screen: '/', action: 'Show live storefront homepage', duration: '0:45' },
            { scene: 3, screen: '/demo', action: 'Introduce the Demo Hub and Sales Presentation', duration: '0:45' },
        ],
    },
    {
        id: 'vid-02',
        category: 'getting-started',
        difficulty: 'beginner',
        duration: '2:00',
        status: 'recorded',
        videoUrl: '/docs/videos/vid-02-dashboard.webm',
        screenshot: '/docs/screenshots/admin-dashboard.png',
        routePath: '/admin',
        title: { en: '2. Dashboard Overview & Navigation', ar: '2. نظرة عامة على لوحة التحكم والتنقل' },
        objective: {
            en: 'Navigate the KPI cards, smart accordion sidebar, quick search, and live notifications.',
            ar: 'فهم بطاقات المؤشرات، القائمة الجانبية الذكية، البحث السريع، والإشعارات.',
        },
        script: {
            en: 'After signing into /admin, you see 4 KPI cards, low-stock alerts, and the smart accordion sidebar with instant search.',
            ar: 'بعد الدخول على لوحة التحكم بتظهرلك 4 بطاقات للمؤشرات، تنبيهات نقص المخزون، والقائمة الجانبية المنظمة مع البحث السريع.',
        },
        storyboard: [
            { scene: 1, screen: '/admin', action: 'Highlight 4 KPI cards and quick action buttons', duration: '1:00' },
            { scene: 2, screen: '/admin/notifications', action: 'Open live notifications panel', duration: '1:00' },
        ],
    },
    {
        id: 'vid-03',
        category: 'getting-started',
        difficulty: 'beginner',
        duration: '2:30',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-settings.png',
        routePath: '/admin/settings',
        title: { en: '3. Basic Settings & White-Label Identity', ar: '3. الإعدادات الأساسية والهوية البيضاء' },
        objective: {
            en: 'Configure store name, currency, timezone, default language, and module toggles.',
            ar: 'ضبط اسم المتجر، العملة، المنطقة الزمنية، اللغة الافتراضية، وتفعيل الوحدات.',
        },
        script: {
            en: 'Open /admin/settings to customize your store name in English and Arabic, currency symbol, and toggle E-Commerce vs Catalog mode.',
            ar: 'من /admin/settings تقدر تعدّل اسم المتجر بالعربي والإنجليزي، العملة، وتتحكم في تفعيل وضع البيع أونلاين أو الكتالوج.',
        },
        storyboard: [
            { scene: 1, screen: '/admin/settings', action: 'Update General & Localization settings and save', duration: '2:30' },
        ],
    },
    {
        id: 'vid-04',
        category: 'products',
        difficulty: 'beginner',
        duration: '3:30',
        status: 'recorded',
        videoUrl: '/docs/videos/vid-04-products.webm',
        screenshot: '/docs/screenshots/admin-product-create.png',
        routePath: '/admin/products/create',
        title: { en: '4. Creating Your First Product (5-Step Wizard)', ar: '4. إضافة أول منتج بمعالج الـ 5 خطوات' },
        objective: {
            en: 'Create a published product with SKU, pricing, stock, images, and variations.',
            ar: 'إضافة منتج جديد كامل بالبيانات والأسعار والصور والمتغيرات.',
        },
        script: {
            en: 'Click New Product on /admin/products to launch the 5-step wizard: Basic Info, Pricing & Stock, Images, Variations, and Review & Publish.',
            ar: 'من صفحة المنتجات نضغط منتج جديد عشان نبدأ المعالج من 5 خطوات: البيانات الأساسية، الأسعار والمخزون، الصور، المتغيرات، ثم النشر.',
        },
        storyboard: [
            { scene: 1, screen: '/admin/products', action: 'Show filters and click New Product', duration: '0:45' },
            { scene: 2, screen: '/admin/products/create', action: 'Step through Basic Info, Pricing, Images, and Publish', duration: '2:45' },
        ],
    },
    {
        id: 'vid-05',
        category: 'products',
        difficulty: 'beginner',
        duration: '2:00',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-product-edit.png',
        routePath: '/admin/products',
        title: { en: '5. Editing Products & Image Galleries', ar: '5. تعديل المنتجات وإدارة معرض الصور' },
        objective: {
            en: 'Edit existing products, reorder gallery images, and set the primary product photo.',
            ar: 'تعديل منتج حالي، ترتيب الصور، وتعيين الصورة الرئيسية.',
        },
        script: {
            en: 'Open any product in /admin/products/{id}/edit, jump to Step 3 Images, reorder photos, and click the Star icon to set the main image.',
            ar: 'افتح أي منتج للتعديل، وانتقل لخطوة الصور لترتيب المعرض واختيار الصورة الرئيسية بضغطة على أيقونة النجمة.',
        },
        storyboard: [{ scene: 1, screen: '/admin/products/1/edit', action: 'Update fields and manage image gallery', duration: '2:00' }],
    },
    {
        id: 'vid-06',
        category: 'products',
        difficulty: 'intermediate',
        duration: '2:30',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-attributes.png',
        routePath: '/admin/attributes',
        title: { en: '6. Product Attributes, Variations & Multi-Tier Pricing', ar: '6. الخصائص والمتغيرات والتسعير المتعدد' },
        objective: {
            en: 'Define Color/Size attributes, generate product variations, and configure Regular/Sale/Wholesale prices.',
            ar: 'إنشاء خصائص اللون والمقاس، توليد المتغيرات، وإضافة أسعار الجملة والعروض.',
        },
        script: {
            en: 'Create reusable attributes at /admin/attributes, then generate variants and wholesale price tiers inside the Product Wizard.',
            ar: 'أنشئ الخصائص في /admin/attributes وبعدها ولّد المتغيرات وأضف أسعار الجملة من داخل معالج المنتج.',
        },
        storyboard: [{ scene: 1, screen: '/admin/attributes', action: 'Create Color/Size options and show Step 2/4 in wizard', duration: '2:30' }],
    },
    {
        id: 'vid-07',
        category: 'products',
        difficulty: 'intermediate',
        duration: '2:00',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-inventory.png',
        routePath: '/admin/inventory',
        title: { en: '7. Inventory Management & Stock Movements', ar: '7. إدارة المخزون وسجل الحركات' },
        objective: {
            en: 'Adjust stock quantities safely and inspect immutable StockMovement records.',
            ar: 'تعديل كميات المخزون ومتابعة سجل حركات الإضافة والسحب.',
        },
        script: {
            en: 'Use /admin/inventory to apply +/- stock adjustments and review every reservation, release, and manual adjustment.',
            ar: 'من /admin/inventory تقدر تزود أو تخصم الكميات وتراجع سجل كل حركة حجز أو استرجاع.',
        },
        storyboard: [{ scene: 1, screen: '/admin/inventory', action: 'Adjust stock and inspect movement history', duration: '2:00' }],
    },
    {
        id: 'vid-08',
        category: 'products',
        difficulty: 'beginner',
        duration: '2:00',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-categories.png',
        routePath: '/admin/categories',
        title: { en: '8. Categories & Brands Organization', ar: '8. تنظيم الأقسام والعلامات التجارية' },
        objective: {
            en: 'Build parent/child category trees and manage visible storefront brands.',
            ar: 'بناء شجرة الأقسام الرئيسية والفرعية وإدارة البراندات.',
        },
        script: {
            en: 'Organize your catalog at /admin/categories and /admin/brands with bilingual titles and visibility toggles.',
            ar: 'نظّم الكتالوج من /admin/categories و/admin/brands بأسماء عربية وإنجليزية متكاملة.',
        },
        storyboard: [{ scene: 1, screen: '/admin/categories', action: 'Create parent & child category and brand', duration: '2:00' }],
    },
    {
        id: 'vid-09',
        category: 'storefront',
        difficulty: 'beginner',
        duration: '2:30',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/storefront-catalog.png',
        routePath: '/catalog',
        title: { en: '9. Customer Storefront, Search & Filters', ar: '9. تجربة العميل في المتجر والبحث والفلاتر' },
        objective: {
            en: 'Explore how shoppers browse /catalog, filter products, use wishlist, and track orders.',
            ar: 'استعراض تصفح المتجر والفلاتر والمفضلة وتتبع الطلبات.',
        },
        script: {
            en: 'Customers browse /, filter by category or brand on /catalog, save items to /wishlist, and track orders on /track-order.',
            ar: 'العميل بيتصفح الرئيسية والكتالوج /catalog ويستخدم الفلاتر والمفضلة ويتابع طلبه من /track-order.',
        },
        storyboard: [{ scene: 1, screen: '/catalog', action: 'Filter catalog and open a product detail page', duration: '2:30' }],
    },
    {
        id: 'vid-10',
        category: 'storefront',
        difficulty: 'intermediate',
        duration: '3:00',
        status: 'recorded',
        videoUrl: '/docs/videos/vid-10-customizer.webm',
        screenshot: '/docs/screenshots/admin-customizer.png',
        routePath: '/admin/customizer',
        title: { en: '10. Storefront Customizer & Theme Presets', ar: '10. مخصّص المتجر وقوالب الثيم' },
        objective: {
            en: 'Customize colors, typography, homepage section order, and save/apply JSON Theme Presets.',
            ar: 'تخصيص الألوان والخطوط وترتيب أقسام الرئيسية وتطبيق قوالب الثيم.',
        },
        script: {
            en: 'Use /admin/customizer to adjust brand colors, reorder homepage blocks, preview Desktop/Mobile & Dark Mode, and manage presets at /admin/customizer/themes.',
            ar: 'من /admin/customizer نقدر نغيّر الألوان، نرتب أقسام الرئيسية، نعاين على الموبايل والوضع الداكن، ونحفظ قوالب جاهزة.',
        },
        storyboard: [
            { scene: 1, screen: '/admin/customizer', action: 'Switch Brand/Layout tabs and toggle Mobile/Dark preview', duration: '1:45' },
            { scene: 2, screen: '/admin/customizer/themes', action: 'Browse Theme Presets manager', duration: '1:15' },
        ],
    },
    {
        id: 'vid-11',
        category: 'orders',
        difficulty: 'intermediate',
        duration: '2:45',
        status: 'recorded',
        videoUrl: '/docs/videos/vid-11-orders.webm',
        screenshot: '/docs/screenshots/admin-orders.png',
        routePath: '/admin/orders',
        title: { en: '11. Managing Orders, Invoices & Shipping Labels', ar: '11. إدارة الطلبات والفواتير وبوالص الشحن' },
        objective: {
            en: 'Filter orders, advance status through the Order State Machine, and print invoices & labels.',
            ar: 'فلترة الطلبات، تحديث الحالات بأمان، وطباعة الفواتير وملصقات الشحن.',
        },
        script: {
            en: 'Track incoming orders at /admin/orders, advance status with one click, and print invoices or shipping labels from /admin/orders/{id}.',
            ar: 'تابع الطلبات في /admin/orders وحدّث الحالة بضغطة واحدة، واطبع الفاتورة أو ملصق الشحن من صفحة تفاصيل الطلب.',
        },
        storyboard: [
            { scene: 1, screen: '/admin/orders', action: 'Filter status tabs and expand an order', duration: '1:30' },
            { scene: 2, screen: '/admin/orders/1', action: 'Show Order Detail, Invoice, and Shipping Label buttons', duration: '1:15' },
        ],
    },
    {
        id: 'vid-12',
        category: 'orders',
        difficulty: 'intermediate',
        duration: '2:00',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-customers.png',
        routePath: '/admin/customers',
        title: { en: '12. Customers, Reviews & Inquiries', ar: '12. إدارة العملاء والتقييمات والاستفسارات' },
        objective: {
            en: 'Manage customer status, moderate product reviews, and track pre-sale inquiries.',
            ar: 'إدارة حسابات العملاء، مراجعة التقييمات، ومتابعة استفسارات الزوار.',
        },
        script: {
            en: 'Review customer accounts at /admin/customers, approve or hide ratings at /admin/reviews, and update inquiry statuses at /admin/inquiries.',
            ar: 'راجع حسابات العملاء في /admin/customers، واعتمد التقييمات في /admin/reviews، وتابع الاستفسارات في /admin/inquiries.',
        },
        storyboard: [{ scene: 1, screen: '/admin/customers', action: 'Inspect customers, reviews, and inquiries', duration: '2:00' }],
    },
    {
        id: 'vid-13',
        category: 'payments',
        difficulty: 'intermediate',
        duration: '2:30',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-payment-methods.png',
        routePath: '/admin/payment-methods',
        title: { en: '13. Payment Gateways, Coupons & Shipping Zones', ar: '13. بوابات الدفع، الكوبونات ومناطق الشحن' },
        objective: {
            en: 'Configure COD, Bank Transfer, MyFatoorah, Fawry, Paymob, Kashier, coupons, and shipping zones.',
            ar: 'إعداد طرق الدفع المختلفة، كوبونات الخصم، ورسوم الشحن حسب المنطقة.',
        },
        script: {
            en: 'Enable payment drivers at /admin/payment-methods, define regional rates at /admin/shipping-zones, and issue promo codes at /admin/coupons.',
            ar: 'فعّل طرق الدفع من /admin/payment-methods، وحدد رسوم الشحن في /admin/shipping-zones، وأنشئ الكوبونات من /admin/coupons.',
        },
        storyboard: [{ scene: 1, screen: '/admin/payment-methods', action: 'Show gateway drivers and shipping zones', duration: '2:30' }],
    },
    {
        id: 'vid-14',
        category: 'payments',
        difficulty: 'beginner',
        duration: '2:00',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/demo-hub.png',
        routePath: '/cart',
        title: { en: '14. Checkout Flow & Demo Payment Simulation', ar: '14. إتمام الطلب ومحاكاة الدفع في الديمو' },
        objective: {
            en: 'Walk through cart checkout, coupon application, and safe simulated confirmation in Demo Mode.',
            ar: 'تجربة سلة التسوق وتطبيق الكوبون ومحاكاة الدفع الآمنة في وضع الديمو.',
        },
        script: {
            en: 'In Demo Mode, online payment drivers bypass live gateway APIs and redirect safely to confirmation with zero real charges.',
            ar: 'في وضع الديمو، أي بوابة دفع إلكترونية بتتحاكى بأمان وبتوجه لصفحة التأكيد بدون أي خصم حقيقي.',
        },
        storyboard: [{ scene: 1, screen: '/cart', action: 'Apply coupon, select payment method, and submit demo order', duration: '2:00' }],
    },
    {
        id: 'vid-15',
        category: 'reports',
        difficulty: 'intermediate',
        duration: '2:00',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-analytics.png',
        routePath: '/admin/analytics',
        title: { en: '15. Sales Analytics & CSV Export', ar: '15. تحليلات المبيعات وتصدير التقارير' },
        objective: {
            en: 'Filter revenue reports by date and export UTF-8 CSV summaries for Excel.',
            ar: 'فلترة تقارير المبيعات بالتاريخ وتصديرها بصيغة CSV.',
        },
        script: {
            en: 'Open /admin/analytics to inspect revenue, top products, and export clean CSV reports.',
            ar: 'افتح /admin/analytics لمراجعة الإيرادات وأكثر المنتجات مبيعًا وتصدير ملف CSV.',
        },
        storyboard: [{ scene: 1, screen: '/admin/analytics', action: 'Apply date filter and click Export CSV', duration: '2:00' }],
    },
    {
        id: 'vid-16',
        category: 'productivity',
        difficulty: 'intermediate',
        duration: '2:30',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-import-export.png',
        routePath: '/admin/import-export',
        title: { en: '16. Bulk Import, Export & Catalog Printing', ar: '16. الاستيراد والتصدير وطباعة الكتالوج' },
        objective: {
            en: 'Download CSV/XLSX templates, preview imports, download error logs, and print catalogs.',
            ar: 'تنزيل قوالب الاستيراد، معاينة الملفات، وطباعة الكتالوج.',
        },
        script: {
            en: 'Use /admin/import-export to bulk-import products with pre-import validation, or /admin/print/catalog for PDF/print catalogs.',
            ar: 'استخدم /admin/import-export لرفع المنتجات جماعيًا مع المعاينة، أو /admin/print/catalog لطباعة الكتالوج.',
        },
        storyboard: [{ scene: 1, screen: '/admin/import-export', action: 'Download template and show preview/import flow', duration: '2:30' }],
    },
    {
        id: 'vid-17',
        category: 'administration',
        difficulty: 'advanced',
        duration: '2:30',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-roles.png',
        routePath: '/admin/roles',
        title: { en: '17. Users, RBAC Roles & Audit Logs', ar: '17. المستخدمون، الصلاحيات وسجل التدقيق' },
        objective: {
            en: 'Create custom roles, assign staff accounts, and inspect/export audit logs.',
            ar: 'إنشاء أدوار مخصصة، إدارة الموظفين، ومراجعة سجل التدقيق.',
        },
        script: {
            en: 'Define least-privilege roles at /admin/roles, assign them in /admin/users, and monitor activity at /admin/system/audit-logs.',
            ar: 'حدد صلاحيات دقيقة من /admin/roles واربطها بالموظفين في /admin/users وراقب النشاط من /admin/system/audit-logs.',
        },
        storyboard: [{ scene: 1, screen: '/admin/roles', action: 'Inspect role permissions matrix and audit logs', duration: '2:30' }],
    },
    {
        id: 'vid-18',
        category: 'administration',
        difficulty: 'advanced',
        duration: '3:00',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-backups.png',
        routePath: '/admin/system/backups',
        title: { en: '18. System Health, Backups, Updates & Licensing', ar: '18. صحة النظام، النسخ الاحتياطي، التحديثات والترخيص' },
        objective: {
            en: 'Run diagnostics, create/verify/restore backups, check updates, activate licenses, and export support bundles.',
            ar: 'فحص صحة السيرفر، إنشاء واستعادة النسخ الاحتياطية، التحديثات، التراخيص، وحزمة الدعم.',
        },
        script: {
            en: 'Manage production reliability across /admin/system/health, /backups, /updates, /license, and /support without SSH.',
            ar: 'أدِر صحة النظام والنسخ الاحتياطي والتحديثات والتراخيص وتقرير الدعم مباشرة من لوحة التحكم.',
        },
        storyboard: [{ scene: 1, screen: '/admin/system/backups', action: 'Create/verify backup and check health & license screens', duration: '3:00' }],
    },
    {
        id: 'vid-19',
        category: 'getting-started',
        difficulty: 'beginner',
        duration: '2:30',
        status: 'recorded',
        videoUrl: '/docs/videos/vid-19-sales-demo.webm',
        screenshot: '/docs/screenshots/demo-hub.png',
        routePath: '/demo/presentation',
        title: { en: '19. Using Demo Mode & Sales Presentation', ar: '19. استخدام وضع الديمو والعرض التقديمي للمبيعات' },
        objective: {
            en: 'Present the product to prospective buyers using /demo and /demo/presentation.',
            ar: 'تقديم المنتج للعملاء باحترافية عبر /demo و/demo/presentation.',
        },
        script: {
            en: 'Open /demo/presentation for a structured 11-slide sales walkthrough with talking points, live demo links, and presenter-only notes.',
            ar: 'افتح /demo/presentation لعرض تقديمي منظم من 11 شريحة بنقاط حديث جاهزة وروابط مباشرة للشاشات وملاحظات خاصة بك.',
        },
        storyboard: [
            { scene: 1, screen: '/demo', action: 'Show Demo Hub portals', duration: '1:00' },
            { scene: 2, screen: '/demo/presentation', action: 'Navigate slides and toggle Focus Mode', duration: '1:30' },
        ],
    },
    {
        id: 'vid-20',
        category: 'installation',
        difficulty: 'advanced',
        duration: '3:00',
        status: 'ready_to_record',
        screenshot: '/docs/screenshots/admin-system-health.png',
        routePath: '/install',
        title: { en: '20. Installing & Deploying for Real Customers', ar: '20. تثبيت السكريبت وتجهيزه للعملاء' },
        objective: {
            en: 'Deploy a fresh copy via /install, disable Demo Mode, activate license, and take an initial backup.',
            ar: 'تثبيت نسخة جديدة عبر /install وإيقاف الديمو وتفعيل الترخيص وأخذ أول نسخة احتياطية.',
        },
        script: {
            en: 'Use the 5-step /install wizard on fresh servers, verify /admin/system/health, disable Demo Mode, and activate the client license.',
            ar: 'استخدم معالج /install على أي استضافة، ثم راجع صحة النظام وأوقف وضع الديمو وفعّل ترخيص العميل.',
        },
        storyboard: [{ scene: 1, screen: '/admin/system/health', action: 'Review post-install health checklist', duration: '3:00' }],
    },
];
