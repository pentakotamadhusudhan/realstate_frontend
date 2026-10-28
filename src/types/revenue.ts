export type ServiceCategory = 'BUILDER' | 'AGENT' | 'ADVERTISING' | 'CUSTOMER';

export type ServiceCode =
  // 1. Builders & Developers
  | 'BUILDER_TIERED_SUBSCRIPTIONS'
  | 'BUILDER_LIFETIME_VERIFICATION'
  | 'BUILDER_UNLIMITED_PORTFOLIO'
  | 'BUILDER_BUYER_ANALYTICS'
  // 2. Agents & Mediators
  | 'AGENT_ONBOARDING_FEE'
  | 'AGENT_BASIC_PLAN'
  | 'AGENT_PAY_PER_LEAD'
  | 'AGENT_TIER_UPGRADES'
  // 3. Advertising & Promotional Services
  | 'ADS_FEATURED_BANNER_SEC1'
  | 'ADS_PRIORITY_BANNER'
  | 'ADS_RECOMMENDED_SPONSORED'
  | 'ADS_SECONDARY_BANNER_SEC2'
  | 'ADS_VENTURES_PAGE_ADS'
  // 4. Customer Services & Premium Features
  | 'CUSTOMER_ADVANCED_SEARCH'
  | 'CUSTOMER_PROXIMITY_ANALYTICS'
  | 'CUSTOMER_EXTENDED_HOLD'
  | 'CUSTOMER_DATA_PRIVACY';

export interface PlatformRevenueService {
  id: string;
  code: ServiceCode;
  name: string;
  category: ServiceCategory;
  description: string;
  is_enabled: boolean;
  config: Record<string, any>;
  updated_by?: string | null;
  updated_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

// 1. Builders & Developers
export interface BuilderVerification {
  id: string;
  builder: string;
  builder_name?: string;
  builder_email?: string;
  company_name: string;
  license_number?: string;
  rera_number?: string;
  document_url?: string;
  fee_paid: string | number;
  payment_reference?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VentureVisitorAnalytics {
  id: string;
  venture: string;
  plot?: string | null;
  visitor?: string | null;
  visitor_email?: string | null;
  action_type: 'VENTURE_VIEW' | 'PLOT_VIEW' | 'INQUIRY_INTENT' | 'HOLD_ATTEMPT';
  session_id?: string;
  ip_address?: string;
  created_at: string;
}

export interface BuyerLeadInfo {
  query_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  status: string;
  message?: string;
  preferred_call_time?: string;
  is_contact_masked: boolean;
  created_at: string;
}

export interface BuilderVentureAnalyticsResponse {
  venture: string;
  slug: string;
  metrics: {
    total_views: number;
    plot_views: number;
    unique_visitors: number;
    total_inquiries: number;
    active_holds: number;
    converted_sales: number;
  };
  prospective_buyers: BuyerLeadInfo[];
}

// 2. Agents & Mediators
export interface AgentOnboardingPayment {
  id: string;
  agent: string;
  agent_name?: string;
  agent_email?: string;
  amount: string | number;
  transaction_reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface LeadPackage {
  id: string;
  name: string;
  credits: number;
  price: string | number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface LeadCreditTransaction {
  id: string;
  transaction_type: 'PURCHASE' | 'UNLOCK' | 'BONUS' | 'REFUND';
  credits: number;
  package?: string | null;
  call_query?: string | null;
  description: string;
  created_at: string;
}

export interface AgentLeadWallet {
  agent: string;
  agent_name: string;
  agent_email: string;
  credits_balance: number;
  total_purchased: number;
  total_spent: number;
  updated_at: string;
  recent_transactions: LeadCreditTransaction[];
}

// 3. Advertising & Promotional Services
export type PromotionSectionType =
  | 'SECTION_1'
  | 'PRIORITY_BANNER'
  | 'RECOMMENDED_SPONSORED'
  | 'SECTION_2'
  | 'VENTURES_PAGE_ADS';

export interface PromotionalPlacement {
  id: string;
  advertiser: string;
  advertiser_name?: string;
  advertiser_email?: string;
  title: string;
  section: PromotionSectionType;
  banner_image_url?: string;
  target_url?: string;
  sponsored_venture?: string | null;
  sponsored_venture_name?: string | null;
  target_city?: string;
  ranking: number;
  is_active: boolean;
  is_approved: boolean;
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at: string;
}

export interface SponsoredVentureCard {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  center_latitude: string;
  center_longitude: string;
  total_plots: number;
  is_sponsored: boolean;
  ad_title?: string;
  ranking?: number;
}

export interface SponsoredVenturesResponse {
  section: string;
  city: string;
  sponsored_count: number;
  organic_count: number;
  display_grid: SponsoredVentureCard[];
}

// 4. Customer Services & Premium Features
export type ProximityCategoryType =
  | 'TRANSIT_HUB'
  | 'COMMERCIAL_ZONE'
  | 'PUBLIC_AMENITY'
  | 'AIRPORT'
  | 'RAILWAY_STATION'
  | 'METRO_STATION'
  | 'HIGHWAY'
  | 'IT_CORRIDOR'
  | 'HOSPITAL'
  | 'SCHOOL';

export interface VentureProximityPoint {
  id: string;
  venture: string;
  category: ProximityCategoryType;
  category_display?: string;
  name: string;
  distance_km: string | number;
  travel_time_mins: number;
  notes?: string;
  created_at: string;
}

export interface PlotHoldExtension {
  id: string;
  hold: string;
  plot_number?: string;
  venture_name?: string;
  customer: string;
  customer_email?: string;
  extended_hours: number;
  fee_paid: string | number;
  previous_expiry: string;
  new_expiry: string;
  notes?: string;
  created_at: string;
}

export interface AdvancedVentureSearchResult {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  posted_by: 'BUILDER' | 'AGENT';
  creator_name: string;
  has_lifetime_verification: boolean;
  total_plots: number;
  created_at: string;
}
