import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  ShieldCheck, 
  ShieldAlert, 
  HeartPulse, 
  Car, 
  Home, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Award,
  Sparkles,
  Users,
  Clock,
  ArrowRight,
  FileCheck
} from 'lucide-react';

const InsurancePage = () => {
  const { user, formatCurrency } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [policyForm, setPolicyForm] = useState({
    policyName: '',
    policyType: 'LIFE_TERM',
    provider: 'HDFC Life',
    policyNumber: '',
    sumAssured: '10000000',
    premiumAmount: '16500',
    premiumFrequency: 'ANNUAL',
    startDate: new Date().toISOString().split('T')[0],
    renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    nominee: 'Spouse',
    taxBenefitSection: '80C',
    notes: 'Pure protection term cover for family'
  });

  const popularPresets = [
    {
      name: 'HDFC Click 2 Protect ₹1.5 Cr',
      type: 'LIFE_TERM',
      provider: 'HDFC Life',
      sumAssured: 15000000,
      premium: 16500,
      frequency: 'ANNUAL',
      tax: '80C',
      notes: 'Pure term plan with terminal illness benefit'
    },
    {
      name: 'Star Health Comprehensive ₹15L',
      type: 'HEALTH',
      provider: 'Star Health',
      sumAssured: 1500000,
      premium: 21000,
      frequency: 'ANNUAL',
      tax: '80D',
      notes: 'Cashless family floater with zero room rent cap'
    },
    {
      name: 'ICICI Lombard Zero-Dep Car Cover',
      type: 'MOTOR',
      provider: 'ICICI Lombard',
      sumAssured: 850000,
      premium: 12500,
      frequency: 'ANNUAL',
      tax: 'NONE',
      notes: 'Comprehensive vehicle cover with 24x7 roadside assist'
    },
    {
      name: 'Tata AIG Critical Illness ₹25L',
      type: 'CRITICAL_ILLNESS',
      provider: 'Tata AIG',
      sumAssured: 2500000,
      premium: 9800,
      frequency: 'ANNUAL',
      tax: '80D',
      notes: 'Lump-sum payout on diagnosis of 30+ major ailments'
    }
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        api.insurance.list(user.id).catch(() => []),
        api.insurance.summary(user.id).catch(() => null)
      ]);
      setPolicies(list);
      setSummary(sum);
    } catch (err) {
      console.error("Failed to load insurance telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setPolicyForm({
      policyName: preset.name,
      policyType: preset.type,
      provider: preset.provider,
      policyNumber: `POL-${Math.floor(100000 + Math.random() * 900000)}`,
      sumAssured: preset.sumAssured.toString(),
      premiumAmount: preset.premium.toString(),
      premiumFrequency: preset.frequency,
      startDate: new Date().toISOString().split('T')[0],
      renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      nominee: 'Family Nominee',
      taxBenefitSection: preset.tax,
      notes: preset.notes
    });
    setShowAddModal(true);
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    try {
      await api.insurance.create({
        userId: user.id,
        policyName: policyForm.policyName,
        policyType: policyForm.policyType,
        provider: policyForm.provider,
        policyNumber: policyForm.policyNumber,
        sumAssured: parseFloat(policyForm.sumAssured),
        premiumAmount: parseFloat(policyForm.premiumAmount),
        premiumFrequency: policyForm.premiumFrequency,
        startDate: policyForm.startDate,
        renewalDate: policyForm.renewalDate,
        nominee: policyForm.nominee,
        taxBenefitSection: policyForm.taxBenefitSection,
        notes: policyForm.notes
      });
      setShowAddModal(false);
      setSuccessMsg(`Policy "${policyForm.policyName}" registered successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadData();
    } catch (err) {
      console.error("Failed to save policy", err);
      setErrorMsg(err.message || "Failed to register policy.");
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleDeletePolicy = async (id) => {
    if (!window.confirm("Are you sure you want to remove this insurance policy from your vault?")) return;
    try {
      await api.insurance.delete(id);
      setSuccessMsg("Insurance policy removed.");
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadData();
    } catch (err) {
      console.error("Failed to delete policy", err);
      setErrorMsg("Failed to delete policy.");
    }
  };

  const filteredPolicies = policies.filter(p => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'LIFE') return p.policyType?.toUpperCase().includes('LIFE');
    if (activeFilter === 'HEALTH') return p.policyType?.toUpperCase().includes('HEALTH') || p.policyType?.toUpperCase().includes('CRITICAL');
    if (activeFilter === 'MOTOR') return p.policyType?.toUpperCase().includes('MOTOR');
    return !p.policyType?.toUpperCase().includes('LIFE') && !p.policyType?.toUpperCase().includes('HEALTH') && !p.policyType?.toUpperCase().includes('MOTOR');
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h3>Loading Protection & Insurance Vault...</h3>
      </div>
    );
  }

  const adequacy = summary?.adequacy;
  const upcomingRenewals = summary?.upcomingRenewals || [];

  return (
    <div>
      {/* Alert Notifications */}
      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '10px',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#34d399'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '10px',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#f87171'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={28} color="#06b6d4" />
            <h1 style={{ margin: 0 }}>Insurance & Protection Portfolio</h1>
          </div>
          <p style={{ margin: '0.2rem 0 0 0' }}>
            Life, Health, Motor, and Property risk coverage with live Human Life Value (HLV) adequacy analysis.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => {
            setPolicyForm({
              policyName: '',
              policyType: 'LIFE_TERM',
              provider: 'HDFC Life',
              policyNumber: '',
              sumAssured: '10000000',
              premiumAmount: '16500',
              premiumFrequency: 'ANNUAL',
              startDate: new Date().toISOString().split('T')[0],
              renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              nominee: 'Spouse',
              taxBenefitSection: '80C',
              notes: ''
            });
            setShowAddModal(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} />
          <span>+ Add Insurance Policy</span>
        </button>
      </div>

      {/* Top Telemetry Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Sum Assured (Cover)</span>
            <ShieldCheck size={18} color="#06b6d4" />
          </div>
          <div className="metric-value" style={{ color: '#06b6d4' }}>
            {formatCurrency(summary?.totalSumAssured || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Life: {formatCurrency(summary?.lifeCoverSumAssured || 0)} • Health: {formatCurrency(summary?.healthCoverSumAssured || 0)}
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Annual Premium Outflow</span>
            <Calendar size={18} color="#ec4899" />
          </div>
          <div className="metric-value" style={{ color: '#ec4899' }}>
            {formatCurrency(summary?.totalAnnualPremium || 0)}/yr
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
            Qualifies for Sec 80C & 80D Tax Relief
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Policies</span>
            <FileCheck size={18} color="var(--color-primary)" />
          </div>
          <div className="metric-value">
            {summary?.activePoliciesCount || 0} Policies
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            In Good Standing
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Overall Protection Score</span>
            <Award size={18} color="var(--color-success)" />
          </div>
          <div className="metric-value" style={{ color: adequacy?.overallProtectionScore >= 80 ? 'var(--color-success)' : adequacy?.overallProtectionScore >= 50 ? '#38bdf8' : 'var(--color-danger)' }}>
            {adequacy?.overallProtectionScore || 0} / 100
          </div>
          <div style={{ fontSize: '0.75rem', color: adequacy?.overallProtectionScore >= 80 ? 'var(--color-success)' : 'var(--text-secondary)' }}>
            {adequacy?.overallProtectionScore >= 80 ? '🛡️ Strong Family Shield' : '⚠️ Coverage Gap Detected'}
          </div>
        </GlassCard>
      </div>

      {/* Protection Adequacy Checker (Unique Innovation!) */}
      {adequacy && (
        <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'stretch' }}>
          {/* Life Cover Adequacy */}
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0 }}>Human Life Value (HLV) Adequacy</h3>
              </div>
              <span className={`badge ${adequacy.lifeCoveragePct >= 100 ? 'badge-success' : adequacy.lifeCoveragePct >= 60 ? 'badge-primary' : 'badge-danger'}`}>
                {adequacy.lifeStatus} ({adequacy.lifeCoveragePct}%)
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Financial benchmark recommends maintaining pure term cover equal to <strong>10x–12x Annual Income + Active Debt Liabilities</strong>.
            </p>

            <div className="progress-bar-container" style={{ margin: '0.5rem 0' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${adequacy.lifeCoveragePct}%`,
                  background: adequacy.lifeCoveragePct >= 100 ? 'var(--color-success)' : 'linear-gradient(90deg, #6366f1, #06b6d4)'
                }}
              ></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span>Current Cover: <strong>{formatCurrency(adequacy.currentLifeCover)}</strong></span>
              <span>Recommended Target: <strong>{formatCurrency(adequacy.recommendedLifeCover)}</strong></span>
            </div>

            {adequacy.lifeGap > 0 ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem', marginTop: 'auto', color: '#fca5a5' }}>
                ⚠️ Protection Gap: <strong>{formatCurrency(adequacy.lifeGap)}</strong> needed to fully protect outstanding loans and dependents.
              </div>
            ) : (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem', marginTop: 'auto', color: '#34d399' }}>
                ✅ Your family's financial security is 100% fortified against income interruption!
              </div>
            )}
          </GlassCard>

          {/* Health Shield Adequacy */}
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={20} color="#ec4899" />
                <h3 style={{ margin: 0 }}>Health Hospitalization Defense</h3>
              </div>
              <span className={`badge ${adequacy.healthCoveragePct >= 100 ? 'badge-success' : adequacy.healthCoveragePct >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                {adequacy.healthStatus} ({adequacy.healthCoveragePct}%)
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Indian healthcare inflation runs at ~14%/year. Benchmark recommended family health floater is <strong>{formatCurrency(adequacy.recommendedHealthCover)}</strong>.
            </p>

            <div className="progress-bar-container" style={{ margin: '0.5rem 0' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${adequacy.healthCoveragePct}%`,
                  background: adequacy.healthCoveragePct >= 100 ? 'var(--color-success)' : 'linear-gradient(90deg, #ec4899, #8b5cf6)'
                }}
              ></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span>Current Health Cover: <strong>{formatCurrency(adequacy.currentHealthCover)}</strong></span>
              <span>Recommended Target: <strong>{formatCurrency(adequacy.recommendedHealthCover)}</strong></span>
            </div>

            {adequacy.healthGap > 0 ? (
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem', marginTop: 'auto', color: '#fcd34d' }}>
                💡 Tip: Add a Super Top-Up policy (e.g. ₹20L with ₹5L deductible) for just ₹3,000/yr to eliminate this gap!
              </div>
            ) : (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem', marginTop: 'auto', color: '#34d399' }}>
                ✅ Cashless hospitalization protection is optimal against medical emergencies.
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Upcoming Renewal Alert Notice */}
      {upcomingRenewals.some(r => r.isDueSoon || r.isOverdue) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={24} color="#fbbf24" />
            <div>
              <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                🔔 Policy Premium Renewal Attention Required!
              </strong>
              <div style={{ fontSize: '0.85rem', color: '#fef3c7' }}>
                {upcomingRenewals.filter(r => r.isDueSoon).map(r => 
                  `"${r.policyName}" (${r.provider}) renewal of ${formatCurrency(r.premiumAmount)} is due in ${r.daysRemaining} days (Date: ${r.renewalDate}).`
                ).join(' ')}
              </div>
            </div>
          </div>
          <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>Pay Before Grace Period</span>
        </div>
      )}

      {/* Popular Presets Strip */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', fontWeight: 600 }}>
          ⚡ 1-CLICK POPULAR INDIAN POLICY PRESETS:
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {popularPresets.map(p => (
            <button 
              key={p.name}
              className="btn glass-panel-interactive"
              onClick={() => handleApplyPreset(p)}
              style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid var(--border-glass)',
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Sparkles size={15} color="var(--color-secondary)" />
              <span>{p.name}</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>({formatCurrency(p.premium)}/yr)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Policy Vault Section */}
      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>Registered Policies Vault ({filteredPolicies.length})</h3>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Policies' },
              { id: 'LIFE', label: 'Life / Term' },
              { id: 'HEALTH', label: 'Health / Mediclaim' },
              { id: 'MOTOR', label: 'Car / Motor' },
              { id: 'OTHER', label: 'Property & Other' }
            ].map(f => (
              <button
                key={f.id}
                className={`btn ${activeFilter === f.id ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredPolicies.length > 0 ? (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Policy & Provider</th>
                <th>Category</th>
                <th>Sum Assured (Cover)</th>
                <th>Premium Outflow</th>
                <th>Renewal Date</th>
                <th>Nominee</th>
                <th>Tax Benefit</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map(p => {
                const isDueSoon = p.status === 'DUE_SOON';
                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.policyName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {p.provider} • {p.policyNumber || 'No Policy #'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                        {p.policyType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#38bdf8' }}>{formatCurrency(p.sumAssured)}</strong>
                    </td>
                    <td>
                      <div>{formatCurrency(p.premiumAmount)}</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.premiumFrequency}</span>
                    </td>
                    <td>
                      <div>{p.renewalDate ? new Date(p.renewalDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</div>
                      {isDueSoon && <span style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 600 }}>Due Soon!</span>}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{p.nominee || 'Not Specified'}</span>
                    </td>
                    <td>
                      {p.taxBenefitSection && p.taxBenefitSection !== 'NONE' ? (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          Sec {p.taxBenefitSection}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'ACTIVE' ? 'badge-success' : isDueSoon ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn"
                        onClick={() => handleDeletePolicy(p.id)}
                        style={{ padding: '0.3rem', border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer' }}
                        title="Delete Policy"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ShieldAlert size={36} color="var(--text-secondary)" style={{ margin: '0 auto 0.75rem' }} />
            <h3>No Policies Registered in this Category</h3>
            <p style={{ maxWidth: '480px', margin: '0 auto 1.25rem' }}>
              Protect your family and assets against unexpected financial shocks. Use one of our quick presets above or click "Add Insurance Policy".
            </p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add First Policy
            </button>
          </div>
        )}
      </GlassCard>

      {/* Modal: Add Policy */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <ShieldCheck size={22} color="var(--color-primary)" />
                <h2 style={{ margin: 0 }}>Register Insurance Policy</h2>
              </div>

              <form onSubmit={handleSavePolicy}>
                <div className="form-group">
                  <label className="form-label">Policy Name *</label>
                  <input 
                    type="text"
                    className="input-field"
                    placeholder="e.g. HDFC Life Click 2 Protect, Star Health Comprehensive"
                    value={policyForm.policyName}
                    onChange={e => setPolicyForm({ ...policyForm, policyName: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Insurance Type *</label>
                    <select 
                      className="input-field"
                      value={policyForm.policyType}
                      onChange={e => {
                        const val = e.target.value;
                        const taxSec = val.includes('LIFE') ? '80C' : (val.includes('HEALTH') || val.includes('CRITICAL') ? '80D' : 'NONE');
                        setPolicyForm({ ...policyForm, policyType: val, taxBenefitSection: taxSec });
                      }}
                    >
                      <option value="LIFE_TERM">Term Life Insurance</option>
                      <option value="LIFE_ENDOWMENT">Life Endowment / ULIP</option>
                      <option value="HEALTH">Health / Family Floater</option>
                      <option value="CRITICAL_ILLNESS">Critical Illness</option>
                      <option value="MOTOR">Motor / Vehicle</option>
                      <option value="HOME">Home & Property</option>
                      <option value="TRAVEL">Travel Insurance</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Insurance Provider *</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. HDFC Life, LIC, Star Health, ICICI Lombard"
                      value={policyForm.provider}
                      onChange={e => setPolicyForm({ ...policyForm, provider: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Sum Assured / Coverage Amount (₹) *</label>
                    <input 
                      type="number"
                      min="1"
                      className="input-field"
                      placeholder="e.g. 10000000 (1 Crore)"
                      value={policyForm.sumAssured}
                      onChange={e => setPolicyForm({ ...policyForm, sumAssured: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Policy Number</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. POL-881920"
                      value={policyForm.policyNumber}
                      onChange={e => setPolicyForm({ ...policyForm, policyNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Premium Amount (₹) *</label>
                    <input 
                      type="number"
                      min="1"
                      className="input-field"
                      placeholder="e.g. 16500"
                      value={policyForm.premiumAmount}
                      onChange={e => setPolicyForm({ ...policyForm, premiumAmount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Premium Frequency *</label>
                    <select 
                      className="input-field"
                      value={policyForm.premiumFrequency}
                      onChange={e => setPolicyForm({ ...policyForm, premiumFrequency: e.target.value })}
                    >
                      <option value="ANNUAL">Annual (Once a year)</option>
                      <option value="HALF_YEARLY">Half-Yearly (Every 6 months)</option>
                      <option value="QUARTERLY">Quarterly (Every 3 months)</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Next Renewal Date *</label>
                    <input 
                      type="date"
                      className="input-field"
                      value={policyForm.renewalDate}
                      onChange={e => setPolicyForm({ ...policyForm, renewalDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nominee Name / Relation</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. Ananya Sharma (Spouse)"
                      value={policyForm.nominee}
                      onChange={e => setPolicyForm({ ...policyForm, nominee: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tax Benefit Category</label>
                  <select 
                    className="input-field"
                    value={policyForm.taxBenefitSection}
                    onChange={e => setPolicyForm({ ...policyForm, taxBenefitSection: e.target.value })}
                  >
                    <option value="80C">Section 80C (Life Insurance up to ₹1.5L)</option>
                    <option value="80D">Section 80D (Health Insurance up to ₹25k/₹50k)</option>
                    <option value="NONE">None (Motor / Commercial)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Policy Notes / Key Benefits</label>
                  <textarea 
                    className="input-field"
                    rows="2"
                    placeholder="e.g. Includes zero room rent cap and restored sum assured benefit"
                    value={policyForm.notes}
                    onChange={e => setPolicyForm({ ...policyForm, notes: e.target.value })}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Policy to Vault</button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurancePage;
