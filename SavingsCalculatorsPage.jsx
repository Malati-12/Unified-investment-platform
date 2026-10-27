import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  PiggyBank, 
  Calculator, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Coins, 
  Calendar, 
  Percent, 
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SavingsCalculatorsPage = () => {
  const { user, formatCurrency } = useAuth();
  const [activeTab, setActiveTab] = useState('tracker'); // tracker vs calculators
  const [savingsPlans, setSavingsPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Live Savings Calculation state (Addresses Mam's exact requirement!)
  const [liveCalc, setLiveCalc] = useState({
    initialDeposit: 50000,
    monthlyAddition: 5000,
    interestRate: 7.0,
    periodYears: 2
  });
  const [calcResult, setCalcResult] = useState(null);

  // Financial Calculators State
  const [calculatorType, setCalculatorType] = useState('sip'); // sip, fd, rd, simple, compound, emi
  const [calcInputs, setCalcInputs] = useState({
    sipMonthly: 10000,
    sipRate: 12,
    sipYears: 10,

    fdPrincipal: 200000,
    fdRate: 7.1,
    fdYears: 3,

    rdMonthly: 5000,
    rdRate: 6.8,
    rdMonths: 24,

    simplePrincipal: 100000,
    simpleRate: 8,
    simpleYears: 2,

    compoundPrincipal: 100000,
    compoundRate: 8,
    compoundYears: 3,
    compoundFreq: 12,

    emiPrincipal: 500000,
    emiRate: 9.5,
    emiMonths: 36
  });

  const [activeCalculatorResult, setActiveCalculatorResult] = useState(null);

  // New Savings Plan Form
  const [newPlan, setNewPlan] = useState({
    accountName: 'HDFC High-Yield Compounding',
    initialDeposit: 50000,
    monthlyAddition: 5000,
    interestRate: 7.0,
    periodYears: 2,
    notes: 'Primary liquid savings reserve'
  });

  useEffect(() => {
    if (user) {
      loadSavingsPlans();
      runLiveSavingsCalculation(liveCalc.initialDeposit, liveCalc.monthlyAddition, liveCalc.interestRate, liveCalc.periodYears);
    }
  }, [user]);

  useEffect(() => {
    computeActiveCalculator();
  }, [calculatorType, calcInputs]);

  const loadSavingsPlans = async () => {
    setLoading(true);
    try {
      const data = await api.savings.list(user.id);
      setSavingsPlans(data);
    } catch (err) {
      console.error("Failed to load savings plans", err);
    } finally {
      setLoading(false);
    }
  };

  const runLiveSavingsCalculation = async (init, monthly, rate, years) => {
    try {
      const res = await api.savings.calculateGrowth(
        parseFloat(init) || 0,
        parseFloat(monthly) || 0,
        parseFloat(rate) || 0,
        parseInt(years) || 1
      );
      setCalcResult(res);
    } catch (err) {
      console.error("Savings computation failed", err);
    }
  };

  const computeActiveCalculator = async () => {
    try {
      let res;
      switch (calculatorType) {
        case 'sip':
          res = await api.savings.runCalculator('sip', {
            monthlyInvestment: calcInputs.sipMonthly,
            expectedReturnRate: calcInputs.sipRate,
            tenureYears: calcInputs.sipYears
          });
          break;
        case 'fd':
          res = await api.savings.runCalculator('fd', {
            principal: calcInputs.fdPrincipal,
            interestRate: calcInputs.fdRate,
            tenureYears: calcInputs.fdYears
          });
          break;
        case 'rd':
          res = await api.savings.runCalculator('rd', {
            monthlyDeposit: calcInputs.rdMonthly,
            interestRate: calcInputs.rdRate,
            tenureMonths: calcInputs.rdMonths
          });
          break;
        case 'simple':
          res = await api.savings.runCalculator('simple-interest', {
            principal: calcInputs.simplePrincipal,
            rate: calcInputs.simpleRate,
            timeYears: calcInputs.simpleYears
          });
          break;
        case 'compound':
          res = await api.savings.runCalculator('compound-interest', {
            principal: calcInputs.compoundPrincipal,
            rate: calcInputs.compoundRate,
            timeYears: calcInputs.compoundYears,
            frequency: calcInputs.compoundFreq
          });
          break;
        case 'emi':
          res = await api.savings.runCalculator('emi', {
            principal: calcInputs.emiPrincipal,
            interestRate: calcInputs.emiRate,
            tenureMonths: calcInputs.emiMonths
          });
          break;
        default:
          break;
      }
      setActiveCalculatorResult(res);
    } catch (err) {
      console.error("Calculator evaluation error", err);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await api.savings.create({
        userId: user.id,
        accountName: newPlan.accountName,
        initialDeposit: parseFloat(newPlan.initialDeposit),
        monthlyAddition: parseFloat(newPlan.monthlyAddition),
        interestRate: parseFloat(newPlan.interestRate),
        periodYears: parseInt(newPlan.periodYears),
        notes: newPlan.notes
      });
      setShowAddModal(false);
      await loadSavingsPlans();
    } catch (err) {
      console.error("Error creating plan", err);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this savings plan?")) return;
    try {
      await api.savings.delete(id);
      await loadSavingsPlans();
    } catch (err) {
      console.error("Error deleting plan", err);
    }
  };

  // Line chart data for live savings calculation
  const lineChartData = {
    labels: calcResult?.yearlyProjections ? calcResult.yearlyProjections.map(y => `Year ${y.year}`) : ['Year 1', 'Year 2'],
    datasets: [
      {
        label: 'Total Invested',
        data: calcResult?.yearlyProjections ? calcResult.yearlyProjections.map(y => y.investedAmount) : [110000, 170000],
        borderColor: '#9ca3af',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.3
      },
      {
        label: 'Estimated Future Value',
        data: calcResult?.yearlyProjections ? calcResult.yearlyProjections.map(y => y.futureValue) : [115000, 182500],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        tension: 0.3
      }
    ]
  };

  return (
    <div>
      {/* Title & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Savings & Interest Engine</h1>
          <p style={{ margin: 0 }}>
            Compound interest projections, periodic additions, and a comprehensive suite of financial calculators.
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${activeTab === 'tracker' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            <PiggyBank size={16} />
            <span>Savings & Growth Planner</span>
          </button>
          <button 
            className={`btn ${activeTab === 'calculators' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('calculators')}
          >
            <Calculator size={16} />
            <span>Financial Calculators Suite</span>
          </button>
        </div>
      </div>

      {activeTab === 'tracker' ? (
        <>
          {/* Requirement Highlight Box */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)', 
            border: '1px solid rgba(99, 102, 241, 0.3)', 
            borderRadius: '12px', 
            padding: '1rem 1.25rem', 
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Sparkles size={24} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                ⭐ Core Requirement: Interactive Savings Compounding Engine
              </strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Test any scenario: E.g., Savings: <strong>₹50,000</strong>, Monthly addition: <strong>₹5,000</strong>, Interest: <strong>7%</strong>, Period: <strong>2 years</strong>. The engine calculates future value and interest earned in real time!
              </div>
            </div>
          </div>

          {/* Interactive Calculation Simulator */}
          <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
            {/* Input Controls */}
            <GlassCard>
              <h3 style={{ marginBottom: '1rem' }}>Savings Growth Simulator</h3>
              
              <div className="form-group">
                <label className="form-label">Initial Savings Balance (₹): {formatCurrency(liveCalc.initialDeposit)}</label>
                <input 
                  type="range"
                  min="0"
                  max="1000000"
                  step="5000"
                  value={liveCalc.initialDeposit}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setLiveCalc({ ...liveCalc, initialDeposit: val });
                    runLiveSavingsCalculation(val, liveCalc.monthlyAddition, liveCalc.interestRate, liveCalc.periodYears);
                  }}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Addition (₹): {formatCurrency(liveCalc.monthlyAddition)}/month</label>
                <input 
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={liveCalc.monthlyAddition}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setLiveCalc({ ...liveCalc, monthlyAddition: val });
                    runLiveSavingsCalculation(liveCalc.initialDeposit, val, liveCalc.interestRate, liveCalc.periodYears);
                  }}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Annual Interest Rate (%): {liveCalc.interestRate}%</label>
                  <input 
                    type="range"
                    min="3.0"
                    max="15.0"
                    step="0.1"
                    value={liveCalc.interestRate}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setLiveCalc({ ...liveCalc, interestRate: val });
                      runLiveSavingsCalculation(liveCalc.initialDeposit, liveCalc.monthlyAddition, val, liveCalc.periodYears);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time Period: {liveCalc.periodYears} Years</label>
                  <input 
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={liveCalc.periodYears}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setLiveCalc({ ...liveCalc, periodYears: val });
                      runLiveSavingsCalculation(liveCalc.initialDeposit, liveCalc.monthlyAddition, liveCalc.interestRate, val);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </GlassCard>

            {/* Results Display */}
            <GlassCard>
              <h3 style={{ marginBottom: '1rem' }}>Projected Future Value</h3>
              {calcResult && (
                <div>
                  <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Future Wealth</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                      {formatCurrency(calcResult.estimatedFutureValue)}
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Amount Invested</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(calcResult.totalInvested)}</div>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Interest Earned</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-success)' }}>
                        +{formatCurrency(calcResult.totalInterestEarned)}
                      </div>
                    </div>
                  </div>

                  {/* Growth Curve Chart */}
                  <div style={{ height: '180px' }}>
                    <Line 
                      data={lineChartData}
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
                </div>
              )}
            </GlassCard>
          </div>

          {/* Active Savings Accounts Grid */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Registered Savings Plans ({savingsPlans.length})</h3>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                <span>Add Savings Account</span>
              </button>
            </div>

            {savingsPlans.length > 0 ? (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Account Name</th>
                    <th>Initial Deposit</th>
                    <th>Monthly Addition</th>
                    <th>Interest Rate</th>
                    <th>Tenure</th>
                    <th>Compounding</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsPlans.map(plan => (
                    <tr key={plan.id}>
                      <td>
                        <strong>{plan.accountName}</strong>
                        {plan.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{plan.notes}</div>}
                      </td>
                      <td>{formatCurrency(plan.initialDeposit)}</td>
                      <td>
                        <strong style={{ color: 'var(--color-secondary)' }}>
                          +{formatCurrency(plan.monthlyAddition)}/mo
                        </strong>
                      </td>
                      <td>
                        <span className="badge badge-success">{plan.interestRate}% p.a.</span>
                      </td>
                      <td>{plan.periodYears} Years</td>
                      <td>{plan.compoundingFrequency || 'MONTHLY'}</td>
                      <td>
                        <button 
                          className="btn"
                          onClick={() => handleDeletePlan(plan.id)}
                          style={{ padding: '0.3rem', border: 'none', background: 'transparent', color: 'var(--color-danger)' }}
                          title="Delete Plan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No savings accounts registered yet. Click <strong>Add Savings Account</strong> to record your compounding deposits!
              </div>
            )}
          </GlassCard>
        </>
      ) : (
        /* Financial Calculators Suite */
        <div>
          {/* Calculator Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
            {[
              { id: 'sip', label: 'SIP Calculator' },
              { id: 'fd', label: 'FD Calculator' },
              { id: 'rd', label: 'RD Calculator' },
              { id: 'simple', label: 'Simple Interest' },
              { id: 'compound', label: 'Compound Interest' },
              { id: 'emi', label: 'Loan EMI' },
            ].map(c => (
              <button 
                key={c.id}
                className={`btn ${calculatorType === c.id ? 'btn-primary' : ''}`}
                onClick={() => setCalculatorType(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Inputs Column */}
            <GlassCard>
              <h3 style={{ marginBottom: '1.25rem', textTransform: 'capitalize' }}>{calculatorType.replace('-', ' ')} Parameters</h3>

              {calculatorType === 'sip' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Monthly Investment (₹): {formatCurrency(calcInputs.sipMonthly)}</label>
                    <input 
                      type="range" min="500" max="100000" step="500" 
                      value={calcInputs.sipMonthly}
                      onChange={e => setCalcInputs({ ...calcInputs, sipMonthly: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Annual Return Rate (%): {calcInputs.sipRate}%</label>
                    <input 
                      type="range" min="5" max="30" step="0.5" 
                      value={calcInputs.sipRate}
                      onChange={e => setCalcInputs({ ...calcInputs, sipRate: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time Period (Years): {calcInputs.sipYears} Years</label>
                    <input 
                      type="range" min="1" max="30" step="1" 
                      value={calcInputs.sipYears}
                      onChange={e => setCalcInputs({ ...calcInputs, sipYears: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}

              {calculatorType === 'fd' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Principal Amount (₹): {formatCurrency(calcInputs.fdPrincipal)}</label>
                    <input 
                      type="range" min="10000" max="2000000" step="10000" 
                      value={calcInputs.fdPrincipal}
                      onChange={e => setCalcInputs({ ...calcInputs, fdPrincipal: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Interest Rate (% p.a.): {calcInputs.fdRate}%</label>
                    <input 
                      type="range" min="3" max="12" step="0.1" 
                      value={calcInputs.fdRate}
                      onChange={e => setCalcInputs({ ...calcInputs, fdRate: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tenure (Years): {calcInputs.fdYears} Years</label>
                    <input 
                      type="range" min="1" max="10" step="0.5" 
                      value={calcInputs.fdYears}
                      onChange={e => setCalcInputs({ ...calcInputs, fdYears: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}

              {calculatorType === 'rd' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Monthly Deposit (₹): {formatCurrency(calcInputs.rdMonthly)}</label>
                    <input 
                      type="range" min="500" max="50000" step="500" 
                      value={calcInputs.rdMonthly}
                      onChange={e => setCalcInputs({ ...calcInputs, rdMonthly: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Interest Rate (%): {calcInputs.rdRate}%</label>
                    <input 
                      type="range" min="3" max="12" step="0.1" 
                      value={calcInputs.rdRate}
                      onChange={e => setCalcInputs({ ...calcInputs, rdRate: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tenure (Months): {calcInputs.rdMonths} Months</label>
                    <input 
                      type="range" min="6" max="120" step="6" 
                      value={calcInputs.rdMonths}
                      onChange={e => setCalcInputs({ ...calcInputs, rdMonths: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}

              {calculatorType === 'simple' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Principal Amount (₹): {formatCurrency(calcInputs.simplePrincipal)}</label>
                    <input 
                      type="range" min="5000" max="1000000" step="5000" 
                      value={calcInputs.simplePrincipal}
                      onChange={e => setCalcInputs({ ...calcInputs, simplePrincipal: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Annual Rate (%): {calcInputs.simpleRate}%</label>
                    <input 
                      type="range" min="1" max="25" step="0.5" 
                      value={calcInputs.simpleRate}
                      onChange={e => setCalcInputs({ ...calcInputs, simpleRate: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time Period (Years): {calcInputs.simpleYears} Years</label>
                    <input 
                      type="range" min="1" max="15" step="1" 
                      value={calcInputs.simpleYears}
                      onChange={e => setCalcInputs({ ...calcInputs, simpleYears: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}

              {calculatorType === 'compound' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Principal Amount (₹): {formatCurrency(calcInputs.compoundPrincipal)}</label>
                    <input 
                      type="range" min="5000" max="1000000" step="5000" 
                      value={calcInputs.compoundPrincipal}
                      onChange={e => setCalcInputs({ ...calcInputs, compoundPrincipal: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Annual Rate (%): {calcInputs.compoundRate}%</label>
                    <input 
                      type="range" min="1" max="25" step="0.5" 
                      value={calcInputs.compoundRate}
                      onChange={e => setCalcInputs({ ...calcInputs, compoundRate: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time Period (Years): {calcInputs.compoundYears} Years</label>
                    <input 
                      type="range" min="1" max="15" step="1" 
                      value={calcInputs.compoundYears}
                      onChange={e => setCalcInputs({ ...calcInputs, compoundYears: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}

              {calculatorType === 'emi' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Loan Amount (₹): {formatCurrency(calcInputs.emiPrincipal)}</label>
                    <input 
                      type="range" min="50000" max="10000000" step="50000" 
                      value={calcInputs.emiPrincipal}
                      onChange={e => setCalcInputs({ ...calcInputs, emiPrincipal: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Interest Rate (% p.a.): {calcInputs.emiRate}%</label>
                    <input 
                      type="range" min="5" max="20" step="0.1" 
                      value={calcInputs.emiRate}
                      onChange={e => setCalcInputs({ ...calcInputs, emiRate: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tenure (Months): {calcInputs.emiMonths} Months</label>
                    <input 
                      type="range" min="6" max="240" step="6" 
                      value={calcInputs.emiMonths}
                      onChange={e => setCalcInputs({ ...calcInputs, emiMonths: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}
            </GlassCard>

            {/* Calculator Output */}
            <GlassCard>
              <h3 style={{ marginBottom: '1.25rem' }}>Calculation Results</h3>
              {activeCalculatorResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {calculatorType === 'emi' ? (
                    <>
                      <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Monthly EMI Payment</span>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {formatCurrency(activeCalculatorResult.monthlyEmi)}/mo
                        </div>
                      </div>
                      <div className="grid-2">
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Principal</span>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatCurrency(activeCalculatorResult.principalAmount)}</div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Total Interest Payable</span>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-danger)' }}>
                            {formatCurrency(activeCalculatorResult.totalInterest)}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--color-secondary)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Maturity / Future Value</span>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                          {formatCurrency(activeCalculatorResult.totalValue || activeCalculatorResult.maturityAmount || activeCalculatorResult.totalAmount)}
                        </div>
                      </div>
                      <div className="grid-2">
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Invested Capital</span>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            {formatCurrency(activeCalculatorResult.totalInvested || activeCalculatorResult.principal)}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Wealth Gained (Interest)</span>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-success)' }}>
                            +{formatCurrency(activeCalculatorResult.estimatedReturns || activeCalculatorResult.interestEarned || activeCalculatorResult.simpleInterest || activeCalculatorResult.compoundInterest)}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p>Computing mathematical models...</p>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {/* Add Savings Plan Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <GlassCard>
              <h2 style={{ marginBottom: '1.25rem' }}>Add Compounding Savings Account</h2>
              <form onSubmit={handleCreatePlan}>
                <div className="form-group">
                  <label className="form-label">Account / Plan Name *</label>
                  <input 
                    type="text"
                    className="input-field"
                    value={newPlan.accountName}
                    onChange={e => setNewPlan({ ...newPlan, accountName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Initial Deposit (₹) *</label>
                    <input 
                      type="number" min="0" className="input-field"
                      value={newPlan.initialDeposit}
                      onChange={e => setNewPlan({ ...newPlan, initialDeposit: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Addition (₹) *</label>
                    <input 
                      type="number" min="0" className="input-field"
                      value={newPlan.monthlyAddition}
                      onChange={e => setNewPlan({ ...newPlan, monthlyAddition: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Annual Interest Rate (%) *</label>
                    <input 
                      type="number" step="0.1" min="0" className="input-field"
                      value={newPlan.interestRate}
                      onChange={e => setNewPlan({ ...newPlan, interestRate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Period (Years) *</label>
                    <input 
                      type="number" min="1" className="input-field"
                      value={newPlan.periodYears}
                      onChange={e => setNewPlan({ ...newPlan, periodYears: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <input 
                    type="text" className="input-field"
                    value={newPlan.notes}
                    onChange={e => setNewPlan({ ...newPlan, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Plan</button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsCalculatorsPage;
