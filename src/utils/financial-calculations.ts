import { CapexItem, OpexItem, CashFlowData, FinancialMetrics, SensitivityResult, ProjectData } from '@/types/financial';

export const calculateTotal = (item: CapexItem | OpexItem): number => {
  return item.volume * item.price;
};

export const calculateCapexTotal = (capexItems: CapexItem[]): number => {
  return capexItems.reduce((sum, item) => sum + calculateTotal(item), 0);
};

export const calculateYearlyOpexCashIn = (opexCashIn: OpexItem[]): number => {
  return opexCashIn.reduce((sum, item) => sum + calculateTotal(item), 0);
};

export const calculateYearlyOpexCashOut = (opexCashOut: OpexItem[]): number => {
  return opexCashOut.reduce((sum, item) => sum + calculateTotal(item), 0);
};

export const calculateNetCashFlow = (data: ProjectData): number[] => {
  try {
    const { projectYears, capexItems, opexCashIn, opexCashOut, opexInGrowth, opexOutGrowth } = data;

    const capex = calculateCapexTotal(capexItems);
    const baseCashIn = calculateYearlyOpexCashIn(opexCashIn);
    const baseCashOut = calculateYearlyOpexCashOut(opexCashOut);

    const growthIn = opexInGrowth / 100.0;
    const growthOut = opexOutGrowth / 100.0;

    const cashflows = [-capex]; // Year 0

    // Calculate each year with compound growth
    for (let year = 1; year <= projectYears; year++) {
      const cashInYear = baseCashIn * Math.pow(1 + growthIn, year);
      const cashOutYear = baseCashOut * Math.pow(1 + growthOut, year);
      const yearlyNet = cashInYear - cashOutYear;
      cashflows.push(yearlyNet);
    }

    return cashflows;
  } catch (error) {
    console.error('Error calculating net cash flow:', error);
    return [0];
  }
};

export const calculateDiscountFactors = (projectYears: number, discountRate: number): number[] => {
  try {
    const rate = discountRate / 100;
    const factors = [1.0]; // Year 0

    for (let i = 1; i <= projectYears; i++) {
      factors.push(Math.pow(1 + rate, i));
    }

    return factors;
  } catch (error) {
    console.error('Error calculating discount factors:', error);
    return [1.0];
  }
};

export const calculateDiscountedCashFlow = (cashflows: number[], discountFactors: number[]): number[] => {
  return cashflows.map((cf, i) => {
    const df = discountFactors[i];
    return df !== 0 ? cf / df : 0;
  });
};

export const calculateCumulativeCashFlow = (discountedCashflows: number[]): number[] => {
  const cumulative = [];
  let total = 0;

  for (const dcf of discountedCashflows) {
    total += dcf;
    cumulative.push(total);
  }

  return cumulative;
};

export const calculateNPV = (discountedCashflows: number[]): number => {
  return discountedCashflows.reduce((sum, dcf) => sum + dcf, 0);
};

export const calculateIRR = (cashflows: number[]): number => {
  // Newton-Raphson method for IRR calculation
  if (cashflows.length < 2) return 0;

  let guess = 0.1; // 10% initial guess
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0;

    for (let j = 0; j < cashflows.length; j++) {
      npv += cashflows[j] / Math.pow(1 + guess, j);
      dNpv -= j * cashflows[j] / Math.pow(1 + guess, j + 1);
    }

    if (Math.abs(npv) < tolerance) break;

    if (Math.abs(dNpv) < tolerance) {
      // Avoid division by zero, try different guess
      guess = guess > 0 ? -0.9 : 0.9;
      continue;
    }

    guess = guess - npv / dNpv;

    // Prevent divergence
    if (guess < -0.99) guess = -0.99;
    if (guess > 10) guess = 10;
  }

  return guess;
};

export const calculatePaybackPeriod = (cumulativeCashflows: number[]): number => {
  for (let i = 0; i < cumulativeCashflows.length; i++) {
    if (cumulativeCashflows[i] >= 0) {
      if (i === 0) return 0;

      const prevCumulative = cumulativeCashflows[i - 1];
      const currCumulative = cumulativeCashflows[i];

      if (currCumulative - prevCumulative !== 0) {
        const fraction = Math.abs(prevCumulative) / (currCumulative - prevCumulative);
        return (i - 1) + fraction;
      }
    }
  }

  return cumulativeCashflows.length - 1; // If never positive
};

export const calculateFinancialMetrics = (data: ProjectData): FinancialMetrics => {
  const cashflows = calculateNetCashFlow(data);
  const discountFactors = calculateDiscountFactors(data.projectYears, data.discountRate);
  const discountedCashflows = calculateDiscountedCashFlow(cashflows, discountFactors);
  const cumulativeCashflows = calculateCumulativeCashFlow(discountedCashflows);

  return {
    npv: calculateNPV(discountedCashflows),
    irr: calculateIRR(cashflows),
    paybackPeriod: calculatePaybackPeriod(cumulativeCashflows),
    totalCapex: calculateCapexTotal(data.capexItems),
    yearlyRevenue: calculateYearlyOpexCashIn(data.opexCashIn),
    yearlyExpenses: calculateYearlyOpexCashOut(data.opexCashOut),
  };
};

export const calculateCashFlowData = (data: ProjectData): CashFlowData[] => {
  const cashflows = calculateNetCashFlow(data);
  const discountFactors = calculateDiscountFactors(data.projectYears, data.discountRate);
  const discountedCashflows = calculateDiscountedCashFlow(cashflows, discountFactors);
  const cumulativeCashflows = calculateCumulativeCashFlow(discountedCashflows);

  const cashFlowData: CashFlowData[] = [];

  for (let i = 0; i < cashflows.length; i++) {
    cashFlowData.push({
      year: i,
      cashFlow: cashflows[i],
      discountedCashFlow: discountedCashflows[i],
      cumulativeCashFlow: cumulativeCashflows[i],
      discountFactor: discountFactors[i],
    });
  }

  return cashFlowData;
};

export const performSensitivityAnalysis = (data: ProjectData, variation: number = 20): SensitivityResult[] => {
  const variationDecimal = variation / 100;
  const baseCashflows = calculateNetCashFlow(data);
  const baseDiscountFactors = calculateDiscountFactors(data.projectYears, data.discountRate);
  const baseDiscounted = calculateDiscountedCashFlow(baseCashflows, baseDiscountFactors);
  const baseNPV = calculateNPV(baseDiscounted);

  const results: SensitivityResult[] = [];

  // 1. Revenue sensitivity
  const highRevenueData = {
    ...data,
    opexCashIn: data.opexCashIn.map(item => ({
      ...item,
      price: item.price * (1 + variationDecimal)
    }))
  };
  const lowRevenueData = {
    ...data,
    opexCashIn: data.opexCashIn.map(item => ({
      ...item,
      price: item.price * (1 - variationDecimal)
    }))
  };

  const npvRevenueHigh = calculateFinancialMetrics(highRevenueData).npv;
  const npvRevenueLow = calculateFinancialMetrics(lowRevenueData).npv;

  results.push({
    variable: 'Revenue',
    npvLow: npvRevenueLow,
    npvHigh: npvRevenueHigh,
    range: npvRevenueHigh - npvRevenueLow
  });

  // 2. Operating Costs sensitivity
  const highCostData = {
    ...data,
    opexCashOut: data.opexCashOut.map(item => ({
      ...item,
      price: item.price * (1 + variationDecimal)
    }))
  };
  const lowCostData = {
    ...data,
    opexCashOut: data.opexCashOut.map(item => ({
      ...item,
      price: item.price * (1 - variationDecimal)
    }))
  };

  const npvCostHigh = calculateFinancialMetrics(highCostData).npv;
  const npvCostLow = calculateFinancialMetrics(lowCostData).npv;

  results.push({
    variable: 'Operating Costs',
    npvLow: npvCostHigh, // Note: swapped because higher cost = lower NPV
    npvHigh: npvCostLow,
    range: npvCostLow - npvCostHigh
  });

  // 3. Initial Investment (CAPEX) sensitivity
  const highCapexData = {
    ...data,
    capexItems: data.capexItems.map(item => ({
      ...item,
      price: item.price * (1 + variationDecimal)
    }))
  };
  const lowCapexData = {
    ...data,
    capexItems: data.capexItems.map(item => ({
      ...item,
      price: item.price * (1 - variationDecimal)
    }))
  };

  const npvCapexHigh = calculateFinancialMetrics(highCapexData).npv;
  const npvCapexLow = calculateFinancialMetrics(lowCapexData).npv;

  results.push({
    variable: 'Initial Investment',
    npvLow: npvCapexHigh, // Note: swapped
    npvHigh: npvCapexLow,
    range: npvCapexLow - npvCapexHigh
  });

  // 4. Discount Rate sensitivity
  const highRateData = { ...data, discountRate: data.discountRate * (1 + variationDecimal) };
  const lowRateData = { ...data, discountRate: Math.max(0.1, data.discountRate * (1 - variationDecimal)) };

  const npvRateHigh = calculateFinancialMetrics(highRateData).npv;
  const npvRateLow = calculateFinancialMetrics(lowRateData).npv;

  results.push({
    variable: 'Discount Rate',
    npvLow: npvRateHigh, // Note: swapped
    npvHigh: npvRateLow,
    range: npvRateLow - npvRateHigh
  });

  // Sort by range (most sensitive first)
  results.sort((a, b) => b.range - a.range);

  return results;
};