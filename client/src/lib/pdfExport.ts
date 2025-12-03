import jsPDF from 'jspdf';
import { formatCurrency, formatPercentage, type TaxCalculationResult, type FilingStatus, TAX_CONSTANTS_2025 } from './taxCalculator';

interface PDFExportData {
  filingStatus: FilingStatus;
  priorYearTax: number;
  priorYearAGI: number;
  currentYearProfit: number;
  result: TaxCalculationResult;
}

const QUARTERS = [
  { label: 'Q1', date: 'April 15, 2025' },
  { label: 'Q2', date: 'June 16, 2025' },
  { label: 'Q3', date: 'September 15, 2025' },
  { label: 'Q4', date: 'January 15, 2026' },
];

function addPageHeader(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Safe Harbor 2025 Tax Shield', 20, 15);
  doc.text(`Page ${pageNum} of ${totalPages}`, 190, 15, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

function addSectionHeader(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(title, 20, y);
  doc.setFont('helvetica', 'normal');
  return y + 8;
}

function addLabelValue(doc: jsPDF, y: number, label: string, value: string, indent: number = 20): number {
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(label, indent, y);
  doc.setTextColor(30, 41, 59);
  doc.text(value, 190, y, { align: 'right' });
  return y + 6;
}

function addDivider(doc: jsPDF, y: number): number {
  doc.setDrawColor(226, 232, 240);
  doc.line(20, y, 190, y);
  return y + 8;
}

export function generateTaxSummaryPDF(data: PDFExportData): void {
  const doc = new jsPDF();
  const { filingStatus, priorYearTax, priorYearAGI, currentYearProfit, result } = data;
  
  let y = 30;
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2025 Estimated Tax Summary', 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Safe Harbor Tax Shield Calculation', 20, y);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 190, y, { align: 'right' });
  y += 15;
  
  y = addDivider(doc, y);
  
  y = addSectionHeader(doc, y, 'Your Information');
  y = addLabelValue(doc, y, 'Filing Status', filingStatus === 'married' ? 'Married Filing Jointly' : 'Single');
  y = addLabelValue(doc, y, '2024 Total Tax Liability', formatCurrency(priorYearTax));
  y = addLabelValue(doc, y, '2024 Adjusted Gross Income', formatCurrency(priorYearAGI));
  y = addLabelValue(doc, y, '2025 Estimated Net Profit', formatCurrency(currentYearProfit));
  y += 8;
  
  y = addDivider(doc, y);
  
  y = addSectionHeader(doc, y, 'Quarterly Payment Schedule');
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y - 2, 170, 45, 3, 3, 'F');
  y += 6;
  
  QUARTERS.forEach((quarter, index) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(quarter.label, 30, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(quarter.date, 50, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(formatCurrency(result.quarterlyPayment), 180, y, { align: 'right' });
    
    y += 10;
  });
  
  y += 5;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Annual Total:', 30, y);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(result.requiredAnnualPayment), 180, y, { align: 'right' });
  y += 15;
  
  y = addDivider(doc, y);
  
  y = addSectionHeader(doc, y, 'Safe Harbor Calculation');
  
  const isHighIncome = priorYearAGI > TAX_CONSTANTS_2025.safeHarborHighIncomeThreshold;
  const multiplierText = isHighIncome ? '110% (AGI over $150,000)' : '100% (AGI $150,000 or less)';
  
  y = addLabelValue(doc, y, '2024 Tax Liability', formatCurrency(priorYearTax));
  y = addLabelValue(doc, y, 'Safe Harbor Multiplier', multiplierText);
  
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(20, y, 170, 12, 2, 2, 'F');
  y += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('Safe Harbor Minimum:', 25, y);
  doc.text(formatCurrency(result.safeHarborMinimum), 185, y, { align: 'right' });
  y += 12;
  
  y += 5;
  
  y = addSectionHeader(doc, y, 'Current Year Projection (90% Method)');
  y = addLabelValue(doc, y, 'Self-Employment Tax', formatCurrency(result.selfEmploymentTax.totalSETax));
  y = addLabelValue(doc, y, 'Federal Income Tax', formatCurrency(result.incomeTax.federalIncomeTax));
  y = addLabelValue(doc, y, 'Total 2025 Projected Tax', formatCurrency(result.currentYearTotalTax));
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, 170, 12, 2, 2, 'F');
  y += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('90% of Projected Tax:', 25, y);
  doc.text(formatCurrency(result.currentYearAvoidanceMinimum), 185, y, { align: 'right' });
  y += 15;
  
  y = addDivider(doc, y);
  
  y = addSectionHeader(doc, y, 'Recommendation');
  
  const recommendedOption = result.isCurrentYearLower ? 'Current Year Estimate' : 'Safe Harbor';
  const recommendedAmount = result.isCurrentYearLower ? result.currentYearAvoidanceMinimum : result.safeHarborMinimum;
  
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(20, y, 170, 20, 3, 3, 'F');
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`Recommended Method: ${recommendedOption}`, 25, y);
  y += 7;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Pay ${formatCurrency(result.quarterlyPayment)} per quarter`, 25, y);
  y += 15;
  
  if (result.savings > 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`You save ${formatCurrency(result.savings)} compared to the alternative.`, 20, y);
  }
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This document is for informational purposes only and does not constitute tax advice.', 105, 285, { align: 'center' });
  doc.text('Consult a qualified tax professional for your specific situation.', 105, 290, { align: 'center' });
  
  addPageHeader(doc, 1, 1);
  
  doc.save('safe-harbor-2025-tax-summary.pdf');
}

export function generate1040ESVouchers(data: PDFExportData): void {
  const doc = new jsPDF();
  const { filingStatus, result } = data;
  
  QUARTERS.forEach((quarter, index) => {
    if (index > 0) {
      doc.addPage();
    }
    
    addPageHeader(doc, index + 1, 4);
    
    let y = 25;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y - 5, 180, 100, 'F');
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(15, y - 5, 180, 100);
    doc.setLineDashPattern([], 0);
    
    y += 5;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Form 1040-ES Payment Voucher', 105, y, { align: 'center' });
    y += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${quarter.label} - 2025 Estimated Tax`, 105, y, { align: 'center' });
    y += 10;
    
    doc.setDrawColor(226, 232, 240);
    doc.line(25, y, 185, y);
    y += 10;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Your Name:', 25, y);
    doc.line(60, y, 130, y);
    
    doc.text('SSN:', 140, y);
    doc.line(155, y, 185, y);
    y += 10;
    
    doc.text('Address:', 25, y);
    doc.line(50, y, 185, y);
    y += 10;
    
    doc.text('City, State, ZIP:', 25, y);
    doc.line(60, y, 185, y);
    y += 15;
    
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(25, y - 2, 160, 20, 3, 3, 'F');
    y += 6;
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('Amount of Payment:', 30, y);
    y += 8;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(result.quarterlyPayment), 30, y);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Due: ${quarter.date}`, 170, y - 4, { align: 'right' });
    y += 25;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Make check payable to: United States Treasury', 25, y);
    y += 5;
    doc.text('Include SSN on check', 25, y);
    y += 20;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Payment Instructions', 25, y);
    y += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    const instructions = [
      '1. Fill in your name, Social Security Number, and address above.',
      '2. Write the amount shown on your check.',
      '3. Make check payable to "United States Treasury".',
      '4. Write your SSN and "2025 Form 1040-ES" on your check.',
      '5. Mail to the IRS address for your state (see IRS.gov for addresses).',
      '',
      'Alternatively, pay online at IRS.gov/Payments using:',
      '• IRS Direct Pay (free, from bank account)',
      '• Debit/Credit Card (fees apply)',
      '• EFTPS (Electronic Federal Tax Payment System)',
    ];
    
    instructions.forEach((line) => {
      doc.text(line, 25, y);
      y += 5;
    });
    
    y += 10;
    
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(25, y - 2, 160, 25, 2, 2, 'F');
    y += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(161, 98, 7);
    doc.text('Reminder', 30, y);
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`This payment is due by ${quarter.date}.`, 30, y);
    y += 5;
    doc.text('Late payments may result in penalties and interest.', 30, y);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a sample voucher for reference. Official IRS Form 1040-ES is available at IRS.gov.', 105, 285, { align: 'center' });
  });
  
  doc.save('2025-form-1040-es-vouchers.pdf');
}
