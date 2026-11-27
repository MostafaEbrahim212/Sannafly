export type HelpLevel = 'beginner' | 'intermediate' | 'advanced';

export interface HelpGuide {
    id: string;
    category: string;
    level: HelpLevel;
    routePath: string;
    screenshot?: string;
    title: { en: string; ar: string };
    summary: { en: string; ar: string };
    what: { en: string; ar: string };
    why: { en: string; ar: string };
    steps: { en: string[]; ar: string[] };
    example: { en: string; ar: string };
    result: { en: string; ar: string };
    notes: { en: string; ar: string };
    troubleshooting: { en: string; ar: string };
}

export interface HelpFaqItem {
    id: string;
    category: string;
    q: { en: string; ar: string };
    a: { en: string; ar: string };
}

export const HELP_CATEGORIES: Array<{ id: string; en: string; ar: string }> = [
    { id: 'all', en: 'All Guides', ar: 'جميع الأدلة' },
    { id: 'getting-started', en: 'Getting Started', ar: 'البداية والتنقل' },
    { id: 'catalog', en: 'Products & Catalog', ar: 'المنتجات والكتالوج' },
    { id: 'sales', en: 'Orders, Pricing & Customers', ar: 'الطلبات والأسعار والعملاء' },
    { id: 'customization', en: 'Storefront & Customization', ar: 'المتجر والتخصيص' },
    { id: 'system', en: 'System, Security & Licensing', ar: 'النظام والأمان والترخيص' },
];

export const HELP_GUIDES: HelpGuide[] = [
    {
        id: 'dashboard-overview',
        category: 'getting-started',
        level: 'beginner',
        routePath: '/admin',
        screenshot: '/docs/screenshots/admin-dashboard.png',
        title: { en: 'Dashboard Overview & Navigation', ar: 'نظرة عامة على لوحة التحكم والتنقل' },
        summary: {
            en: 'Understand KPI cards, sidebar quick search, live notifications, and theme/language toggles.',
            ar: 'تعرّف على مؤشرات الأداء، البحث السريع في القائمة، الإشعارات الفورية، وتبديل اللغة والمظهر.',
        },
        what: {
            en: 'The central command center summarizing products, low-stock alerts, categories, orders, and recent activity.',
            ar: 'مركز التحكم الرئيسي الذي يعرض ملخص المنتجات، تنبيهات انخفاض المخزون، الأقسام، الطلبات، وآخر الأنشطة.',
        },
        why: {
            en: 'Gives owners an immediate daily health check without opening multiple screens.',
            ar: 'يمنح صاحب المتجر نظرة يومية فورية على ما يحتاج متابعة دون التنقل بين عدة صفحات.',
        },
        steps: {
            en: [
                'Sign in at /admin/login to land on /admin.',
                'Check the 4 KPI cards (Products, Low Stock, Categories, Orders).',
                'Use the sidebar search bar to jump to any section instantly.',
                'Click the Bell icon in the top bar or visit /admin/notifications to review live alerts.',
            ],
            ar: [
                'سجّل الدخول عبر /admin/login للوصول إلى /admin.',
                'راجع بطاقات المؤشرات الأربع (المنتجات، نقص المخزون، الأقسام، الطلبات).',
                'استخدم شريط البحث في القائمة الجانبية للوصول السريع لأي قسم.',
                'اضغط على أيقونة الجرس في الأعلى أو افتح /admin/notifications لمتابعة التنبيهات الفورية.',
            ],
        },
        example: {
            en: 'Spot 1 Low Stock item and 2 Pending Orders on /admin, then click Orders to confirm them.',
            ar: 'ملاحظة منتج منخفض المخزون وطلبين قيد الانتظار في /admin ثم الانتقال مباشرة إلى الطلبات لتأكيدها.',
        },
        result: {
            en: 'Live polling (/admin/realtime/feed) keeps unread counts and order status updates synced automatically.',
            ar: 'يقوم التحديث الفوري (/admin/realtime/feed) بمزامنة عداد الإشعارات وتحديثات الطلبات تلقائيًا.',
        },
        notes: {
            en: 'Sidebar items and quick actions adapt automatically to your role permissions.',
            ar: 'تظهر عناصر القائمة والإجراءات السريعة تلقائيًا حسب صلاحيات دورك الوظيفي.',
        },
        troubleshooting: {
            en: 'If Orders card is hidden, enable module_ecommerce in /admin/settings.',
            ar: 'إذا لم تظهر بطاقة الطلبات، تأكد من تفعيل module_ecommerce في /admin/settings.',
        },
    },
    {
        id: 'products-wizard',
        category: 'catalog',
        level: 'beginner',
        routePath: '/admin/products/create',
        screenshot: '/docs/screenshots/admin-product-create.png',
        title: { en: 'Products & 5-Step Product Wizard', ar: 'المنتجات ومعالج الإضافة من 5 خطوات' },
        summary: {
            en: 'Create and edit products with bilingual info, multi-tier pricing, image galleries, and variations.',
            ar: 'إضافة وتعديل المنتجات ببيانات ثنائية اللغة، أسعار متعددة، معرض صور، ومتغيرات.',
        },
        what: {
            en: 'Guided 5-step workflow: Basic Info → Pricing & Stock → Images → Variations → Review & Publish.',
            ar: 'معالج من 5 خطوات: البيانات الأساسية ← الأسعار والمخزون ← الصور ← المتغيرات ← المراجعة والنشر.',
        },
        why: {
            en: 'Prevents incomplete product listings and keeps SKUs, images, and inventory consistent.',
            ar: 'يضمن اكتمال بيانات المنتج وتناسق أكواد SKU والصور والمخزون.',
        },
        steps: {
            en: [
                'Open /admin/products and click New Product (/admin/products/create).',
                'Fill English & Arabic names, click Generate SKU, and pick Category & Brand.',
                'On Step 2, enter Regular Price, optional Sale/Wholesale tiers, and Stock Quantity.',
                'On Step 3, upload photos and click the Star icon to set the Main Image.',
                'On Step 4 (optional), enable Variations, pick Attributes, and click Generate Variations.',
                'On Step 5, click Publish Product or Save as Draft.',
            ],
            ar: [
                'افتح /admin/products واضغط منتج جديد (/admin/products/create).',
                'أدخل الاسم بالإنجليزية والعربية، واضغط توليد SKU، واختر القسم والعلامة التجارية.',
                'في الخطوة 2، أدخل السعر الأساسي، وأسعار العرض/الجملة الاختيارية، وكمية المخزون.',
                'في الخطوة 3، ارفع الصور واضغط أيقونة النجمة لتعيين الصورة الرئيسية.',
                'في الخطوة 4 (اختياري)، فعّل المتغيرات واختر الخصائص ثم اضغط توليد المتغيرات.',
                'في الخطوة 5، اضغط نشر المنتج أو حفظ كمسودة.',
            ],
        },
        example: {
            en: 'Publish "Wireless Studio Headphones" (CF-AUD-101) at 249.00 with 2 photos and Matte Black / Silver variants.',
            ar: 'نشر "سماعات استوديو لاسلكية" بسعر 249.00 مع صورتين ومتغيرات للون الأسود والفضي.',
        },
        result: {
            en: 'Product is saved transactionally, images are thumbnailed, and published items appear immediately on /catalog.',
            ar: 'يُحفظ المنتج داخل معاملة قاعدة بيانات، وتُنشأ صور مصغرة، ويظهر فورًا في /catalog عند النشر.',
        },
        notes: {
            en: 'Product deletion is blocked in Demo Mode by demo.guard.',
            ar: 'حذف المنتجات محظور في وضع Demo Mode عبر middleware الحماية demo.guard.',
        },
        troubleshooting: {
            en: 'If images look broken, verify storage:link in /admin/system/health.',
            ar: 'إذا لم تظهر الصور، تحقق من ارتباط التخزين storage:link في /admin/system/health.',
        },
    },
    {
        id: 'categories-brands-inventory',
        category: 'catalog',
        level: 'beginner',
        routePath: '/admin/inventory',
        screenshot: '/docs/screenshots/admin-inventory.png',
        title: { en: 'Categories, Brands, Attributes & Inventory', ar: 'الأقسام والعلامات والخصائص والمخزون' },
        summary: {
            en: 'Organize catalog hierarchy, manage variation attributes, and track every stock movement.',
            ar: 'تنظيم شجرة الأقسام، إدارة خصائص المتغيرات، ومتابعة كل حركة مخزون.',
        },
        what: {
            en: 'Dedicated managers at /admin/categories, /admin/brands, /admin/attributes, and /admin/inventory.',
            ar: 'شاشات متخصصة في /admin/categories و/admin/brands و/admin/attributes و/admin/inventory.',
        },
        why: {
            en: 'Powers storefront filtering and keeps an immutable stock adjustment ledger.',
            ar: 'يدعم فلاتر المتجر ويوفر سجلًا دقيقًا لحركات الإضافة والسحب والحجز في المخزون.',
        },
        steps: {
            en: [
                'Create top-level and child categories at /admin/categories.',
                'Add brands at /admin/brands and variation attributes (Color/Size) at /admin/attributes.',
                'Use /admin/inventory to apply +/- stock adjustments and inspect StockMovement history.',
            ],
            ar: [
                'أنشئ الأقسام الرئيسية والفرعية في /admin/categories.',
                'أضف العلامات التجارية في /admin/brands وخصائص المتغيرات في /admin/attributes.',
                'استخدم /admin/inventory لتعديل الكميات (+ / -) ومراجعة سجل الحركات.',
            ],
        },
        example: {
            en: 'Add +10 units to a restocked keyboard in /admin/inventory and verify the movement log row.',
            ar: 'إضافة 10 قطع لمنتج في /admin/inventory والتحقق من تسجيل الحركة فورًا في السجل.',
        },
        result: {
            en: 'Stock counts update atomically and low-stock alerts clear automatically.',
            ar: 'تُحدَّث الكميات فورًا وتختفي تنبيهات نقص المخزون تلقائيًا.',
        },
        notes: {
            en: 'Cancelled or returned orders automatically release reserved stock back to inventory.',
            ar: 'إلغاء الطلب أو إرجاعه يعيد المخزون المحجوز تلقائيًا.',
        },
        troubleshooting: {
            en: 'If Brands are hidden on storefront, check module_brands in /admin/settings.',
            ar: 'إذا لم تظهر العلامات التجارية في المتجر، تحقق من تفعيل module_brands في الإعدادات.',
        },
    },
    {
        id: 'orders-fulfillment',
        category: 'sales',
        level: 'intermediate',
        routePath: '/admin/orders',
        screenshot: '/docs/screenshots/admin-orders.png',
        title: { en: 'Orders, State Machine & Printing', ar: 'إدارة الطلبات، دورة الحالة والطباعة' },
        summary: {
            en: 'Filter orders, advance status safely, print invoices & shipping labels, and reconcile payments.',
            ar: 'فلترة الطلبات، تحديث الحالات بأمان، طباعة الفواتير وبوالص الشحن، ومراجعة الدفع.',
        },
        what: {
            en: 'Order pipeline enforcing pending → confirmed → processing → shipped → delivered, plus cancelled/returned/refunded.',
            ar: 'دورة حياة منظمة للطلب: قيد الانتظار ← مؤكد ← قيد التجهيز ← تم الشحن ← تم التسليم، مع دعم الإلغاء والمرتجع.',
        },
        why: {
            en: 'Prevents invalid status jumps, protects stock integrity, and keeps customers notified.',
            ar: 'يمنع الانتقال الخاطئ للحالات، ويحافظ على المخزون، ويرسل إشعارات فورية للعميل.',
        },
        steps: {
            en: [
                'Open /admin/orders and select a status tab (e.g., Pending).',
                'Click the one-click next-step button (Confirm Order → Start Preparing → Ship Order → Mark Delivered).',
                'Open /admin/orders/{id} for full line items, Invoice (/invoice), and Shipping Label (/label).',
            ],
            ar: [
                'افتح /admin/orders واختر تبويب الحالة (مثل قيد الانتظار).',
                'استخدم زر الخطوة التالية السريع (تأكيد الطلب ← بدء التجهيز ← شحن الطلب ← تم التسليم).',
                'افتح تفاصيل الطلب /admin/orders/{id} لطباعة الفاتورة (/invoice) أو ملصق الشحن (/label).',
            ],
        },
        example: {
            en: 'Confirm a new COD order, print its shipping label, ship it, then mark it Delivered and Paid.',
            ar: 'تأكيد طلب دفع عند الاستلام، طباعة ملصق الشحن، شحنه، ثم تحديده كمسلّم ومدفوع.',
        },
        result: {
            en: 'Customer /track-order and /my-orders update in real time and notifications are sent.',
            ar: 'تتحدث صفحة تتبع الطلب /track-order وحساب العميل وتُرسل الإشعارات تلقائيًا.',
        },
        notes: {
            en: 'Requires orders.manage permission to change status.',
            ar: 'يتطلب تغيير حالة الطلب صلاحية orders.manage.',
        },
        troubleshooting: {
            en: 'If next button is missing, the order is in a terminal state or user only has orders.view.',
            ar: 'إذا لم يظهر زر التحديث، فالطلب في حالة نهائية أو الحساب يملك صلاحية العرض فقط.',
        },
    },
    {
        id: 'payments-coupons-shipping',
        category: 'sales',
        level: 'intermediate',
        routePath: '/admin/payment-methods',
        screenshot: '/docs/screenshots/admin-payment-methods.png',
        title: { en: 'Payment Gateways, Coupons & Shipping Zones', ar: 'بوابات الدفع، الكوبونات ومناطق الشحن' },
        summary: {
            en: 'Configure COD, Bank Transfer, MyFatoorah, Fawry, Paymob, Kashier, promo codes, and delivery fees.',
            ar: 'إعداد الدفع عند الاستلام، التحويل البنكي، ماي فاتورة، فوري، بايموب، كاشير، الكوبونات والشحن.',
        },
        what: {
            en: 'Checkout infrastructure split across /admin/payment-methods, /admin/shipping-zones, and /admin/coupons.',
            ar: 'بنية الدفع والشحن والخصومات موزعة على /admin/payment-methods و/admin/shipping-zones و/admin/coupons.',
        },
        why: {
            en: 'Enables local/regional online payments and accurate shipping & discount calculations at /cart.',
            ar: 'يتيح الدفع الإلكتروني المحلي والإقليمي وحساب رسوم الشحن والخصم بدقة في السلة.',
        },
        steps: {
            en: [
                'Enable COD or configure an online driver in /admin/payment-methods (Sandbox or Live keys).',
                'Create regional delivery rates and free-shipping thresholds in /admin/shipping-zones.',
                'Create percentage or fixed promo codes in /admin/coupons.',
            ],
            ar: [
                'فعّل الدفع عند الاستلام أو أضف مفاتيح بوابة الدفع في /admin/payment-methods.',
                'أنشئ مناطق الشحن والرسوم وحد الشحن المجاني في /admin/shipping-zones.',
                'أنشئ كوبونات خصم (نسبة أو مبلغ ثابت) في /admin/coupons.',
            ],
        },
        example: {
            en: 'Set Cairo shipping to 50 with free shipping over 1000, and create coupon WELCOME10 (10% off).',
            ar: 'تحديد شحن القاهرة بـ 50 مع شحن مجاني فوق 1000، وإنشاء كوبون WELCOME10 بخصم 10%.',
        },
        result: {
            en: 'Checkout dynamically calculates totals and handles online payment callbacks (/payments/callback/{driver}).',
            ar: 'يحسب المتجر الإجمالي تلقائيًا ويعالج إشعارات الدفع الإلكتروني عبر /payments/callback/{driver}.',
        },
        notes: {
            en: 'In Demo Mode, online payment gateways simulate confirmation safely without external API calls.',
            ar: 'في وضع Demo Mode، تتم محاكاة الدفع الإلكتروني بأمان دون استدعاء البوابات الحقيقية.',
        },
        troubleshooting: {
            en: 'Webhooks require a public HTTPS URL; local 127.0.0.1 cannot receive external callbacks.',
            ar: 'تتطلب بوابات الدفع رابط HTTPS عامًا لاستقبال Webhooks ولا تعمل على 127.0.0.1.',
        },
    },
    {
        id: 'import-export-analytics',
        category: 'sales',
        level: 'intermediate',
        routePath: '/admin/import-export',
        screenshot: '/docs/screenshots/admin-import-export.png',
        title: { en: 'Bulk Import/Export & Sales Analytics', ar: 'الاستيراد والتصدير وتحليلات المبيعات' },
        summary: {
            en: 'Onboard catalogs via CSV/XLSX with preview validation, export data, and review revenue analytics.',
            ar: 'رفع المنتجات عبر CSV/XLSX مع معاينة التحقق، تصدير البيانات، ومراجعة تقارير المبيعات.',
        },
        what: {
            en: 'Spreadsheet import/export center (/admin/import-export), Analytics (/admin/analytics), and Print Catalog (/admin/print/catalog).',
            ar: 'مركز الاستيراد والتصدير (/admin/import-export)، التحليلات (/admin/analytics)، وطباعة الكتالوج (/admin/print/catalog).',
        },
        why: {
            en: 'Saves hours when migrating large product lists and provides exportable financial metrics.',
            ar: 'يوفر ساعات عند إدخال مئات المنتجات ويمنحك تقارير مبيعات قابلة للتصدير.',
        },
        steps: {
            en: [
                'Download the CSV or XLSX template from /admin/import-export.',
                'Upload your filled sheet and click Preview to check validation before importing.',
                'Click Import and download per-row error CSV if any row fails.',
                'Review revenue trends and export CSV at /admin/analytics.',
            ],
            ar: [
                'نزّل قالب CSV أو XLSX من /admin/import-export.',
                'ارفع الملف واضغط معاينة للتحقق من البيانات قبل الاعتماد.',
                'اضغط استيراد، ونزّل ملف الأخطاء إن وُجدت صفوف تحتاج تصحيحًا.',
                'راجع الإيرادات وصدّر ملف CSV من /admin/analytics.',
            ],
        },
        example: {
            en: 'Import 50 new SKUs using the XLSX template, then print an updated catalog PDF at /admin/print/catalog.',
            ar: 'استيراد 50 منتجًا عبر قالب XLSX ثم طباعة كتالوج PDF محدث من /admin/print/catalog.',
        },
        result: {
            en: 'ImportJob records track created/updated/failed counts for auditability.',
            ar: 'يتم توثيق كل عملية استيراد بسجل ImportJob يوضح عدد الصفوف الناجحة والفاشلة.',
        },
        notes: {
            en: 'Ensure every row has a unique SKU.',
            ar: 'تأكد من وجود كود SKU فريد لكل صف.',
        },
        troubleshooting: {
            en: 'If Arabic characters look garbled in Excel, import using UTF-8 encoding via Excel Data → From Text/CSV.',
            ar: 'إذا ظهرت الحروف العربية بشكل غير صحيح في Excel، افتح الملف عبر ترميز UTF-8.',
        },
    },
    {
        id: 'customizer-themes-policies',
        category: 'customization',
        level: 'intermediate',
        routePath: '/admin/customizer',
        screenshot: '/docs/screenshots/admin-customizer.png',
        title: { en: 'Storefront Customizer, Theme Presets & Policies', ar: 'مخصص المتجر، قوالب الثيم والسياسات' },
        summary: {
            en: 'Customize colors, niche presets, section ordering, live Desktop/Mobile/Dark preview, and legal pages.',
            ar: 'تخصيص الألوان، القوالب الجاهزة، ترتيب أقسام الرئيسية، المعاينة المباشرة، وصفحات السياسات.',
        },
        what: {
            en: '4-tab visual customizer (/admin/customizer), JSON Theme Presets (/admin/customizer/themes), and Policies (/admin/policies).',
            ar: 'مخصص مرئي بـ 4 تبويبات (/admin/customizer)، إدارة قوالب الثيم (/admin/customizer/themes)، والسياسات (/admin/policies).',
        },
        why: {
            en: 'Turns the white-label platform into a unique branded storefront in minutes without coding.',
            ar: 'يحوّل المنصة إلى متجر بهوية بصرية مستقلة خلال دقائق دون تعديل الكود.',
        },
        steps: {
            en: [
                'Open /admin/customizer and choose a Niche Preset or custom Primary/Accent/Text colors.',
                'Edit Hero & Promo Banner texts in English and Arabic.',
                'Use Layout tab to toggle and reorder homepage sections.',
                'Preview in Desktop/Mobile and Light/Dark modes, then click Save.',
                'Save or export reusable presets at /admin/customizer/themes and edit legal pages at /admin/policies.',
            ],
            ar: [
                'افتح /admin/customizer واختر قالب نشاط جاهز أو حدد ألوان العلامة التجارية.',
                'عدّل نصوص الواجهة الرئيسية والبانر الترويجي بالعربية والإنجليزية.',
                'من تبويب التخطيط، فعّل أو أعد ترتيب أقسام الصفحة الرئيسية.',
                'عاين النتيجة على الكمبيوتر والموبايل وفي الوضعين الفاتح والداكن ثم احفظ.',
                'احفظ القالب في /admin/customizer/themes وحدّث السياسات في /admin/policies.',
            ],
        },
        example: {
            en: 'Apply Signature Petrol, move Featured Products above Categories, and save as a reusable JSON preset.',
            ar: 'تطبيق قالب Signature Petrol، وتقديم المنتجات المميزة قبل الأقسام، وحفظ الإعدادات كقالب JSON.',
        },
        result: {
            en: 'CSS theme variables update immediately across Storefront and Admin.',
            ar: 'تتحدث متغيرات الألوان فورًا في المتجر ولوحة التحكم.',
        },
        notes: {
            en: 'Theme preset mutations are blocked in Demo Mode.',
            ar: 'تعديل أو حذف قوالب الثيم محظور في وضع Demo Mode.',
        },
        troubleshooting: {
            en: 'Hard-refresh the storefront (Ctrl+F5) if old browser styles appear cached.',
            ar: 'اضغط Ctrl+F5 في المتجر إذا بقيت الألوان القديمة مخزنة مؤقتًا في المتصفح.',
        },
    },
    {
        id: 'settings-whitelabel',
        category: 'system',
        level: 'advanced',
        routePath: '/admin/settings',
        screenshot: '/docs/screenshots/admin-settings.png',
        title: { en: 'System Settings & White-Label Configuration', ar: 'إعدادات النظام والهوية البيضاء (White-Label)' },
        summary: {
            en: 'Configure store identity, currency, timezone, localization, module toggles, image sizing, and order TTLs.',
            ar: 'إعداد اسم المتجر، العملة، المنطقة الزمنية، اللغة، تفعيل الوحدات، إعدادات الصور، ومهلة الطلبات.',
        },
        what: {
            en: 'Master settings panel (/admin/settings) grouped by General, Localization, Modules, Products, Orders, SEO, and Privacy.',
            ar: 'لوحة الإعدادات الشاملة (/admin/settings) مقسمة حسب الهوية، اللغة، الوحدات، المنتجات، الطلبات، السيو، والخصوصية.',
        },
        why: {
            en: 'Controls global business rules such as E-Commerce vs Catalog-only mode and currency formatting.',
            ar: 'تتحكم في قواعد العمل الأساسية مثل وضع التجارة الإلكترونية أو الكتالوج فقط وتنسيق العملة.',
        },
        steps: {
            en: [
                'Open /admin/settings.',
                'Update General branding, contact/WhatsApp info, currency code & symbol.',
                'Set default_locale, timezone, and module toggles.',
                'Click Save Settings.',
            ],
            ar: [
                'افتح /admin/settings.',
                'حدّث بيانات الهوية، التواصل والواتساب، ورمز وعلامة العملة.',
                'اضبط اللغة الافتراضية والمنطقة الزمنية وتبديلات الوحدات.',
                'اضغط حفظ الإعدادات.',
            ],
        },
        example: {
            en: 'Switch currency to SAR (ر.س), timezone to Asia/Riyadh, and default_locale to ar.',
            ar: 'تغيير العملة إلى SAR (ر.س) والمنطقة الزمنية إلى Asia/Riyadh واللغة الافتراضية إلى العربية.',
        },
        result: {
            en: 'Saved inside a DB transaction with an AuditLog entry.',
            ar: 'تُحفظ الإعدادات داخل معاملة قاعدة بيانات مع تسجيل الحدث في سجل التدقيق.',
        },
        notes: {
            en: 'Blocked in Demo Mode by demo.guard.',
            ar: 'حفظ الإعدادات محظور في وضع Demo Mode.',
        },
        troubleshooting: {
            en: '403 when saving means user lacks settings.manage or Demo Mode is enabled.',
            ar: 'ظهور خطأ 403 عند الحفظ يعني عدم وجود صلاحية settings.manage أو تفعيل وضع Demo.',
        },
    },
    {
        id: 'users-roles-audit',
        category: 'system',
        level: 'advanced',
        routePath: '/admin/roles',
        screenshot: '/docs/screenshots/admin-roles.png',
        title: { en: 'Users, Roles, RBAC & Audit Logs', ar: 'المستخدمون، الأدوار، الصلاحيات وسجل التدقيق' },
        summary: {
            en: 'Manage staff accounts, granular permissions, immutable audit trails, and system logs.',
            ar: 'إدارة حسابات الموظفين، مصفوفة الصلاحيات، سجل التدقيق، وسجلات النظام.',
        },
        what: {
            en: 'Access control across /admin/users, /admin/roles, /admin/system/audit-logs, and /admin/system-logs.',
            ar: 'إدارة الوصول والأمان عبر /admin/users و/admin/roles و/admin/system/audit-logs و/admin/system-logs.',
        },
        why: {
            en: 'Enforces least-privilege access and records accountability for every admin action.',
            ar: 'يطبّق مبدأ أقل صلاحية ممكنة ويوثّق كل تعديل إداري للمراجعة والمساءلة.',
        },
        steps: {
            en: [
                'Create custom roles with exact permissions in /admin/roles.',
                'Create staff accounts and assign roles in /admin/users.',
                'Inspect or export admin activity in /admin/system/audit-logs.',
            ],
            ar: [
                'أنشئ أدوارًا مخصصة بصلاحيات محددة في /admin/roles.',
                'أضف حسابات الموظفين واربطها بالأدوار في /admin/users.',
                'راجع أو صدّر سجل التدقيق من /admin/system/audit-logs.',
            ],
        },
        example: {
            en: 'Create an Order Staff role with only dashboard.access, orders.view, and orders.manage.',
            ar: 'إنشاء دور موظف طلبات بصلاحيات dashboard.access وorders.view وorders.manage فقط.',
        },
        result: {
            en: 'Staff users only see permitted sidebar items and receive 403 on restricted routes.',
            ar: 'يرى الموظف الأقسام المصرح له بها فقط ويُمنع (403) من باقي المسارات.',
        },
        notes: {
            en: 'Demo Reviewer (demo@example.com) is automatically locked to read-only permissions.',
            ar: 'حساب المراجعة التجريبي (demo@example.com) مقيد بصلاحيات القراءة فقط.',
        },
        troubleshooting: {
            en: 'Every admin role must include dashboard.access in addition to module permissions.',
            ar: 'يجب أن يتضمن كل دور إداري صلاحية dashboard.access بجانب صلاحيات القسم.',
        },
    },
    {
        id: 'health-backups-updates-license',
        category: 'system',
        level: 'advanced',
        routePath: '/admin/system/backups',
        screenshot: '/docs/screenshots/admin-backups.png',
        title: { en: 'Health, Backups, Updates, License & Support', ar: 'صحة النظام، النسخ الاحتياطي، التحديثات، الترخيص والدعم' },
        summary: {
            en: 'Run diagnostics, create/verify/restore backups, manage updates, activate licenses, and export support bundles.',
            ar: 'تشغيل فحوصات الصحة، إنشاء واستعادة النسخ الاحتياطية، إدارة التحديثات، تفعيل التراخيص، وتصدير تقارير الدعم.',
        },
        what: {
            en: 'Commercial operations suite: /admin/system/health, /backups, /updates, /license, /support, and /admin/system-tools.',
            ar: 'حزمة الإدارة التجارية: /admin/system/health و/backups و/updates و/license و/support و/admin/system-tools.',
        },
        why: {
            en: 'Designed for reliable operation on both Shared Hosting and VPS without requiring SSH for routine tasks.',
            ar: 'مصممة للعمل الموثوق على الاستضافة المشتركة وVPS دون الحاجة الدائمة لـ SSH.',
        },
        steps: {
            en: [
                'Check /admin/system/health and send a Test Mail to verify SMTP.',
                'Create and Verify a backup in /admin/system/backups before any update.',
                'Check /admin/system/updates for new releases.',
                'Activate buyer domain license at /admin/system/license.',
                'Generate an anonymized diagnostic bundle at /admin/system/support when troubleshooting.',
            ],
            ar: [
                'افحص /admin/system/health وأرسل بريدًا تجريبيًا للتحقق من SMTP.',
                'أنشئ نسخة احتياطية وتحقق منها في /admin/system/backups قبل أي تحديث.',
                'تحقق من التحديثات في /admin/system/updates.',
                'فعّل ترخيص العميل في /admin/system/license.',
                'أنشئ حزمة دعم منزوعة الأسرار من /admin/system/support عند الحاجة للمساعدة الفنية.',
            ],
        },
        example: {
            en: 'Create a Database backup, click Verify, download an off-site copy, then run an update.',
            ar: 'إنشاء نسخة احتياطية لقاعدة البيانات، التحقق منها، تنزيل نسخة خارجية، ثم تنفيذ التحديث.',
        },
        result: {
            en: 'Checksums verify archive integrity; support exports redact sensitive secrets automatically.',
            ar: 'يتم التحقق من سلامة النسخ عبر Checksums، وتُخفى الأسرار تلقائيًا في تقارير الدعم.',
        },
        notes: {
            en: 'Demo Mode blocks backups, updates, test mail, and license mutations.',
            ar: 'وضع Demo Mode يمنع تعديل النسخ الاحتياطية والتحديثات والترخيص.',
        },
        troubleshooting: {
            en: 'On Shared Hosting with Zip limits, use Database backup type instead of Full.',
            ar: 'في الاستضافة المشتركة محدودة الذاكرة، اختر نوع Database للنسخ الاحتياطي.',
        },
    },
    {
        id: 'demo-and-installer',
        category: 'system',
        level: 'advanced',
        routePath: '/demo',
        screenshot: '/docs/screenshots/demo-hub.png',
        title: { en: 'Demo Mode (/demo) & Web Installer (/install)', ar: 'وضع العرض التجريبي (/demo) ومعالج التثبيت (/install)' },
        summary: {
            en: 'Safely demonstrate the platform to buyers via /demo and deploy new client copies via /install.',
            ar: 'استعراض المنصة بأمان للمشترين عبر /demo وتثبيت نسخ العملاء الجدد عبر /install.',
        },
        what: {
            en: 'Public Demo Hub (/demo) with restricted demo-reviewer login, plus guided 5-step Web Installer (/install).',
            ar: 'مركز التجربة العام (/demo) مع حساب مراجعة مقيّد، ومعالج التثبيت الموجه (/install).',
        },
        why: {
            en: 'Lets buyers evaluate the full UI safely and install new copies without touching CLI.',
            ar: 'يمكّن المشترين من تجربة النظام بأمان وتثبيت نسخ جديدة عبر المتصفح.',
        },
        steps: {
            en: [
                'For sales demos: enable Demo Mode, share /product and /demo with prospects.',
                'For new client deployments: upload files, visit /install, test DB, run migrations/seeders, and create the owner account.',
                'After /install completes, verify Demo Mode is OFF and activate the client license.',
            ],
            ar: [
                'للعروض التسويقية: فعّل Demo Mode وشارك /product و/demo مع العملاء المحتملين.',
                'لتثبيت نسخة عميل جديد: ارفع الملفات وافتح /install لاختبار القاعدة وتشغيل التثبيت وإنشاء المالك.',
                'بعد اكتمال /install، تأكد من إيقاف Demo Mode وفعّل ترخيص العميل.',
            ],
        },
        example: {
            en: 'Prospect visits /product → clicks Live Demo (/demo) → explores Admin via one-click Demo Reviewer.',
            ar: 'العميل يزور /product ← يضغط تجربة حية (/demo) ← يستكشف لوحة التحكم بحساب المراجعة المقيّد.',
        },
        result: {
            en: '/install automatically locks itself once completed via EnsureNotInstalled middleware.',
            ar: 'يُغلق مسار /install تلقائيًا بعد اكتمال التثبيت عبر EnsureNotInstalled.',
        },
        notes: {
            en: 'Always disable Demo Mode before launching a real production store.',
            ar: 'يجب إيقاف Demo Mode دائمًا قبل تشغيل أي متجر فعلي.',
        },
        troubleshooting: {
            en: 'If /demo/login-admin returns 403, Demo Mode is currently disabled in Settings.',
            ar: 'إذا أعاد /demo/login-admin خطأ 403 فهذا يعني أن Demo Mode معطل في الإعدادات.',
        },
    },
];

export const HELP_FAQS: HelpFaqItem[] = [
    {
        id: 'catalog-only',
        category: 'getting-started',
        q: {
            en: 'Can I run the platform as a product catalog without online checkout?',
            ar: 'هل يمكن تشغيل المنصة ككتالوج عرض فقط بدون سلة وطلبات أونلاين؟',
        },
        a: {
            en: 'Yes. Disable module_ecommerce in /admin/settings. Cart and checkout are hidden while products, categories, inquiries, and WhatsApp buttons stay active.',
            ar: 'نعم، قم بتعطيل module_ecommerce من /admin/settings فتختفي السلة والطلبات وتبقى المنتجات والاستفسارات والواتساب فعّالة.',
        },
    },
    {
        id: 'demo-blocked',
        category: 'system',
        q: {
            en: 'Why does saving settings or deleting a product say "disabled in Demo Mode"?',
            ar: 'لماذا تظهر رسالة أن الإجراء معطل في وضع Demo Mode عند الحفظ أو الحذف؟',
        },
        a: {
            en: 'Demo Mode is active and demo.guard protects sensitive routes. Turn off Demo Mode in production.',
            ar: 'لأن وضع Demo Mode مفعّل وحماية demo.guard تمنع التعديلات الحساسة. أوقفه في المتجر الفعلي.',
        },
    },
    {
        id: 'images-broken',
        category: 'catalog',
        q: {
            en: 'Product images show broken links after moving to a new server.',
            ar: 'صور المنتجات لا تظهر بعد نقل المشروع لسيرفر جديد.',
        },
        a: {
            en: 'Check Storage Symlink in /admin/system/health (run php artisan storage:link) and verify APP_URL in .env.',
            ar: 'تحقق من Storage Symlink في /admin/system/health ونفّذ php artisan storage:link وتأكد من APP_URL.',
        },
    },
    {
        id: 'rbac-403',
        category: 'system',
        q: {
            en: 'A staff member receives 403 Forbidden on a dashboard page.',
            ar: 'أحد الموظفين يواجه خطأ 403 عند فتح صفحة في لوحة التحكم.',
        },
        a: {
            en: 'Verify their role in /admin/roles includes both dashboard.access and the module permission, and their user status is Active.',
            ar: 'تأكد من أن دوره في /admin/roles يحتوي على dashboard.access وصلاحية القسم المطلوب وأن حسابه نشط.',
        },
    },
    {
        id: 'arabic-csv',
        category: 'sales',
        q: {
            en: 'Arabic text looks garbled when opening exported CSV in Excel.',
            ar: 'النصوص العربية تظهر برموز غريبة عند فتح ملف CSV في Excel.',
        },
        a: {
            en: 'Open Excel → Data → From Text/CSV and select UTF-8 encoding.',
            ar: 'افتح الملف من Excel عبر البيانات (Data) ← من نص/CSV واختر ترميز UTF-8.',
        },
    },
];
