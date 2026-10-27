import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  CreditCard, 
  PieChart as PieIcon, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  ShoppingBag,
  Home,
  Utensils,
  GraduationCap,
  Car,
  Zap,
  HeartPulse,
  Film,
  Tag
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CashFlowPage = () => {
  const { user, formatCurrency } = useAuth();
  const [cashFlows, setCashFlows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // ALL, INCOME, EXPENSE
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    type: 'EXPENSE',
    category: 'Food & Dining',
    amount: '',
    flowDate: new Date().toISOString().split('T')[0],
    description: '',
    paymentMode: 'UPI'
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, summ] = await Promise.all([
        api.cashFlow.list(user.id),
        api.cashFlow.summary(user.id)
      ]);
      setCashFlows(list);
      setSummary(summ);
    } catch (err) {
      console.error("Error fetching cash flows", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;

    try {
      await api.cashFlow.create({
        userId: user.id,
        type: form.type,
        category: form.category,
        amount: parseFloat(form.amount),
        flowDate: form.flowDate,
        description: form.description,
        paymentMode: form.paymentMode
      });
      setShowAddModal(false);
      setForm({
        type: 'EXPENSE',
        category: 'Food & Dining',
        amount: '',
        flowDate: new Date().toISOString().split('T')[0],
        description: '',
        paymentMode: 'UPI'
      });
      await loadData();
    } catch (err) {
      console.error("Failed to add transaction", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this cash flow record?")) return;
    try {
      await api.cashFlow.delete(id);
      await loadData();
    } catch (err) {
      console.error("Failed to delete record", err);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Food & Dining': return <Utensils size={16} color="#f59e0b" />;
      case 'Shopping': return <ShoppingBag size={16} color="#ec4899" />;
      case 'Rent & Housing': return <Home size={16} color="#6366f1" />;
      case 'Education': return <GraduationCap size={16} color="#06b6d4" />;
      case 'Travel & Fuel': return <Car size={16} color="#10b981" />;
      case 'Bills & Utilities': return <Zap size={16} color="#eab308" />;
      case 'Healthcare': return <HeartPulse size={16} color="#ef4444" />;
      case 'Entertainment': return <Film size={16} color="#8b5cf6" />;
      default: return <Tag size={16} color="#9ca3af" />;
    }
  };

  const categories = form.type === 'INCOME' 
    ? ['Salary', 'Freelance', 'Business', 'Investment Return', 'Rental Income', 'Other Income']
    : ['Food & Dining', 'Shopping', 'Rent & Housing', 'Education', 'Travel & Fuel', 'Bills & Utilities', 'Healthcare', 'Entertainment', 'Other Expenses'];

  const filteredFlows = cashFlows.filter(cf => {
    if (filterType === 'ALL') return true;
    return cf.type === filterType;
  });

  // Chart data: Expense categories
  const expenseCat = summary?.expenseByCategory || {};
  const expenseDoughnutData = {
    labels: Object.keys(expenseCat),
    datasets: [{
      data: Object.values(expenseCat),
      backgroundColor: ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#64748b'],
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)'
    }]
  };

  // Chart data: Monthly Income vs Expense
  const monthlyInc = summary?.monthlyIncome || {};
  const monthlyExp = summary?.monthlyExpense || {};
  const allMonths = Array.from(new Set([...Object.keys(monthlyInc), ...Object.keys(monthlyExp)])).sort();

  const cashFlowBarData = {
    labels: allMonths.map(m => {
      const parts = m.split('-');
      const d = new Date(parts[0], parseInt(parts[1]) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Income',
        data: allMonths.map(m => monthlyInc[m] || 0),
        backgroundColor: '#10b981',
        borderRadius: 6
      },
      {
        label: 'Expense',
        data: allMonths.map(m => monthlyExp[m] || 0),
        backgroundColor: '#ef4444',
        borderRadius: 6
      }
    ]
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh' }}><h3>Loading Cash Flows...</h3></div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Income & Expense Management</h1>
          <p style={{ margin: 0 }}>Categorize your income sources and track where every rupee goes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>Add Cash Flow</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Registered Income</span>
            <div className="badge badge-success">Cash In</div>
          </div>
          <div className="metric-value" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(summary?.totalIncome || 0)}
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>Salary, freelancing & investment profits</p>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Expenses</span>
            <div className="badge badge-danger">Cash Out</div>
          </div>
          <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
            {formatCurrency(summary?.totalExpenses || 0)}
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>Living costs, rent, bills & food</p>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Net Monthly Savings</span>
            <div className="badge badge-primary">{summary?.savingsRatePct || 0}% Savings Rate</div>
          </div>
          <div className="metric-value" style={{ color: (summary?.netSavings || 0) >= 0 ? 'var(--color-secondary)' : 'var(--color-danger)' }}>
            {formatCurrency(summary?.netSavings || 0)}
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>Surplus funds available to invest in SIPs/FDs</p>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <GlassCard>
          <h3 style={{ marginBottom: '1rem' }}>Where Your Money Goes (Expenses)</h3>
          <div style={{ height: '230px' }}>
            {Object.keys(expenseCat).length > 0 ? (
              <Doughnut 
                data={expenseDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right', labels: { color: '#9ca3af' } } }
                }}
              />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <p>No expenses recorded yet.</p>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 style={{ marginBottom: '1rem' }}>Monthly Cash Flow Progression</h3>
          <div style={{ height: '230px' }}>
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
      </div>

      {/* Ledger Table */}
      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0 }}>Transaction Ledger</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${filterType === 'ALL' ? 'btn-primary' : ''}`}
              onClick={() => setFilterType('ALL')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              All ({cashFlows.length})
            </button>
            <button 
              className={`btn ${filterType === 'INCOME' ? 'btn-primary' : ''}`}
              onClick={() => setFilterType('INCOME')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Incomes
            </button>
            <button 
              className={`btn ${filterType === 'EXPENSE' ? 'btn-primary' : ''}`}
              onClick={() => setFilterType('EXPENSE')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Expenses
            </button>
          </div>
        </div>

        {filteredFlows.length > 0 ? (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Payment Mode</th>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlows.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getCategoryIcon(item.category)}
                      <strong>{item.category}</strong>
                    </div>
                  </td>
                  <td>{item.description || '-'}</td>
                  <td>
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                      {item.paymentMode || 'UPI'}
                    </span>
                  </td>
                  <td>{new Date(item.flowDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${item.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: item.type === 'INCOME' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                    </strong>
                  </td>
                  <td>
                    <button 
                      className="btn" 
                      onClick={() => handleDelete(item.id)}
                      style={{ padding: '0.3rem', border: 'none', background: 'transparent', color: 'var(--color-danger)' }}
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No cash flow records found. Click <strong>Add Cash Flow</strong> to start tracking your expenses!
          </div>
        )}
      </GlassCard>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <GlassCard>
              <h2 style={{ marginBottom: '1.25rem' }}>Add Cash Flow Record</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button"
                      className={`btn ${form.type === 'EXPENSE' ? 'btn-danger' : ''}`}
                      onClick={() => setForm({ ...form, type: 'EXPENSE', category: 'Food & Dining' })}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Expense (Outflow)
                    </button>
                    <button 
                      type="button"
                      className={`btn ${form.type === 'INCOME' ? 'btn-primary' : ''}`}
                      onClick={() => setForm({ ...form, type: 'INCOME', category: 'Salary' })}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Income (Inflow)
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select 
                    className="input-field"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input 
                      type="number"
                      step="any"
                      min="1"
                      className="input-field"
                      placeholder="e.g. 5000"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input 
                      type="date"
                      className="input-field"
                      value={form.flowDate}
                      onChange={e => setForm({ ...form, flowDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Payment Mode</label>
                    <select 
                      className="input-field"
                      value={form.paymentMode}
                      onChange={e => setForm({ ...form, paymentMode: e.target.value })}
                    >
                      <option value="UPI">UPI (GPay/PhonePe)</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes / Description</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. Monthly groceries from D-Mart"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Transaction</button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlowPage;
