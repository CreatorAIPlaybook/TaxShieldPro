// 2025 Tax Year Constants - EXACT values from specification
export const TAX_CONSTANTS_2025 = {
  // Standard Deductions
  standardDeduction: {
    single: 15750,
    married: 31500,
  },
  
  // Self-Employment Tax
  socialSecurityWageBase: 176100,
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

// 2025 Income Tax Brackets
export const TAX_BRACKETS_2025 = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11926, max: 48475, rate: 0.12 },
    { min: 48476, max: 103350, rate: 0.22 },
    { min: 103351, max: 197300, rate: 0.24 },
    { min: 197301, max: 250525, rate: 0.32 },
    { min: 250526, max: 626350, rate: 0.35 },
    { min: 626351, max: Infinity, rate: 0.37 },
  ],
  married: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23851, max: 96950, rate: 0.12 },
    { min: 96951, max: 206700, rate: 0.22 },
    { min: 206701, max: 394600, rate: 0.24 },
    { min: 394601, max: 501050, rate: 0.32 },
    { min: 501051, max: 751600, rate: 0.35 },
    { min: 751601, max: Infinity, rate: 0.37 },
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
  const socialSecurityTaxable = Math.min(seTaxableEarnings, TAX_CONSTANTS_2025.socialSecurityWageBase);
  const socialSecurityTax = socialSecurityTaxable * TAX_CONSTANTS_2025.socialSecurityRate;
  
  // Medicare Tax (2.9% on all earnings)
  const medicareTax = seTaxableEarnings * TAX_CONSTANTS_2025.medicareRate;
  
  // Additional Medicare Tax (0.9% on earnings over threshold)
  const additionalMedicareThreshold = TAX_CONSTANTS_2025.additionalMedicareThreshold[filingStatus];
  const additionalMedicareTaxable = Math.max(0, seTaxableEarnings - additionalMedicareThreshold);
  const additionalMedicareTax = additionalMedicareTaxable * TAX_CONSTANTS_2025.additionalMedicareRate;
  
  const totalSETax = socialSecurityTax + medicareTax + additionalMedicareTax;
  
  // Half of SE tax is deductible from income
  const seTaxDeduction = totalSETax * TAX_CONSTANTS_2025.seTaxDeductionRate;
  
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
  const standardDeduction = TAX_CONSTANTS_2025.standardDeduction[filingStatus];
  const brackets = TAX_BRACKETS_2025[filingStatus];
  
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
  const multiplier = priorYearAGI > TAX_CONSTANTS_2025.safeHarborHighIncomeThreshold
    ? TAX_CONSTANTS_2025.safeHarborHighIncomeMultiplier
    : TAX_CONSTANTS_2025.safeHarborStandardMultiplier;
  
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
  const currentYearAvoidanceMinimum = currentYearTotalTax * TAX_CONSTANTS_2025.currentYearAvoidanceMultiplier;
  
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
