import { useState, useMemo, useCallback } from 'react';
import { Lock, Info, Shield, DollarSign, TrendingDown, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  calculateTaxes,
  formatCurrency,
  formatPercentage,
  parseCurrency,
  type FilingStatus,
  type TaxCalculationResult,
  TAX_CONSTANTS_2025,
} from '@/lib/taxCalculator';

interface CurrencyInputProps {
  id: string;
  label: string;
  tooltip: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function CurrencyInput({ id, label, tooltip, value, onChange, placeholder }: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    onChange(rawValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format on blur
    if (value) {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        onChange(numValue.toString());
      }
    }
  };

  const displayValue = useMemo(() => {
    if (isFocused) return value;
    if (!value) return '';
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('en-US');
  }, [value, isFocused]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-foreground">
        {label}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`tooltip-${id}`}
            >
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs bg-foreground text-background text-xs p-3 rounded-md"
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base">
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder || '0'}
          className="w-full h-12 pl-8 pr-4 text-base bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all tabular-nums"
          data-testid={`input-${id}`}
        />
      </div>
    </div>
  );
}

interface FilingStatusToggleProps {
  value: FilingStatus;
  onChange: (value: FilingStatus) => void;
}

function FilingStatusToggle({ value, onChange }: FilingStatusToggleProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Filing Status</label>
      <div className="bg-muted rounded-lg p-1 flex">
        <button
          type="button"
          onClick={() => onChange('single')}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            value === 'single'
              ? 'bg-foreground text-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="button-filing-single"
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => onChange('married')}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            value === 'married'
              ? 'bg-foreground text-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="button-filing-married"
        >
          Married Filing Jointly
        </button>
      </div>
    </div>
  );
}

interface ResultCardProps {
  title: string;
  subtitle: string;
  amount: number;
  breakdown: { label: string; value: number }[];
  isRecommended?: boolean;
  icon: React.ReactNode;
}

function ResultCard({ title, subtitle, amount, breakdown, isRecommended, icon }: ResultCardProps) {
  const baseClasses = isRecommended
    ? 'bg-gradient-to-br from-[hsl(var(--emerald-50))] to-[hsl(var(--emerald-100))] border-[hsl(var(--emerald-200))]'
    : '';

  return (
    <Card className={`relative ${baseClasses}`} data-testid={`card-${isRecommended ? 'safe-harbor' : 'current-year'}`}>
      {isRecommended && (
        <div className="absolute top-4 right-4">
          <Badge 
            className="bg-[hsl(var(--emerald-600))] text-white border-0 px-3 py-1 text-xs font-medium no-default-hover-elevate no-default-active-elevate"
            data-testid="badge-recommended"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs uppercase tracking-wide font-medium">{subtitle}</span>
        </div>
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span 
            className="text-3xl font-semibold tabular-nums text-foreground"
            data-testid={`amount-${isRecommended ? 'safe-harbor' : 'current-year'}`}
          >
            {formatCurrency(amount)}
          </span>
          <span className="text-sm text-muted-foreground ml-2">/ year</span>
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          {breakdown.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium tabular-nums text-foreground">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface QuarterlyBreakdownProps {
  quarterlyAmount: number;
}

function QuarterlyBreakdown({ quarterlyAmount }: QuarterlyBreakdownProps) {
  const quarters = [
    { label: 'Q1', date: 'Apr 15, 2025' },
    { label: 'Q2', date: 'Jun 16, 2025' },
    { label: 'Q3', date: 'Sep 15, 2025' },
    { label: 'Q4', date: 'Jan 15, 2026' },
  ];

  return (
    <Card data-testid="card-quarterly-breakdown">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          Quarterly Payment Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quarters.map((quarter) => (
            <div
              key={quarter.label}
              className="bg-muted rounded-lg p-4 text-center"
              data-testid={`quarter-${quarter.label.toLowerCase()}`}
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {quarter.label}
              </div>
              <div className="text-lg font-semibold tabular-nums text-foreground">
                {formatCurrency(quarterlyAmount)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{quarter.date}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaxCalculator() {
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  const [priorYearTax, setPriorYearTax] = useState('');
  const [priorYearAGI, setPriorYearAGI] = useState('');
  const [currentYearProfit, setCurrentYearProfit] = useState('');

  const hasAllInputs = priorYearTax && priorYearAGI && currentYearProfit;

  const result = useMemo<TaxCalculationResult | null>(() => {
    if (!hasAllInputs) return null;

    const inputs = {
      filingStatus,
      priorYearTax: parseInt(priorYearTax, 10) || 0,
      priorYearAGI: parseInt(priorYearAGI, 10) || 0,
      currentYearProfit: parseInt(currentYearProfit, 10) || 0,
    };

    return calculateTaxes(inputs);
  }, [filingStatus, priorYearTax, priorYearAGI, currentYearProfit, hasAllInputs]);

  const currentYearBreakdown = useMemo(() => {
    if (!result) return [];
    return [
      { label: 'Self-Employment Tax', value: result.selfEmploymentTax.totalSETax },
      { label: 'Federal Income Tax', value: result.incomeTax.federalIncomeTax },
      { label: 'Total Projected Tax', value: result.currentYearTotalTax },
    ];
  }, [result]);

  const safeHarborBreakdown = useMemo(() => {
    if (!result) return [];
    const priorTax = parseInt(priorYearTax, 10) || 0;
    const multiplierPercent = Math.round(result.safeHarborMultiplier * 100);
    return [
      { label: '2024 Total Tax', value: priorTax },
      { label: `Multiplier (${multiplierPercent}%)`, value: result.safeHarborMinimum },
    ];
  }, [result, priorYearTax]);

  // Determine which card to recommend
  const isSafeHarborRecommended = result && !result.isCurrentYearLower;

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-xs font-medium">100% Private - No Data Stored</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground" data-testid="text-title">
              Safe Harbor 2025 Tax Shield
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Calculate your estimated quarterly tax payments and avoid IRS underpayment penalties
            </p>
          </div>
        </header>

        {/* Input Card */}
        <Card className="shadow-lg" data-testid="card-input">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-medium">
              <Shield className="h-5 w-5 text-primary" />
              Tax Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FilingStatusToggle value={filingStatus} onChange={setFilingStatus} />
            
            <div className="border-t border-border pt-6 space-y-6">
              <CurrencyInput
                id="prior-year-tax"
                label="2024 Total Tax Liability"
                tooltip="Look at Form 1040, Line 24. This is your total tax before payments and credits."
                value={priorYearTax}
                onChange={setPriorYearTax}
                placeholder="e.g., 25,000"
              />
              
              <CurrencyInput
                id="prior-year-agi"
                label="2024 Adjusted Gross Income (AGI)"
                tooltip="Look at Form 1040, Line 11. This determines if you need to pay 100% or 110% of last year's tax."
                value={priorYearAGI}
                onChange={setPriorYearAGI}
                placeholder="e.g., 150,000"
              />
            </div>
            
            <div className="border-t border-border pt-6">
              <CurrencyInput
                id="current-year-profit"
                label="2025 Estimated Net Profit"
                tooltip="Your expected business revenue minus expenses for 2025. This is your self-employment income."
                value={currentYearProfit}
                onChange={setCurrentYearProfit}
                placeholder="e.g., 200,000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Savings Banner */}
            {result.savings > 0 && (
              <div 
                className="bg-gradient-to-r from-[hsl(var(--emerald-50))] to-[hsl(var(--emerald-100))] border border-[hsl(var(--emerald-200))] rounded-lg p-4 flex items-center gap-3"
                data-testid="banner-savings"
              >
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--emerald-600))] flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isSafeHarborRecommended 
                      ? 'Safe Harbor saves you cash flow!' 
                      : 'Current year estimate is lower!'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pay {formatCurrency(result.savings)} less than the alternative
                  </p>
                </div>
              </div>
            )}

            {/* Result Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultCard
                title="What you think you owe"
                subtitle="Based on 2025 Income"
                amount={result.currentYearAvoidanceMinimum}
                breakdown={currentYearBreakdown}
                isRecommended={result.isCurrentYearLower}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <ResultCard
                title="The minimum to avoid fines"
                subtitle="Safe Harbor Amount"
                amount={result.safeHarborMinimum}
                breakdown={safeHarborBreakdown}
                isRecommended={isSafeHarborRecommended}
                icon={<Shield className="h-4 w-4" />}
              />
            </div>

            {/* Quarterly Breakdown */}
            <QuarterlyBreakdown quarterlyAmount={result.quarterlyPayment} />

            {/* Tax Calculation Details */}
            <Card data-testid="card-details">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  2025 Tax Calculation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Self-Employment Tax */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Self-Employment Tax</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Social Security (12.4%)</span>
                        <span className="tabular-nums font-medium">{formatCurrency(result.selfEmploymentTax.socialSecurityTax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Medicare (2.9%)</span>
                        <span className="tabular-nums font-medium">{formatCurrency(result.selfEmploymentTax.medicareTax)}</span>
                      </div>
                      {result.selfEmploymentTax.additionalMedicareTax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Additional Medicare (0.9%)</span>
                          <span className="tabular-nums font-medium">{formatCurrency(result.selfEmploymentTax.additionalMedicareTax)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-border pt-2">
                        <span className="font-medium">Total SE Tax</span>
                        <span className="tabular-nums font-semibold">{formatCurrency(result.selfEmploymentTax.totalSETax)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Income Tax */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Federal Income Tax</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxable Income</span>
                        <span className="tabular-nums font-medium">{formatCurrency(result.incomeTax.taxableIncome)}</span>
                      </div>
                      {result.incomeTax.bracketDetails.slice(0, 3).map((bracket, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-muted-foreground">{formatPercentage(bracket.rate)} Bracket</span>
                          <span className="tabular-nums font-medium">{formatCurrency(bracket.taxAtRate)}</span>
                        </div>
                      ))}
                      {result.incomeTax.bracketDetails.length > 3 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Higher Brackets</span>
                          <span className="tabular-nums font-medium">
                            {formatCurrency(
                              result.incomeTax.bracketDetails
                                .slice(3)
                                .reduce((sum, b) => sum + b.taxAtRate, 0)
                            )}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-border pt-2">
                        <span className="font-medium">Total Income Tax</span>
                        <span className="tabular-nums font-semibold">{formatCurrency(result.incomeTax.federalIncomeTax)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center px-4">
              This calculator provides estimates for informational purposes only and should not be 
              considered tax advice. Consult a qualified tax professional for your specific situation.
              All calculations use projected 2025 tax rates and brackets.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!result && (
          <div 
            className="text-center py-12 text-muted-foreground"
            data-testid="empty-state"
          >
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Enter your tax information above to see your Safe Harbor calculation</p>
          </div>
        )}
      </div>
    </div>
  );
}
