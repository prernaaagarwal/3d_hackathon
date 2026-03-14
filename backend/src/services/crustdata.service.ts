import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const CRUSTDATA_BASE_URL = 'https://api.crustdata.com';

interface CrustdataCompanyProfile {
  name: string;
  domain: string | null;
  headcount: number | null;
  headcountGrowth6m: number | null;
  headcountGrowth1y: number | null;
  headcountGrowth2y: number | null;
  industry: string | null;
  founded: string | null;
  location: string | null;
  linkedin_url: string | null;
  description: string | null;
  specialties: string[];
  companyType: string | null;
  employeeCountRange: string | null;
  revenueRange: { min: string | null; max: string | null } | null;
  headquartersCity: string | null;
  headquartersCountry: string | null;
  logoUrl: string | null;
  hiring_roles: string[];
  recent_news: string[];
  funding_total: number | null;
  funding_stage: string | null;
}

/** Crustdata API response types */
interface CrustdataGrowthEntry {
  timespan: string;
  percentage: number;
}

interface CrustdataRevenueAmount {
  amount: number;
  unit: string;
  currencyCode: string;
}

interface CrustdataHeadquarters {
  country?: string;
  geographicArea?: string;
  city?: string;
  line1?: string;
}

interface CrustdataSearchCompany {
  name?: string;
  description?: string;
  linkedin_company_url?: string;
  website?: string;
  industry?: string;
  company_type?: string;
  founded_year?: number;
  location?: string;
  headquarters?: CrustdataHeadquarters;
  employee_count?: number;
  employee_count_range?: string;
  employee_growth_percentages?: CrustdataGrowthEntry[];
  specialties?: string[];
  revenue_range?: {
    estimatedMinRevenue?: CrustdataRevenueAmount;
    estimatedMaxRevenue?: CrustdataRevenueAmount;
  };
  decision_makers_count?: string;
  logo_urls?: Record<string, string>;
}

interface CrustdataSearchResponse {
  companies?: CrustdataSearchCompany[];
  total_display_count?: number;
}

interface CrustdataJobOpening {
  title?: string;
  job_title?: string;
}

interface CrustdataNewsArticle {
  title?: string;
  headline?: string;
}

interface CrustdataEnrichmentResponse {
  company_name?: string;
  job_openings?: CrustdataJobOpening[];
  news_articles?: CrustdataNewsArticle[];
  headcount?: { headcount?: number };
  total_funding_usd?: number;
  last_funding_round_type?: string;
}

/**
 * Crustdata API client for B2B company intelligence.
 * Docs: https://docs.crustdata.com/docs/discover/company-data-api
 *
 * Two-step flow:
 * 1. POST /screener/company/search — find company by name (filter: KEYWORD)
 * 2. GET  /screener/company       — enrich with jobs & news (by domain)
 */
export const crustdataService = {
  /** Build auth headers for Crustdata (uses "Token" scheme, not Bearer) */
  getHeaders(): Record<string, string> {
    return {
      'Authorization': `Token ${env.CRUSTDATA_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  },

  /**
   * Step 1: Search for a company by name using the Company Search API
   */
  async searchCompany(companyName: string): Promise<CrustdataSearchCompany | null> {
    const response = await fetch(`${CRUSTDATA_BASE_URL}/screener/company/search`, {
      method: 'POST',
      headers: crustdataService.getHeaders(),
      body: JSON.stringify({
        filters: [
          {
            filter_type: 'KEYWORD',
            type: 'in',
            value: [companyName],
          },
        ],
        page: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Crustdata search API error', {
        status: response.status,
        body: errorText,
      });
      throw new Error(`Crustdata search failed: ${response.status} — ${errorText}`);
    }

    const data = (await response.json()) as CrustdataSearchResponse;
    return data.companies?.[0] ?? null;
  },

  /**
   * Step 2: Enrich a company by domain for jobs & news
   */
  async enrichCompany(domain: string): Promise<CrustdataEnrichmentResponse | null> {
    const url = `${CRUSTDATA_BASE_URL}/screener/company?company_domain=${encodeURIComponent(domain)}&fields=job_openings,news_articles,headcount,total_funding_usd,last_funding_round_type`;
    const response = await fetch(url, {
      method: 'GET',
      headers: crustdataService.getHeaders(),
    });

    if (!response.ok) {
      logger.warn('Crustdata enrichment API error', { status: response.status, domain });
      return null; // Non-fatal — we still have search data
    }

    return (await response.json()) as CrustdataEnrichmentResponse;
  },

  /**
   * Main method: search + enrich a company by name
   */
  async getCompanyProfile(companyName: string): Promise<CrustdataCompanyProfile> {
    if (!env.CRUSTDATA_API_KEY) {
      logger.warn('Crustdata API key not configured, returning mock data');
      return crustdataService.getMockProfile(companyName);
    }

    try {
      // Step 1: Search for the company
      const company = await crustdataService.searchCompany(companyName);

      if (!company) {
        throw new AppError(
          `Developer "${companyName}" not found in Crustdata`,
          404,
          'DEVELOPER_NOT_FOUND',
        );
      }

      // Extract domain from website URL (strip protocol, www., and trailing path)
      const domain = company.website
        ? company.website.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
        : null;

      // Extract growth percentages
      const growthEntries = company.employee_growth_percentages ?? [];
      const growth6m = growthEntries.find((g) => g.timespan === 'SIX_MONTHS')?.percentage ?? null;
      const growth1y = growthEntries.find((g) => g.timespan === 'YEAR')?.percentage ?? null;
      const growth2y = growthEntries.find((g) => g.timespan === 'TWO_YEAR')?.percentage ?? null;

      // Format revenue
      const formatRevenue = (rev?: CrustdataRevenueAmount): string | null => {
        if (!rev) return null;
        return `${rev.amount} ${rev.unit} ${rev.currencyCode}`;
      };

      // Step 2: Enrich with jobs & news (non-fatal if fails)
      let enrichment: CrustdataEnrichmentResponse | null = null;
      if (domain) {
        try {
          enrichment = await crustdataService.enrichCompany(domain);
        } catch (enrichError) {
          logger.warn('Crustdata enrichment failed, continuing with search data', {
            error: String(enrichError),
          });
        }
      }

      // Extract hiring roles from job openings
      const hiringRoles: string[] = (enrichment?.job_openings ?? [])
        .map((j) => j.title ?? j.job_title ?? '')
        .filter(Boolean)
        .slice(0, 10);

      // Extract news titles
      const recentNews: string[] = (enrichment?.news_articles ?? [])
        .map((n) => n.title ?? n.headline ?? '')
        .filter(Boolean)
        .slice(0, 5);

      return {
        name: company.name ?? companyName,
        domain,
        headcount: enrichment?.headcount?.headcount ?? company.employee_count ?? null,
        headcountGrowth6m: growth6m,
        headcountGrowth1y: growth1y,
        headcountGrowth2y: growth2y,
        industry: company.industry ?? null,
        founded: company.founded_year?.toString() ?? null,
        location: company.location ?? null,
        linkedin_url: company.linkedin_company_url ?? null,
        description: company.description ?? null,
        specialties: company.specialties ?? [],
        companyType: company.company_type ?? null,
        employeeCountRange: company.employee_count_range ?? null,
        revenueRange: company.revenue_range
          ? {
              min: formatRevenue(company.revenue_range.estimatedMinRevenue),
              max: formatRevenue(company.revenue_range.estimatedMaxRevenue),
            }
          : null,
        headquartersCity: company.headquarters?.city ?? null,
        headquartersCountry: company.headquarters?.country ?? null,
        logoUrl: company.logo_urls?.['400x400'] ?? company.logo_urls?.['200x200'] ?? null,
        hiring_roles: hiringRoles,
        recent_news: recentNews,
        funding_total: enrichment?.total_funding_usd ?? null,
        funding_stage: enrichment?.last_funding_round_type ?? null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Crustdata API call failed', { error: String(error) });
      logger.warn('Falling back to mock Crustdata data');
      return crustdataService.getMockProfile(companyName);
    }
  },

  /**
   * Mock profile for development/demo when Crustdata API key is unavailable
   */
  getMockProfile(companyName: string): CrustdataCompanyProfile {
    return {
      name: companyName,
      domain: `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      headcount: Math.floor(Math.random() * 5000) + 500,
      headcountGrowth6m: Math.round((Math.random() * 20 - 5) * 100) / 100,
      headcountGrowth1y: Math.round((Math.random() * 30 - 5) * 100) / 100,
      headcountGrowth2y: Math.round((Math.random() * 40 - 5) * 100) / 100,
      industry: 'Real Estate Development',
      founded: `${2000 + Math.floor(Math.random() * 15)}`,
      location: 'Dubai, UAE',
      linkedin_url: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
      description: `${companyName} is a leading real estate developer in the UAE market.`,
      specialties: ['Real Estate Development', 'Luxury Properties', 'Commercial Real Estate'],
      companyType: 'Privately Held',
      employeeCountRange: '1,001-5,000',
      revenueRange: { min: '500 MILLION USD', max: '1 BILLION USD' },
      headquartersCity: 'Dubai',
      headquartersCountry: 'United Arab Emirates',
      logoUrl: null,
      hiring_roles: ['Project Manager', 'Senior Architect', 'Sales Director', 'Site Engineer', 'Marketing Manager'],
      recent_news: [
        `${companyName} announces new luxury waterfront project in Dubai Marina`,
        `${companyName} reports 15% revenue growth in Q4 2025`,
        `${companyName} partners with global design firm for upcoming development`,
      ],
      funding_total: Math.floor(Math.random() * 500000000) + 50000000,
      funding_stage: 'Established',
    };
  },
};

