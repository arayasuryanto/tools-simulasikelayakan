import { saveAs } from 'file-saver';
import { ProjectData, CapexItem, OpexItem } from '@/types/financial';
import { calculateTotal, calculateNetCashFlow, calculateDiscountFactors, calculateDiscountedCashFlow, calculateCumulativeCashFlow, calculateNPV, calculateIRR, calculatePaybackPeriod } from './financial-calculations';
import * as XLSX from 'xlsx';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
};

const generateCashFlowTable = (data: ProjectData) => {
  const cashflows = calculateNetCashFlow(data);
  const discountFactors = calculateDiscountFactors(data.projectYears, data.discountRate);
  const discountedCashflows = calculateDiscountedCashFlow(cashflows, discountFactors);
  const cumulativeCashflows = calculateCumulativeCashFlow(discountedCashflows);

  const yearsLabels = ['Tahun 0', ...Array.from({ length: data.projectYears }, (_, i) => `Tahun ${i + 1}`)];

  const cashFlowData: any[] = [];

  // Title rows
  cashFlowData.push(['', ...Array(yearsLabels.length + 1).fill('')]);
  cashFlowData.push(['CASH FLOW ANALYSIS (ARUS KAS)', '', ...Array(yearsLabels.length - 1).fill('')]);
  cashFlowData.push([`Project Duration: ${data.projectYears} years | Discount Rate: ${data.discountRate}%`, '', ...Array(yearsLabels.length - 1).fill('')]);
  cashFlowData.push([`Generated: ${new Date().toLocaleString('id-ID')}`, '', ...Array(yearsLabels.length - 1).fill('')]);
  cashFlowData.push(['', ...Array(yearsLabels.length + 1).fill('')]);

  // Headers
  cashFlowData.push(['Description', 'Total', ...yearsLabels]);

  // CAPEX Section
  cashFlowData.push(['CAPITAL EXPENDITURE (CAPEX)', '', ...Array(yearsLabels.length - 1).fill('')]);

  let capexTotal = 0;
  data.capexItems.forEach(item => {
    const total = -calculateTotal(item);
    capexTotal += total;
    const row = [`  ${item.name}`, total];
    yearsLabels.forEach((_, i) => {
      row.push(i === 0 ? total : '');
    });
    cashFlowData.push(row);
  });
  cashFlowData.push(['Total CAPEX', capexTotal, capexTotal, ...Array(yearsLabels.length - 1).fill('')]);
  cashFlowData.push(['', '', ...Array(yearsLabels.length - 1).fill('')]);

  // OPEX Cash In Section
  cashFlowData.push(['OPERATIONAL REVENUE (OPEX - Cash In)', '', ...Array(yearsLabels.length - 1).fill('')]);

  const growthIn = data.opexInGrowth / 100.0;
  data.opexCashIn.forEach(item => {
    const baseTotal = calculateTotal(item);
    const row = [`  ${item.name}`, baseTotal, ''];
    for (let i = 1; i < yearsLabels.length; i++) {
      const yearTotal = baseTotal * Math.pow(1 + growthIn, i);
      row.push(yearTotal);
    }
    cashFlowData.push(row);
  });

  // Total Revenue
  const baseYearlyRevenue = data.opexCashIn.reduce((sum, item) => sum + calculateTotal(item), 0);
  const revenueRow: any[] = ['Total Revenue', '', ''];
  for (let i = 1; i < yearsLabels.length; i++) {
    const yearRevenue = baseYearlyRevenue * Math.pow(1 + growthIn, i);
    revenueRow.push(yearRevenue);
  }
  cashFlowData.push(revenueRow);
  cashFlowData.push(['', '', ...Array(yearsLabels.length - 1).fill('')]);

  // OPEX Cash Out Section
  cashFlowData.push(['OPERATIONAL EXPENSES (OPEX - Cash Out)', '', ...Array(yearsLabels.length - 1).fill('')]);

  const growthOut = data.opexOutGrowth / 100.0;
  data.opexCashOut.forEach(item => {
    const baseTotal = -calculateTotal(item);
    const row = [`  ${item.name}`, baseTotal, ''];
    for (let i = 1; i < yearsLabels.length; i++) {
      const yearTotal = baseTotal * Math.pow(1 + growthOut, i);
      row.push(yearTotal);
    }
    cashFlowData.push(row);
  });

  // Total Expenses
  const baseYearlyExpenses = data.opexCashOut.reduce((sum, item) => sum + calculateTotal(item), 0);
  const expensesRow: any[] = ['Total Expenses', '', ''];
  for (let i = 1; i < yearsLabels.length; i++) {
    const yearExpenses = baseYearlyExpenses * Math.pow(1 + growthOut, i);
    expensesRow.push(yearExpenses);
  }
  cashFlowData.push(expensesRow);
  cashFlowData.push(['', '', ...Array(yearsLabels.length - 1).fill('')]);

  // Financial Summary
  cashFlowData.push(['FINANCIAL SUMMARY', '', ...Array(yearsLabels.length - 1).fill('')]);
  cashFlowData.push(['NET CASH FLOW', '', ...cashflows]);
  cashFlowData.push([`DISCOUNT FACTOR (MARR ${data.discountRate}%)`, '', ...discountFactors]);
  cashFlowData.push(['DISCOUNTED CASH FLOW', '', ...discountedCashflows]);
  cashFlowData.push(['CUMULATIVE CASH FLOW', '', ...cumulativeCashflows]);

  const npv = calculateNPV(discountedCashflows);
  const irr = calculateIRR(cashflows);
  const paybackPeriod = calculatePaybackPeriod(cumulativeCashflows);

  cashFlowData.push(['NPV', npv, ...Array(yearsLabels.length - 1).fill('')]);
  cashFlowData.push(['IRR', `${(irr * 100).toFixed(2)}%`, ...Array(yearsLabels.length - 1).fill('')]);
  cashFlowData.push(['Payback Period', `${paybackPeriod.toFixed(2)} years`, ...Array(yearsLabels.length - 1).fill('')]);

  return cashFlowData;
};

export const exportToExcel = (data: ProjectData) => {
  try {
    const wb = XLSX.utils.book_new();

    // Cash Flow Analysis Sheet
    const cashFlowData = generateCashFlowTable(data);
    const wsCashFlow = XLSX.utils.aoa_to_sheet(cashFlowData);

    // Styling for title rows
    wsCashFlow['!cols'] = [
      { width: 40 }, // Description column
      ...Array(cashFlowData[0].length - 1).fill({ width: 15 })
    ];

    // Merge cells for title
    wsCashFlow['!merges'] = [
      { s: { r: 1, c: 0 }, e: { r: 1, c: cashFlowData[0].length - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: cashFlowData[0].length - 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: cashFlowData[0].length - 1 } }
    ];

    XLSX.utils.book_append_sheet(wb, wsCashFlow, 'Cash Flow Analysis');

    // Data Summary Sheet
    const summaryData = [
      ['PROJECT DATA SUMMARY'],
      [''],
      ['CAPEX Items'],
      ['Name', 'Volume', 'Unit', 'Price', 'Total'],
      ...data.capexItems.map(item => [
        item.name,
        item.volume,
        item.unit,
        item.price,
        calculateTotal(item)
      ]),
      ['', '', '', '', data.capexItems.reduce((sum, item) => sum + calculateTotal(item), 0)],
      [''],
      ['Revenue Items'],
      ['Name', 'Volume', 'Unit', 'Price', 'Total'],
      ...data.opexCashIn.map(item => [
        item.name,
        item.volume,
        item.unit,
        item.price,
        calculateTotal(item)
      ]),
      ['', '', '', '', data.opexCashIn.reduce((sum, item) => sum + calculateTotal(item), 0)],
      [''],
      ['Expense Items'],
      ['Name', 'Volume', 'Unit', 'Price', 'Total'],
      ...data.opexCashOut.map(item => [
        item.name,
        item.volume,
        item.unit,
        item.price,
        calculateTotal(item)
      ]),
      ['', '', '', '', data.opexCashOut.reduce((sum, item) => sum + calculateTotal(item), 0)],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { width: 40 },
      { width: 10 },
      { width: 10 },
      { width: 15 },
      { width: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Data Summary');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const fileName = `feasibility_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Error exporting to Excel. Please try again.');
  }
};