import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  Plus, 
  Target, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle,
  Sparkles, 
  ShieldAlert, 
  GraduationCap, 
  Car, 
  Plane, 
  Home, 
  Award,
  Briefcase
} from 'lucide-react';

const GoalsPage = () => {
  const { user, formatCurrency } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [goals, setGoals] = useState([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddPort, setShowAddPort] = useState(false);
  const [newPortName, setNewPortName] = useState('');
  const [portCreating, setPortCreating] = useState(false);
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [goalSuccess, setGoalSuccess] = useState(null);
  const [goalError, setGoalError] = useState(null);
  const [selectedPortIdForGoal, setSelectedPortIdForGoal] = useState('');
  const [loading, setLoading] = useState(true);

  const [goalForm, setGoalForm] = useState({
    goalName: 'Emergency Fund',
    targetAmount: '100000',
    targetDate: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0]
  });

  const presets = [
    { name: 'Emergency Fund', amount: 100000, months: 12, icon: ShieldAlert },
    { name: 'Higher Education', amount: 300000, months: 24, icon: GraduationCap },
    { name: 'Dream Car Purchase', amount: 800000, months: 36, icon: Car },
    { name: 'International Travel', amount: 100000, months: 10, icon: Plane },
    { name: 'Apartment Down Payment', amount: 1500000, months: 48, icon: Home }
  ];

  useEffect(() => {
    if (user) {
      loadPortfolios();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchGoals(selectedPortfolio.id);
      setSelectedPortIdForGoal(selectedPortfolio.id.toString());
    }
  }, [selectedPortfolio]);

  const loadPortfolios = async () => {
    setLoading(true);
    try {
      const data = await api.portfolios.list(user.id);
      setPortfolios(data);
      if (data && data.length > 0) {
        setSelectedPortfolio(prev => {
          if (prev && data.some(p => p.id === prev.id)) {
            return data.find(p => p.id === prev.id);
          }
          return data[0];
        });
        setSelectedPortIdForGoal(data[0].id.toString());
      }
    } catch (e) {
      console.error("Error fetching portfolios for goals", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async (portfolioId) => {
    try {
      const data = await api.goals.list(portfolioId);
      setGoals(data);
    } catch (e) {
      console.error("Error fetching goals", e);
    }
  };

  const handleApplyPreset = (preset) => {
    const targetD = new Date();
    targetD.setMonth(targetD.getMonth() + preset.months);
    setGoalForm({
      goalName: preset.name,
      targetAmount: preset.amount.toString(),
      targetDate: targetD.toISOString().split('T')[0]
    });
    setShowAddGoal(true);
  };

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    if (!newPortName.trim()) return;

    setPortCreating(true);
    setGoalError(null);
    try {
      const newPort = await api.portfolios.create(user.id, newPortName.trim());
      const updatedList = await api.portfolios.list(user.id);
      setPortfolios(updatedList);
      const created = updatedList.find(p => p.id === newPort.id) || updatedList[updatedList.length - 1];
      if (created) {
        setSelectedPortfolio(created);
        setSelectedPortIdForGoal(created.id.toString());
      }
      setNewPortName('');
      setShowAddPort(false);
      setGoalSuccess(`Portfolio "${newPort.name}" created successfully!`);
      setTimeout(() => setGoalSuccess(null), 4000);
    } catch (err) {
      console.error("Failed to create portfolio", err);
      setGoalError(err.message || "Failed to create portfolio. Please try again.");
    } finally {
      setPortCreating(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalForm.goalName || !goalForm.targetAmount || !goalForm.targetDate) return;

    setGoalSubmitting(true);
    setGoalError(null);

    try {
      const chosenPortId = selectedPortIdForGoal ? parseInt(selectedPortIdForGoal) : (selectedPortfolio?.id || null);

      await api.goals.create({
        portfolioId: chosenPortId,
        userId: user.id,
        goalName: goalForm.goalName,
        targetAmount: parseFloat(goalForm.targetAmount),
        targetDate: goalForm.targetDate
      });

      setGoalForm({
        goalName: '',
        targetAmount: '',
        targetDate: ''
      });
      setShowAddGoal(false);
      setGoalSuccess(`Goal "${goalForm.goalName}" created successfully!`);
      setTimeout(() => setGoalSuccess(null), 4000);

      // Refresh portfolios and goals
      const updatedPorts = await api.portfolios.list(user.id);
      setPortfolios(updatedPorts);
      
      const activePortId = chosenPortId || (updatedPorts.length > 0 ? updatedPorts[0].id : null);
      if (activePortId) {
        const found = updatedPorts.find(p => p.id === activePortId) || updatedPorts[0];
        setSelectedPortfolio(found);
        await fetchGoals(found.id);
      }
    } catch (err) {
      console.error("Error creating goal", err);
      setGoalError(err.message || "Failed to save goal. Please check your inputs.");
    } finally {
      setGoalSubmitting(false);
    }
  };

  const handleUpdateStatus = async (goalId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'ACHIEVED' : 'ACTIVE';
    try {
      await api.goals.updateStatus(goalId, nextStatus);
      if (selectedPortfolio) {
        await fetchGoals(selectedPortfolio.id);
      }
    } catch (e) {
      console.error("Error updating goal status", e);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm("Are you sure you want to delete this financial goal?")) return;
    try {
      await api.goals.delete(goalId);
      if (selectedPortfolio) {
        await fetchGoals(selectedPortfolio.id);
      }
      setGoalSuccess("Goal deleted successfully.");
      setTimeout(() => setGoalSuccess(null), 3000);
    } catch (e) {
      console.error("Error deleting goal", e);
      setGoalError("Failed to delete goal.");
    }
  };

  const calculateMonthlySavings = (target, current, targetDateStr) => {
    if (current >= target) return 0;
    const targetDate = new Date(targetDateStr);
    const today = new Date();
    const diffTime = targetDate - today;
    const diffMonths = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.4)));
    const needed = Math.max(0, target - current);
    return Math.round(needed / diffMonths);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh' }}><h3>Loading Goal Planner...</h3></div>;
  }

  const portfolioValue = selectedPortfolio?.totalValue || 0;

  return (
    <div>
      {/* Notifications */}
      {goalSuccess && (
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
            <span>{goalSuccess}</span>
          </div>
          <button onClick={() => setGoalSuccess(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      {goalError && (
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
            <span>{goalError}</span>
          </div>
          <button onClick={() => setGoalError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Financial Goals & Milestone Planner</h1>
          <p style={{ margin: 0 }}>
            Target goal tracking with intelligent periodic savings computation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            onClick={() => setShowAddPort(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Briefcase size={16} color="var(--color-primary)" />
            <span>+ Create New Portfolio</span>
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setGoalForm({
                goalName: '',
                targetAmount: '',
                targetDate: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0]
              });
              setShowAddGoal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} />
            <span>+ Create Financial Goal</span>
          </button>
        </div>
      </div>

      {/* Preset Indian Goals Quick-Add Strip */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', fontWeight: 600 }}>
          ⚡ QUICK-START PRESET FINANCIAL GOALS:
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {presets.map(p => {
            const Icon = p.icon;
            return (
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
                <Icon size={16} color="var(--color-secondary)" />
                <span>{p.name}</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>({formatCurrency(p.amount)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {portfolios.length > 0 ? (
        <>
          {/* Linked Portfolio Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Linked Asset Portfolio:</span>
            <select 
              className="input-field" 
              style={{ width: 'auto', padding: '0.4rem 1.25rem' }}
              value={selectedPortfolio?.id || ''}
              onChange={(e) => {
                const p = portfolios.find(p => p.id === parseInt(e.target.value));
                setSelectedPortfolio(p);
                setSelectedPortIdForGoal(p?.id?.toString() || '');
              }}
            >
              {portfolios.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.totalValue || 0)})</option>
              ))}
            </select>
            <button
              className="btn"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setShowAddPort(true)}
            >
              <Plus size={14} /> New Portfolio
            </button>
          </div>

          {/* Goal Cards Grid */}
          {goals.length > 0 ? (
            <div className="grid-3">
              {goals.map(g => {
                const progressPct = Math.min(100, Math.round((portfolioValue / g.targetAmount) * 100));
                const savingsNeeded = calculateMonthlySavings(g.targetAmount, portfolioValue, g.targetDate);
                const isAchieved = g.status === 'ACHIEVED' || progressPct >= 100;
                
                return (
                  <GlassCard key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={18} color="var(--color-primary)" />
                        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{g.goalName}</h3>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button 
                          className="btn" 
                          onClick={() => handleUpdateStatus(g.id, g.status)} 
                          style={{ padding: '0.25rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                          title={isAchieved ? "Mark as In Progress" : "Mark as Achieved"}
                        >
                          <CheckCircle size={18} color={isAchieved ? 'var(--color-success)' : 'var(--text-secondary)'} />
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => handleDeleteGoal(g.id)} 
                          style={{ padding: '0.25rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                          title="Delete Goal"
                        >
                          <Trash2 size={18} color="var(--color-danger)" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Milestone Progress</span>
                        <strong style={{ color: isAchieved ? 'var(--color-success)' : '#38bdf8' }}>{progressPct}%</strong>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${progressPct}%`, 
                            background: isAchieved ? 'var(--color-success)' : 'linear-gradient(90deg, #6366f1, #06b6d4)' 
                          }}
                        ></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Accumulated: {formatCurrency(portfolioValue)}</span>
                        <span>Target: {formatCurrency(g.targetAmount)}</span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.85rem', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={14} />
                        <span>Deadline: {new Date(g.targetDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>

                      {!isAchieved && savingsNeeded > 0 ? (
                        <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                          Target Savings Needed: <strong style={{ color: 'var(--color-secondary)' }}>{formatCurrency(savingsNeeded)}/mo</strong>
                        </div>
                      ) : (
                        <div className="badge badge-success" style={{ alignSelf: 'flex-start' }}>
                          🏆 Milestone Achieved!
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <GlassCard style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Target size={24} color="var(--color-primary)" />
              </div>
              <h2 style={{ marginBottom: '0.5rem' }}>No Financial Goals Created for this Portfolio</h2>
              <p style={{ maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                Choose one of the quick preset targets above or click "Create Financial Goal" to start tracking your targets!
              </p>
              <button className="btn btn-primary" onClick={() => setShowAddGoal(true)}>
                <Plus size={16} /> Create Financial Goal
              </button>
            </GlassCard>
          )}
        </>
      ) : (
        <GlassCard style={{ padding: '3.5rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Briefcase size={28} color="var(--color-primary)" />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Ready to Plan Your Financial Future?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Start by creating an Investment Portfolio, or create a Financial Goal directly. A portfolio will be created for you automatically if you don't have one yet.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => setShowAddPort(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={16} color="var(--color-primary)" />
              <span>Create New Portfolio</span>
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddGoal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} />
              <span>Create Financial Goal</span>
            </button>
          </div>
        </GlassCard>
      )}

      {/* Modal: Create Financial Goal */}
      {showAddGoal && (
        <div className="modal-overlay" onClick={() => setShowAddGoal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <Target size={22} color="var(--color-primary)" />
                <h2 style={{ margin: 0 }}>Set Financial Goal</h2>
              </div>
              <form onSubmit={handleCreateGoal}>
                <div className="form-group">
                  <label className="form-label">Goal Title *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Emergency Fund, Child Education, Electric Vehicle"
                    value={goalForm.goalName}
                    onChange={e => setGoalForm({ ...goalForm, goalName: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Target Amount (₹) *</label>
                    <input 
                      type="number" 
                      min="1"
                      className="input-field" 
                      placeholder="e.g. 100000" 
                      value={goalForm.targetAmount}
                      onChange={e => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Deadline *</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={goalForm.targetDate}
                      onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Linked Portfolio</label>
                    <button 
                      type="button" 
                      onClick={() => setShowAddPort(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Plus size={13} /> New Portfolio
                    </button>
                  </div>
                  <select 
                    className="input-field"
                    value={selectedPortIdForGoal}
                    onChange={e => setSelectedPortIdForGoal(e.target.value)}
                  >
                    {portfolios.length > 0 ? (
                      portfolios.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.totalValue || 0)})</option>
                      ))
                    ) : (
                      <option value="">Main Investment Portfolio (Auto-provisions)</option>
                    )}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn" onClick={() => setShowAddGoal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={goalSubmitting}>
                    {goalSubmitting ? 'Saving Goal...' : 'Save Goal'}
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Modal: Create New Portfolio */}
      {showAddPort && (
        <div className="modal-overlay" onClick={() => setShowAddPort(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <Briefcase size={22} color="var(--color-primary)" />
                <h2 style={{ margin: 0 }}>Create New Investment Portfolio</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                Portfolios help you organize your wealth, holdings, and targets separately.
              </p>
              <form onSubmit={handleCreatePortfolio}>
                <div className="form-group">
                  <label className="form-label">Portfolio Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Retirement 2040, High Growth Tech, Safe Fixed Income"
                    value={newPortName}
                    onChange={e => setNewPortName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn" onClick={() => setShowAddPort(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={portCreating}>
                    {portCreating ? 'Creating...' : 'Create Portfolio'}
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
