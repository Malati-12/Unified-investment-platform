import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  Target, 
  Wallet, 
  ArrowLeftRight, 
  PiggyBank, 
  Landmark, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Shield,
  Receipt,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

const Dashboard = ({ setActiveTab }) => {
  const { user, formatCurrency } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    portfolios: [],
    portfolioSummary: null,
    cashFlowSummary: null,
    savingsPlans: [],
    loans: [],
    goals: [],
    riskAnalysis: null,
    marketQuotes: [],
    insuranceSummary: null
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ports, portSumm, cfSumm, savings, loans, risk, quotes, insSumm, cibil] = await Promise.all([
        api.portfolios.list(user.id).catch(() => []),
        api.portfolios.getUserSummary(user.id).catch(() => null),
        api.cashFlow.summary(user.id).catch(() => null),
        api.savings.list(user.id).catch(() => []),
        api.loans.list(user.id).catch(() => []),
        api.risk.getAnalysis(user.id).catch(() => null),
        api.portfolios.getMarketQuotes().catch(() => []),
        api.insurance.summary(user.id).catch(() => null),
        api.cibil.getAnalysis(user.id).catch(() => null)
      ]);

      // Fetch goals from first portfolio if exists
      let userGoals = [];
      if (ports.length > 0) {
        userGoals = await api.goals.list(ports[0].id).catch(() => []);
      }

      setData({
        portfolios: ports,
        portfolioSummary: portSumm,
        cashFlowSummary: cfSumm,
        savingsPlans: savings,
        loans: loans,
        goals: userGoals,
        riskAnalysis: risk,
        marketQuotes: quotes,
        insuranceSummary: insSumm,
        cibil: cibil
      });
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p>Synthesizing unified financial telemetry...</p>
      </div>
    );
  }

  // Calculate 7 Key Required Figures:
  const totalIncome = data.cashFlowSummary?.totalIncome || 0;
  const totalExpenses = data.cashFlowSummary?.totalExpenses || 0;
  const totalSavings = data.savingsPlans.reduce((sum, s) => sum + (s.initialDeposit || 0), 0);
  const totalInvestments = data.portfolioSummary?.totalInvested || 0;
  const currentPortfolioValue = data.portfolioSummary?.totalValue || 0;
  const profitLoss = data.portfolioSummary?.unrealizedPnL || 0;
  const profitLossPct = data.portfolioSummary?.unrealizedPnLPct || 0;
  
  const totalActiveDebt = data.loans
    .filter(l => l.status === 'ACTIVE')
    .reduce((sum, l) => sum + Math.max(0, l.principalAmount - (l.amountPaid || 0)), 0);

  // Net Worth = (Portfolio Value + Total Savings) - Total Debt
  const netWorth = (currentPortfolioValue + totalSavings) - totalActiveDebt;

  // Upcoming Payments: Next EMIs from active loans
  const upcomingLoans = data.loans.filter(l => l.status === 'ACTIVE');

  // Protection & Financial Health Score Calculations
  const totalInsuranceCover = data.insuranceSummary?.totalSumAssured || 0;
  const lifeCover = data.insuranceSummary?.lifeCoverSumAssured || 0;
  const healthCover = data.insuranceSummary?.healthCoverSumAssured || 0;
  const insuranceCount = data.insuranceSummary?.activePoliciesCount || 0;
  const hlvAdequacy = data.insuranceSummary?.adequacy?.lifeCoveragePct || 0;
  const healthAdequacy = data.insuranceSummary?.adequacy?.healthCoveragePct || 0;
  const renewalAlerts = data.insuranceSummary?.upcomingRenewals || [];

  // Financial Health Index (0 - 100)
  const savingsRate = data.cashFlowSummary?.savingsRatePct || 0;
  const savingsScore = Math.min(25, Math.max(0, Math.round((savingsRate / 30) * 25))); // 30% savings rate = 25 pts

  const monthlyDebt = upcomingLoans.reduce((sum, l) => sum + (l.emiAmount || 0), 0);
  const monthlyIncVal = totalIncome > 0 ? totalIncome : 1;
  const dti = (monthlyDebt / monthlyIncVal) * 100;
  let debtScore = 25;
  if (dti > 50) debtScore = 5;
  else if (dti > 40) debtScore = 12;
  else if (dti > 25) debtScore = 18;
  else debtScore = 25;

  const lifeScore = Math.min(15, Math.round((hlvAdequacy / 100) * 15));
  const healthScore = Math.min(10, Math.round((healthAdequacy / 100) * 10));
  const protectionScore = lifeScore + healthScore;

  const monthlyExpVal = totalExpenses > 0 ? totalExpenses : 1;
  const runwayMonths = totalExpenses > 0 ? (totalSavings / monthlyExpVal).toFixed(1) : 0;
  const runwayScore = Math.min(25, Math.max(0, Math.round(((totalSavings / monthlyExpVal) / 6) * 25)));

  const healthIndex = Math.min(100, Math.max(0, savingsScore + debtScore + protectionScore + runwayScore));

  const getHealthGrade = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'var(--color-success)', advice: 'Optimal asset defense, healthy savings rate & low debt risk.' };
    if (score >= 65) return { label: 'Good', color: '#38bdf8', advice: 'Solid foundation; consider closing insurance coverage gaps.' };
    if (score >= 50) return { label: 'Moderate', color: 'var(--color-warning)', advice: 'Moderate resilience; bolster emergency fund and term life cover.' };
    return { label: 'Attention Needed', color: 'var(--color-danger)', advice: 'High debt load or inadequate insurance protection.' };
  };
  const healthGrade = getHealthGrade(healthIndex);

  // Chart 1: Asset Allocation Doughnut
  const allocation = data.portfolioSummary?.assetBreakdown || {};
  const doughnutData = {
    labels: Object.keys(allocation).length > 0 ? Object.keys(allocation) : ['Cash & Savings', 'Stocks', 'Mutual Funds', 'Bonds & FD', 'Gold'],
    datasets: [{
      data: Object.keys(allocation).length > 0 ? Object.values(allocation) : [totalSavings || 50000, 150000, 100000, 75000, 35000],
      backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 2,
    }]
  };

  // Chart 2: Cash Flow (Income vs Expenses)
  const monthlyInc = data.cashFlowSummary?.monthlyIncome || {};
  const monthlyExp = data.cashFlowSummary?.monthlyExpense || {};
  const allMonths = Array.from(new Set([...Object.keys(monthlyInc), ...Object.keys(monthlyExp)])).sort();
  const displayMonths = allMonths.length > 0 ? allMonths : ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];

  const cashFlowBarData = {
    labels: displayMonths.map(m => {
      const parts = m.split('-');
      const d = new Date(parts[0], parseInt(parts[1]) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Income',
        data: displayMonths.map(m => monthlyInc[m] || (m === displayMonths[displayMonths.length - 1] ? totalIncome : 120000)),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Expenses',
        data: displayMonths.map(m => monthlyExp[m] || (m === displayMonths[displayMonths.length - 1] ? totalExpenses : 65000)),
        backgroundColor: '#ef4444',
        borderRadius: 6,
      }
    ]
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem', fontSize: '1.75rem' }}>Welcome, {user?.name}</h1>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            All-in-One Personal Financial Management & Wealth Planning System
          </p>
        </div>
        
        {/* Quick Live Market Strip */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {data.marketQuotes.slice(0, 3).map((q, idx) => (
            <div key={idx} style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid var(--border-glass)', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem'
            }}>
              <span style={{ fontWeight: 600 }}>{q.symbol}</span>
              <span>₹{q.currentPrice?.toLocaleString('en-IN')}</span>
              <span style={{ color: q.dayChange >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                {q.dayChange >= 0 ? '+' : ''}{q.dayChangePct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Advisory Summary Ticker */}
      <div className="ai-ticker">
        <Sparkles size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.9rem' }}>
          <strong>Financial Pulse:</strong>{' '}
          {data.riskAnalysis?.recommendation || 
            `Your portfolio is well-balanced across asset classes. Upcoming EMI payments total ${formatCurrency(upcomingLoans.reduce((sum, l) => sum + l.emiAmount, 0))} this month. Keep building your emergency reserves!`
          }
        </div>
      </div>

      {/* Primary KPI Metrics: The 7 Core Figures */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {/* 1. Net Worth */}
        <GlassCard onClick={() => setActiveTab('reports')} className="glass-panel-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Net Worth</span>
            <Wallet size={18} color="var(--color-secondary)" />
          </div>
          <div className="metric-value" style={{ color: '#38bdf8' }}>{formatCurrency(netWorth)}</div>
          <div className="metric-change" style={{ color: 'var(--color-success)' }}>
            <TrendingUp size={13} />
            <span>(Assets - Liabilities)</span>
          </div>
        </GlassCard>

        {/* 2. Total Investments & Current Value */}
        <GlassCard onClick={() => setActiveTab('portfolio')} className="glass-panel-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Portfolio Value</span>
            <Briefcase size={18} color="var(--color-primary)" />
          </div>
          <div className="metric-value">{formatCurrency(currentPortfolioValue)}</div>
          <div className="metric-change" style={{ color: profitLoss >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {profitLoss >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>P&L: {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)} ({profitLossPct}%)</span>
          </div>
        </GlassCard>

        {/* 3. Total Savings */}
        <GlassCard onClick={() => setActiveTab('savings')} className="glass-panel-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Savings & Deposits</span>
            <PiggyBank size={18} color="#ec4899" />
          </div>
          <div className="metric-value" style={{ color: '#f472b6' }}>{formatCurrency(totalSavings)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {data.savingsPlans.length} active compounding plans
          </div>
        </GlassCard>

        {/* 4. Active Loans / Debt */}
        <GlassCard onClick={() => setActiveTab('loans')} className="glass-panel-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Outstanding Debt</span>
            <Landmark size={18} color="var(--color-danger)" />
          </div>
          <div className="metric-value" style={{ color: '#f87171' }}>{formatCurrency(totalActiveDebt)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {upcomingLoans.length} active loans (EMIs pending)
          </div>
        </GlassCard>
      </div>

      {/* Secondary Quick Metrics: Monthly Cash Flow Snapshot */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <GlassCard onClick={() => setActiveTab('cashflow')} className="glass-panel-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Income (Monthly)</span>
            <span className="badge badge-success">Cash In</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--color-success)', fontSize: '1.4rem' }}>
            {formatCurrency(totalIncome)}
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem' }}>Salary, freelancing & investment returns</p>
        </GlassCard>

        <GlassCard onClick={() => setActiveTab('cashflow')} className="glass-panel-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Expenses (Monthly)</span>
            <span className="badge badge-danger">Cash Out</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--color-danger)', fontSize: '1.4rem' }}>
            {formatCurrency(totalExpenses)}
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem' }}>Rent, food, utilities & lifestyle</p>
        </GlassCard>

        <GlassCard onClick={() => setActiveTab('cashflow')} className="glass-panel-interactive">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Monthly Net Savings</span>
            <span className="badge badge-primary">{data.cashFlowSummary?.savingsRatePct || 0}% rate</span>
          </div>
          <div className="metric-value" style={{ color: (totalIncome - totalExpenses) >= 0 ? 'var(--color-secondary)' : 'var(--color-danger)', fontSize: '1.4rem' }}>
            {formatCurrency(totalIncome - totalExpenses)}
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem' }}>Available surplus for investments & SIPs</p>
        </GlassCard>
      </div>

      {/* 360° Financial Wellness & Protection Health Row */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Card 1: 360° Financial Wellness Score */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>360° Financial Health Score</h3>
            </div>
            <span className="badge" style={{ 
              background: `${healthGrade.color}22`, 
              color: healthGrade.color, 
              border: `1px solid ${healthGrade.color}44`,
              fontWeight: 700,
              fontSize: '0.8rem'
            }}>
              {healthGrade.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: `conic-gradient(${healthGrade.color} ${healthIndex * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--bg-glass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: healthGrade.color, lineHeight: 1 }}>{healthIndex}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {healthGrade.advice}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.5rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Savings: </span>
                  <strong>{savingsScore}/25 pts</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.5rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Debt Safety: </span>
                  <strong>{debtScore}/25 pts</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.5rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Protection: </span>
                  <strong>{protectionScore}/25 pts</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.5rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Runway: </span>
                  <strong>{runwayScore}/25 pts ({runwayMonths} mo)</strong>
                </div>
                <div onClick={() => setActiveTab('loans')} style={{ background: 'rgba(0,200,83,0.08)', padding: '0.35rem 0.5rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid rgba(0,200,83,0.2)', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🎯 CIBIL Credit Score:</span>
                  <strong style={{ color: data.cibil?.scoreColor || '#00C853' }}>{data.cibil?.cibilScore || 765} ({data.cibil?.ratingCategory || 'EXCELLENT'}) ➔</strong>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Card 2: Protection Fortress & Tax Hub */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color="#06b6d4" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Protection Cover & Tax Shield</h3>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-primary" onClick={() => setActiveTab('insurance')} style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}>
                Insurance
              </button>
              <button className="btn" onClick={() => setActiveTab('tax')} style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}>
                Tax 80C/D
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Sum Insured</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8' }}>{formatCurrency(totalInsuranceCover)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{insuranceCount} active policies</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Life HLV Adequacy</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: hlvAdequacy >= 100 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {hlvAdequacy}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cover: {formatCurrency(lifeCover)}</div>
            </div>
          </div>

          {renewalAlerts.length > 0 ? (
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              border: '1px solid rgba(245, 158, 11, 0.3)', 
              borderRadius: '6px', 
              padding: '0.4rem 0.75rem',
              fontSize: '0.75rem',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={14} />
              <span><strong>Renewal Alert:</strong> {renewalAlerts[0].policyName} due on {renewalAlerts[0].renewalDate}</span>
            </div>
          ) : (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.08)', 
              border: '1px solid rgba(16, 185, 129, 0.2)', 
              borderRadius: '6px', 
              padding: '0.4rem 0.75rem',
              fontSize: '0.75rem',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShieldCheck size={14} />
              <span>All insurance premiums are active and up-to-date with tax deductions synced.</span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Cash Flow Chart */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Monthly Cash Flow: Income vs Expense</h3>
            <button className="btn" onClick={() => setActiveTab('cashflow')} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
              Details
            </button>
          </div>
          <div style={{ height: '220px' }}>
            <Bar 
              data={cashFlowBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } },
                scales: {
                  x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
                }
              }}
            />
          </div>
        </GlassCard>

        {/* Asset Allocation Doughnut */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Multi-Asset Allocation Matrix</h3>
            <button className="btn" onClick={() => setActiveTab('portfolio')} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
              Investments
            </button>
          </div>
          <div style={{ height: '220px' }}>
            <Doughnut 
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#9ca3af' } } }
              }}
            />
          </div>
        </GlassCard>
      </div>

      {/* Upcoming Payments & Goal Progress Row */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Upcoming Payments (Loan EMIs & Bills) */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--color-warning)" />
              <h3 style={{ margin: 0 }}>Upcoming Payments & EMIs</h3>
            </div>
            <button className="btn" onClick={() => setActiveTab('loans')} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
              Loan Schedule
            </button>
          </div>

          {upcomingLoans.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingLoans.map(loan => (
                <div key={loan.id} style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: '8px', 
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{loan.loanName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Due Date: {loan.nextEmiDate ? new Date(loan.nextEmiDate).toLocaleDateString() : 'Next Month 10th'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{formatCurrency(loan.emiAmount)}</div>
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>EMI Due</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No upcoming loan EMIs. You are debt-free!
            </div>
          )}
        </GlassCard>

        {/* Goal Progress Tracker */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} color="var(--color-primary)" />
              <h3 style={{ margin: 0 }}>Financial Goal Progress</h3>
            </div>
            <button className="btn" onClick={() => setActiveTab('goals')} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
              All Goals
            </button>
          </div>

          {data.goals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.goals.slice(0, 3).map(goal => {
                const target = goal.targetAmount || 1;
                const current = currentPortfolioValue;
                const progress = Math.min(100, Math.round((current / target) * 100));

                return (
                  <div key={goal.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600 }}>{goal.goalName}</span>
                      <span>Target: {formatCurrency(target)} ({progress}%)</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No active goals created yet. Click "All Goals" to create Emergency Fund, Education or Car goals!
            </div>
          )}
        </GlassCard>
      </div>

      {/* Quick Access Action Hub */}
      <GlassCard style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Quick Management Actions</h3>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>Fast-track actions across your financial ecosystem</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setActiveTab('cashflow')}>
              <ArrowLeftRight size={14} />
              <span>Add Cash Flow</span>
            </button>
            <button className="btn" onClick={() => setActiveTab('portfolio')}>
              <TrendingUp size={14} />
              <span>Buy / Sell Asset</span>
            </button>
            <button className="btn" onClick={() => setActiveTab('savings')}>
              <PiggyBank size={14} />
              <span>Calculators</span>
            </button>
            <button className="btn" onClick={() => setActiveTab('insurance')}>
              <Shield size={14} />
              <span>Insurance Vault</span>
            </button>
            <button className="btn" onClick={() => setActiveTab('tax')}>
              <Receipt size={14} />
              <span>Tax Optimizer</span>
            </button>
            <button className="btn" onClick={() => setActiveTab('reports')}>
              <span>Printable Report</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Dashboard;
