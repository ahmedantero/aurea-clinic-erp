const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Enterprise-Grade BI & Analytics Controller for Clinic & Spa ERP
 * Implements high-performance Prisma aggregations, groupBy, _sum, and financial reconciliation.
 */

// ── 1. Shift Closing / Drawer Reconciliation ──────────────────────────────
async function getShiftClosingReport(req, res) {
  try {
    const { date, userId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    // Base filter for the target day
    const invoiceWhere = {
      createdAt: { gte: dayStart, lte: dayEnd },
      ...(userId ? { createdById: userId } : {}),
    };

    // Filter ONLY standalone manual revenues (not double-counting appointment revenues)
    const revenueWhere = {
      date: { gte: dayStart, lte: dayEnd },
      source: 'MANUAL',
      ...(userId ? { createdById: userId } : {}),
    };

    // 1. Prisma groupBy on Invoices by paymentMethod and createdById
    const invoiceGroups = await prisma.invoice.groupBy({
      by: ['payment_method', 'createdById'],
      where: invoiceWhere,
      _sum: {
        net_amount: true,
        discount_applied: true,
        total_amount: true,
      },
      _count: {
        id: true,
      },
    });

    // 2. Prisma groupBy on Manual Revenues by paymentMethod and createdById
    const revenueGroups = await prisma.revenue.groupBy({
      by: ['paymentMethod', 'createdById'],
      where: revenueWhere,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // 3. Cash Drawer Outflows (Petty Cash Expenses paid from drawer on same day)
    const pettyCashExpenses = await prisma.expense.findMany({
      where: {
        expense_date: { gte: dayStart, lte: dayEnd },
        ...(userId ? { createdById: userId } : {}),
        OR: [
          { notes: { contains: 'درج' } },
          { notes: { contains: 'كاش' } },
          { expense_type: { contains: 'نثريات' } },
        ],
      },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
      },
    });

    const totalDrawerOutflows = pettyCashExpenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );

    // 4. Fetch Users to enrich receptionist / cashier data
    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name || u.username]));

    // Aggregate summary per cashier / receptionist
    const drawerByStaff = {};

    invoiceGroups.forEach((group) => {
      const staffKey = group.createdById || 'unassigned';
      const staffName = userMap.get(group.createdById) || 'مجهول / تلقائي';
      const method = group.payment_method || 'CASH';
      const total = Number(group._sum.net_amount || 0);
      const count = group._count.id;

      if (!drawerByStaff[staffKey]) {
        drawerByStaff[staffKey] = {
          staffId: staffKey,
          staffName,
          cash: 0,
          instapay: 0,
          wallet: 0,
          totalInflow: 0,
          invoiceCount: 0,
        };
      }

      drawerByStaff[staffKey].invoiceCount += count;
      drawerByStaff[staffKey].totalInflow += total;

      const isCash = method === 'CASH' || method.includes('كاش');
      const isInstapay = method === 'INSTAPAY' || method.includes('إنستاباي') || method.includes('انستاباي');
      const isWallet = method === 'WALLET' || method.includes('محفظة');

      if (isCash) drawerByStaff[staffKey].cash += total;
      else if (isInstapay) drawerByStaff[staffKey].instapay += total;
      else if (isWallet) drawerByStaff[staffKey].wallet += total;
      else drawerByStaff[staffKey].cash += total;
    });

    // Merge manual revenues into drawer reconciliation
    revenueGroups.forEach((group) => {
      const staffKey = group.createdById || 'unassigned';
      const staffName = userMap.get(group.createdById) || 'مجهول / تلقائي';
      const method = group.paymentMethod || 'CASH';
      const total = Number(group._sum.amount || 0);
      const count = group._count.id;

      if (!drawerByStaff[staffKey]) {
        drawerByStaff[staffKey] = {
          staffId: staffKey,
          staffName,
          cash: 0,
          instapay: 0,
          wallet: 0,
          totalInflow: 0,
          invoiceCount: 0,
        };
      }

      drawerByStaff[staffKey].invoiceCount += count;
      drawerByStaff[staffKey].totalInflow += total;

      const isRevCash = method === 'CASH' || String(method).includes('كاش');
      const isRevInstapay = method === 'INSTAPAY' || String(method).includes('إنستاباي') || String(method).includes('انستاباي');
      const isRevWallet = method === 'WALLET' || String(method).includes('محفظة');

      if (isRevCash) drawerByStaff[staffKey].cash += total;
      else if (isRevInstapay) drawerByStaff[staffKey].instapay += total;
      else if (isRevWallet) drawerByStaff[staffKey].wallet += total;
      else drawerByStaff[staffKey].cash += total;
    });

    const staffDrawers = Object.values(drawerByStaff);
    const totalCash = staffDrawers.reduce((acc, curr) => acc + curr.cash, 0);
    const totalInstaPay = staffDrawers.reduce((acc, curr) => acc + curr.instapay, 0);
    const totalWallet = staffDrawers.reduce((acc, curr) => acc + curr.wallet, 0);
    const grandTotalInflow = totalCash + totalInstaPay + totalWallet;
    const netDrawerCash = totalCash - totalDrawerOutflows;

    return res.json({
      date: targetDate.toISOString().split('T')[0],
      summary: {
        totalCash,
        totalInstaPay,
        totalWallet,
        grandTotalInflow,
        totalDrawerOutflows,
        netDrawerCash,
      },
      staffDrawers,
      pettyCashExpenses,
    });
  } catch (error) {
    console.error('Error in getShiftClosingReport:', error);
    return res.status(500).json({ error: 'Failed to calculate shift closing report', details: error.message });
  }
}

// ── 2. Expenses Breakdown & P&L ───────────────────────────────────────────
async function getExpensesBreakdown(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);

    const whereClause = (startDate || endDate) ? { expense_date: dateFilter } : {};

    // 1. Prisma groupBy to aggregate sum by expense category
    const categoryAggregations = await prisma.expense.groupBy({
      by: ['expense_type'],
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    // 2. Total Expenses
    const totalExpensesAgg = await prisma.expense.aggregate({
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true },
    });

    const totalExpenses = Number(totalExpensesAgg._sum.amount || 0);

    // 3. Petty Cash drawer expenses
    const pettyCashExpenses = await prisma.expense.findMany({
      where: {
        ...whereClause,
        OR: [
          { notes: { contains: 'درج' } },
          { notes: { contains: 'كاش' } },
          { expense_type: { contains: 'نثريات' } },
        ],
      },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
      },
      orderBy: { expense_date: 'desc' },
    });

    const totalPettyCash = pettyCashExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const categories = categoryAggregations.map((cat) => {
      const amount = Number(cat._sum.amount || 0);
      return {
        category: cat.expense_type || 'نثريات عامة',
        amount,
        count: cat._count.id,
        percentage: totalExpenses > 0 ? Number(((amount / totalExpenses) * 100).toFixed(1)) : 0,
      };
    });

    return res.json({
      totalExpenses,
      totalPettyCash,
      categories,
      pettyCashExpenses,
    });
  } catch (error) {
    console.error('Error in getExpensesBreakdown:', error);
    return res.status(500).json({ error: 'Failed to fetch expenses breakdown', details: error.message });
  }
}

// ── 3. Inventory Valuation & COGS (Cost of Goods Sold) ────────────────────
async function getInventoryCOGSReport(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);

    // 1. Warehouse Total Valuation & Low Stock
    const allItems = await prisma.inventoryItem.findMany({
      orderBy: { quantity_in_stock: 'asc' },
    });

    let totalWarehouseValuation = 0;
    let potentialSalesValue = 0;
    const lowStockItems = [];

    allItems.forEach((item) => {
      const qty = Number(item.quantity_in_stock || 0);
      const cost = Number(item.unit_cost || 0);
      const sell = Number(item.selling_price || 0);

      totalWarehouseValuation += qty * cost;
      potentialSalesValue += qty * sell;

      // Threshold <= 10 considered low stock
      if (qty <= 10) {
        lowStockItems.push({
          id: item.id,
          name: item.item_name,
          unitCost: cost,
          sellingPrice: sell,
          quantityInStock: qty,
          unitType: item.unit_type,
          valuation: Math.round(qty * cost * 100) / 100,
          status: qty <= 0 ? 'نفذت الكمية' : 'مخزون حرج',
        });
      }
    });

    // 2. COGS: Cost of Consumables used in Completed Appointments
    const appointmentConsumablesWhere = {
      appointment: {
        status: { in: ['Completed', 'مكتمل'] },
        ...(startDate || endDate ? { appointment_date: dateFilter } : {}),
      },
    };

    const usedConsumables = await prisma.appointmentConsumable.findMany({
      where: appointmentConsumablesWhere,
      include: {
        product: true,
        appointment: {
          select: {
            id: true,
            final_price: true,
            appointment_date: true,
            service: { select: { name: true } },
          },
        },
      },
    });

    let totalConsumablesCost = 0;
    let totalConsumablesCharged = 0;

    usedConsumables.forEach((c) => {
      const qty = Number(c.quantity || 1);
      const cost = Number(c.product?.unit_cost || 0);
      const charged = Number(c.priceCharged || 0);

      totalConsumablesCost += qty * cost;
      totalConsumablesCharged += charged;
    });

    // 3. Internal Dispatches (Direct Clinic consumption)
    const dispatches = await prisma.internalDispatch.findMany({
      where: (startDate || endDate) ? { date: dateFilter } : {},
      include: {
        product: true,
        createdBy: { select: { name: true, username: true } },
      },
      orderBy: { date: 'desc' },
    });

    const totalDispatchesCost = dispatches.reduce(
      (sum, d) => sum + Number(d.totalCost || 0),
      0
    );

    const totalCOGS = totalConsumablesCost + totalDispatchesCost;

    // 4. Completed Service Revenue during the period for Margin Analysis
    const completedInvoices = await prisma.invoice.aggregate({
      where: (startDate || endDate) ? { createdAt: dateFilter } : {},
      _sum: { net_amount: true },
    });

    const totalServiceRevenue = Number(completedInvoices._sum.net_amount || 0);
    const grossProfit = totalServiceRevenue - totalCOGS;
    const grossMarginPercent = totalServiceRevenue > 0
      ? Number(((grossProfit / totalServiceRevenue) * 100).toFixed(1))
      : 0;

    return res.json({
      warehouseValuation: Math.round(totalWarehouseValuation * 100) / 100,
      potentialSalesValue: Math.round(potentialSalesValue * 100) / 100,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      cogsSummary: {
        totalServiceRevenue,
        totalConsumablesCost: Math.round(totalConsumablesCost * 100) / 100,
        totalDispatchesCost: Math.round(totalDispatchesCost * 100) / 100,
        totalCOGS: Math.round(totalCOGS * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossMarginPercent,
      },
      recentDispatches: dispatches.slice(0, 10),
    });
  } catch (error) {
    console.error('Error in getInventoryCOGSReport:', error);
    return res.status(500).json({ error: 'Failed to generate inventory COGS report', details: error.message });
  }
}

// ── 4. Staff Commissions & Comprehensive Payroll ──────────────────────────
async function getStaffCommissionsPayrollReport(req, res) {
  try {
    const { startDate, endDate, monthYear } = req.query;
    const currentMonthYear = monthYear || `${new Date().getMonth() + 1}-${new Date().getFullYear()}`;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);

    // 1. Fetch Staff with Completed Appointments for commission calculation
    const staffMembers = await prisma.staff.findMany({
      include: {
        staffMember: {
          include: {
            transactions: {
              where: (startDate || endDate) ? { date: dateFilter } : {},
            },
          },
        },
        appointments: {
          where: {
            status: { in: ['Completed', 'مكتمل', 'Confirmed', 'مؤكد'] },
            ...(startDate || endDate ? { appointment_date: dateFilter } : {}),
          },
          include: {
            invoice: true,
            consumables: true,
            service: true,
            client: true,
          },
        },
      },
    });

    let grandTotalCommissions = 0;
    let grandTotalBaseSalary = 0;
    let grandTotalNetPayroll = 0;

    const staffPayrollList = staffMembers.map((st) => {
      const appointments = st.appointments || [];
      let totalRevenue = 0;
      let commissionableBase = 0;
      let totalConsumablesDeduction = 0;

      appointments.forEach((apt) => {
        const amt = Number(apt.invoice ? apt.invoice.net_amount : apt.final_price) || 0;
        const consumablesSum = (apt.consumables || []).reduce(
          (cSum, c) => cSum + (Number(c.priceCharged) || 0),
          0
        );
        // Base service price before discount (staff commission is preserved on gross)
        const grossPrice = Number(apt.invoice ? apt.invoice.total_amount : apt.final_price) || 0;
        const base = Math.max(0, grossPrice - consumablesSum);

        totalRevenue += amt;
        commissionableBase += base;
        totalConsumablesDeduction += consumablesSum;
      });

      const commType = st.commission_type || 'نسبة';
      const commValue = Number(st.commission_value) || 0;
      const isPercentage = commType === 'نسبة' || commType.includes('%');
      const isFixedRent = commType === 'ثابت' || commType === 'إيجار' || commType.includes('إيجار');

      let commissionOwed = 0;
      if (isPercentage) {
        commissionOwed = (commissionableBase * commValue) / 100;
      } else if (isFixedRent) {
        commissionOwed = commissionableBase; // Fixed rental agreement
      } else {
        commissionOwed = (commissionableBase * 30) / 100;
      }

      // HR & Payroll records from StaffMember model if linked
      const sm = st.staffMember;
      const baseSalary = sm ? Number(sm.baseSalary || 0) : 0;

      // Aggregations on transactions (Advances, Deductions, Bonuses)
      const transactions = sm?.transactions || [];
      const totalAdvances = transactions
        .filter((t) => t.type === 'ADVANCE')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalDeductions = transactions
        .filter((t) => t.type === 'DEDUCTION')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalBonuses = transactions
        .filter((t) => t.type === 'BONUS')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Formula: Base Salary + Commissions + Bonuses - Deductions - Advances
      const netPayable = Math.max(
        0,
        baseSalary + commissionOwed + totalBonuses - totalDeductions - totalAdvances
      );

      grandTotalCommissions += commissionOwed;
      grandTotalBaseSalary += baseSalary;
      grandTotalNetPayroll += netPayable;

      return {
        id: st.id,
        staffMemberId: sm?.id || null,
        name: st.name,
        specialty: st.specialty,
        role: sm?.role || 'مختص',
        commissionType: commType,
        commissionValue: commValue,
        sessionsCount: appointments.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        commissionableBase: Math.round(commissionableBase * 100) / 100,
        commissionOwed: Math.round(commissionOwed * 100) / 100,
        baseSalary: Math.round(baseSalary * 100) / 100,
        totalBonuses: Math.round(totalBonuses * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalAdvances: Math.round(totalAdvances * 100) / 100,
        netPayable: Math.round(netPayable * 100) / 100,
      };
    });

    return res.json({
      period: {
        startDate: startDate || '',
        endDate: endDate || '',
        monthYear: currentMonthYear,
      },
      summary: {
        totalStaff: staffMembers.length,
        grandTotalCommissions: Math.round(grandTotalCommissions * 100) / 100,
        grandTotalBaseSalary: Math.round(grandTotalBaseSalary * 100) / 100,
        grandTotalNetPayroll: Math.round(grandTotalNetPayroll * 100) / 100,
      },
      staffPayrollList,
    });
  } catch (error) {
    console.error('Error in getStaffCommissionsPayrollReport:', error);
    return res.status(500).json({ error: 'Failed to generate staff payroll report', details: error.message });
  }
}

// ── 5. Master BI Dashboard Aggregation ────────────────────────────────────
async function getMasterBIDashboard(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);

    const hasDate = Boolean(startDate || endDate);

    // 1. Revenue aggregations
    const invoicesAgg = await prisma.invoice.aggregate({
      where: hasDate ? { createdAt: dateFilter } : {},
      _sum: { net_amount: true, discount_applied: true },
      _count: { id: true },
    });

    // Only aggregate standalone manual revenues to prevent double-counting appointment revenues
    const manualRevenueAgg = await prisma.revenue.aggregate({
      where: {
        source: 'MANUAL',
        ...(hasDate ? { date: dateFilter } : {}),
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const totalInvoiceRevenue = Number(invoicesAgg._sum.net_amount || 0);
    const totalManualRevenue = Number(manualRevenueAgg._sum.amount || 0);
    const grandTotalRevenue = totalInvoiceRevenue + totalManualRevenue;

    // 2. Expenses aggregations
    const expensesAgg = await prisma.expense.aggregate({
      where: hasDate ? { expense_date: dateFilter } : {},
      _sum: { amount: true },
      _count: { id: true },
    });
    const totalExpenses = Number(expensesAgg._sum.amount || 0);

    // 3. Daily trend for AreaChart
    const recentInvoices = await prisma.invoice.findMany({
      where: hasDate ? { createdAt: dateFilter } : {},
      select: { createdAt: true, net_amount: true },
      orderBy: { createdAt: 'asc' },
    });

    const recentManualRevenues = await prisma.revenue.findMany({
      where: {
        source: 'MANUAL',
        ...(hasDate ? { date: dateFilter } : {}),
      },
      select: { date: true, amount: true },
      orderBy: { date: 'asc' },
    });

    const recentExpenses = await prisma.expense.findMany({
      where: hasDate ? { expense_date: dateFilter } : {},
      select: { expense_date: true, amount: true },
      orderBy: { expense_date: 'asc' },
    });

    const dailyTrendMap = {};
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    recentInvoices.forEach((inv) => {
      const dStr = inv.createdAt.toISOString().split('T')[0];
      if (!dailyTrendMap[dStr]) {
        const dObj = new Date(inv.createdAt);
        dailyTrendMap[dStr] = {
          date: dStr,
          dayName: arabicDays[dObj.getDay()] || '',
          revenue: 0,
          expenses: 0,
          netProfit: 0,
        };
      }
      dailyTrendMap[dStr].revenue += Number(inv.net_amount || 0);
    });

    recentManualRevenues.forEach((rev) => {
      const dStr = rev.date.toISOString().split('T')[0];
      if (!dailyTrendMap[dStr]) {
        const dObj = new Date(rev.date);
        dailyTrendMap[dStr] = {
          date: dStr,
          dayName: arabicDays[dObj.getDay()] || '',
          revenue: 0,
          expenses: 0,
          netProfit: 0,
        };
      }
      dailyTrendMap[dStr].revenue += Number(rev.amount || 0);
    });

    recentExpenses.forEach((exp) => {
      const dStr = exp.expense_date.toISOString().split('T')[0];
      if (!dailyTrendMap[dStr]) {
        const dObj = new Date(exp.expense_date);
        dailyTrendMap[dStr] = {
          date: dStr,
          dayName: arabicDays[dObj.getDay()] || '',
          revenue: 0,
          expenses: 0,
          netProfit: 0,
        };
      }
      dailyTrendMap[dStr].expenses += Number(exp.amount || 0);
    });

    const dailyTrend = Object.values(dailyTrendMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        revenue: Math.round(item.revenue),
        expenses: Math.round(item.expenses),
        netProfit: Math.round(item.revenue - item.expenses),
      }));

    // 4. Expenses Category Breakdown (Donut Chart)
    const expenseCategories = await prisma.expense.groupBy({
      by: ['expense_type'],
      where: hasDate ? { expense_date: dateFilter } : {},
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const expensesPieData = expenseCategories.map((c) => ({
      name: c.expense_type || 'نثريات',
      value: Math.round(Number(c._sum.amount || 0)),
    }));

    // 5. Top Services & Providers
    const topAppointments = await prisma.appointment.findMany({
      where: {
        status: { in: ['Completed', 'مكتمل'] },
        ...(hasDate ? { appointment_date: dateFilter } : {}),
      },
      include: {
        service: true,
        staff: true,
        invoice: true,
      },
    });

    const serviceMap = {};
    const staffMap = {};

    topAppointments.forEach((apt) => {
      const rev = Number(apt.invoice ? apt.invoice.net_amount : apt.final_price) || 0;
      const sName = apt.service?.name || 'خدمة عامة';
      const docName = apt.staff?.name || 'مختص غير مسجل';

      if (!serviceMap[sName]) serviceMap[sName] = { name: sName, revenue: 0, count: 0 };
      serviceMap[sName].revenue += rev;
      serviceMap[sName].count += 1;

      if (!staffMap[docName]) staffMap[docName] = { name: docName, revenue: 0, count: 0 };
      staffMap[docName].revenue += rev;
      staffMap[docName].count += 1;
    });

    const topServices = Object.values(serviceMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topStaff = Object.values(staffMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 6. Net Profit
    const netProfit = grandTotalRevenue - totalExpenses;
    const profitMargin = grandTotalRevenue > 0
      ? Number(((netProfit / grandTotalRevenue) * 100).toFixed(1))
      : 0;

    return res.json({
      period: { startDate: startDate || '', endDate: endDate || '' },
      kpis: {
        totalRevenue: Math.round(grandTotalRevenue),
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        profitMargin,
        invoicesCount: (invoicesAgg._count.id || 0) + (manualRevenueAgg._count.id || 0),
      },
      dailyTrend,
      expensesPieData,
      topServices,
      topStaff,
    });
  } catch (error) {
    console.error('Error in getMasterBIDashboard:', error);
    return res.status(500).json({ error: 'Failed to generate master BI dashboard', details: error.message });
  }
}

module.exports = {
  getShiftClosingReport,
  getExpensesBreakdown,
  getInventoryCOGSReport,
  getStaffCommissionsPayrollReport,
  getMasterBIDashboard,
};
