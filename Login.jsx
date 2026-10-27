import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { TrendingUp, User, Mail, Lock, Phone } from 'lucide-react';

const loginStyle = `
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem 1rem;
  background-image: 
    radial-gradient(at 20% 20%, rgba(99, 102, 241, 0.25) 0px, transparent 40%),
    radial-gradient(at 80% 80%, rgba(6, 182, 212, 0.25) 0px, transparent 40%);
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 2.5rem 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.auth-logo-text {
  font-size: 1.6rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.auth-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
  display: block;
}

.auth-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  padding: 3px;
  border-radius: var(--radius-sm);
  margin-bottom: 1.75rem;
}

.auth-tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  transition: var(--transition-smooth);
}

.auth-tab-btn.active {
  background: var(--color-primary-glow);
  color: #fff;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.input-icon-group {
  position: relative;
}

.input-icon-group svg {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.input-icon-group input {
  padding-left: 2.75rem;
}

.auth-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  margin-bottom: 1.25rem;
}
`;

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CLIENT'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password, formData.phone, formData.role);
      }
    } catch (e) {
      setError(e.message || 'Authentication failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{loginStyle}</style>
      <div className="auth-page">
        <GlassCard className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <TrendingUp size={32} color="#06b6d4" />
              <span className="auth-logo-text">Unified Wealth</span>
            </div>
            <span className="auth-subtitle">
              All-in-One Personal Financial Management & Investment Planning System
            </span>
          </div>

          <div className="auth-tabs">
            <button 
              className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Register
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-icon-group">
                  <User size={18} />
                  <input 
                    type="text" 
                    name="name" 
                    className="input-field" 
                    placeholder="e.g. Bhavana" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <div className="input-icon-group">
                <Mail size={18} />
                <input 
                  type="email" 
                  name="email" 
                  className="input-field" 
                  placeholder="name@example.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="input-icon-group">
                <Lock size={18} />
                <input 
                  type="password" 
                  name="password" 
                  className="input-field" 
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <div className="input-icon-group">
                  <Phone size={18} />
                  <input 
                    type="tel" 
                    name="phone" 
                    className="input-field" 
                    placeholder="+91 98765 43210" 
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '0.8rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In to Account' : 'Create Account'}
            </button>
          </form>
        </GlassCard>
      </div>
    </>
  );
};

export default Login;
