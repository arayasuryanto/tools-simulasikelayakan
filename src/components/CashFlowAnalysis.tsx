'use client';

import React, { useMemo } from 'react';
import { Download, Table } from 'lucide-react';
import { ProjectData } from '@/types/financial';
import { calculateCashFlowData, calculateFinancialMetrics } from '@/utils/financial-calculations';
import { exportToExcel } from '@/utils/excel-export';

interface CashFlowAnalysisProps {
  projectData: ProjectData;
}

export default function CashFlowAnalysis({ projectData }: CashFlowAnalysisProps) {
  const cashFlowData = useMemo(() => calculateCashFlowData(projectData), [projectData]);
  const metrics = useMemo(() => calculateFinancialMetrics(projectData), [projectData]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const generateCashFlowTable = () => {
    const yearsLabels = ['Tahun 0', ...Array.from({ length: projectData.projectYears }, (_, i) => `Tahun ${i + 1}`)];

    const tableData: any[] = [];

    // CAPEX Section
    tableData.push({
      description: 'CAPITAL EXPENDITURE (CAPEX)',
      total: '',
      isHeader: true,
      color: 'bg-blue-50'
    });

    let capexTotal = 0;
    projectData.capexItems.forEach(item => {
      const itemTotal = -item.volume * item.price;
      capexTotal += itemTotal;
      const row: any = {
        description: `  ${item.name}`,
        total: formatCurrency(itemTotal),
        isSubtotal: true
      };

      yearsLabels.forEach((year, index) => {
        row[year] = index === 0 ? formatCurrency(itemTotal) : '';
      });

      tableData.push(row);
    });

    tableData.push({
      description: 'Total CAPEX',
      total: formatCurrency(capexTotal),
      isTotal: true,
      color: 'bg-blue-100'
    });
    yearsLabels.forEach((year, index) => {
      tableData[tableData.length - 1][year] = index === 0 ? formatCurrency(capexTotal) : '';
    });

    // OPEX Cash In Section
    tableData.push({
      description: '',
      total: '',
      isSpacer: true
    });

    tableData.push({
      description: 'OPERATIONAL REVENUE (OPEX - Cash In)',
      total: '',
      isHeader: true,
      color: 'bg-green-50'
    });

    const growthIn = projectData.opexInGrowth / 100.0;
    projectData.opexCashIn.forEach(item => {
      const baseTotal = item.volume * item.price;
      const row: any = {
        description: `  ${item.name}`,
        total: formatCurrency(baseTotal),
        isSubtotal: true
      };

      yearsLabels.forEach((year, index) => {
        if (index === 0) {
          row[year] = '';
        } else {
          const yearTotal = baseTotal * Math.pow(1 + growthIn, index);
          row[year] = formatCurrency(yearTotal);
        }
      });

      tableData.push(row);
    });

    const baseYearlyRevenue = projectData.opexCashIn.reduce((sum, item) => sum + (item.volume * item.price), 0);
    const revenueRow: any = {
      description: 'Total Revenue',
      total: '',
      isTotal: true,
      color: 'bg-green-100'
    };
    yearsLabels.forEach((year, index) => {
      if (index === 0) {
        revenueRow[year] = '';
      } else {
        const yearRevenue = baseYearlyRevenue * Math.pow(1 + growthIn, index);
        revenueRow[year] = formatCurrency(yearRevenue);
      }
    });
    tableData.push(revenueRow);

    // OPEX Cash Out Section
    tableData.push({
      description: '',
      total: '',
      isSpacer: true
    });

    tableData.push({
      description: 'OPERATIONAL EXPENSES (OPEX - Cash Out)',
      total: '',
      isHeader: true,
      color: 'bg-red-50'
    });

    const growthOut = projectData.opexOutGrowth / 100.0;
    projectData.opexCashOut.forEach(item => {
      const baseTotal = -item.volume * item.price;
      const row: any = {
        description: `  ${item.name}`,
        total: formatCurrency(baseTotal),
        isSubtotal: true
      };

      yearsLabels.forEach((year, index) => {
        if (index === 0) {
          row[year] = '';
        } else {
          const yearTotal = baseTotal * Math.pow(1 + growthOut, index);
          row[year] = formatCurrency(yearTotal);
        }
      });

      tableData.push(row);
    });

    const baseYearlyExpenses = projectData.opexCashOut.reduce((sum, item) => sum + (item.volume * item.price), 0);
    const expensesRow: any = {
      description: 'Total Expenses',
      total: '',
      isTotal: true,
      color: 'bg-red-100'
    };
    yearsLabels.forEach((year, index) => {
      if (index === 0) {
        expensesRow[year] = '';
      } else {
        const yearExpenses = baseYearlyExpenses * Math.pow(1 + growthOut, index);
        expensesRow[year] = formatCurrency(-yearExpenses);
      }
    });
    tableData.push(expensesRow);

    // Financial Summary Section
    tableData.push({
      description: '',
      total: '',
      isSpacer: true
    });

    tableData.push({
      description: 'FINANCIAL SUMMARY',
      total: '',
      isHeader: true,
      color: 'bg-yellow-50'
    });

    cashFlowData.forEach((item) => {
      const row: any = {
        description: item.year === 0 ? 'NET CASH FLOW' : '',
        total: '',
        isSubtotal: true
      };

      yearsLabels.forEach((year, index) => {
        if (index === item.year) {
          row[year] = formatCurrency(item.cashFlow);
        } else if (index === 0) {
          row[year] = 'NET CASH FLOW';
        } else {
          row[year] = '';
        }
      });

      if (item.year === 0) {
        tableData.push(row);
      }
    });

    // Add discount factors, discounted cash flow, and cumulative cash flow
    const discountFactorRow: any = {
      description: `DISCOUNT FACTOR (MARR ${projectData.discountRate}%)`,
      total: '',
      isSubtotal: true
    };

    const discountedCashFlowRow: any = {
      description: 'DISCOUNTED CASH FLOW',
      total: '',
      isSubtotal: true
    };

    const cumulativeCashFlowRow: any = {
      description: 'CUMULATIVE CASH FLOW',
      total: '',
      isSubtotal: true
    };

    yearsLabels.forEach((year, index) => {
      discountFactorRow[year] = cashFlowData[index]?.discountFactor?.toFixed(4) || '';
      discountedCashFlowRow[year] = formatCurrency(cashFlowData[index]?.discountedCashFlow || 0);
      cumulativeCashFlowRow[year] = formatCurrency(cashFlowData[index]?.cumulativeCashFlow || 0);
    });

    tableData.push(discountFactorRow);
    tableData.push(discountedCashFlowRow);
    tableData.push(cumulativeCashFlowRow);

    // Add final metrics
    tableData.push({
      description: 'NPV',
      total: formatCurrency(metrics.npv),
      isTotal: true,
      color: 'bg-yellow-100'
    });
    yearsLabels.forEach((year, index) => {
      if (index === 0) {
        tableData[tableData.length - 1][year] = formatCurrency(metrics.npv);
      }
    });

    tableData.push({
      description: 'IRR',
      total: `${(metrics.irr * 100).toFixed(2)}%`,
      isTotal: true,
      color: 'bg-yellow-100'
    });
    yearsLabels.forEach((year, index) => {
      if (index === 0) {
        tableData[tableData.length - 1][year] = `${(metrics.irr * 100).toFixed(2)}%`;
      }
    });

    tableData.push({
      description: 'Payback Period',
      total: `${metrics.paybackPeriod.toFixed(2)} years`,
      isTotal: true,
      color: 'bg-yellow-100'
    });
    yearsLabels.forEach((year, index) => {
      if (index === 0) {
        tableData[tableData.length - 1][year] = `${metrics.paybackPeriod.toFixed(2)} years`;
      }
    });

    return { tableData, yearsLabels };
  };

  const { tableData, yearsLabels } = generateCashFlowTable();

  const exportToCSV = () => {
    const csvContent = [
      ['Description', 'Total', ...yearsLabels],
      ...tableData.map(row => [
        row.description || '',
        row.total || '',
        ...yearsLabels.map(year => row[year] || '')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cashflow_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Cash Flow Analysis (Arus Kas)</h2>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            <Download size={16} />
            <span>Download CSV</span>
          </button>
          <button
            onClick={() => exportToExcel(projectData)}
            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
          >
            <Download size={16} />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold">Description</th>
              <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-right font-semibold">Total</th>
              {yearsLabels.map((year, index) => (
                <th key={index} className="border border-gray-300 bg-gray-100 px-4 py-2 text-right font-semibold">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  row.isHeader ? row.color :
                  row.isTotal ? row.color :
                  row.isSpacer ? '' :
                  row.isSubtotal ? 'bg-gray-50' : ''
                }
              >
                <td className={`border border-gray-300 px-4 py-2 ${row.isHeader ? 'font-bold' : row.isTotal ? 'font-semibold' : ''}`}>
                  {row.description}
                </td>
                <td className={`border border-gray-300 px-4 py-2 text-right ${row.isTotal ? 'font-semibold' : ''}`}>
                  {row.total}
                </td>
                {yearsLabels.map((year, colIndex) => (
                  <td key={colIndex} className="border border-gray-300 px-4 py-2 text-right">
                    {row[year]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Metrics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Net Present Value (NPV)</h3>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.npv)}</p>
          <p className="text-sm text-blue-700 mt-1">
            {metrics.npv > 0 ? '✅ Project is financially viable' : '❌ Project is not financially viable'}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Internal Rate of Return (IRR)</h3>
          <p className="text-2xl font-bold text-green-900">{(metrics.irr * 100).toFixed(2)}%</p>
          <p className="text-sm text-green-700 mt-1">
            {metrics.irr * 100 > projectData.discountRate ? '✅ IRR exceeds required rate' : '⚠️ IRR below required rate'}
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Payback Period</h3>
          <p className="text-2xl font-bold text-purple-900">{metrics.paybackPeriod.toFixed(2)} years</p>
          <p className="text-sm text-purple-700 mt-1">
            {metrics.paybackPeriod <= projectData.projectYears ? '✅ Investment recovered within project timeline' : '⚠️ Payback exceeds project duration'}
          </p>
        </div>
      </div>
    </div>
  );
}