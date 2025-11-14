'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ProjectData } from '@/types/financial';
import { calculateFinancialMetrics } from '@/utils/financial-calculations';

interface FinancialMetricsProps {
  projectData: ProjectData;
}

export default function FinancialMetrics({ projectData }: FinancialMetricsProps) {
  const metrics = useMemo(() => calculateFinancialMetrics(projectData), [projectData]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const decisionCriteria = [
    {
      metric: 'NPV',
      value: formatCurrency(metrics.npv),
      criteria: 'NPV > 0',
      status: metrics.npv > 0,
      description: 'Project creates positive value'
    },
    {
      metric: 'IRR',
      value: formatPercentage(metrics.irr * 100),
      criteria: `IRR > ${projectData.discountRate}%`,
      status: metrics.irr * 100 > projectData.discountRate,
      description: 'Return exceeds required rate'
    },
    {
      metric: 'Payback Period',
      value: `${metrics.paybackPeriod.toFixed(2)} years`,
      criteria: `PBP < ${projectData.projectYears} years`,
      status: metrics.paybackPeriod <= projectData.projectYears,
      description: 'Investment recovered within timeline'
    }
  ];

  const passingCriteria = decisionCriteria.filter(criteria => criteria.status).length;

  const getRecommendation = () => {
    if (passingCriteria === 3) {
      return {
        type: 'success',
        title: 'STRONG RECOMMENDATION: PROCEED WITH PROJECT',
        icon: CheckCircle,
        color: 'green',
        message: 'All three financial criteria are met. The project demonstrates strong financial viability and should be considered for implementation.'
      };
    } else if (passingCriteria === 2) {
      return {
        type: 'warning',
        title: 'CONDITIONAL RECOMMENDATION: PROCEED WITH CAUTION',
        icon: AlertCircle,
        color: 'yellow',
        message: 'Two out of three financial criteria are met. Consider reviewing assumptions, conducting sensitivity analysis, and evaluating optimization opportunities.'
      };
    } else {
      return {
        type: 'danger',
        title: 'NOT RECOMMENDED: REJECT OR REDESIGN PROJECT',
        icon: XCircle,
        color: 'red',
        message: 'The project fails to meet most financial criteria. Reconsider scope, explore cost reduction, or investigate alternative investments.'
      };
    }
  };

  const recommendation = getRecommendation();
  const Icon = recommendation.icon;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Financial Metrics & Analysis</h2>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* NPV Card */}
        <div className="bg-white border rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Net Present Value (NPV)</h3>
            {metrics.npv > 0 ? (
              <TrendingUp className="text-green-500" size={24} />
            ) : (
              <TrendingDown className="text-red-500" size={24} />
            )}
          </div>
          <p className={`text-3xl font-bold mb-2 ${metrics.npv > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(metrics.npv)}
          </p>
          <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
            metrics.npv > 0
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {metrics.npv > 0 ? 'Positive' : 'Negative'}
          </div>
        </div>

        {/* IRR Card */}
        <div className="bg-white border rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Internal Rate of Return (IRR)</h3>
            {metrics.irr * 100 > projectData.discountRate ? (
              <Target className="text-green-500" size={24} />
            ) : (
              <AlertCircle className="text-yellow-500" size={24} />
            )}
          </div>
          <p className={`text-3xl font-bold mb-2 ${
            metrics.irr * 100 > projectData.discountRate ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {formatPercentage(metrics.irr * 100)}
          </p>
          <p className="text-sm text-gray-600">
            vs MARR: {formatPercentage(metrics.irr * 100 - projectData.discountRate)}
          </p>
        </div>

        {/* Payback Period Card */}
        <div className="bg-white border rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Payback Period</h3>
            <DollarSign className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-2">
            {metrics.paybackPeriod.toFixed(2)} years
          </p>
          <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
            metrics.paybackPeriod <= projectData.projectYears
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {metrics.paybackPeriod <= projectData.projectYears
              ? `Within ${projectData.projectYears} years`
              : `Exceeds ${projectData.projectYears} years`
            }
          </div>
        </div>
      </div>

      {/* Investment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Investment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Initial Investment (CAPEX):</span>
              <span className="font-semibold">{formatCurrency(metrics.totalCapex)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Annual Net Operating Cash Flow:</span>
              <span className="font-semibold">{formatCurrency(metrics.yearlyRevenue - metrics.yearlyExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Project Duration:</span>
              <span className="font-semibold">{projectData.projectYears} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount Rate (MARR):</span>
              <span className="font-semibold">{formatPercentage(projectData.discountRate)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Decision Criteria</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-left py-2">Value</th>
                  <th className="text-left py-2">Criteria</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {decisionCriteria.map((criteria, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{criteria.metric}</td>
                    <td className="py-2">{criteria.value}</td>
                    <td className="py-2 text-gray-600">{criteria.criteria}</td>
                    <td className="py-2 text-center">
                      {criteria.status ? (
                        <CheckCircle className="inline text-green-500" size={16} />
                      ) : (
                        <XCircle className="inline text-red-500" size={16} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`border-l-4 border-${recommendation.color}-500 bg-${recommendation.color}-50 p-6 rounded-r-lg`}>
        <div className="flex items-start space-x-3">
          <Icon className={`text-${recommendation.color}-600 mt-1`} size={24} />
          <div>
            <h3 className={`text-lg font-bold text-${recommendation.color}-800 mb-2`}>
              {recommendation.title}
            </h3>
            <p className={`text-${recommendation.color}-700`}>
              {recommendation.message}
            </p>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Summary:</p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {passingCriteria} of {decisionCriteria.length} criteria met
                </span>
                <div className="flex space-x-1">
                  {decisionCriteria.map((criteria, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${
                        criteria.status ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      title={criteria.metric}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analysis */}
      <div className="mt-8 bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Additional Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-1">Profitability Index</h4>
            <p className="text-xl font-bold text-blue-600">
              {metrics.totalCapex !== 0 ? ((metrics.npv + metrics.totalCapex) / metrics.totalCapex).toFixed(2) : 'N/A'}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {metrics.totalCapex !== 0 && ((metrics.npv + metrics.totalCapex) / metrics.totalCapex) > 1 ? 'Acceptable' : 'Not Acceptable'}
            </p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-1">Annual Revenue</h4>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(metrics.yearlyRevenue)}
            </p>
            <p className="text-xs text-green-700 mt-1">Per year</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-1">Annual Expenses</h4>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(metrics.yearlyExpenses)}
            </p>
            <p className="text-xs text-purple-700 mt-1">Per year</p>
          </div>
        </div>
      </div>
    </div>
  );
}