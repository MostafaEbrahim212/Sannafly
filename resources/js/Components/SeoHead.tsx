import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import type { PageProps } from '@/types';

interface SeoHeadProps {
    title: string;
    description?: string | null;
    image?: string | null;
    type?: 'website' | 'product';
    canonical?: string | null;
    noIndex?: boolean;
    jsonLd?: Record<string, any> | Array<Record<string, any>> | null;
}

export default function SeoHead({
    title,
    description,
    image,
    type = 'website',
    canonical,
    noIndex = false,
    jsonLd,
}: SeoHeadProps) {
    const { settings } = usePage<PageProps>().props;
    const { localized, locale } = useTranslation();

    const siteName = localized(settings.site_name || 'MyStore', settings.site_name_ar);
    const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
    const metaDesc = description || settings.meta_description || localized(settings.site_description, settings.site_description_ar) || '';

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonicalUrl = canonical || (typeof window !== 'undefined' ? `${origin}${window.location.pathname}` : '');
    const absoluteImage = image ? (image.startsWith('http') ? image : `${origin}${image}`) : null;

    const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

    return (
        <Head title={fullTitle}>
            {metaDesc && <meta head-key="description" name="description" content={metaDesc} />}
            <meta head-key="robots" name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
            {canonicalUrl && <link head-key="canonical" rel="canonical" href={canonicalUrl} />}

            {/* Open Graph */}
            <meta head-key="og:site_name" property="og:site_name" content={siteName} />
            <meta head-key="og:title" property="og:title" content={fullTitle} />
            {metaDesc && <meta head-key="og:description" property="og:description" content={metaDesc} />}
            <meta head-key="og:type" property="og:type" content={type} />
            <meta head-key="og:locale" property="og:locale" content={locale === 'ar' ? 'ar_EG' : 'en_US'} />
            {canonicalUrl && <meta head-key="og:url" property="og:url" content={canonicalUrl} />}
            {absoluteImage && <meta head-key="og:image" property="og:image" content={absoluteImage} />}

            {/* Twitter Card */}
            <meta head-key="twitter:card" name="twitter:card" content={absoluteImage ? 'summary_large_image' : 'summary'} />
            <meta head-key="twitter:title" name="twitter:title" content={fullTitle} />
            {metaDesc && <meta head-key="twitter:description" name="twitter:description" content={metaDesc} />}
            {absoluteImage && <meta head-key="twitter:image" name="twitter:image" content={absoluteImage} />}

            {/* Structured Data (JSON-LD) */}
            {schemas.map((schema, idx) => (
                <script key={idx} type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            ))}
        </Head>
    );
}
