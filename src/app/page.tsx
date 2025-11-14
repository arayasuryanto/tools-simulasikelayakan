'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, BarChart3, Target } from 'lucide-react';
import DataEditor from '@/components/DataEditor';
import CashFlowAnalysis from '@/components/CashFlowAnalysis';
import FinancialMetrics from '@/components/FinancialMetrics';
import Visualizations from '@/components/Visualizations';
import SensitivityAnalysis from '@/components/SensitivityAnalysis';
import { ProjectData, CapexItem, OpexItem } from '@/types/financial';
import { exportToExcel } from '@/utils/excel-export';
import { v4 as uuidv4 } from 'uuid';

// Default data
const defaultCapexItems: CapexItem[] = [
  { id: uuidv4(), name: "Synology NAS Server", volume: 1, unit: "unit", price: 10599000 },
  { id: uuidv4(), name: "Uninterruptible Power Supply (UPS)", volume: 1, unit: "unit", price: 3529000 },
  { id: uuidv4(), name: "Network Switch", volume: 2, unit: "unit", price: 132900 },
  { id: uuidv4(), name: "Laptop/Desktop", volume: 9, unit: "unit", price: 6671000 },
  { id: uuidv4(), name: "Tablet", volume: 6, unit: "unit", price: 4249150 },
  { id: uuidv4(), name: "Wireless Access Point", volume: 3, unit: "unit", price: 175000 },
  { id: uuidv4(), name: "Biaya Pengembangan Sistem", volume: 1, unit: "paket", price: 28000000 },
  { id: uuidv4(), name: "Biaya Setup & Instalasi", volume: 1, unit: "paket", price: 2000000 },
  { id: uuidv4(), name: "Biaya Onboarding & Training", volume: 1, unit: "paket", price: 1500000 },
  { id: uuidv4(), name: "Biaya Domain & Konfigurasi", volume: 1, unit: "paket", price: 2319900 }
];

const defaultOpexCashIn: OpexItem[] = [
  { id: uuidv4(), name: "Penghematan biaya tenaga kerja administrasi", volume: 1, unit: "paket", price: 21600000 },
  { id: uuidv4(), name: "Pengurangan biaya kesalahan & rework", volume: 1, unit: "paket", price: 16800000 },
  { id: uuidv4(), name: "Peningkatan produktivitas proses bisnis", volume: 1, unit: "paket", price: 45153948 },
  { id: uuidv4(), name: "Penghematan biaya dokumen fisik", volume: 1, unit: "paket", price: 4813680 }
];

const defaultOpexCashOut: OpexItem[] = [
  { id: uuidv4(), name: "Koneksi Internet Dedicated", volume: 2, unit: "paket", price: 375000 },
  { id: uuidv4(), name: "Listrik (Server & Infrastruktur) PLN tarif R1/900VA", volume: 1, unit: "paket", price: 456000 },
  { id: uuidv4(), name: "IP Public Cloudflare", volume: 1, unit: "paket", price: 331440 },
  { id: uuidv4(), name: "Maintenance & Support Teknis", volume: 1, unit: "paket", price: 1500000 }
];

export default function Home() {
  const [projectData, setProjectData] = useState<ProjectData>({
    capexItems: [],
    opexCashIn: [],
    opexCashOut: [],
    projectYears: 5,
    discountRate: 12,
    opexInGrowth: 0,
    opexOutGrowth: 0
  });

  const [activeTab, setActiveTab] = useState(0);
  const [lastSave, setLastSave] = useState<Date>(new Date());

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('feasibility-project-data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setProjectData({
          ...projectData,
          ...parsed,
          lastSave: new Date(parsed.lastSave)
        });
      } catch (error) {
        console.error('Error loading saved data:', error);
        loadDefaultData();
      }
    } else {
      loadDefaultData();
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('feasibility-project-data', JSON.stringify({
        ...projectData,
        lastSave: new Date()
      }));
      setLastSave(new Date());
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectData]);

  const loadDefaultData = () => {
    setProjectData({
      capexItems: defaultCapexItems,
      opexCashIn: defaultOpexCashIn,
      opexCashOut: defaultOpexCashOut,
      projectYears: 5,
      discountRate: 12,
      opexInGrowth: 0,
      opexOutGrowth: 0
    });
  };

  const saveProject = () => {
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setProjectData(data);
        } catch (error) {
          console.error('Error loading project:', error);
          alert('Error loading project file');
        }
      };
      reader.readAsText(file);
    }
  };

  const exportExcel = () => {
    exportToExcel(projectData);
  };

  const tabs = [
    { icon: Calculator, label: "Input Data" },
    { icon: TrendingUp, label: "Cash Flow Analysis" },
    { icon: DollarSign, label: "Financial Metrics" },
    { icon: BarChart3, label: "Visualizations" },
    { icon: Target, label: "Sensitivity Analysis" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Professional Header */}
        <header className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex flex-col items-center">
              {/* Logo - Working Local Version */}
              <div className="mb-4">
                <div className="h-16 w-auto rounded-lg bg-white p-3 shadow-md flex items-center justify-center">
                  {/* Using inline SVG as working logo */}
                  <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="64" rx="16" fill="url(#logoGradient)"/>
                    <defs>
                      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#3b82f6"/>
                        <stop offset="100%" style="stop-color:#6366f1"/>
                      </linearGradient>
                    </defs>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" x="16" y="16">
                      <path d="M9 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h4a1 1 0 0 0 1-1h4v2a1 1 0 0 0 1 1h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2h-4a2 2 0 0 0-2-2zM11 5H7v14h4V5zM19 2c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zm0 6c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zm0 6c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2v-6z" fill="white"/>
                    </svg>
                  </svg>
                </div>
              </div>

              {/* Title and Subtitle */}
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Simulasi Kelayakan
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  Professional Investment Analysis & Financial Assessment Platform
                </p>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-gray-50 px-8 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Real-time Financial Analysis
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Advanced Tools</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Auto-saved at {lastSave.toLocaleTimeString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-6 text-gray-800">⚙️ Project Configuration</h2>

              {/* General Settings */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">General Settings</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Duration (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={projectData.projectYears}
                    onChange={(e) => setProjectData({
                      ...projectData,
                      projectYears: parseInt(e.target.value) || 1
                    })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Rate (MARR %)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={projectData.discountRate}
                    onChange={(e) => setProjectData({
                      ...projectData,
                      discountRate: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Growth Rates */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">📈 Yearly Growth Rates</h3>
                <p className="text-sm text-gray-600 mb-3">For analysis display only</p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cash In / Revenue Growth (%/year)
                  </label>
                  <input
                    type="number"
                    min="-100"
                    max="100"
                    step="0.5"
                    value={projectData.opexInGrowth}
                    onChange={(e) => setProjectData({
                      ...projectData,
                      opexInGrowth: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cash Out / Expense Growth (%/year)
                  </label>
                  <input
                    type="number"
                    min="-100"
                    max="100"
                    step="0.5"
                    value={projectData.opexOutGrowth}
                    onChange={(e) => setProjectData({
                      ...projectData,
                      opexOutGrowth: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Data Management */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">💾 Data Management</h3>

                <div className="space-y-2">
                  <button
                    onClick={saveProject}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"
                  >
                    <span>💾</span>
                    <span>Save Project</span>
                  </button>

                  <label className="block w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-center cursor-pointer">
                    <span>📂 Load Project</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={loadProject}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={exportExcel}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"
                  >
                    <span>📊</span>
                    <span>Export to Excel</span>
                  </button>

                  <button
                    onClick={loadDefaultData}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"
                  >
                    <span>🔄</span>
                    <span>Reset to Default</span>
                  </button>
                </div>
              </div>

              {/* Quick Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4">📊 Quick Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CAPEX:</span>
                    <span className="font-semibold">
                      Rp {projectData.capexItems.reduce((sum, item) => sum + (item.volume * item.price), 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Revenue:</span>
                    <span className="font-semibold">
                      Rp {projectData.opexCashIn.reduce((sum, item) => sum + (item.volume * item.price), 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Expenses:</span>
                    <span className="font-semibold">
                      Rp {projectData.opexCashOut.reduce((sum, item) => sum + (item.volume * item.price), 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="flex flex-wrap border-b">
                {tabs.map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                      activeTab === index
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {activeTab === 0 && (
                <div>
                  <DataEditor
                    title="💼 Capital Expenditure (CAPEX)"
                    items={projectData.capexItems}
                    onChange={(items) => setProjectData({ ...projectData, capexItems: items as CapexItem[] })}
                    color="primary"
                    unitPlaceholder="unit"
                  />
                  <DataEditor
                    title="💵 Operating Revenue (OPEX - Cash In)"
                    items={projectData.opexCashIn}
                    onChange={(items) => setProjectData({ ...projectData, opexCashIn: items as OpexItem[] })}
                    color="success"
                    unitPlaceholder="month"
                  />
                  <DataEditor
                    title="💸 Operating Expenses (OPEX - Cash Out)"
                    items={projectData.opexCashOut}
                    onChange={(items) => setProjectData({ ...projectData, opexCashOut: items as OpexItem[] })}
                    color="danger"
                    unitPlaceholder="month"
                  />
                </div>
              )}

              {activeTab === 1 && (
                <CashFlowAnalysis projectData={projectData} />
              )}

              {activeTab === 2 && (
                <FinancialMetrics projectData={projectData} />
              )}

              {activeTab === 3 && (
                <Visualizations projectData={projectData} />
              )}

              {activeTab === 4 && (
                <SensitivityAnalysis projectData={projectData} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
