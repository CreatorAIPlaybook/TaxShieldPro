import jsPDF from 'jspdf';
import { formatCurrency, formatPercentage, type TaxCalculationResult, type FilingStatus, TAX_CONSTANTS_2026 } from './taxCalculator';

interface PDFExportData {
  filingStatus: FilingStatus;
  priorYearTax: number;
  priorYearAGI: number;
  currentYearProfit: number;
  result: TaxCalculationResult;
}

const QUARTERS = [
  { label: 'Q1', date: 'April 15, 2026' },
  { label: 'Q2', date: 'June 15, 2026' },
  { label: 'Q3', date: 'September 15, 2026' },
  { label: 'Q4', date: 'January 15, 2027' },
];

function addPageHeader(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Safe Harbor 2026 Tax Shield', 20, 15);
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
  doc.text('2026 Estimated Tax Summary', 20, y);
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
  y = addLabelValue(doc, y, '2025 Total Tax Liability', formatCurrency(priorYearTax));
  y = addLabelValue(doc, y, '2025 Adjusted Gross Income', formatCurrency(priorYearAGI));
  y = addLabelValue(doc, y, '2026 Estimated Net Profit', formatCurrency(currentYearProfit));
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
  
  const isHighIncome = priorYearAGI > TAX_CONSTANTS_2026.safeHarborHighIncomeThreshold;
  const multiplierText = isHighIncome ? '110% (AGI over $150,000)' : '100% (AGI $150,000 or less)';
  
  y = addLabelValue(doc, y, '2025 Tax Liability', formatCurrency(priorYearTax));
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
  y = addLabelValue(doc, y, 'Total 2026 Projected Tax', formatCurrency(result.currentYearTotalTax));
  
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
  
  doc.save('safe-harbor-2026-tax-summary.pdf');
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
    doc.text(`${quarter.label} - 2026 Estimated Tax`, 105, y, { align: 'center' });
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
      '4. Write your SSN and "2026 Form 1040-ES" on your check.',
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
  
  doc.save('2026-form-1040-es-vouchers.pdf');
}

interface LeadMagnetPDFData extends PDFExportData {
  firstName: string;
  email: string;
}

export function generateLeadMagnetPDF(data: LeadMagnetPDFData): void {
  const doc = new jsPDF();
  const { firstName, result, priorYearAGI } = data;
  const isHighIncome = priorYearAGI > TAX_CONSTANTS_2026.safeHarborHighIncomeThreshold;
  
  let y = 30;
  
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Your 2026 Safe Harbor Plan', 105, 25, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Personalized Quarterly Tax Payment Schedule', 105, 38, { align: 'center' });
  
  y = 65;
  
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`Hi ${firstName},`, 20, y);
  y += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('Here is your personalized 2026 estimated tax payment schedule using the IRS Safe Harbor method.', 20, y);
  y += 6;
  doc.text('By following this plan, you\'ll be protected from IRS underpayment penalties.', 20, y);
  y += 15;
  
  // Compact table layout to fit on single page
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y - 5, 180, 75, 5, 5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y - 5, 180, 75, 5, 5, 'S');
  
  y += 5;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Your Quarterly Payment Schedule', 105, y, { align: 'center' });
  y += 10;
  
  QUARTERS.forEach((quarter, index) => {
    doc.setFillColor(16, 185, 129);
    doc.circle(30, y - 2, 3, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${quarter.label}:`, 40, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(quarter.date, 60, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(formatCurrency(result.quarterlyPayment), 180, y, { align: 'right' });
    
    y += 10;
  });
  
  // Spacing before the divider line
  y += 5;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(40, y - 5, 170, y - 5);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Total Annual Payments:', 40, y);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(result.requiredAnnualPayment), 180, y, { align: 'right' });
  y += 15;
  
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(15, y - 5, 180, 30, 3, 3, 'F');
  y += 5;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(161, 98, 7);
  doc.text('Why Safe Harbor?', 20, y);
  y += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const safeHarborExplanation = isHighIncome 
    ? 'Since your 2025 AGI exceeded $150,000, you qualify by paying 110% of last year\'s tax.'
    : 'Since your 2025 AGI was $150,000 or less, you qualify by paying 100% of last year\'s tax.';
  doc.text(safeHarborExplanation, 20, y);
  y += 5;
  doc.text('This protects you from penalties regardless of how much you actually owe when you file.', 20, y);
  y += 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('How to Pay', 20, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  
  const paymentOptions = [
    '1. IRS Direct Pay (free) - Pay directly from your bank account at IRS.gov/DirectPay',
    '2. EFTPS - Electronic Federal Tax Payment System at EFTPS.gov',
    '3. Check - Mail to IRS with Form 1040-ES voucher',
  ];
  
  paymentOptions.forEach((option) => {
    doc.text(option, 20, y);
    y += 6;
  });
  
  // Add 10mm breathing room between content and FreshBooks CTA
  y += 10;
  
  // Get page dimensions for collision detection
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerSafetyZone = pageHeight - 25; // 25mm from bottom is the safety threshold
  
  // Collision detection: if content would overlap with footer, add new page
  if (y > footerSafetyZone) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(15, y - 5, 180, 25, 3, 3, 'F');
  y += 5;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('Want to automatically track your deductions?', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Try ', 20, y);
  
  // Add clickable FreshBooks hyperlink (blue and underlined)
  const freshBooksUrl = 'https://freshbooks.com';
  doc.setTextColor(59, 130, 246); // Blue color
  doc.textWithLink('FreshBooks', 28, y, { url: freshBooksUrl });
  // Add underline for the link
  const linkWidth = doc.getTextWidth('FreshBooks');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.3);
  doc.line(28, y + 0.5, 28 + linkWidth, y + 0.5);
  
  doc.setTextColor(71, 85, 105);
  doc.text(' - the #1 accounting software for freelancers and solopreneurs.', 28 + linkWidth, y);
  
  // Footer at exactly 15mm from the bottom of the page (centered)
  const footerY = pageHeight - 15;
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated by Safe Harbor 2026 Tax Shield | creatoraiplaybook.co', 105, footerY - 10, { align: 'center' });
  doc.text('This document is for informational purposes only and does not constitute tax advice.', 105, footerY - 5, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 105, footerY, { align: 'center' });
  
  doc.save('2026_Safe_Harbor_Plan.pdf');
}
