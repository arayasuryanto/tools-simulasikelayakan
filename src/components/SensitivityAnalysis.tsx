'use client';

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProjectData } from '@/types/financial';
import { performSensitivityAnalysis, calculateFinancialMetrics } from '@/utils/financial-calculations';

interface SensitivityAnalysisProps {
  projectData: ProjectData;
}

export default function SensitivityAnalysis({ projectData }: SensitivityAnalysisProps) {
  const [variation, setVariation] = useState(20);

  const sensitivityResults = useMemo(
    () => performSensitivityAnalysis(projectData, variation),
    [projectData, variation]
  );

  const baseMetrics = useMemo(
    () => calculateFinancialMetrics(projectData),
    [projectData]
  );

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepare Tornado chart data
  const tornadoChartData = sensitivityResults.map(result => {
    const baseNPV = baseMetrics.npv;
    return {
      variable: result.variable,
      'Low Impact': result.npvLow - baseNPV,
      'High Impact': result.npvHigh - baseNPV,
      range: result.range
    };
  });

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

  const sensitivityTableData = sensitivityResults.map((result, index) => ({
    rank: index + 1,
    variable: result.variable,
    npvLow: formatCurrency(result.npvLow),
    baseNPV: formatCurrency(baseMetrics.npv),
    npvHigh: formatCurrency(result.npvHigh),
    range: formatCurrency(result.range),
    sensitivity: result.range / Math.abs(baseMetrics.npv) * 100
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sensitivity Analysis (Tornado Diagram)</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          <strong>What this shows:</strong> How changes in key variables affect the NPV.
          Adjust the variation percentage to see different scenarios.
        </p>
      </div>

      {/* Variation Control */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <label className="font-semibold text-gray-700">
            Variation Percentage:
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={variation}
            onChange={(e) => setVariation(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="bg-gray-100 px-3 py-1 rounded font-semibold text-gray-700 min-w-[80px] text-center">
            ±{variation}%
          </span>
        </div>
      </div>

      {/* Tornado Chart */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Tornado Diagram - Sensitivity Analysis (±{variation}%)
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={tornadoChartData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            />
            <YAxis
              type="category"
              dataKey="variable"
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="Low Impact"
              stackId="a"
              fill="#fca5a5"
              name={`-${variation}% Impact`}
            />
            <Bar
              dataKey="High Impact"
              stackId="a"
              fill="#86efac"
              name={`+${variation}% Impact`}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-300 rounded"></div>
            <span>Negative Impact (Reduces NPV)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-300 rounded"></div>
            <span>Positive Impact (Increases NPV)</span>
          </div>
        </div>
      </div>

      {/* Sensitivity Analysis Summary Table */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">📋 Sensitivity Analysis Summary</h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Rank</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Variable</th>
                <th className="border border-gray-300 px-4 py-2 text-right">NPV at -{variation}%</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Base NPV</th>
                <th className="border border-gray-300 px-4 py-2 text-right">NPV at +{variation}%</th>
                <th className="border border-gray-300 px-4 py-2 text-right">NPV Range</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Sensitivity %</th>
              </tr>
            </thead>
            <tbody>
              {sensitivityTableData.map((row, index) => (
                <tr key={index} className={index === 0 ? 'bg-yellow-50 font-semibold' : ''}>
                  <td className="border border-gray-300 px-4 py-2 text-center">{row.rank}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.variable}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{row.npvLow}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{row.baseNPV}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{row.npvHigh}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{row.range}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    <span className={`px-2 py-1 rounded text-xs ${
                      row.sensitivity > 50
                        ? 'bg-red-100 text-red-800'
                        : row.sensitivity > 25
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {row.sensitivity.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-800 mb-4">📖 Interpretation & Recommendations</h3>

        <div className="space-y-4">
          <div className="bg-white bg-opacity-70 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Most Sensitive Variable:</h4>
            <p className="text-blue-800">
              <strong>{sensitivityResults[0]?.variable}</strong> has the greatest impact on NPV
              ({((sensitivityResults[0]?.range / Math.abs(baseMetrics.npv)) * 100).toFixed(1)}% sensitivity).
            </p>
          </div>

          <div className="bg-white bg-opacity-70 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Least Sensitive Variable:</h4>
            <p className="text-blue-800">
              <strong>{sensitivityResults[sensitivityResults.length - 1]?.variable}</strong> has the smallest impact on NPV.
            </p>
          </div>

          <div className="bg-white bg-opacity-70 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Management Recommendations:</h4>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Focus management attention on the most sensitive variables to maximize project success</li>
              <li>Conduct detailed analysis and monitoring of {sensitivityResults[0]?.variable}</li>
              <li>Consider risk mitigation strategies for high-impact variables</li>
              <li>Use sensitivity analysis to prioritize areas for improvement and optimization</li>
            </ul>
          </div>

          <div className="bg-white bg-opacity-70 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Risk Assessment:</h4>
            <div className="space-y-2">
              {sensitivityResults.map((result, index) => {
                const sensitivity = (result.range / Math.abs(baseMetrics.npv)) * 100;
                const riskLevel = sensitivity > 50 ? 'High' : sensitivity > 25 ? 'Medium' : 'Low';
                const riskColor = sensitivity > 50 ? 'text-red-700' : sensitivity > 25 ? 'text-yellow-700' : 'text-green-700';

                return (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-blue-800">{result.variable}:</span>
                    <span className={`font-semibold ${riskColor}`}>{riskLevel} Risk</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">🎯 Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2">Scenario Planning</h4>
            <p className="text-purple-700 text-sm">
              With ±{variation}% variation, NPV ranges from {formatCurrency(sensitivityResults[0]?.npvLow || 0)}
              to {formatCurrency(sensitivityResults[0]?.npvHigh || 0)}.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Break-Even Analysis</h4>
            <p className="text-orange-700 text-sm">
              Focus on variables that could make the project unprofitable under adverse conditions.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Optimization Opportunities</h4>
            <p className="text-green-700 text-sm">
              Small improvements in high-sensitivity variables can significantly impact project value.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Critical Success Factors</h4>
            <p className="text-red-700 text-sm">
              {sensitivityResults[0]?.variable} is the most critical factor for project success.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}