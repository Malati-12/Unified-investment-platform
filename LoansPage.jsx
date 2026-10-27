import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  Landmark, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Table as TableIcon,
  Percent,
  Receipt,
  FileText,
  ShieldCheck,
  Award,
  Zap,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

const LoansPage = () => {
  const { user, formatCurrency } = useAuth();
  const [loans, setLoans] = useState([]);
  const [cibilData, setCibilData] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [amortizationData, setAmortizationData] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [loanForm, setLoanForm] = useState({
    loanName: 'HDFC Car Loan - Creta',
    loanType: 'CAR',
    principalAmount: '750000',
    interestRate: '8.6',
    tenureMonths: '60',
    amountPaid: '0',
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      loadLoans();
    }
  }, [user]);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const [loansList, cibil] = await Promise.all([
        api.loans.list(user.id).catch(() => []),
        api.cibil.getAnalysis(user.id).catch(() => null)
      ]);
      setLoans(loansList);
      setCibilData(cibil);
    } catch (err) {
      console.error("Error fetching loans and CIBIL telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      await api.loans.create({
        userId: user.id,
        loanName: loanForm.loanName,
        loanType: loanForm.loanType,
        principalAmount: parseFloat(loanForm.principalAmount),
        interestRate: parseFloat(loanForm.interestRate),
        tenureMonths: parseInt(loanForm.tenureMonths),
        amountPaid: parseFloat(loanForm.amountPaid) || 0,
        startDate: loanForm.startDate
      });
      setShowAddModal(false);
      await loadLoans();
    } catch (err) {
      console.error("Error creating loan", err);
    }
  };

  const handleDeleteLoan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this loan record?")) return;
    try {
      await api.loans.delete(id);
      await loadLoans();
    } catch (err) {
      console.error("Failed to delete loan", err);
    }
  };

  const handleViewSchedule = async (loan) => {
    setSelectedLoan(loan);
    try {
      const data = await api.loans.getAmortization(loan.id);
      setAmortizationData(data);
      setShowScheduleModal(true);
    } catch (err) {
      console.error("Failed to generate amortization schedule", err);
    }
  };

  const handlePayEmi = async (loanId) => {
    try {
      await api.loans.payEmi(loanId);
      await loadLoans();
      if (selectedLoan?.id === loanId) {
        const updated = await api.loans.getAmortization(loanId);
        setAmortizationData(updated);
      }
    } catch (err) {
      console.error("Failed to log EMI payment", err);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh' }}><h3>Loading Loan Telemetry...</h3></div>;
  }

  const totalBorrowings = loans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalRepaid = loans.reduce((sum, l) => sum + (l.amountPaid || 0), 0);
  const totalRemaining = Math.max(0, totalBorrowings - totalRepaid);
  const monthlyEmiTotal = loans.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + l.emiAmount, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Loans & EMI Management</h1>
          <p style={{ margin: 0 }}>
            Track liability schedules, interest components, and dynamic month-by-month amortization tables.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>Record New Loan</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Borrowed Principal</span>
          <div className="metric-value">{formatCurrency(totalBorrowings)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Across {loans.length} loans</div>
        </GlassCard>

        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Principal Amount Repaid</span>
          <div className="metric-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(totalRepaid)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>
            {totalBorrowings > 0 ? Math.round((totalRepaid / totalBorrowings) * 100) : 0}% Cleared
          </div>
        </GlassCard>

        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Outstanding Debt Balance</span>
          <div className="metric-value" style={{ color: 'var(--color-danger)' }}>{formatCurrency(totalRemaining)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Remaining principal liability</div>
        </GlassCard>

        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CIBIL Credit Score</span>
          <div className="metric-value" style={{ color: cibilData?.scoreColor || '#00C853', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>{cibilData?.cibilScore || 765}</span>
            <span style={{ fontSize: '0.8rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(0,200,83,0.15)', color: cibilData?.scoreColor || '#00C853' }}>
              {cibilData?.ratingCategory || 'EXCELLENT'}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scale 300 - 900 (TransUnion CIBIL)</div>
        </GlassCard>
      </div>

      {/* CIBIL Credit Health Detail Box */}
      {cibilData && (
        <GlassCard style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={24} color="#10b981" />
              <div>
                <h3 style={{ margin: 0 }}>CIBIL Credit Health & Rating Analysis</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Powered by TransUnion CIBIL Scoring Engine</span>
              </div>
            </div>
            <div className="badge badge-success" style={{ fontSize: '0.85rem' }}>
              🎯 CIBIL Score: {cibilData.cibilScore} / 900 ({cibilData.ratingCategory})
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
            {cibilData.creditHealthText}
          </p>

          {/* 5 CIBIL Factors Grid */}
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#38bdf8' }}>5 Core CIBIL Score Weight Factors</h4>
          <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1f))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {cibilData.factors?.map((f, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  <span>{f.name} ({f.weight})</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{f.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>{f.scorePct}% Rating</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.2' }}>{f.description}</div>
              </div>
            ))}
          </div>

          {/* Pre-Approved Offers & Improvement Tips */}
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Zap size={16} color="#f59e0b" />
                <h4 style={{ margin: 0, fontSize: '0.85rem' }}>Pre-Approved Loan Offers (Based on CIBIL {cibilData.cibilScore})</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {cibilData.preApprovedOffers?.map((o, i) => (
                  <li key={i} style={{ marginBottom: '0.3rem' }}>
                    <strong style={{ color: '#e2e8f0' }}>{o.type}:</strong> {o.offer}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp size={16} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '0.85rem' }}>Tips to Boost CIBIL Score to 800+</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {cibilData.improvementTips?.slice(0, 3).map((tip, i) => (
                  <li key={i} style={{ marginBottom: '0.3rem' }}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Loans Grid */}
      <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
        {loans.map(loan => {
          const remaining = Math.max(0, loan.principalAmount - (loan.amountPaid || 0));
          const paidPct = Math.min(100, Math.round(((loan.amountPaid || 0) / loan.principalAmount) * 100));

          return (
            <GlassCard key={loan.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Landmark size={20} color="var(--color-danger)" />
                    <h3 style={{ margin: 0 }}>{loan.loanName}</h3>
                  </div>
                  <span className="badge badge-primary" style={{ marginTop: '0.35rem', fontSize: '0.7rem' }}>
                    {loan.loanType} LOAN
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn" 
                    onClick={() => handleDeleteLoan(loan.id)}
                    style={{ padding: '0.25rem', border: 'none', background: 'transparent', color: 'var(--color-danger)' }}
                    title="Delete Loan"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Loan Repayment Progress</span>
                  <strong style={{ color: paidPct >= 100 ? 'var(--color-success)' : '#38bdf8' }}>{paidPct}%</strong>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${paidPct}%`, 
                      background: paidPct >= 100 ? 'var(--color-success)' : 'linear-gradient(90deg, #ef4444, #f59e0b)' 
                    }}
                  ></div>
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="grid-2" style={{ gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Sanctioned Principal</span>
                  <strong>{formatCurrency(loan.principalAmount)}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Monthly EMI</span>
                  <strong style={{ color: 'var(--color-secondary)' }}>{formatCurrency(loan.emiAmount)}/mo</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Interest Rate</span>
                  <strong>{loan.interestRate}% p.a.</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Remaining Balance</span>
                  <strong style={{ color: 'var(--color-danger)' }}>{formatCurrency(remaining)}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.85rem', marginTop: 'auto' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handlePayEmi(loan.id)}
                  style={{ flex: 1, fontSize: '0.8rem', justifyContent: 'center' }}
                  disabled={loan.status === 'CLOSED'}
                >
                  <Receipt size={14} />
                  <span>{loan.status === 'CLOSED' ? 'Loan Closed' : 'Mark EMI Paid'}</span>
                </button>
                <button 
                  className="btn" 
                  onClick={() => handleViewSchedule(loan)}
                  style={{ fontSize: '0.8rem' }}
                >
                  <TableIcon size={14} />
                  <span>Amortization</span>
                </button>
              </div>
            </GlassCard>
          );
        })}

        {loans.length === 0 && (
          <div style={{ gridColumn: 'span 2', padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h2>No Loans Recorded</h2>
            <p>You have no active loans recorded. Click "Record New Loan" to track car, home, or personal EMIs.</p>
          </div>
        )}
      </div>

      {/* Amortization Schedule Modal */}
      {showScheduleModal && amortizationData && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" style={{ maxWidth: '820px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <GlassCard style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0 }}>EMI Amortization Schedule</h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {amortizationData.loan?.loanName} • Total Loan Cost: {formatCurrency(amortizationData.totalCostOfLoan)}
                  </span>
                </div>
                <button className="btn" onClick={() => setShowScheduleModal(false)} style={{ padding: '0.3rem 0.6rem' }}>✕</button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, maxHeight: '55vh' }}>
                <table className="glass-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Payment Date</th>
                      <th>Opening Balance</th>
                      <th>EMI</th>
                      <th>Principal</th>
                      <th>Interest</th>
                      <th>Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortizationData.schedule?.map(row => (
                      <tr key={row.month}>
                        <td><strong>#{row.month}</strong></td>
                        <td>{new Date(row.paymentDate).toLocaleDateString()}</td>
                        <td>{formatCurrency(row.beginningBalance)}</td>
                        <td><strong>{formatCurrency(row.emi)}</strong></td>
                        <td style={{ color: 'var(--color-success)' }}>{formatCurrency(row.principalComponent)}</td>
                        <td style={{ color: 'var(--color-danger)' }}>{formatCurrency(row.interestComponent)}</td>
                        <td><strong>{formatCurrency(row.endingBalance)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Total Interest Payable: <strong style={{ color: 'var(--color-danger)' }}>{formatCurrency(amortizationData.totalInterestPayable)}</strong>
                </span>
                <button className="btn btn-primary" onClick={() => setShowScheduleModal(false)}>Close</button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <GlassCard>
              <h2 style={{ marginBottom: '1.25rem' }}>Record Loan & EMI Schedule</h2>
              <form onSubmit={handleCreateLoan}>
                <div className="form-group">
                  <label className="form-label">Loan Name / Description *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. HDFC Home Loan, SBI Car Loan, Student Loan"
                    value={loanForm.loanName}
                    onChange={e => setLoanForm({ ...loanForm, loanName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Loan Type</label>
                    <select 
                      className="input-field"
                      value={loanForm.loanType}
                      onChange={e => setLoanForm({ ...loanForm, loanType: e.target.value })}
                    >
                      <option value="CAR">Car Loan</option>
                      <option value="HOME">Home Loan</option>
                      <option value="PERSONAL">Personal Loan</option>
                      <option value="EDUCATION">Education Loan</option>
                      <option value="GOLD">Gold Loan</option>
                      <option value="OTHER">Other Loan</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Loan Amount (Principal ₹) *</label>
                    <input 
                      type="number" min="1000" className="input-field"
                      value={loanForm.principalAmount}
                      onChange={e => setLoanForm({ ...loanForm, principalAmount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Interest Rate (% p.a.) *</label>
                    <input 
                      type="number" step="0.1" min="1" className="input-field"
                      value={loanForm.interestRate}
                      onChange={e => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tenure (Months) *</label>
                    <input 
                      type="number" min="3" className="input-field"
                      value={loanForm.tenureMonths}
                      onChange={e => setLoanForm({ ...loanForm, tenureMonths: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount Already Paid (₹)</label>
                    <input 
                      type="number" min="0" className="input-field"
                      value={loanForm.amountPaid}
                      onChange={e => setLoanForm({ ...loanForm, amountPaid: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Loan Start Date</label>
                  <input 
                    type="date" className="input-field"
                    value={loanForm.startDate}
                    onChange={e => setLoanForm({ ...loanForm, startDate: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Loan</button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansPage;
