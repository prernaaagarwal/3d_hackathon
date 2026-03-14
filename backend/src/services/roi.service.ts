import { createUserClient } from '../config/supabase';
import { RoiCalculation } from '../types/models.types';

interface RoiInput {
  purchase_price: number;
  annual_rent: number;
  service_charge?: number;
  has_mortgage?: boolean;
  down_payment_pct?: number;
  mortgage_rate_pct?: number;
  mortgage_term_years?: number;
  holding_period_years?: number;
  appreciation_rate_pct?: number;
  property_id?: string;
}

interface RoiResult {
  gross_yield: number;
  net_yield: number;
  monthly_cashflow: number;
  irr_5yr: number;
  irr_10yr: number;
  annual_expenses: number;
  annual_mortgage_payment: number;
  cashflow_projection: { year: number; cashflow: number; propertyValue: number; equity: number }[];
}

/**
 * Calculate annual mortgage payment using standard amortization formula
 */
const calculateAnnualMortgage = (
  principal: number,
  annualRate: number,
  termYears: number
): number => {
  if (annualRate === 0) return principal / termYears;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  return monthlyPayment * 12;
};

/**
 * Simple IRR approximation using Newton's method
 */
const calculateIrr = (cashflows: number[], guess = 0.1): number => {
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let j = 0; j < cashflows.length; j++) {
      npv += cashflows[j] / Math.pow(1 + rate, j);
      dnpv -= j * cashflows[j] / Math.pow(1 + rate, j + 1);
    }
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-7) return newRate * 100;
    rate = newRate;
  }
  return rate * 100;
};

export const roiService = {
  calculate(input: RoiInput): RoiResult {
    const serviceCharge = input.service_charge ?? 0;
    const holdingYears = input.holding_period_years ?? 5;
    const appreciationRate = (input.appreciation_rate_pct ?? 5) / 100;

    // Gross yield
    const grossYield = (input.annual_rent / input.purchase_price) * 100;

    // Net yield (after service charge)
    const annualExpenses = serviceCharge;
    const netIncome = input.annual_rent - annualExpenses;
    const netYield = (netIncome / input.purchase_price) * 100;

    // Mortgage
    let annualMortgagePayment = 0;
    let loanAmount = 0;
    if (input.has_mortgage && input.down_payment_pct && input.mortgage_rate_pct && input.mortgage_term_years) {
      const downPayment = input.purchase_price * (input.down_payment_pct / 100);
      loanAmount = input.purchase_price - downPayment;
      annualMortgagePayment = calculateAnnualMortgage(loanAmount, input.mortgage_rate_pct, input.mortgage_term_years);
    }

    // Monthly cashflow
    const monthlyCashflow = (netIncome - annualMortgagePayment) / 12;

    // Cashflow projection
    const cashflowProjection = [];
    const initialInvestment = input.has_mortgage
      ? input.purchase_price * ((input.down_payment_pct ?? 100) / 100)
      : input.purchase_price;

    const irrCashflows5 = [-initialInvestment];
    const irrCashflows10 = [-initialInvestment];

    for (let year = 1; year <= Math.max(holdingYears, 10); year++) {
      const propertyValue = input.purchase_price * Math.pow(1 + appreciationRate, year);
      const annualCashflow = netIncome - annualMortgagePayment;
      const equity = propertyValue - Math.max(0, loanAmount - (loanAmount / (input.mortgage_term_years ?? 1)) * year);

      if (year <= holdingYears) {
        cashflowProjection.push({ year, cashflow: annualCashflow, propertyValue, equity });
      }

      if (year < 5) irrCashflows5.push(annualCashflow);
      else if (year === 5) irrCashflows5.push(annualCashflow + propertyValue - loanAmount);

      if (year < 10) irrCashflows10.push(annualCashflow);
      else if (year === 10) irrCashflows10.push(annualCashflow + propertyValue - loanAmount);
    }

    const irr5yr = calculateIrr(irrCashflows5);
    const irr10yr = calculateIrr(irrCashflows10);

    return {
      gross_yield: Math.round(grossYield * 100) / 100,
      net_yield: Math.round(netYield * 100) / 100,
      monthly_cashflow: Math.round(monthlyCashflow),
      irr_5yr: Math.round(irr5yr * 100) / 100,
      irr_10yr: Math.round(irr10yr * 100) / 100,
      annual_expenses: annualExpenses,
      annual_mortgage_payment: Math.round(annualMortgagePayment),
      cashflow_projection: cashflowProjection,
    };
  },

  async save(token: string, userId: string, input: RoiInput, result: RoiResult) {
    const supabase = createUserClient(token);
    const { data, error } = await supabase
      .from('roi_calculations')
      .insert({
        user_id: userId,
        property_id: input.property_id ?? null,
        purchase_price: input.purchase_price,
        annual_rent: input.annual_rent,
        service_charge: input.service_charge ?? 0,
        has_mortgage: input.has_mortgage ?? false,
        down_payment_pct: input.down_payment_pct ?? null,
        mortgage_rate_pct: input.mortgage_rate_pct ?? null,
        mortgage_term_years: input.mortgage_term_years ?? null,
        holding_period_years: input.holding_period_years ?? 5,
        appreciation_rate_pct: input.appreciation_rate_pct ?? 5,
        gross_yield: result.gross_yield,
        net_yield: result.net_yield,
        monthly_cashflow: result.monthly_cashflow,
        irr_5yr: result.irr_5yr,
        irr_10yr: result.irr_10yr,
      })
      .select()
      .single();

    if (error) throw error;
    return data as RoiCalculation;
  },

  async getHistory(token: string, userId: string) {
    const supabase = createUserClient(token);
    const { data, error } = await supabase
      .from('roi_calculations')
      .select('*, properties(address, area)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  },
};

