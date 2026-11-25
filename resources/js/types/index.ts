export interface AuthUser {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    status: 'active' | 'inactive' | 'suspended';
    roles: string[];
}

export interface PageProps {
    auth: {
        user: AuthUser | null;
        permissions: string[];
        customer?: {
            id: number;
            name: string;
            email: string;
            phone?: string | null;
        } | null;
    };
    locale: 'en' | 'ar';
    dir: 'ltr' | 'rtl';
    settings: Record<string, any>;
    cartCount: number;
    flash: {
        success?: string | null;
        error?: string | null;
    };
    [key: string]: any;
}

export interface Category {
    id: number;
    parent_id: number | null;
    name: string;
    name_ar?: string | null;
    slug: string;
    description?: string | null;
    description_ar?: string | null;
    image?: string | null;
    sort_order: number;
    is_visible: boolean;
    products_count?: number;
    parent?: Category | null;
}

export interface Brand {
    id: number;
    name: string;
    name_ar?: string | null;
    slug: string;
    logo?: string | null;
    website?: string | null;
    is_visible: boolean;
    sort_order: number;
    products_count?: number;
}

export interface PriceType {
    id: number;
    name: string;
    name_ar?: string | null;
    slug: string;
    is_default: boolean;
}

export interface ProductPrice {
    id: number;
    price_type_id: number;
    variation_id: number | null;
    amount: string;
    currency: string;
    min_quantity: number;
    max_quantity?: number | null;
    price_type?: PriceType;
}

export interface ProductImage {
    id: number;
    product_id: number;
    variation_id: number | null;
    path: string;
    thumbnail_path?: string | null;
    webp_path?: string | null;
    alt_text?: string | null;
    caption?: string | null;
    sort_order: number;
    is_main: boolean;
}

export interface AttributeOption {
    id: number;
    attribute_id: number;
    value: string;
    value_ar?: string | null;
    color_hex?: string | null;
    attribute?: {
        id: number;
        name: string;
        name_ar?: string | null;
        type: string;
    };
}

export interface ProductVariation {
    id: number;
    product_id: number;
    sku: string;
    barcode?: string | null;
    name?: string | null;
    stock_quantity: number;
    low_stock_threshold: number;
    weight?: string | null;
    status: 'active' | 'inactive';
    is_default: boolean;
    options?: AttributeOption[];
    prices?: ProductPrice[];
    images?: ProductImage[];
}

export interface Product {
    id: number;
    category_id: number | null;
    brand_id: number | null;
    name: string;
    name_ar?: string | null;
    slug: string;
    sku: string;
    barcode?: string | null;
    short_description?: string | null;
    short_description_ar?: string | null;
    description?: string | null;
    description_ar?: string | null;
    status: 'draft' | 'published' | 'archived';
    visibility: 'public' | 'private' | 'catalog_only';
    is_featured: boolean;
    has_variations: boolean;
    track_inventory: boolean;
    allow_backorder: boolean;
    allow_negative_stock: boolean;
    stock_quantity: number;
    low_stock_threshold: number;
    weight?: string | null;
    specifications?: Array<{ key: string; value: string }> | null;
    tags?: string[] | null;
    seo_title?: string | null;
    seo_description?: string | null;
    category?: Category | null;
    brand?: Brand | null;
    images?: ProductImage[];
    prices?: ProductPrice[];
    variations?: ProductVariation[];
}
