import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  Calculator, 
  Receipt, 
  Sparkles, 
  CheckCircle2, 
  TrendingDown, 
  ShieldCheck, 
  HeartPulse, 
  Home, 
  Percent, 
  Info,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';

const TaxPlannerPage = () => {
  const { user, formatCurrency } = useAuth();
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salaryInput, setSalaryInput] = useState(1500000);
  const [useCustomSalary, setUseCustomSalary] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTaxAnalysis();
    }
  }, [user]);

  const fetchTaxAnalysis = async (customSalary = null) => {
    setLoading(true);
    try {
      const data = await api.tax.getAnalysis(user.id, customSalary);
      setTaxData(data);
      if (!customSalary && data.grossSalary) {
        setSalaryInput(data.grossSalary);
      }
    } catch (err) {
      console.error("Failed to load tax telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalaryChange = (newVal) => {
    setSalaryInput(newVal);
    setUseCustomSalary(true);
    fetchTaxAnalysis(newVal);
  };

  if (loading && !taxData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h3>Calculating Income Tax Optimization...</h3>
      </div>
    );
  }

  const deductions = taxData?.deductions;
  const oldRegime = taxData?.oldRegime;
  const newRegime = taxData?.newRegime;
  const isNewBetter = taxData?.recommendedRegime === 'NEW_REGIME';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt size={28} color="#38bdf8" />
            <h1 style={{ margin: 0 }}>Indian Income Tax Planner & 80C/80D Optimizer</h1>
          </div>
          <p style={{ margin: '0.2rem 0 0 0' }}>
            Side-by-side Old vs. New Tax Regime comparison (Budget 2024–25 revised slabs) with live deduction optimization.
          </p>
        </div>

        <div className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
          🇮🇳 FY 2024-25 / AY 2025-26
        </div>
      </div>

      {/* Interactive Annual Gross Income Slider */}
      <GlassCard style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Annual Gross Salary (Inflow): {formatCurrency(salaryInput)}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {useCustomSalary ? "⚡ Testing custom scenario" : "Auto-detected from Cash Flow income"}
            </span>
          </div>
          {useCustomSalary && (
            <button 
              className="btn"
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
              onClick={() => {
                setUseCustomSalary(false);
                fetchTaxAnalysis(null);
              }}
            >
              Reset to Recorded Salary
            </button>
          )}
        </div>

        <input 
          type="range"
          min="300000"
          max="5000000"
          step="50000"
          value={salaryInput}
          onChange={e => handleSalaryChange(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          <span>₹3 Lakhs</span>
          <span>₹15 Lakhs</span>
          <span>₹30 Lakhs</span>
          <span>₹50 Lakhs</span>
        </div>
      </GlassCard>

      {/* AI Recommendation Banner */}
      {taxData && (
        <div style={{
          background: isNewBetter 
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)' 
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: isNewBetter ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={28} color={isNewBetter ? '#38bdf8' : '#34d399'} />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                OPTIMAL TAX REGIME RECOMMENDATION
              </div>
              <strong style={{ fontSize: '1.25rem', color: '#fff' }}>
                {isNewBetter ? '🏆 NEW TAX REGIME IS BETTER' : '🏆 OLD TAX REGIME IS BETTER'}
              </strong>
              <div style={{ fontSize: '0.88rem', color: '#e0e7ff', marginTop: '0.2rem' }}>
                You save <strong style={{ color: isNewBetter ? '#38bdf8' : '#34d399' }}>{formatCurrency(taxData.taxSavings)}</strong> in income taxes by choosing the {isNewBetter ? 'New Tax Regime' : 'Old Tax Regime'}!
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tax Liability</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isNewBetter ? '#38bdf8' : '#34d399' }}>
                {formatCurrency(isNewBetter ? newRegime?.totalTaxLiability : oldRegime?.totalTaxLiability)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Matrix */}
      <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
        {/* Old Regime Card */}
        <GlassCard style={{ border: !isNewBetter ? '2px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Old Tax Regime</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>With full 80C, 80D & Loan Deductions</span>
            </div>
            {!isNewBetter && <span className="badge badge-success">Recommended</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gross Salary</span>
              <strong>{formatCurrency(taxData?.grossSalary || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
              <span>Standard Deduction</span>
              <span>- {formatCurrency(deductions?.standardDeductionOld || 50000)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
              <span>Section 80C (Life Ins + ELSS)</span>
              <span>- {formatCurrency(deductions?.allowed80C || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
              <span>Section 80D (Health Insurance)</span>
              <span>- {formatCurrency(deductions?.allowed80D || 0)}</span>
            </div>
            {deductions?.allowedSec24b > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                <span>Section 24(b) Home Loan Interest</span>
                <span>- {formatCurrency(deductions?.allowedSec24b || 0)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ fontWeight: 600 }}>Net Taxable Income</span>
              <strong style={{ color: '#38bdf8' }}>{formatCurrency(oldRegime?.taxableIncome || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Base Income Tax</span>
              <span>{formatCurrency(oldRegime?.baseTax || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>4% Health & Edu Cess</span>
              <span>{formatCurrency(oldRegime?.cess || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.6rem', borderTop: '1px solid var(--border-glass)', fontSize: '1.05rem' }}>
              <strong>Total Tax Payable</strong>
              <strong style={{ color: !isNewBetter ? 'var(--color-success)' : 'var(--text-primary)' }}>
                {formatCurrency(oldRegime?.totalTaxLiability || 0)}
              </strong>
            </div>
          </div>
        </GlassCard>

        {/* New Regime Card */}
        <GlassCard style={{ border: isNewBetter ? '2px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>New Tax Regime (Budget 2024)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Concessional Slabs + ₹75,000 Standard Deduction</span>
            </div>
            {isNewBetter && <span className="badge badge-primary">Recommended</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gross Salary</span>
              <strong>{formatCurrency(taxData?.grossSalary || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8' }}>
              <span>Standard Deduction (Budget 2024)</span>
              <span>- {formatCurrency(deductions?.standardDeductionNew || 75000)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Section 80C Deductions</span>
              <span>Not Applicable</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Section 80D Health Deductions</span>
              <span>Not Applicable</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Section 24(b) Home Loan Interest</span>
              <span>Not Applicable</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ fontWeight: 600 }}>Net Taxable Income</span>
              <strong style={{ color: '#38bdf8' }}>{formatCurrency(newRegime?.taxableIncome || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Base Income Tax</span>
              <span>{formatCurrency(newRegime?.baseTax || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>4% Health & Edu Cess</span>
              <span>{formatCurrency(newRegime?.cess || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.6rem', borderTop: '1px solid var(--border-glass)', fontSize: '1.05rem' }}>
              <strong>Total Tax Payable</strong>
              <strong style={{ color: isNewBetter ? '#38bdf8' : 'var(--text-primary)' }}>
                {formatCurrency(newRegime?.totalTaxLiability || 0)}
              </strong>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Deduction Quotas & Live Optimization (Unique Feature!) */}
      <h3 style={{ marginBottom: '1rem' }}>Section Deductions & Tax Shield Breakdown (Old Regime)</h3>
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {/* Section 80C Card */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--color-primary)" />
              <h4 style={{ margin: 0 }}>Section 80C</h4>
            </div>
            <span className="badge badge-primary">Cap: ₹1,50,000</span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Life Insurance Term Premiums + ELSS Mutual Funds + PPF/EPF
          </div>

          <div className="progress-bar-container" style={{ marginBottom: '0.5rem' }}>
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(100, ((deductions?.total80CClaimed || 0) / 150000) * 100)}%` }}
            ></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
            <span>Claimed: <strong>{formatCurrency(deductions?.total80CClaimed || 0)}</strong></span>
            <span>Allowed: <strong>{formatCurrency(deductions?.allowed80C || 0)}</strong></span>
          </div>

          {deductions?.remaining80CQuota > 0 ? (
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem', color: '#c7d2fe' }}>
              💡 Invest <strong>{formatCurrency(deductions.remaining80CQuota)}</strong> in ELSS Mutual Funds to maximize your 80C limit!
            </div>
          ) : (
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem', color: '#34d399' }}>
              ✅ 100% of Section 80C limit exhausted!
            </div>
          )}
        </GlassCard>

        {/* Section 80D Card */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartPulse size={18} color="#ec4899" />
              <h4 style={{ margin: 0 }}>Section 80D</h4>
            </div>
            <span className="badge badge-warning">Cap: ₹50,000</span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Health Insurance Premiums (Self + Family up to ₹25k, Parents up to ₹50k)
          </div>

          <div className="progress-bar-container" style={{ marginBottom: '0.5rem' }}>
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${Math.min(100, ((deductions?.healthInsurancePremium || 0) / 50000) * 100)}%`,
                background: 'linear-gradient(90deg, #ec4899, #8b5cf6)'
              }}
            ></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
            <span>Health Premium: <strong>{formatCurrency(deductions?.healthInsurancePremium || 0)}</strong></span>
            <span>Allowed: <strong>{formatCurrency(deductions?.allowed80D || 0)}</strong></span>
          </div>

          <div style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.2)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem', color: '#fbcfe8' }}>
            🏥 Health insurance protects your family while reducing taxable income directly.
          </div>
        </GlassCard>

        {/* Section 24(b) Home Loan Interest */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Home size={18} color="#38bdf8" />
              <h4 style={{ margin: 0 }}>Section 24(b)</h4>
            </div>
            <span className="badge badge-primary">Cap: ₹2,00,000</span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Interest paid on Housing Loans for self-occupied residential property
          </div>

          <div className="progress-bar-container" style={{ marginBottom: '0.5rem' }}>
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${Math.min(100, ((deductions?.homeLoanInterest || 0) / 200000) * 100)}%`,
                background: 'linear-gradient(90deg, #38bdf8, #6366f1)'
              }}
            ></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
            <span>Annual Interest: <strong>{formatCurrency(deductions?.homeLoanInterest || 0)}</strong></span>
            <span>Deduction: <strong>{formatCurrency(deductions?.allowedSec24b || 0)}</strong></span>
          </div>

          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem', color: '#bae6fd' }}>
            🏠 Auto-synchronized with your active loan amortization balances.
          </div>
        </GlassCard>
      </div>

      {/* Tax Slabs Reference Card */}
      <GlassCard>
        <h4 style={{ marginBottom: '0.75rem' }}>New Tax Regime Slabs Reference (Union Budget 2024 Revision)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>₹0 to ₹3,00,000</span>
            <div><strong style={{ color: 'var(--color-success)' }}>0% (Nil)</strong></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>₹3,00,001 to ₹7,00,000</span>
            <div><strong>5%</strong> (Rebate up to 7L)</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>₹7,00,001 to ₹10,00,000</span>
            <div><strong>10%</strong></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>₹10,00,001 to ₹12,00,000</span>
            <div><strong>15%</strong></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>₹12,00,001 to ₹15,00,000</span>
            <div><strong>20%</strong></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Above ₹15,00,000</span>
            <div><strong style={{ color: 'var(--color-danger)' }}>30%</strong></div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default TaxPlannerPage;
