import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  ShieldCheck, 
  Users, 
  Wallet, 
  TrendingUp, 
  Landmark, 
  Target, 
  Eye, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Layers
} from 'lucide-react';

const AdminPortalPage = () => {
  const { user, formatCurrency } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientOverview, setClientOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([
        api.admin.getMetrics().catch(() => null),
        api.admin.getClients().catch(() => [])
      ]);
      setMetrics(m);
      setClients(c);
    } catch (err) {
      console.error("Failed to load admin telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectClient = async (client) => {
    setSelectedClient(client);
    try {
      const overview = await api.admin.getClientOverview(client.id);
      setClientOverview(overview);
    } catch (err) {
      console.error("Failed to fetch client drilldown", err);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh' }}><h3>Loading Administrative Master Console...</h3></div>;
  }

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={28} color="#38bdf8" />
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Administrative Master Console</h1>
          </div>
          <p style={{ margin: '0.2rem 0 0 0' }}>
            Multi-client oversight: Monitor all registered clients, aggregate platform wealth, and audit financial health.
          </p>
        </div>
        <div className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
          👑 Admin Level Access
        </div>
      </div>

      {/* Platform Aggregates Grid */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Platform AUM</span>
            <Wallet size={18} color="#38bdf8" />
          </div>
          <div className="metric-value" style={{ color: '#38bdf8' }}>
            {formatCurrency(metrics?.assetsUnderManagement || 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Investments + Savings</div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Registered Clients</span>
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div className="metric-value">{metrics?.totalClients || clients.length} Clients</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unlimited scalability</div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Platform Investments</span>
            <TrendingUp size={18} color="var(--color-success)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(metrics?.totalInvestments || 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Equities, MFs, Gold, Bonds</div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Platform Debt</span>
            <Landmark size={18} color="var(--color-danger)" />
          </div>
          <div className="metric-value" style={{ color: '#f87171' }}>
            {formatCurrency(metrics?.totalActiveDebt || 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Outstanding client loan liabilities</div>
        </GlassCard>
      </div>

      {/* Registered Clients Directory */}
      <GlassCard style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Registered Client Directory ({clients.length})</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Independent client data isolation: Clients see only their data; Admin views all.
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <input 
              type="text"
              className="input-field"
              placeholder="Search clients by name/email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>
        </div>

        <table className="glass-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Risk Profile</th>
              <th>CIBIL Score</th>
              <th>Investments</th>
              <th>Savings</th>
              <th>Loans (Debt)</th>
              <th>Net Worth</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id}>
                <td><strong>{client.name}</strong></td>
                <td>{client.email}</td>
                <td>
                  <span className={`badge ${client.role === 'ADMIN' ? 'badge-primary' : 'badge-success'}`}>
                    {client.role}
                  </span>
                </td>
                <td>{client.riskProfile || 'MODERATE'}</td>
                <td>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem', background: 'rgba(0,200,83,0.15)', color: '#00C853', border: '1px solid rgba(0,200,83,0.3)' }}>
                    🎯 {client.cibilScore || 765}
                  </span>
                </td>
                <td>{formatCurrency(client.totalInvestments)}</td>
                <td>{formatCurrency(client.totalSavings)}</td>
                <td style={{ color: client.totalLoans > 0 ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                  {formatCurrency(client.totalLoans)}
                </td>
                <td>
                  <strong style={{ color: '#38bdf8' }}>{formatCurrency(client.netWorth)}</strong>
                </td>
                <td>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleInspectClient(client)}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    <Eye size={14} />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Client Inspection Modal */}
      {selectedClient && (
        <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
          <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <GlassCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Client Financial Inspection: {selectedClient.name}</h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedClient.email} • {selectedClient.phone}</span>
                </div>
                <button className="btn" onClick={() => setSelectedClient(null)} style={{ padding: '0.3rem 0.6rem' }}>✕</button>
              </div>

              {/* Client Snapshot Cards */}
              <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Investments</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(selectedClient.totalInvestments)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Savings</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ec4899' }}>{formatCurrency(selectedClient.totalSavings)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calculated Net Worth</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{formatCurrency(selectedClient.netWorth)}</div>
                </div>
              </div>

              {/* Holdings Section */}
              <h4 style={{ marginBottom: '0.5rem' }}>Portfolio Holdings ({clientOverview?.holdings?.length || 0})</h4>
              {clientOverview?.holdings && clientOverview.holdings.length > 0 ? (
                <table className="glass-table" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Current Price</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientOverview.holdings.map((h, i) => (
                      <tr key={i}>
                        <td><strong>{h.assetName}</strong></td>
                        <td><span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{h.assetType}</span></td>
                        <td>{h.quantity}</td>
                        <td>{formatCurrency(h.currentPrice)}</td>
                        <td><strong>{formatCurrency(h.quantity * h.currentPrice)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No active holdings logged.</p>
              )}

              {/* Active Loans */}
              <h4 style={{ marginBottom: '0.5rem' }}>Active Loans ({clientOverview?.loans?.length || 0})</h4>
              {clientOverview?.loans && clientOverview.loans.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {clientOverview.loans.map(l => (
                    <div key={l.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{l.loanName}</strong> ({l.interestRate}% p.a.)</span>
                      <strong style={{ color: 'var(--color-danger)' }}>
                        Balance: {formatCurrency(Math.max(0, l.principalAmount - (l.amountPaid || 0)))}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Zero debt obligations.</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={() => setSelectedClient(null)}>Done Inspecting</button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortalPage;
