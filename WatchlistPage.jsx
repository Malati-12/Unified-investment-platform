import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { Plus, Trash2, Search, TrendingUp, TrendingDown } from 'lucide-react';

const WatchlistPage = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('STOCK');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, [user]);

  const fetchWatchlist = async () => {
    if (!user) return;
    try {
      const data = await api.watchlist.list(user.id);
      setWatchlist(data);
    } catch (e) {
      console.error("Error loading watchlist", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    try {
      await api.watchlist.add(user.id, assetName.toUpperCase(), assetType);
      setAssetName('');
      await fetchWatchlist();
    } catch (e) {
      console.error("Error adding asset to watchlist", e);
    }
  };

  const handleRemoveAsset = async (id) => {
    try {
      await api.watchlist.remove(id);
      await fetchWatchlist();
    } catch (e) {
      console.error("Error removing asset", e);
    }
  };

  // Mock pricing and change percentages for watchlist UI
  const getMockPrice = (symbol) => {
    const prices = {
      'AAPL': { price: 185.45, change: 1.25, up: true },
      'MSFT': { price: 420.30, change: 0.85, up: true },
      'VOO': { price: 480.12, change: 0.45, up: true },
      'BTC': { price: 68420.00, change: -2.35, up: false },
      'ETH': { price: 3450.50, change: -1.80, up: false },
      'TSLA': { price: 175.60, change: 3.12, up: true },
      'AMZN': { price: 178.15, change: -0.22, up: false },
      'AGG': { price: 95.80, change: 0.05, up: true }
    };
    return prices[symbol.toUpperCase()] || { price: 150.00, change: 0.50, up: true };
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><h3>Loading Watchlist...</h3></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Personal Watchlist</h1>
          <p style={{ margin: 0 }}>Monitor target stock symbols, mutual funds, or coins before making purchases.</p>
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        {/* Add Asset Panel */}
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Search size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0 }}>Add Target Symbol</h3>
          </div>

          <form onSubmit={handleAddAsset}>
            <div className="form-group">
              <label className="form-label">Asset Ticker Symbol</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. AAPL, MSFT, BTC" 
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Asset Type</label>
              <select 
                className="input-field"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
              >
                <option value="STOCK">Stock</option>
                <option value="ETF">ETF</option>
                <option value="MUTUAL_FUND">Mutual Fund</option>
                <option value="BOND">Bond</option>
                <option value="CRYPTO">Crypto</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
              <Plus size={16} />
              <span>Add to Watchlist</span>
            </button>
          </form>
        </GlassCard>

        {/* Watchlist Table */}
        <GlassCard>
          <h3 style={{ marginBottom: '1rem' }}>Tracked Market Assets</h3>

          {watchlist.length > 0 ? (
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Simulated Price</th>
                  <th>24h Change</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map(item => {
                  const data = getMockPrice(item.assetName);
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.assetName}</strong></td>
                      <td>
                        <span className="badge badge-primary">{item.assetType}</span>
                      </td>
                      <td>${data.price.toLocaleString()}</td>
                      <td>
                        <span 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.2rem', 
                            color: data.up ? 'var(--color-success)' : 'var(--color-danger)', 
                            fontWeight: 600 
                          }}
                        >
                          {data.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          <span>{data.up ? '+' : ''}{data.change}%</span>
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleRemoveAsset(item.id)}
                          style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}
                          title="Remove from Watchlist"
                        >
                          <Trash2 size={16} color="var(--color-danger)" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Your watchlist is currently empty. Use the sidebar panel to add ticker symbols to track.
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default WatchlistPage;
