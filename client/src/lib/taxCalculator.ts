// 2026 Tax Year Constants - Updated for Annual Rollover
export const TAX_CONSTANTS_2026 = {
  // Standard Deductions (increased for 2026)
  standardDeduction: {
    single: 16100,
    married: 32200,
  },
  
  // Self-Employment Tax
  socialSecurityWageBase: 184500, // Increased from 176100
  socialSecurityRate: 0.124, // 12.4%
  medicareRate: 0.029, // 2.9%
  additionalMedicareRate: 0.009, // 0.9%
  additionalMedicareThreshold: {
    single: 200000,
    married: 250000,
  },
  
  // Self-employment tax deduction (half of SE tax is deductible)
  seTaxDeductionRate: 0.5,
  
  // Safe Harbor thresholds
  safeHarborHighIncomeThreshold: 150000,
  safeHarborHighIncomeMultiplier: 1.1, // 110%
  safeHarborStandardMultiplier: 1.0, // 100%
  currentYearAvoidanceMultiplier: 0.9, // 90%
} as const;

// 2026 Income Tax Brackets (adjusted for inflation)
export const TAX_BRACKETS_2026 = {
  single: [
    { min: 0, max: 12250, rate: 0.10 },
    { min: 12251, max: 49850, rate: 0.12 },
    { min: 49851, max: 106350, rate: 0.22 },
    { min: 106351, max: 203000, rate: 0.24 },
    { min: 203001, max: 257500, rate: 0.32 },
    { min: 257501, max: 644050, rate: 0.35 },
    { min: 644051, max: Infinity, rate: 0.37 },
  ],
  married: [
    { min: 0, max: 24500, rate: 0.10 },
    { min: 24501, max: 99700, rate: 0.12 },
    { min: 99701, max: 212700, rate: 0.22 },
    { min: 212701, max: 406000, rate: 0.24 },
    { min: 406001, max: 515000, rate: 0.32 },
    { min: 515001, max: 773000, rate: 0.35 },
    { min: 773001, max: Infinity, rate: 0.37 },
  ],
} as const;

export type FilingStatus = 'single' | 'married';

export interface TaxInputs {
  filingStatus: FilingStatus;
  priorYearTax: number;
  priorYearAGI: number;
  currentYearProfit: number;
}

export interface SelfEmploymentTaxBreakdown {
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicareTax: number;
  totalSETax: number;
  seTaxDeduction: number;
}

export interface IncomeTaxBreakdown {
  taxableIncome: number;
  federalIncomeTax: number;
  bracketDetails: { rate: number; taxableAtRate: number; taxAtRate: number }[];
}

export interface TaxCalculationResult {
  // Current Year Calculation
  selfEmploymentTax: SelfEmploymentTaxBreakdown;
  incomeTax: IncomeTaxBreakdown;
  currentYearTotalTax: number;
  currentYearAvoidanceMinimum: number;
  
  // Safe Harbor Calculation
  safeHarborMultiplier: number;
  safeHarborMinimum: number;
  
  // Final Result
  requiredAnnualPayment: number;
  quarterlyPayment: number;
  
  // Which option is recommended
  isCurrentYearLower: boolean;
  savings: number;
}

/**
 * Calculate Self-Employment Tax
 */
export function calculateSelfEmploymentTax(
  netProfit: number,
  filingStatus: FilingStatus
): SelfEmploymentTaxBreakdown {
  // SE tax is calculated on 92.35% of net profit
  const seTaxableEarnings = netProfit * 0.9235;
  
  // Social Security Tax (12.4% on earnings up to wage base)
  const socialSecurityTaxable = Math.min(seTaxableEarnings, TAX_CONSTANTS_2026.socialSecurityWageBase);
  const socialSecurityTax = socialSecurityTaxable * TAX_CONSTANTS_2026.socialSecurityRate;
  
  // Medicare Tax (2.9% on all earnings)
  const medicareTax = seTaxableEarnings * TAX_CONSTANTS_2026.medicareRate;
  
  // Additional Medicare Tax (0.9% on earnings over threshold)
  const additionalMedicareThreshold = TAX_CONSTANTS_2026.additionalMedicareThreshold[filingStatus];
  const additionalMedicareTaxable = Math.max(0, seTaxableEarnings - additionalMedicareThreshold);
  const additionalMedicareTax = additionalMedicareTaxable * TAX_CONSTANTS_2026.additionalMedicareRate;
  
  const totalSETax = socialSecurityTax + medicareTax + additionalMedicareTax;
  
  // Half of SE tax is deductible from income
  const seTaxDeduction = totalSETax * TAX_CONSTANTS_2026.seTaxDeductionRate;
  
  return {
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    totalSETax,
    seTaxDeduction,
  };
}

/**
 * Calculate Federal Income Tax using progressive brackets
 */
export function calculateIncomeTax(
  netProfit: number,
  seTaxDeduction: number,
  filingStatus: FilingStatus
): IncomeTaxBreakdown {
  const standardDeduction = TAX_CONSTANTS_2026.standardDeduction[filingStatus];
  const brackets = TAX_BRACKETS_2026[filingStatus];
  
  // AGI = Net Profit - Half of SE Tax
  const agi = netProfit - seTaxDeduction;
  
  // Taxable Income = AGI - Standard Deduction
  const taxableIncome = Math.max(0, agi - standardDeduction);
  
  let remainingIncome = taxableIncome;
  let totalTax = 0;
  const bracketDetails: { rate: number; taxableAtRate: number; taxAtRate: number }[] = [];
  
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    
    const bracketSize = bracket.max - bracket.min + 1;
    const taxableAtRate = Math.min(remainingIncome, bracketSize);
    const taxAtRate = taxableAtRate * bracket.rate;
    
    if (taxableAtRate > 0) {
      bracketDetails.push({
        rate: bracket.rate,
        taxableAtRate,
        taxAtRate,
      });
    }
    
    totalTax += taxAtRate;
    remainingIncome -= taxableAtRate;
  }
  
  return {
    taxableIncome,
    federalIncomeTax: totalTax,
    bracketDetails,
  };
}

/**
 * Calculate Safe Harbor minimum payment
 */
export function calculateSafeHarbor(
  priorYearTax: number,
  priorYearAGI: number
): { safeHarborMinimum: number; multiplier: number } {
  const multiplier = priorYearAGI > TAX_CONSTANTS_2026.safeHarborHighIncomeThreshold
    ? TAX_CONSTANTS_2026.safeHarborHighIncomeMultiplier
    : TAX_CONSTANTS_2026.safeHarborStandardMultiplier;
  
  return {
    safeHarborMinimum: priorYearTax * multiplier,
    multiplier,
  };
}

/**
 * Main calculation function - computes everything
 */
export function calculateTaxes(inputs: TaxInputs): TaxCalculationResult {
  const { filingStatus, priorYearTax, priorYearAGI, currentYearProfit } = inputs;
  
  // Calculate Self-Employment Tax
  const selfEmploymentTax = calculateSelfEmploymentTax(currentYearProfit, filingStatus);
  
  // Calculate Income Tax
  const incomeTax = calculateIncomeTax(
    currentYearProfit,
    selfEmploymentTax.seTaxDeduction,
    filingStatus
  );
  
  // Total Current Year Tax
  const currentYearTotalTax = selfEmploymentTax.totalSETax + incomeTax.federalIncomeTax;
  
  // Current Year Avoidance Minimum (90% of projected tax)
  const currentYearAvoidanceMinimum = currentYearTotalTax * TAX_CONSTANTS_2026.currentYearAvoidanceMultiplier;
  
  // Safe Harbor Calculation
  const { safeHarborMinimum, multiplier: safeHarborMultiplier } = calculateSafeHarbor(
    priorYearTax,
    priorYearAGI
  );
  
  // Required payment is the LESSER of the two
  const requiredAnnualPayment = Math.min(safeHarborMinimum, currentYearAvoidanceMinimum);
  const quarterlyPayment = requiredAnnualPayment / 4;
  
  // Determine which is lower for recommendation
  const isCurrentYearLower = currentYearAvoidanceMinimum < safeHarborMinimum;
  const savings = Math.abs(safeHarborMinimum - currentYearAvoidanceMinimum);
  
  return {
    selfEmploymentTax,
    incomeTax,
    currentYearTotalTax,
    currentYearAvoidanceMinimum,
    safeHarborMultiplier,
    safeHarborMinimum,
    requiredAnnualPayment,
    quarterlyPayment,
    isCurrentYearLower,
    savings,
  };
}

/**
 * Format number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Format number as currency with cents
 */
export function formatCurrencyWithCents(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
