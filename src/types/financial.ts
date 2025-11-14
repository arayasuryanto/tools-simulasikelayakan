export interface CapexItem {
  id: string;
  name: string;
  volume: number;
  unit: string;
  price: number;
}

export interface OpexItem {
  id: string;
  name: string;
  volume: number;
  unit: string;
  price: number;
}

export interface ProjectData {
  capexItems: CapexItem[];
  opexCashIn: OpexItem[];
  opexCashOut: OpexItem[];
  projectYears: number;
  discountRate: number;
  opexInGrowth: number;
  opexOutGrowth: number;
}

export interface CashFlowData {
  year: number;
  cashFlow: number;
  discountedCashFlow: number;
  cumulativeCashFlow: number;
  discountFactor: number;
}

export interface FinancialMetrics {
  npv: number;
  irr: number;
  paybackPeriod: number;
  totalCapex: number;
  yearlyRevenue: number;
  yearlyExpenses: number;
}

export interface SensitivityResult {
  variable: string;
  npvLow: number;
  npvHigh: number;
  range: number;
}