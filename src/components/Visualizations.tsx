'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ProjectData } from '@/types/financial';
import { calculateCashFlowData, calculateFinancialMetrics } from '@/utils/financial-calculations';

interface VisualizationsProps {
  projectData: ProjectData;
}

export default function Visualizations({ projectData }: VisualizationsProps) {
  const cashFlowData = useMemo(() => calculateCashFlowData(projectData), [projectData]);
  const metrics = useMemo(() => calculateFinancialMetrics(projectData), [projectData]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(value);
  };

  // Prepare chart data
  const yearsLabels = ['Year 0', ...Array.from({ length: projectData.projectYears }, (_, i) => `Year ${i + 1}`)];

  const cashFlowChartData = cashFlowData.map((item, index) => ({
    year: yearsLabels[index],
    cashFlow: item.cashFlow,
    discountedCashFlow: item.discountedCashFlow,
    cumulativeCashFlow: item.cumulativeCashFlow,
  }));

  // CAPEX breakdown data
  const capexData = projectData.capexItems.map(item => ({
    name: item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name,
    value: item.volume * item.price,
    fullName: item.name
  }));

  // Revenue breakdown data
  const revenueData = projectData.opexCashIn.map(item => ({
    name: item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name,
    value: item.volume * item.price,
    fullName: item.name
  }));

  // Expenses breakdown data
  const expensesData = projectData.opexCashOut.map(item => ({
    name: item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name,
    value: item.volume * item.price,
    fullName: item.name
  }));

  // Metrics comparison data
  const metricsData = [
    {
      name: 'NPV (Million Rp)',
      actual: metrics.npv / 1000000,
      target: 0,
      fill: metrics.npv > 0 ? '#10b981' : '#ef4444'
    },
    {
      name: 'IRR (%)',
      actual: metrics.irr * 100,
      target: projectData.discountRate,
      fill: metrics.irr * 100 > projectData.discountRate ? '#10b981' : '#ef4444'
    },
    {
      name: 'Payback (Years)',
      actual: metrics.paybackPeriod,
      target: projectData.projectYears,
      fill: metrics.paybackPeriod <= projectData.projectYears ? '#10b981' : '#ef4444'
    }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{payload[0].payload.fullName || payload[0].name}</p>
          <p className="text-blue-600">{formatCurrency(payload[0].value)}</p>
          <p className="text-gray-600">
            {((payload[0].percent || 0) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Visualizations & Charts</h2>

      {/* Cash Flow Charts */}
      <div className="space-y-8">
        {/* Net Cash Flow Bar Chart */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">💰 Net Cash Flow by Year</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={cashFlowChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="cashFlow"
                name="Net Cash Flow"
                fill="#3b82f6"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative Cash Flow Line Chart */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">📈 Cumulative Discounted Cash Flow</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cashFlowChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cumulativeCashFlow"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Cumulative Cash Flow"
                dot={{ fill: '#3b82f6', r: 6 }}
              />
              {/* Break-even line */}
              <Line
                type="monotone"
                dataKey={() => 0}
                stroke="#ef4444"
                strokeDasharray="5 5"
                name="Break-even"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CAPEX Pie Chart */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">💼 CAPEX Breakdown</h3>
            {capexData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={capexData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {capexData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No CAPEX data available
              </div>
            )}
          </div>

          {/* Revenue Bar Chart */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">💵 Revenue Sources</h3>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={revenueData}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No revenue data available
              </div>
            )}
          </div>

          {/* Expenses Bar Chart */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">💸 Expense Categories</h3>
            {expensesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={expensesData}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No expense data available
              </div>
            )}
          </div>
        </div>

        {/* Financial Metrics Comparison */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">📊 Key Financial Metrics vs Targets</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'actual') {
                    return [value, 'Actual'];
                  }
                  return [value, 'Target/Threshold'];
                }}
              />
              <Legend />
              <Bar dataKey="actual" name="Actual" />
              <Bar dataKey="target" name="Target/Threshold" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow Comparison */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">📊 Cash Flow Analysis</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cashFlowChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cashFlow"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Cash Flow"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="discountedCashFlow"
                stroke="#10b981"
                strokeWidth={2}
                name="Discounted Cash Flow"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeCashFlow"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Cumulative Cash Flow"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}