export interface AdBanner {
    id: string | number;
    ad_type: string;
    banner_url: string;
    target_url: string;
    start_date?: string;
    end_date: string;
    ranking: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface AdBannerFormData {
    ad_type: string;
    banner_url: string;
    target_url: string;
    end_date: string;
    ranking: number;
    is_active: boolean;
}
