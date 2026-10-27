import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Briefcase, 
  History, 
  TrendingUp, 
  Search, 
  Coins, 
  FileSpreadsheet, 
  Building2, 
  Repeat, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const PortfolioPage = () => {
  const { user, formatCurrency } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [marketQuotes, setMarketQuotes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeAssetFilter, setActiveAssetFilter] = useState('ALL');

  const [showAddPort, setShowAddPort] = useState(false);
  const [newPortName, setNewPortName] = useState('');
  const [showTxModal, setShowTxModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [txForm, setTxForm] = useState({
    assetName: 'TATAMOTORS',
    assetType: 'STOCK',
    buySell: 'BUY',
    quantity: '10',
    price: '1045.75',
    interestRate: '',
    maturityDate: '',
    sipAmount: '',
    notes: ''
  });
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchHoldingsAndTx(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [ports, quotes, summ] = await Promise.all([
        api.portfolios.list(user.id),
        api.portfolios.getMarketQuotes().catch(() => []),
        api.portfolios.getUserSummary(user.id).catch(() => null)
      ]);
      setPortfolios(ports);
      setMarketQuotes(quotes);
      setSummary(summ);
      if (ports.length > 0) {
        if (!selectedPortfolio || !ports.some(p => p.id === selectedPortfolio.id)) {
          setSelectedPortfolio(ports[0]);
        }
      }
    } catch (e) {
      console.error("Error loading portfolio data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHoldingsAndTx = async (portfolioId) => {
    try {
      const [hData, tData, summ] = await Promise.all([
        api.portfolios.getHoldings(portfolioId),
        api.portfolios.getTransactions(portfolioId),
        api.portfolios.getUserSummary(user.id)
      ]);
      setHoldings(hData.filter(h => h.quantity > 0));
      setTransactions(tData);
      setSummary(summ);
    } catch (e) {
      console.error("Error fetching holdings/transactions", e);
    }
  };

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    if (!newPortName.trim()) return;
    try {
      const saved = await api.portfolios.create(user.id, newPortName);
      setNewPortName('');
      setShowAddPort(false);
      const updatedPorts = await api.portfolios.list(user.id);
      setPortfolios(updatedPorts);
      setSelectedPortfolio(saved);
    } catch (e) {
      console.error("Error creating portfolio", e);
    }
  };

  const handleQuickSelectQuote = (quote) => {
    setTxForm({
      ...txForm,
      assetName: quote.symbol,
      assetType: quote.assetType,
      price: quote.currentPrice.toString()
    });
  };

  const handleTxSubmit = async (e) => {
    e.preventDefault();
    setTxError('');
    setTxSuccess('');
    if (!txForm.assetName || !txForm.quantity || !txForm.price) {
      setTxError('Please enter asset name, quantity, and price.');
      return;
    }

    try {
      let targetPort = selectedPortfolio;
      if (!targetPort && portfolios.length > 0) {
        targetPort = portfolios[0];
        setSelectedPortfolio(portfolios[0]);
      }

      // If user has no portfolio, auto-create one!
      if (!targetPort) {
        const created = await api.portfolios.create(user.id, "Main Investment Portfolio");
        targetPort = created;
        setSelectedPortfolio(created);
        const updated = await api.portfolios.list(user.id);
        setPortfolios(updated);
      }

      await api.portfolios.executeTransaction(
        targetPort.id,
        txForm.assetName.toUpperCase(),
        txForm.assetType,
        txForm.buySell,
        parseFloat(txForm.quantity),
        parseFloat(txForm.price)
      );

      const successMsg = `Order executed successfully! ${txForm.buySell} ${txForm.quantity} units of ${txForm.assetName.toUpperCase()} at ₹${parseFloat(txForm.price).toLocaleString('en-IN')}`;
      setTxSuccess(successMsg);
      setTimeout(() => setTxSuccess(''), 6000);

      setShowTxModal(false);
      setTxForm({
        assetName: 'TATAMOTORS',
        assetType: 'STOCK',
        buySell: 'BUY',
        quantity: '10',
        price: '1045.75',
        interestRate: '',
        maturityDate: '',
        sipAmount: '',
        notes: ''
      });

      const updatedPorts = await api.portfolios.list(user.id);
      setPortfolios(updatedPorts);
      const current = updatedPorts.find(p => p.id === targetPort.id) || updatedPorts[0];
      setSelectedPortfolio(current);
      await fetchHoldingsAndTx(current.id);
    } catch (err) {
      setTxError(err.message || 'Transaction failed. Please check holding balance.');
    }
  };

  // Filter holdings by asset class
  const filteredHoldings = holdings.filter(h => {
    if (activeAssetFilter === 'ALL') return true;
    if (activeAssetFilter === 'MUTUAL_FUND') return h.assetType === 'MUTUAL_FUND' || h.assetType === 'SIP';
    if (activeAssetFilter === 'FIXED_INCOME') return h.assetType === 'FD' || h.assetType === 'BOND';
    return h.assetType === activeAssetFilter;
  });

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh' }}><h3>Loading Investments Hub...</h3></div>;
  }

  // Calculate totals for currently selected portfolio
  const portfolioInvested = holdings.reduce((sum, h) => sum + ((h.buyPrice || h.currentPrice) * h.quantity), 0);
  const portfolioCurrentVal = holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
  const portfolioPnL = portfolioCurrentVal - portfolioInvested;
  const portfolioPnLPct = portfolioInvested > 0 ? (portfolioPnL / portfolioInvested) * 100.0 : 0.0;

  return (
    <div>
      {/* Success Notification Banner */}
      {txSuccess && (
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.15)', 
          border: '1px solid var(--color-success)', 
          color: '#34d399', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '10px', 
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 600,
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle2 size={20} color="#34d399" />
          <span>{txSuccess}</span>
        </div>
      )}

      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Investment Management (Groww & Angel One Style)</h1>
          <p style={{ margin: 0 }}>Real-time multi-asset tracking: Stocks, Mutual Funds, SIP, FDs, Bonds, ETFs, and Digital Gold.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={() => setShowAddPort(true)}>
            <Briefcase size={16} />
            <span>New Portfolio</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowTxModal(true)}>
            <Plus size={16} />
            <span>Execute Trade / SIP</span>
          </button>
        </div>
      </div>

      {/* Live Market Pulse Bar (Groww/AngelOne style) */}
      <div style={{ 
        background: 'rgba(10, 15, 30, 0.7)', 
        border: '1px solid var(--border-glass)', 
        borderRadius: '12px', 
        padding: '0.75rem 1rem', 
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        overflowX: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-secondary)', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>
          <TrendingUp size={16} />
          <span>MARKET WATCH:</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          {marketQuotes.map((q, idx) => (
            <div 
              key={idx} 
              onClick={() => { handleQuickSelectQuote(q); setShowTxModal(true); }}
              style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--border-glass)', 
                borderRadius: '8px', 
                padding: '0.35rem 0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                transition: 'var(--transition-smooth)'
              }}
              className="glass-panel-interactive"
              title="Click to trade"
            >
              <span style={{ fontWeight: 600 }}>{q.symbol}</span>
              <span style={{ color: 'var(--text-primary)' }}>₹{q.currentPrice?.toLocaleString('en-IN')}</span>
              <span style={{ color: q.dayChange >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, fontSize: '0.75rem' }}>
                {q.dayChange >= 0 ? '+' : ''}{q.dayChangePct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolios Tab Selector & Empty State Handling */}
      {portfolios.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem 1.5rem', marginBottom: '1.5rem' }}>
          <Briefcase size={36} color="var(--color-primary)" style={{ margin: '0 auto 0.75rem' }} />
          <h2 style={{ margin: '0 0 0.5rem' }}>No Investment Portfolios Created Yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.25rem', fontSize: '0.9rem' }}>
            Create your first portfolio to start tracking Indian Equities, Mutual Funds, SIPs, Digital Gold, and Fixed Deposits.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddPort(true)}>
            <Plus size={16} />
            <span>Create First Portfolio</span>
          </button>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.25rem', alignItems: 'center' }}>
          {portfolios.map(p => (
            <button 
              key={p.id}
              className={`btn ${selectedPortfolio?.id === p.id ? 'btn-primary' : ''}`}
              onClick={() => setSelectedPortfolio(p)}
              style={{ fontSize: '0.85rem' }}
            >
              <Briefcase size={14} />
              <span>{p.name}</span>
              <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>({formatCurrency(p.totalValue || 0)})</span>
            </button>
          ))}
          <button 
            className="btn" 
            onClick={() => setShowAddPort(true)} 
            style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', padding: '0.4rem 0.8rem' }}
            title="Add another portfolio"
          >
            <Plus size={14} />
            <span>Add Portfolio</span>
          </button>
        </div>
      )}

      {/* Main KPI Summary for Selected Portfolio */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Portfolio Value</span>
          <div className="metric-value" style={{ color: '#38bdf8' }}>{formatCurrency(portfolioCurrentVal)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live market valuation</div>
        </GlassCard>

        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Invested Capital</span>
          <div className="metric-value">{formatCurrency(portfolioInvested)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total purchase cost basis</div>
        </GlassCard>

        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unrealized Returns (P&L)</span>
          <div className="metric-value" style={{ color: portfolioPnL >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {portfolioPnL >= 0 ? '+' : ''}{formatCurrency(portfolioPnL)}
          </div>
          <div className="metric-change" style={{ color: portfolioPnL >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {portfolioPnL >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{portfolioPnLPct.toFixed(2)}% All-Time Return</span>
          </div>
        </GlassCard>

        <GlassCard>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Asset Classes</span>
          <div className="metric-value" style={{ color: '#f59e0b' }}>{holdings.length} Assets</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Diversified multi-asset spread</div>
        </GlassCard>
      </div>

      {/* Asset Class Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'ALL', label: 'All Holdings' },
          { id: 'STOCK', label: 'Stocks / Equities' },
          { id: 'MUTUAL_FUND', label: 'Mutual Funds & SIP' },
          { id: 'FIXED_INCOME', label: 'Fixed Deposits & Bonds' },
          { id: 'GOLD', label: 'Digital Gold' },
          { id: 'ETF', label: 'ETFs' },
        ].map(pill => (
          <button 
            key={pill.id}
            className={`btn ${activeAssetFilter === pill.id ? 'btn-primary' : ''}`}
            onClick={() => setActiveAssetFilter(pill.id)}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Holdings Table */}
      <GlassCard style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Active Holdings ({filteredHoldings.length})</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Portfolio: <strong>{selectedPortfolio?.name}</strong>
          </span>
        </div>

        {filteredHoldings.length > 0 ? (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Type</th>
                <th>Quantity / Units</th>
                <th>Avg Buy Price</th>
                <th>Current Price</th>
                <th>Invested Amount</th>
                <th>Current Value</th>
                <th>Overall Return (P&L)</th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.map(h => {
                const buyP = h.buyPrice || h.currentPrice;
                const invested = buyP * h.quantity;
                const currentVal = h.currentPrice * h.quantity;
                const pnl = currentVal - invested;
                const pnlPct = invested > 0 ? (pnl / invested) * 100.0 : 0.0;

                return (
                  <tr key={h.id}>
                    <td>
                      <div>
                        <strong>{h.assetName}</strong>
                        {h.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{h.notes}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                        {h.assetType}
                      </span>
                    </td>
                    <td>{h.quantity}</td>
                    <td>{formatCurrency(buyP)}</td>
                    <td><strong>{formatCurrency(h.currentPrice)}</strong></td>
                    <td>{formatCurrency(invested)}</td>
                    <td><strong>{formatCurrency(currentVal)}</strong></td>
                    <td>
                      <div style={{ color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>
                          ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No holdings found under this filter. Click <strong>Execute Trade / SIP</strong> above to log your investments!
          </div>
        )}
      </GlassCard>

      {/* Transaction History Log */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <History size={18} color="var(--color-primary)" />
          <h3 style={{ margin: 0 }}>Transaction Execution History</h3>
        </div>

        {transactions.length > 0 ? (
          <table className="glass-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Action</th>
                <th>Quantity</th>
                <th>Execution Price</th>
                <th>Total Value</th>
                <th>Execution Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).map(t => (
                <tr key={t.id}>
                  <td><strong>{t.investment?.assetName}</strong></td>
                  <td>{t.investment?.assetType}</td>
                  <td>
                    <span className={`badge ${t.buySell === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                      {t.buySell}
                    </span>
                  </td>
                  <td>{t.quantity}</td>
                  <td>{formatCurrency(t.price)}</td>
                  <td><strong>{formatCurrency(t.quantity * t.price)}</strong></td>
                  <td>{new Date(t.transactionDate).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No past transactions recorded for this portfolio.
          </div>
        )}
      </GlassCard>

      {/* Modal: New Portfolio */}
      {showAddPort && (
        <div className="modal-overlay" onClick={() => setShowAddPort(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <GlassCard>
              <h2 style={{ marginBottom: '1.25rem' }}>Create New Portfolio</h2>
              <form onSubmit={handleCreatePortfolio}>
                <div className="form-group">
                  <label className="form-label">Portfolio Title *</label>
                  <input 
                    type="text"
                    className="input-field"
                    placeholder="e.g. Long Term Equities, FD & Liquid Reserve, Crypto Alpha"
                    value={newPortName}
                    onChange={e => setNewPortName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn" onClick={() => setShowAddPort(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create</button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Modal: Execute Trade / Buy / Sell / SIP */}
      {showTxModal && (
        <div className="modal-overlay" onClick={() => setShowTxModal(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <GlassCard>
              <h2 style={{ marginBottom: '0.5rem' }}>Execute Investment / Trade</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
                Add Indian Stocks, Mutual Funds, SIPs, Fixed Deposits, Bonds, or ETFs to your portfolio.
              </p>

              {txError && <div className="auth-error" style={{ marginBottom: '1rem' }}>{txError}</div>}

              <form onSubmit={handleTxSubmit}>
                {/* Destination Portfolio Selector */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Destination Portfolio *</label>
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={() => setShowAddPort(true)} 
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                    >
                      + New Portfolio
                    </button>
                  </div>
                  {portfolios.length > 0 ? (
                    <select 
                      className="input-field"
                      value={selectedPortfolio?.id || portfolios[0]?.id || ''}
                      onChange={e => {
                        const portId = parseInt(e.target.value);
                        const p = portfolios.find(item => item.id === portId);
                        if (p) setSelectedPortfolio(p);
                      }}
                    >
                      {portfolios.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.totalValue || 0)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#38bdf8', padding: '0.4rem 0' }}>
                      ✨ A default 'Main Investment Portfolio' will be created automatically for this trade.
                    </div>
                  )}
                </div>

                {/* Popular Quick Select */}
                <div className="form-group">
                  <label className="form-label">Quick Select Indian Market Assets:</label>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {['TATAMOTORS', 'RELIANCE', 'TCS', 'HDFCBANK', 'Parag Parikh Flexi Cap Fund', 'GOLD BEES ETF'].map(sym => (
                      <button 
                        key={sym} 
                        type="button" 
                        className="btn" 
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => {
                          const quote = marketQuotes.find(q => q.symbol === sym);
                          if (quote) {
                            handleQuickSelectQuote(quote);
                          } else {
                            setTxForm({ ...txForm, assetName: sym });
                          }
                        }}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Asset Name / Symbol *</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. INFY, Parag Parikh Flexi Cap, HDFC FD"
                      value={txForm.assetName}
                      onChange={e => setTxForm({ ...txForm, assetName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Asset Class *</label>
                    <select 
                      className="input-field"
                      value={txForm.assetType}
                      onChange={e => setTxForm({ ...txForm, assetType: e.target.value })}
                    >
                      <option value="STOCK">Stock / Equity</option>
                      <option value="MUTUAL_FUND">Mutual Fund</option>
                      <option value="SIP">SIP (Monthly Systematic)</option>
                      <option value="FD">Fixed Deposit (FD)</option>
                      <option value="BOND">Govt Bond / SGB</option>
                      <option value="ETF">ETF</option>
                      <option value="GOLD">Digital Gold</option>
                      <option value="CRYPTO">Crypto</option>
                      <option value="OTHER">Other Investment</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Action</label>
                    <select 
                      className="input-field"
                      value={txForm.buySell}
                      onChange={e => setTxForm({ ...txForm, buySell: e.target.value })}
                    >
                      <option value="BUY">BUY / INVEST</option>
                      <option value="SELL">SELL / REDEEM</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity / Units *</label>
                    <input 
                      type="number"
                      step="any"
                      min="0.001"
                      className="input-field"
                      value={txForm.quantity}
                      onChange={e => setTxForm({ ...txForm, quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price per Unit (₹) *</label>
                    <input 
                      type="number"
                      step="any"
                      min="0.01"
                      className="input-field"
                      value={txForm.price}
                      onChange={e => setTxForm({ ...txForm, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Total Investment Volume:</span>
                    <strong style={{ color: 'var(--color-secondary)' }}>
                      {formatCurrency((parseFloat(txForm.quantity) || 0) * (parseFloat(txForm.price) || 0))}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button type="button" className="btn" onClick={() => setShowTxModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Execute Order</button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
