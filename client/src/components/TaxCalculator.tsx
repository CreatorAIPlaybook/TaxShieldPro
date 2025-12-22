import { useState, useMemo, useCallback } from 'react';
import { Lock, Info, Shield, DollarSign, TrendingDown, Calendar, CheckCircle, RotateCcw, ChevronDown, Calculator, ShieldCheck, AlertTriangle, Download, FileText, ExternalLink, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverTrigger,
  PopoverContentInstant,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AFFILIATE_LINKS } from '../lib/constants';
import {
  calculateTaxes,
  formatCurrency,
  formatPercentage,
  parseCurrency,
  type FilingStatus,
  type TaxCalculationResult,
  TAX_CONSTANTS_2025,
} from '@/lib/taxCalculator';
import { useLocalStorage, clearTaxCalculatorStorage } from '@/hooks/useLocalStorage';
import { generateTaxSummaryPDF, generate1040ESVouchers, generateLeadMagnetPDF } from '@/lib/pdfExport';

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
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`tooltip-${id}`}
            >
              <Info className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContentInstant
            side="top"
            className="max-w-xs bg-foreground text-background text-xs p-3"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {tooltip}
          </PopoverContentInstant>
        </Popover>
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
    <Card className={baseClasses} data-testid={`card-${isRecommended ? 'safe-harbor' : 'current-year'}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-row justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {icon}
              <span className="text-xs uppercase tracking-wide font-medium">{subtitle}</span>
            </div>
            <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
          </div>
          {isRecommended && (
            <Badge 
              className="bg-[hsl(var(--emerald-600))] text-white border-0 px-3 py-1 text-xs font-medium no-default-hover-elevate no-default-active-elevate flex-shrink-0"
              data-testid="badge-recommended"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Recommended
            </Badge>
          )}
        </div>
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

interface CalculationExplanationProps {
  netProfit: number;
  filingStatus: FilingStatus;
  priorYearTax: number;
  priorYearAGI: number;
  result: TaxCalculationResult;
}

function CalculationExplanation({ netProfit, filingStatus, priorYearTax, priorYearAGI, result }: CalculationExplanationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const standardDeduction = TAX_CONSTANTS_2025.standardDeduction[filingStatus];
  const seTaxableEarnings = netProfit * 0.9235;
  const isHighIncome = priorYearAGI > TAX_CONSTANTS_2025.safeHarborHighIncomeThreshold;

  const steps = [
    {
      title: 'Step 1: Calculate SE Taxable Earnings',
      description: 'Your net profit is multiplied by 92.35% to get your self-employment taxable earnings.',
      calculation: `${formatCurrency(netProfit)} × 92.35% = ${formatCurrency(seTaxableEarnings)}`,
    },
    {
      title: 'Step 2: Calculate Self-Employment Tax',
      description: 'Social Security (12.4% up to wage base) + Medicare (2.9%) + Additional Medicare if applicable.',
      calculation: `${formatCurrency(result.selfEmploymentTax.socialSecurityTax)} + ${formatCurrency(result.selfEmploymentTax.medicareTax)}${result.selfEmploymentTax.additionalMedicareTax > 0 ? ` + ${formatCurrency(result.selfEmploymentTax.additionalMedicareTax)}` : ''} = ${formatCurrency(result.selfEmploymentTax.totalSETax)}`,
    },
    {
      title: 'Step 3: Calculate Taxable Income',
      description: `Net profit minus half of SE tax minus standard deduction (${formatCurrency(standardDeduction)}).`,
      calculation: `${formatCurrency(netProfit)} − ${formatCurrency(result.selfEmploymentTax.seTaxDeduction)} − ${formatCurrency(standardDeduction)} = ${formatCurrency(result.incomeTax.taxableIncome)}`,
    },
    {
      title: 'Step 4: Apply Tax Brackets',
      description: `Your taxable income is taxed progressively through the ${filingStatus === 'married' ? 'married filing jointly' : 'single'} brackets.`,
      calculation: `Federal Income Tax = ${formatCurrency(result.incomeTax.federalIncomeTax)}`,
    },
    {
      title: 'Step 5: Total 2025 Projected Tax',
      description: 'Add self-employment tax and federal income tax together.',
      calculation: `${formatCurrency(result.selfEmploymentTax.totalSETax)} + ${formatCurrency(result.incomeTax.federalIncomeTax)} = ${formatCurrency(result.currentYearTotalTax)}`,
    },
    {
      title: 'Step 6: Calculate Safe Harbor Minimum',
      description: isHighIncome 
        ? `Since your 2024 AGI (${formatCurrency(priorYearAGI)}) exceeded $150,000, you must pay 110% of last year's tax.`
        : `Since your 2024 AGI (${formatCurrency(priorYearAGI)}) was $150,000 or less, you pay 100% of last year's tax.`,
      calculation: `${formatCurrency(priorYearTax)} × ${isHighIncome ? '110%' : '100%'} = ${formatCurrency(result.safeHarborMinimum)}`,
    },
    {
      title: 'Step 7: Determine Required Payment',
      description: 'The IRS requires the lesser of: 90% of current year tax OR your Safe Harbor amount.',
      calculation: `min(${formatCurrency(result.currentYearAvoidanceMinimum)}, ${formatCurrency(result.safeHarborMinimum)}) = ${formatCurrency(result.requiredAnnualPayment)}`,
    },
  ];

  return (
    <Card data-testid="card-calculation-explanation">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate">
            <CardTitle className="flex items-center justify-between gap-2 text-lg font-medium">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-muted-foreground" />
                How We Calculated This
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative pl-8 pb-4 border-l-2 border-border last:border-l-0 last:pb-0"
                data-testid={`step-${index + 1}`}
              >
                <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">{index + 1}</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                  <div className="bg-muted rounded-md px-3 py-2 font-mono text-xs tabular-nums">
                    {step.calculation}
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-foreground mb-1">Your Quarterly Payment</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(result.requiredAnnualPayment)} ÷ 4 = <span className="font-semibold text-foreground">{formatCurrency(result.quarterlyPayment)}</span> per quarter
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface PenaltySavingsComparisonProps {
  result: TaxCalculationResult;
  priorYearTax: number;
}

function PenaltySavingsComparison({ result, priorYearTax }: PenaltySavingsComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const irsInterestRate = 0.08;
  const worstCaseUnderpayment = Math.max(0, result.currentYearTotalTax - result.safeHarborMinimum);
  const averageQuartersUnderpaid = 2;
  const potentialPenalty = worstCaseUnderpayment * (irsInterestRate / 12) * (averageQuartersUnderpaid * 3);
  const differenceFromSafeHarbor = result.currentYearAvoidanceMinimum - result.safeHarborMinimum;
  const cashFlowSavings = differenceFromSafeHarbor > 0 ? differenceFromSafeHarbor : 0;

  if (priorYearTax === 0) return null;

  return (
    <Card data-testid="card-penalty-comparison">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate">
            <CardTitle className="flex items-center justify-between gap-2 text-lg font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[hsl(var(--emerald-600))]" />
                Safe Harbor Protection
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div className="bg-[hsl(var(--emerald-50))] border border-[hsl(var(--emerald-200))] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[hsl(var(--emerald-600))] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    You're Protected from Underpayment Penalties
                  </p>
                  <p className="text-xs text-muted-foreground">
                    By paying the Safe Harbor amount ({formatCurrency(result.safeHarborMinimum)}), you are protected from IRS underpayment penalties under Safe Harbor rules—even if your actual 2025 income is higher than estimated.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">What Safe Harbor Saves You</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Without Safe Harbor</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    If your income exceeds your estimate and you underpay:
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Potential underpayment</span>
                      <span className="tabular-nums font-medium text-amber-600">{formatCurrency(worstCaseUnderpayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. penalty (IRS rate)</span>
                      <span className="tabular-nums font-medium text-red-600">{formatCurrency(potentialPenalty)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[hsl(var(--emerald-50))] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-[hsl(var(--emerald-600))]" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">With Safe Harbor</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Pay your Safe Harbor amount and avoid all penalties:
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Penalty protection</span>
                      <span className="tabular-nums font-medium text-[hsl(var(--emerald-600))]">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peace of mind</span>
                      <span className="tabular-nums font-medium text-[hsl(var(--emerald-600))]">Protected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {cashFlowSavings > 0 && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-1">
                  Cash Flow Advantage
                </p>
                <p className="text-xs text-muted-foreground">
                  Choosing Safe Harbor saves you <span className="font-semibold text-foreground">{formatCurrency(cashFlowSavings)}</span> in 
                  quarterly payments compared to paying 90% of your projected tax. You can invest this difference and pay the 
                  balance when you file your return.
                </p>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">How it works:</strong> The IRS Safe Harbor rule states that if you pay at least 
                100% of your prior year's tax (110% if AGI exceeded $150,000), you cannot be penalized for underpayment—regardless 
                of how much you actually owe when you file.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function TaxCalculator() {
  const [filingStatus, setFilingStatus] = useLocalStorage<FilingStatus>('filingStatus', 'single');
  const [priorYearTax, setPriorYearTax] = useLocalStorage('priorYearTax', '');
  const [priorYearAGI, setPriorYearAGI] = useLocalStorage('priorYearAGI', '');
  const [currentYearProfit, setCurrentYearProfit] = useLocalStorage('currentYearProfit', '');

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ firstName?: string; email?: string }>({});

  const handleClearAll = useCallback(() => {
    clearTaxCalculatorStorage();
    setFilingStatus('single');
    setPriorYearTax('');
    setPriorYearAGI('');
    setCurrentYearProfit('');
    setIsEmailModalOpen(false);
    setFormErrors({});
  }, [setFilingStatus, setPriorYearTax, setPriorYearAGI, setCurrentYearProfit]);

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

  const isSafeHarborRecommended = result ? !result.isCurrentYearLower : false;

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { firstName?: string; email?: string } = {};
    if (!firstName.trim()) errors.firstName = 'Please enter your first name';
    if (!email.trim()) {
      errors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    if (!result) return;
    setFormErrors({});
    setIsSubmitting(true);
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          firstName: firstName.trim() 
        }),
      });
    } catch (error) {
      console.error('Newsletter subscription error:', error);
    }
    generateLeadMagnetPDF({
      filingStatus,
      priorYearTax: parseInt(priorYearTax, 10) || 0,
      priorYearAGI: parseInt(priorYearAGI, 10) || 0,
      currentYearProfit: parseInt(currentYearProfit, 10) || 0,
      result,
      firstName: firstName.trim(),
      email: email.trim(),
    });
    setTimeout(() => {
      setIsSubmitting(false);
      setIsEmailModalOpen(false);
      setFirstName('');
      setEmail('');
    }, 500);
  }, [firstName, email, result, filingStatus, priorYearTax, priorYearAGI, currentYearProfit]);

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-xs font-medium">100% Private - Stored Only on Your Device</span>
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

        <Card className="shadow-lg" data-testid="card-input">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium">
              <Shield className="h-5 w-5 text-primary" />
              Tax Information
            </CardTitle>
            {hasAllInputs && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearAll}
                className="text-muted-foreground"
                data-testid="button-reset"
                aria-label="Clear all inputs"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
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

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

            <QuarterlyBreakdown quarterlyAmount={result.quarterlyPayment} />

            <Card className="border-2 border-primary/20 bg-primary/5" data-testid="card-download-report">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">Get Your Personalized Tax Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Download a professional PDF with your exact quarterly payment amounts and IRS deadlines
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full md:w-auto px-8"
                  onClick={() => setIsEmailModalOpen(true)}
                  data-testid="button-download-report"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download Your 2025 Tax Plan
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800" data-testid="card-freshbooks-affiliate">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      Stop Guessing
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This tool provides planning estimates. To automatically track your actual write-offs and lock in your savings, we recommend FreshBooks.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-freshbooks-cta"
                  >
                    <a 
                      href={AFFILIATE_LINKS.freshbooks} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Start Free Trial (No Credit Card)
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-export">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <Download className="h-5 w-5 text-muted-foreground" />
                  More Export Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => generateTaxSummaryPDF({
                      filingStatus,
                      priorYearTax: parseInt(priorYearTax, 10) || 0,
                      priorYearAGI: parseInt(priorYearAGI, 10) || 0,
                      currentYearProfit: parseInt(currentYearProfit, 10) || 0,
                      result,
                    })}
                    data-testid="button-export-summary"
                  >
                    <Download className="h-5 w-5" />
                    <span className="font-medium">Download Tax Summary</span>
                    <span className="text-xs text-muted-foreground">PDF with all calculations</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => generate1040ESVouchers({
                      filingStatus,
                      priorYearTax: parseInt(priorYearTax, 10) || 0,
                      priorYearAGI: parseInt(priorYearAGI, 10) || 0,
                      currentYearProfit: parseInt(currentYearProfit, 10) || 0,
                      result,
                    })}
                    data-testid="button-export-vouchers"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Download Payment Vouchers</span>
                    <span className="text-xs text-muted-foreground">Form 1040-ES for all 4 quarters</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <CalculationExplanation
              netProfit={parseInt(currentYearProfit, 10) || 0}
              filingStatus={filingStatus}
              priorYearTax={parseInt(priorYearTax, 10) || 0}
              priorYearAGI={parseInt(priorYearAGI, 10) || 0}
              result={result}
            />

            <PenaltySavingsComparison
              result={result}
              priorYearTax={parseInt(priorYearTax, 10) || 0}
            />

            <Card data-testid="card-details">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  2025 Tax Calculation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <p className="text-xs text-muted-foreground text-center px-4">
              This calculator provides estimates for informational purposes only and should not be 
              considered tax advice. Consult a qualified tax professional for your specific situation.
              All calculations use projected 2025 tax rates and brackets.
            </p>
          </div>
        )}

        {!result && (
          <div 
            className="text-center py-12 text-muted-foreground"
            data-testid="empty-state"
          >
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Enter your tax information above to see your Safe Harbor calculation</p>
          </div>
        )}

        <footer className="mt-12 pb-8 text-center" data-testid="footer-branding">
          <p className="text-sm text-slate-400">
            Built by{' '}
            <a 
              href="https://creatoraiplaybook.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-slate-300 transition-colors"
              data-testid="link-playbook-media"
            >
              Playbook Media
            </a>
            . Get the full system at{' '}
            <a 
              href="https://creatoraiplaybook.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-slate-300 transition-colors"
              data-testid="link-full-system"
            >
              creatoraiplaybook.co
            </a>
          </p>
        </footer>
      </div>

      <Dialog open={isEmailModalOpen} onOpenChange={(open) => {
        setIsEmailModalOpen(open);
        if (!open) {
          setFormErrors({});
        }
      }}>
        <DialogContent className="sm:max-w-md" data-testid="modal-email-capture">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Get Your Free Tax Plan
            </DialogTitle>
            <DialogDescription>
              Enter your details below to download your personalized 2025 Safe Harbor payment schedule.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (formErrors.firstName) setFormErrors(prev => ({ ...prev, firstName: undefined }));
                }}
                className={formErrors.firstName ? 'border-red-500' : ''}
                data-testid="input-first-name"
              />
              {formErrors.firstName && (
                <p className="text-xs text-red-500" data-testid="error-first-name">{formErrors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }));
                }}
                className={formErrors.email ? 'border-red-500' : ''}
                data-testid="input-email"
              />
              {formErrors.email && (
                <p className="text-xs text-red-500" data-testid="error-email">{formErrors.email}</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                data-testid="button-submit-email"
              >
                {isSubmitting ? (
                  <>Generating PDF...</>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download My Tax Plan
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                We respect your privacy. No spam, ever.
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}