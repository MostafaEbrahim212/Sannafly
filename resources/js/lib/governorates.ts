export interface Governorate {
    code: string;
    en: string;
    ar: string;
    region: 'greater_cairo' | 'alex_delta' | 'canal' | 'upper_egypt' | 'frontier';
}

export const EGYPT_GOVERNORATES: Governorate[] = [
    { code: 'cairo', en: 'Cairo', ar: 'القاهرة', region: 'greater_cairo' },
    { code: 'giza', en: 'Giza', ar: 'الجيزة', region: 'greater_cairo' },
    { code: 'qalyubia', en: 'Qalyubia', ar: 'القليوبية', region: 'greater_cairo' },
    { code: 'alexandria', en: 'Alexandria', ar: 'الإسكندرية', region: 'alex_delta' },
    { code: 'dakahlia', en: 'Dakahlia', ar: 'الدقهلية', region: 'alex_delta' },
    { code: 'sharqia', en: 'Sharqia', ar: 'الشرقية', region: 'alex_delta' },
    { code: 'gharbia', en: 'Gharbia', ar: 'الغربية', region: 'alex_delta' },
    { code: 'monufia', en: 'Monufia', ar: 'المنوفية', region: 'alex_delta' },
    { code: 'beheira', en: 'Beheira', ar: 'البحيرة', region: 'alex_delta' },
    { code: 'kafr_el_sheikh', en: 'Kafr El Sheikh', ar: 'كفر الشيخ', region: 'alex_delta' },
    { code: 'damietta', en: 'Damietta', ar: 'دمياط', region: 'alex_delta' },
    { code: 'port_said', en: 'Port Said', ar: 'بورسعيد', region: 'canal' },
    { code: 'ismailia', en: 'Ismailia', ar: 'الإسماعيلية', region: 'canal' },
    { code: 'suez', en: 'Suez', ar: 'السويس', region: 'canal' },
    { code: 'fayoum', en: 'Fayoum', ar: 'الفيوم', region: 'upper_egypt' },
    { code: 'beni_suef', en: 'Beni Suef', ar: 'بني سويف', region: 'upper_egypt' },
    { code: 'minya', en: 'Minya', ar: 'المنيا', region: 'upper_egypt' },
    { code: 'assiut', en: 'Assiut', ar: 'أسيوط', region: 'upper_egypt' },
    { code: 'sohag', en: 'Sohag', ar: 'سوهاج', region: 'upper_egypt' },
    { code: 'qena', en: 'Qena', ar: 'قنا', region: 'upper_egypt' },
    { code: 'luxor', en: 'Luxor', ar: 'الأقصر', region: 'upper_egypt' },
    { code: 'aswan', en: 'Aswan', ar: 'أسوان', region: 'upper_egypt' },
    { code: 'red_sea', en: 'Red Sea', ar: 'البحر الأحمر', region: 'frontier' },
    { code: 'matrouh', en: 'Matrouh', ar: 'مطروح', region: 'frontier' },
    { code: 'north_sinai', en: 'North Sinai', ar: 'شمال سيناء', region: 'frontier' },
    { code: 'south_sinai', en: 'South Sinai', ar: 'جنوب سيناء', region: 'frontier' },
    { code: 'new_valley', en: 'New Valley', ar: 'الوادي الجديد', region: 'frontier' },
];
