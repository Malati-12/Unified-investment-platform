import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  TrendingUp, 
  PiggyBank, 
  Target, 
  Landmark, 
  FileText, 
  ShieldAlert, 
  Newspaper, 
  Bot, 
  LogOut,
  ShieldCheck,
  Shield,
  Receipt
} from 'lucide-react';

const sidebarStyle = `
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  background: rgba(10, 15, 30, 0.85);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem;
  z-index: 100;
  overflow-y: auto;
}

.sidebar-logo {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
  padding: 0.25rem 0.5rem;
}

.currency-toggle-box {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  padding: 3px;
  margin-bottom: 1.25rem;
}

.currency-toggle-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.35rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.currency-toggle-btn.active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
}

.sidebar-menu {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.sidebar-section-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  padding: 0.5rem 0.75rem 0.2rem 0.75rem;
  font-weight: 700;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.88rem;
  transition: var(--transition-smooth);
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: var(--color-primary-glow);
  color: var(--text-primary);
  border-left: 3px solid var(--color-primary);
  box-shadow: inset 5px 0 10px rgba(99, 102, 241, 0.05);
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid var(--border-glass);
  padding-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.user-profile-section {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.25rem 0.5rem;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role-badge {
  font-size: 0.7rem;
  color: var(--color-secondary);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
}
`;

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout, currency, changeCurrency, isAdmin } = useAuth();

  const mainSections = [
    { id: 'dashboard', label: '1. Financial Dashboard', icon: LayoutDashboard },
    { id: 'cashflow', label: '2. Income & Expenses', icon: ArrowLeftRight },
    { id: 'portfolio', label: '3. Investment Manager', icon: TrendingUp },
    { id: 'savings', label: '4. Savings & Interest', icon: PiggyBank },
    { id: 'goals', label: '5. Financial Goals', icon: Target },
    { id: 'loans', label: '6. Loans & EMI Schedule', icon: Landmark },
    { id: 'reports', label: '7. Reports & Insights', icon: FileText },
  ];

  const protectionSections = [
    { id: 'insurance', label: '8. Insurance & Cover', icon: Shield },
    { id: 'tax', label: '9. Tax Optimizer (80C/D)', icon: Receipt },
  ];

  const intelligenceSections = [
    { id: 'risk', label: 'Risk Analysis', icon: ShieldAlert },
    { id: 'news', label: 'Market News', icon: Newspaper },
    { id: 'ai-chat', label: 'AI Advisor', icon: Bot },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <style>{sidebarStyle}</style>
      <div className="sidebar">
        <div className="sidebar-logo">
          <TrendingUp size={22} color="#06b6d4" />
          <span>Unified Wealth</span>
        </div>

        {/* Currency Switcher */}
        <div className="currency-toggle-box">
          <button 
            className={`currency-toggle-btn ${currency === 'INR' ? 'active' : ''}`}
            onClick={() => changeCurrency('INR')}
          >
            ₹ INR (Indian)
          </button>
          <button 
            className={`currency-toggle-btn ${currency === 'USD' ? 'active' : ''}`}
            onClick={() => changeCurrency('USD')}
          >
            $ USD
          </button>
        </div>

        <div className="sidebar-section-label">Core Modules</div>
        <ul className="sidebar-menu">
          {mainSections.map((item) => {
            const Icon = item.icon;
            return (
              <li 
                key={item.id}
                className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </li>
            );
          })}

          <div className="sidebar-section-label" style={{ marginTop: '0.5rem' }}>Protection & Tax</div>
          {protectionSections.map((item) => {
            const Icon = item.icon;
            return (
              <li 
                key={item.id}
                className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </li>
            );
          })}

          <div className="sidebar-section-label" style={{ marginTop: '0.5rem' }}>Intelligence & Tools</div>
          {intelligenceSections.map((item) => {
            const Icon = item.icon;
            return (
              <li 
                key={item.id}
                className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </li>
            );
          })}

          {/* Admin Command Center - Only visible when logged in as Administrator */}
          {isAdmin && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: '0.5rem' }}>Administration</div>
              <li 
                className={`sidebar-item ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
                style={{ 
                  background: activeTab === 'admin' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.05)',
                  borderColor: 'rgba(6, 182, 212, 0.3)',
                  color: '#38bdf8'
                }}
              >
                <ShieldCheck size={18} color="#38bdf8" />
                <span>Admin Console</span>
              </li>
            </>
          )}
        </ul>

        {user && (
          <div className="sidebar-footer">
            <div className="user-profile-section">
              <div className="avatar">
                {getInitials(user.name)}
              </div>
              <div className="user-info">
                <span className="user-name" title={user.name}>{user.name}</span>
                <span className="user-role-badge">
                  {isAdmin ? '🛡️ Administrator' : `${user.riskProfile ? user.riskProfile + ' Risk' : 'Verified'} Investor`}
                </span>
              </div>
            </div>
            <button className="btn btn-danger" onClick={logout} style={{ width: '100%', justifyContent: 'center', padding: '0.5rem' }}>
              <LogOut size={16} />
              <span style={{ fontSize: '0.85rem' }}>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
