import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  FileText, 
  Printer, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart as PieIcon, 
  Target, 
  Landmark, 
  PiggyBank, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const ReportsPage = () => {
  const { user, formatCurrency } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReport();
    }
  }, [user]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.reports.getComprehensive(user.id);
      setReport(data);
    } catch (err) {
      console.error("Failed to load comprehensive report", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh' }}><h3>Generating Comprehensive Financial Statement...</h3></div>;
  }

  if (!report) {
    return <div style={{ padding: '3rem 1rem', textAlign: 'center' }}><h3>No report data generated.</h3></div>;
  }

  // Chart: Asset Allocation
  const allocation = report.assetAllocation || {};
  const doughnutData = {
    labels: Object.keys(allocation),
    datasets: [{
      data: Object.values(allocation),
      backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'],
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)'
    }]
  };

  // Mock Net Worth Growth Timeline (Jan - Present)
  const nw = report.netWorth || 100000;
  const netWorthTrendData = {
    labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    datasets: [{
      label: 'Net Worth Progression',
      data: [nw * 0.82, nw * 0.86, nw * 0.89, nw * 0.92, nw * 0.95, nw * 0.97, nw],
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      fill: true,
      tension: 0.3
    }]
  };

  return (
    <div className="printable-report-container">
      <style>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .sidebar, .btn, .no-print {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .glass-panel {
            background: #fff !important;
            border: 1px solid #ddd !important;
            color: #000 !important;
            box-shadow: none !important;
          }
          .metric-value {
            color: #000 !important;
            -webkit-text-fill-color: #000 !important;
          }
          .glass-table th, .glass-table td {
            color: #000 !important;
            border-bottom: 1px solid #eee !important;
          }
        }
      `}</style>

      {/* Header with Print action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Financial Reports & Comprehensive Insights</h1>
          <p style={{ margin: 0 }}>
            Official wealth disclosure statement, asset performance breakdown, and net worth trajectory.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={16} />
          <span>Print / Save as PDF Statement</span>
        </button>
      </div>

      {/* Official Statement Banner */}
      <GlassCard style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Comprehensive Wealth & Financial Health Statement
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Client: <strong>{report.clientName}</strong> ({report.clientEmail}) • Risk Appetite: <strong>{report.riskProfile}</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Statement Generated:</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </GlassCard>

      {/* Executive Net Worth & Cash Flow Summary */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Net Worth</span>
          <div className="metric-value" style={{ color: '#38bdf8' }}>{formatCurrency(report.netWorth)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Assets minus Debt</div>
        </GlassCard>

        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Portfolio Current Value</span>
          <div className="metric-value">{formatCurrency(report.currentPortfolioValue)}</div>
          <div style={{ fontSize: '0.8rem', color: report.totalPnL >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            Returns: {report.totalPnL >= 0 ? '+' : ''}{formatCurrency(report.totalPnL)} ({report.totalPnLPercentage}%)
          </div>
        </GlassCard>

        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Liquid Savings</span>
          <div className="metric-value" style={{ color: '#ec4899' }}>{formatCurrency(report.totalSavingsBalance)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            +{formatCurrency(report.totalMonthlyAdditions)}/mo additions
          </div>
        </GlassCard>

        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Debt Liabilities</span>
          <div className="metric-value" style={{ color: '#f87171' }}>{formatCurrency(report.totalDebtRemaining)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            EMI: {formatCurrency(report.totalMonthlyEmiOutflow)}/mo
          </div>
        </GlassCard>
      </div>

      {/* Charts: Net Worth Progression & Allocation */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <GlassCard>
          <h3 style={{ marginBottom: '1rem' }}>Net Worth Growth Trajectory</h3>
          <div style={{ height: '220px' }}>
            <Line 
              data={netWorthTrendData}
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

        <GlassCard>
          <h3 style={{ marginBottom: '1rem' }}>Multi-Asset Diversification Breakdown</h3>
          <div style={{ height: '220px' }}>
            {Object.keys(allocation).length > 0 ? (
              <Doughnut 
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right', labels: { color: '#9ca3af' } } }
                }}
              />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <p>No investment assets recorded yet.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Detailed Investment Performance Statement Table */}
      <GlassCard style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Investment Holdings & Performance Statement</h3>
        {report.holdings && report.holdings.length > 0 ? (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Security / Asset</th>
                <th>Asset Class</th>
                <th>Units</th>
                <th>Avg Buy Price</th>
                <th>Current Price</th>
                <th>Invested Amount</th>
                <th>Current Value</th>
                <th>Total Return (P&L)</th>
              </tr>
            </thead>
            <tbody>
              {report.holdings.map((h, i) => (
                <tr key={i}>
                  <td><strong>{h.assetName}</strong></td>
                  <td><span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{h.assetType}</span></td>
                  <td>{h.quantity}</td>
                  <td>{formatCurrency(h.buyPrice)}</td>
                  <td>{formatCurrency(h.currentPrice)}</td>
                  <td>{formatCurrency(h.investedAmount)}</td>
                  <td><strong>{formatCurrency(h.currentValue)}</strong></td>
                  <td>
                    <span style={{ color: h.pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                      {h.pnl >= 0 ? '+' : ''}{formatCurrency(h.pnl)} ({h.pnlPercentage}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No active holdings logged.</p>
        )}
      </GlassCard>

      {/* Liabilities & Financial Goals Status Grid */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Active Loans */}
        <GlassCard>
          <h3 style={{ marginBottom: '1rem' }}>Active Liabilities & Loan Obligations</h3>
          {report.loans && report.loans.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {report.loans.map(l => (
                <div key={l.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{l.loanName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{l.interestRate}% p.a. • EMI: {formatCurrency(l.emiAmount)}/mo</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
                      {formatCurrency(Math.max(0, l.principalAmount - (l.amountPaid || 0)))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Principal Balance</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Zero debt obligations.</p>
          )}
        </GlassCard>

        {/* Financial Goals */}
        <GlassCard>
          <h3 style={{ marginBottom: '1rem' }}>Financial Goals & Milestone Progress</h3>
          {report.goals && report.goals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {report.goals.map(g => (
                <div key={g.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{g.goalName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Deadline: {new Date(g.targetDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: 'var(--color-secondary)' }}>{formatCurrency(g.targetAmount)}</strong>
                    <div>
                      <span className={`badge ${g.status === 'ACHIEVED' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                        {g.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No active saving targets defined.</p>
          )}
        </GlassCard>
      </div>

      {/* Signature & Disclosure */}
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '1rem 0' }}>
        Unified Investment Platform • Certified Personal Wealth & Investment Planning Engine • Designed for Academic & MCA Final Evaluation
      </div>
    </div>
  );
};

export default ReportsPage;
