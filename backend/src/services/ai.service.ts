import { gemini, GEMINI_MODEL } from '../config/gemini';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

interface PropertyDescriptionInput {
  address: string;
  area: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  priceAed: number;
  annualRentAed?: number;
}

interface RoiNarrativeInput {
  area: string;
  purchasePrice: number;
  annualRent: number;
  grossYield: number;
  netYield: number;
  monthlyCashflow: number;
  irr5yr: number;
  irr10yr: number;
  holdingPeriodYears: number;
  appreciationRatePct: number;
  hasMortgage: boolean;
}

interface DeveloperReportInput {
  developerName: string;
  crustdataProfile: Record<string, unknown>;
}

export const aiService = {
  async generatePropertyDescription(property: PropertyDescriptionInput): Promise<string> {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Generate a property listing description for this Dubai property:
Address: ${property.address}
Area: ${property.area}
Type: ${property.propertyType}
Bedrooms: ${property.bedrooms} | Bathrooms: ${property.bathrooms}
Size: ${property.sqft} sqft
Price: AED ${property.priceAed.toLocaleString()}
${property.annualRentAed ? `Annual Rent: AED ${property.annualRentAed.toLocaleString()}` : ''}`,
        config: {
          systemInstruction: `You are a luxury Dubai real estate copywriter. Write a compelling 150-250 word property description. Be specific to the area and property type. Highlight key selling points (location, views, finishes, lifestyle, investment potential). Tone: confident, aspirational, professional. Do not use generic filler. Every sentence must add value. Do not include the price or address — those are shown separately in the UI.`,
          temperature: 0.8,
          maxOutputTokens: 512,
        },
      });

      return response.text ?? '';
    } catch (error) {
      logger.error('Gemini property description generation failed', { error: String(error) });
      throw new AppError('Failed to generate property description', 500, 'AI_GENERATION_FAILED');
    }
  },

  async generateRoiNarrative(roi: RoiNarrativeInput): Promise<string> {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Generate an investment analysis narrative for this Dubai property:
Area: ${roi.area}
Purchase Price: AED ${roi.purchasePrice.toLocaleString()}
Annual Rent: AED ${roi.annualRent.toLocaleString()}
Gross Yield: ${roi.grossYield.toFixed(2)}%
Net Yield: ${roi.netYield.toFixed(2)}%
Monthly Cashflow: AED ${roi.monthlyCashflow.toLocaleString()}
5-Year IRR: ${roi.irr5yr.toFixed(2)}%
10-Year IRR: ${roi.irr10yr.toFixed(2)}%
Holding Period: ${roi.holdingPeriodYears} years
Capital Appreciation Rate: ${roi.appreciationRatePct}%
Has Mortgage: ${roi.hasMortgage ? 'Yes' : 'No'}`,
        config: {
          systemInstruction: `You are a Dubai real estate investment analyst. Write a 2-3 paragraph (100-200 words) objective investment summary for a non-technical investor. Include: whether yield is competitive for the area, cashflow timeline, key risk factors (vacancy, rate sensitivity), and overall investment quality. Tone: data-driven and objective like an analyst briefing — not salesy. Use specific numbers from the data provided.`,
          temperature: 0.6,
          maxOutputTokens: 512,
        },
      });

      return response.text ?? '';
    } catch (error) {
      logger.error('Gemini ROI narrative generation failed', { error: String(error) });
      throw new AppError('Failed to generate ROI narrative', 500, 'AI_GENERATION_FAILED');
    }
  },

  async generateDeveloperReport(input: DeveloperReportInput): Promise<string> {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Generate an institutional-grade developer due diligence report for:

Developer: ${input.developerName}

B2B Intelligence Data:
${JSON.stringify(input.crustdataProfile, null, 2)}

Provide a structured report covering:
1. Company Overview & Scale
2. Growth Trajectory (headcount trends, hiring momentum)
3. Financial Health Indicators
4. Key Risk Factors
5. Overall Assessment (Buy / Hold / Caution rating with reasoning)`,
        config: {
          systemInstruction: `You are a senior real estate investment analyst at a top-tier consultancy. Generate a structured, institutional-grade developer due diligence report. Use formal, analytical language. Every claim must reference the provided data. Include a clear Buy/Hold/Caution recommendation. Format with clear headers and bullet points. Be objective — highlight both strengths and risks.`,
          temperature: 0.5,
          maxOutputTokens: 1500,
        },
      });

      return response.text ?? '';
    } catch (error) {
      logger.error('Gemini developer report generation failed', { error: String(error) });
      throw new AppError('Failed to generate developer report', 500, 'AI_GENERATION_FAILED');
    }
  },
};

