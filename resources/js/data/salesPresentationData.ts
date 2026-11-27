export interface SalesSection {
    id: string;
    demoUrl: string;
    screenshot: string;
    title: { en: string; ar: string };
    content: { en: string; ar: string };
    talkingPoints: { en: string[]; ar: string[] };
    demoSteps: { en: string[]; ar: string[] };
    benefits: { en: string[]; ar: string[] };
}

export const SALES_SECTIONS: SalesSection[] = [
    {
        id: 'opening',
        demoUrl: '/demo',
        screenshot: '/docs/screenshots/product-landing.png',
        title: { en: '1. Opening — Product Introduction', ar: '1. الافتتاحية — التعريف بالمنصة' },
        content: {
            en: 'Sannafly is a complete White-Label Product Catalog & E-Commerce platform built for businesses and agencies, supporting full Arabic (RTL) and English (LTR) out of the box.',
            ar: 'منصة Sannafly هي نظام تجاري متكامل لإدارة وعرض وبيع المنتجات بهوية بيضاء كاملة (White-Label)، مصممة لتعمل بالعربية والإنجليزية بسلاسة من أول يوم.',
        },
        talkingPoints: {
            en: [
                'Runs in two flexible modes: full E-Commerce with cart & checkout, or pure Catalog & WhatsApp Inquiry mode.',
                '100% white-label: change brand name, logos, colors, currency, and language from the admin panel.',
            ],
            ar: [
                'النظام بيشتغل بوضعين: متجر إلكتروني كامل بالسلة والدفع، أو كتالوج احترافي للعرض والاستفسارات والواتساب.',
                'تقدر تغيّر اسم البراند واللوجو والألوان والعملة واللغة بالكامل من لوحة التحكم بدون أي تعديل في الكود.',
            ],
        },
        demoSteps: {
            en: ['Show the bilingual landing page (/product) and switch AR/EN and Dark/Light mode.'],
            ar: ['اعرض الصفحة التعريفية (/product) وبدّل بين العربي والإنجليزي والوضع الداكن والفاتح.'],
        },
        benefits: {
            en: ['Ready to launch for a single store or rebrand and sell to unlimited clients.'],
            ar: ['جاهز للتشغيل الفوري لأي متجر أو لإعادة بيعه وتخصيصه لعملاء متعددين.'],
        },
    },
    {
        id: 'storefront',
        demoUrl: '/',
        screenshot: '/docs/screenshots/storefront-home.png',
        title: { en: '2. Storefront Experience', ar: '2. تجربة المتجر للعميل' },
        content: {
            en: 'A fast, mobile-first storefront with homepage sections, category/brand filters, variation selectors, wishlist, cart, coupons, and live order tracking.',
            ar: 'واجهة متجر سريعة ومتجاوبة مع الموبايل تشمل البحث والفلاتر، خيارات المنتج، المفضلة، السلة، الكوبونات، وتتبع الطلبات.',
        },
        talkingPoints: {
            en: [
                'Customers can filter by category, brand, and price, view wholesale tiers, or send a direct WhatsApp inquiry.',
                'Guest checkout and registered customer accounts (/my-orders, /track-order) are both supported.',
            ],
            ar: [
                'العميل يقدر يفلتر بالقسم أو البراند أو السعر، ويشوف أسعار الجملة أو يبعت استفسار مباشر على واتساب.',
                'متاح الطلب كزائر أو بحساب عميل مع تتبع مباشر لحالة الطلب.',
            ],
        },
        demoSteps: {
            en: ['Open /, browse /catalog, open a product detail page, and add an item to /cart.'],
            ar: ['افتح الرئيسية /، تصفح /catalog، افتح صفحة منتج وأضفه إلى السلة /cart.'],
        },
        benefits: {
            en: ['Higher conversion on mobile with zero friction in Arabic or English.'],
            ar: ['تجربة شراء سهلة وسريعة على الموبايل تزود المبيعات.'],
        },
    },
    {
        id: 'dashboard',
        demoUrl: '/admin',
        screenshot: '/docs/screenshots/admin-dashboard.png',
        title: { en: '3. Dashboard Overview', ar: '3. نظرة عامة على لوحة التحكم' },
        content: {
            en: 'Central command center with 4 KPI cards, low-stock alerts, recent inquiries, quick actions, sidebar quick search, and realtime notifications.',
            ar: 'لوحة تحكم مركزية تعرض أهم مؤشرات الأداء، تنبيهات نقص المخزون، أحدث الاستفسارات، وإشعارات فورية.',
        },
        talkingPoints: {
            en: [
                'Store owners see what needs attention in 5 seconds: pending orders, low stock, and unread alerts.',
                'Smart accordion sidebar keeps navigation clean and searchable.',
            ],
            ar: [
                'صاحب المتجر يشوف في 5 ثواني إيه اللي محتاج متابعة: الطلبات الجديدة، الأصناف القريبة من النفاد، والإشعارات.',
                'القائمة الجانبية منظمة وذكية وفيها بحث سريع لأي شاشة.',
            ],
        },
        demoSteps: {
            en: ['Open /admin, point out the KPI cards, Bell notifications, and sidebar quick search.'],
            ar: ['افتح /admin ووضح بطاقات المؤشرات، جرس الإشعارات، والبحث السريع في القائمة.'],
        },
        benefits: {
            en: ['Saves daily management time and prevents missed orders or stockouts.'],
            ar: ['توفير وقت الإدارة اليومي ومنع نسيان الطلبات أو نفاد المخزون فجأة.'],
        },
    },
    {
        id: 'products',
        demoUrl: '/admin/products',
        screenshot: '/docs/screenshots/admin-product-create.png',
        title: { en: '4. Product Management', ar: '4. إدارة المنتجات والمعالج' },
        content: {
            en: '5-step Product Wizard supporting bilingual descriptions, SKU generator, multi-image gallery, attribute variations, multi-tier pricing, and inventory ledger.',
            ar: 'معالج إضافة منتج من 5 خطوات يدعم الوصف بالعربي والإنجليزي، توليد SKU، معرض الصور، المتغيرات، التسعير المتعدد، والمخزون.',
        },
        talkingPoints: {
            en: [
                'Supports simple products and multi-variant products (Color/Size) with per-variant SKUs and prices.',
                'Every stock adjustment is recorded in an immutable StockMovement ledger.',
            ],
            ar: [
                'بيدعم المنتجات البسيطة والمنتجات متعددة الخيارات (لون/مقاس) بسعر ومخزون لكل خيار.',
                'كل حركة مخزون بتتسجل في سجل دقيق عشان مفيش كمية تضيع.',
            ],
        },
        demoSteps: {
            en: ['Open /admin/products, show search/status filters, and explain the 5-step wizard & /admin/inventory.'],
            ar: ['افتح /admin/products ووضح الفلاتر والبحث ومعالج الإضافة وشاشة المخزون /admin/inventory.'],
        },
        benefits: {
            en: ['Clean, structured catalog onboarding with fewer staff mistakes.'],
            ar: ['إدخال منظم للمنتجات يقلل أخطاء الموظفين.'],
        },
    },
    {
        id: 'categories',
        demoUrl: '/admin/categories',
        screenshot: '/docs/screenshots/admin-categories.png',
        title: { en: '5. Categories & Brands', ar: '5. الأقسام والعلامات التجارية' },
        content: {
            en: 'Hierarchical parent/child categories and brand collections with bilingual names, visibility toggles, and sort ordering.',
            ar: 'شجرة أقسام رئيسية وفرعية وعلامات تجارية بأسماء عربية وإنجليزية مع التحكم في الظهور والترتيب.',
        },
        talkingPoints: {
            en: [
                'Categories and brands automatically power storefront filtering and homepage showcase blocks.',
            ],
            ar: [
                'الأقسام والبراندات بتغذي فلاتر المتجر وأقسام الصفحة الرئيسية تلقائيًا.',
            ],
        },
        demoSteps: {
            en: ['Open /admin/categories to show parent/child nesting and bilingual labels.'],
            ar: ['افتح /admin/categories لعرض الأقسام الرئيسية والفرعية.'],
        },
        benefits: {
            en: ['Helps shoppers find products faster in large catalogs.'],
            ar: ['تسهيل وصول العميل للمنتج المطلوب بسرعة.'],
        },
    },
    {
        id: 'customization',
        demoUrl: '/admin/customizer/themes',
        screenshot: '/docs/screenshots/admin-customizer.png',
        title: { en: '6. Store Customization', ar: '6. تخصيص المتجر والثيمات' },
        content: {
            en: '4-tab Storefront Customizer (Brand, Hero, Layout, Promos) with Desktop/Mobile & Dark/Light live preview plus exportable JSON Theme Presets.',
            ar: 'مخصّص مرئي بـ 4 تبويبات مع معاينة حية للكمبيوتر والموبايل والوضعين الفاتح والداكن، بالإضافة لقوالب ثيم جاهزة.',
        },
        talkingPoints: {
            en: [
                'Switch niche presets, reorder homepage sections, and export/import JSON theme presets in seconds.',
            ],
            ar: [
                'تقدر تغير ألوان المتجر وترتيب أقسام الرئيسية وتطبّق قوالب جاهزة في ثواني.',
            ],
        },
        demoSteps: {
            en: ['Open /admin/customizer/themes to showcase saved presets and theme flexibility.'],
            ar: ['افتح /admin/customizer/themes لعرض قوالب الثيم الجاهزة.'],
        },
        benefits: {
            en: ['Distinctive brand identity for every store without developer costs.'],
            ar: ['هوية بصرية مميزة لكل متجر بدون تكلفة تطوير إضافية.'],
        },
    },
    {
        id: 'orders',
        demoUrl: '/admin/orders',
        screenshot: '/docs/screenshots/admin-orders.png',
        title: { en: '7. Orders & Customers', ar: '7. إدارة الطلبات والعملاء' },
        content: {
            en: 'Strict Order State Machine (Pending → Confirmed → Processing → Shipped → Delivered), printable invoices & shipping labels, customer directory, reviews, and inquiries.',
            ar: 'دورة حياة منضبطة للطلب، طباعة الفواتير وبوالص الشحن، إدارة العملاء، التقييمات، والاستفسارات.',
        },
        talkingPoints: {
            en: [
                'One-click happy-path progression plus automatic stock release if an order is cancelled or returned.',
            ],
            ar: [
                'تحديث حالة الطلب بضغطة واحدة، ولو الطلب اتلغى أو رجع المخزون بيرجع تلقائيًا.',
            ],
        },
        demoSteps: {
            en: ['Open /admin/orders, filter by status tabs, and expand an order row to show quick details.'],
            ar: ['افتح /admin/orders واستعرض تبويبات الحالات وتفاصيل الطلب.'],
        },
        benefits: {
            en: ['Streamlined fulfillment and zero inventory leaks.'],
            ar: ['تنظيم كامل للشحن والتجهيز بدون أخطاء مخزون.'],
        },
    },
    {
        id: 'payments',
        demoUrl: '/cart',
        screenshot: '/docs/screenshots/admin-payment-methods.png',
        title: { en: '8. Payments & Checkout', ar: '8. الدفع الإلكتروني وإتمام الطلب' },
        content: {
            en: 'Supports Cash on Delivery, Bank Transfer, MyFatoorah, Fawry, Paymob, and Kashier. Online gateways require client API keys in production and are safely simulated in Demo Mode.',
            ar: 'يدعم الدفع عند الاستلام، التحويل البنكي، ماي فاتورة، فوري، بايموب، وكاشير. البوابات الإلكترونية تتطلب مفاتيح العميل في الإنتاج وتُحاكى بأمان في الديمو.',
        },
        talkingPoints: {
            en: [
                'Built for Egyptian and MENA payment providers alongside COD and Bank Transfer.',
                'In Demo Mode, online checkout simulates confirmation so zero real charges happen.',
            ],
            ar: [
                'يدعم أشهر بوابات الدفع في مصر والخليج بجانب الدفع عند الاستلام والتحويل البنكي.',
                'في وضع الديمو الدفع الإلكتروني محاكى بالكامل بدون أي خصم حقيقي.',
            ],
        },
        demoSteps: {
            en: ['Open /cart and point out the shipping zone selector, coupon box, and simulated payment notice.'],
            ar: ['افتح /cart ووضح اختيار منطقة الشحن، الكوبون، وتنبيه محاكاة الدفع.'],
        },
        benefits: {
            en: ['Flexible local payment options ready for production configuration.'],
            ar: ['خيارات دفع محلية متنوعة جاهزة للربط الفعلي.'],
        },
    },
    {
        id: 'reports',
        demoUrl: '/admin/analytics',
        screenshot: '/docs/screenshots/admin-analytics.png',
        title: { en: '9. Reports & Analytics', ar: '9. التقارير وتحليلات المبيعات' },
        content: {
            en: 'Revenue tracking, order volume breakdowns, top-selling products, date filters, and one-click UTF-8 CSV export.',
            ar: 'متابعة الإيرادات، توزيع الطلبات، أكثر المنتجات مبيعًا، فلاتر التاريخ، وتصدير CSV.',
        },
        talkingPoints: {
            en: [
                'Gives owners clear visibility into best-sellers and revenue trends with Excel-ready CSV exports.',
            ],
            ar: [
                'يوضح أكثر المنتجات تحقيقًا للمبيعات مع إمكانية تصدير التقارير لملفات Excel.',
            ],
        },
        demoSteps: {
            en: ['Open /admin/analytics and show the KPIs and Export CSV button.'],
            ar: ['افتح /admin/analytics واعرض المؤشرات وزر تصدير CSV.'],
        },
        benefits: {
            en: ['Data-driven purchasing and marketing decisions.'],
            ar: ['قرارات تسويق وشراء مبنية على أرقام فعلية.'],
        },
    },
    {
        id: 'productivity',
        demoUrl: '/admin/products',
        screenshot: '/docs/screenshots/admin-import-export.png',
        title: { en: '10. Import, Export & Productivity', ar: '10. الاستيراد والتصدير والإنتاجية' },
        content: {
            en: 'CSV/XLSX bulk product import with preview validation and error CSVs, catalog printing, bulk actions, search, and filters.',
            ar: 'استيراد وتصدير المنتجات عبر CSV/XLSX مع معاينة قبل الحفظ وتقرير أخطاء، وطباعة الكتالوج، والإجراءات الجماعية.',
        },
        talkingPoints: {
            en: [
                'Onboard hundreds of products via spreadsheet instead of manual entry one by one.',
            ],
            ar: [
                'رفع مئات المنتجات دفعة واحدة من شيت Excel بدل الإدخال اليدوي.',
            ],
        },
        demoSteps: {
            en: ['Show search, filters, and bulk selection on /admin/products.'],
            ar: ['وضح البحث والفلاتر والتحديد الجماعي في /admin/products.'],
        },
        benefits: {
            en: ['Saves hours during initial store setup and seasonal updates.'],
            ar: ['يوفر ساعات طويلة عند تجهيز المتجر أو تحديث الأسعار.'],
        },
    },
    {
        id: 'security',
        demoUrl: '/admin/system/audit-logs',
        screenshot: '/docs/screenshots/admin-audit-logs.png',
        title: { en: '11. Security, Maintenance & Administration', ar: '11. الأمان والصيانة والإدارة التجارية' },
        content: {
            en: 'Granular RBAC permissions, immutable Audit Logs, System Health diagnostics, Backup & Restore, Updates, Commercial Licensing, Support Export, and Web Installer (/install).',
            ar: 'صلاحيات دقيقة RBAC، سجل تدقيق للعمليات، فحص صحة النظام، النسخ الاحتياطي والاستعادة، التحديثات، التراخيص، ومعالج التثبيت.',
        },
        talkingPoints: {
            en: [
                'Sensitive operations (backups, secrets, user management) are strictly locked behind RBAC and DemoModeGuard.',
                'Includes a guided /install wizard so non-technical buyers can deploy easily on Shared Hosting or VPS.',
            ],
            ar: [
                'العمليات الحساسة محمية بصلاحيات دقيقة وDemoModeGuard، وكل تعديل إداري بيتسجل في سجل التدقيق.',
                'يوجد معالج تثبيت /install يسهّل التركيب على أي استضافة بدون تعقيد.',
            ],
        },
        demoSteps: {
            en: ['Open /admin/system/audit-logs to show activity tracking and explain Demo Mode restrictions.'],
            ar: ['افتح /admin/system/audit-logs لعرض سجل النشاط وتوضيح حماية وضع الديمو.'],
        },
        benefits: {
            en: ['Enterprise-grade accountability and smooth commercial deployment.'],
            ar: ['أمان عالٍ ومحاسبية واضحة مع سهولة التركيب والدعم الفني.'],
        },
    },
];
