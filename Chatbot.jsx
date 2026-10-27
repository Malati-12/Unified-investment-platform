import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Send, Bot, User as UserIcon, ShieldCheck, Key, HelpCircle } from 'lucide-react';
import GlassCard from './GlassCard';

const chatStyle = `
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-glass);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 0.5rem;
  margin-bottom: 1rem;
}

.chat-bubble {
  max-width: 80%;
  padding: 1rem;
  border-radius: var(--radius-md);
  line-height: 1.6;
  font-size: 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-bubble-bot {
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  align-self: flex-start;
  border-top-left-radius: 4px;
}

.chat-bubble-user {
  background: var(--color-primary-glow);
  border: 1px solid var(--border-glass-glow);
  align-self: flex-end;
  border-top-right-radius: 4px;
}

.chat-input-area {
  display: flex;
  gap: 0.75rem;
}

.chat-input-area input {
  flex: 1;
}

.api-key-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.85rem;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  transition: var(--transition-smooth);
}

.api-key-toggle:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.preset-queries {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  color: var(--text-secondary);
  padding: 0.4rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.preset-btn:hover {
  border-color: var(--color-primary);
  color: var(--text-primary);
  background: var(--color-primary-glow);
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.5rem;
}

.typing-dot {
  width: 6px;
  height: 6px;
  background: var(--text-secondary);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-bubble pre {
  background: rgba(0, 0, 0, 0.4);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.85rem;
  margin: 0.5rem 0;
  border: 1px solid var(--border-glass);
}

.chat-bubble code {
  font-family: monospace;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}

.chat-bubble ul, .chat-bubble ol {
  padding-left: 1.25rem;
}
`;

const Chatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${user?.name || 'Investor'}! I am your Unified Wealth AI Advisor.\n\nI have complete real-time context across your **Portfolio Holdings**, **Cash Flow (Income & Expenses)**, **Savings & Interest**, **Active Loans & EMIs**, and **Financial Goals**.\n\nAsk me anything! For example:\n- *"Analyze my portfolio risk & diversification"*\n- *"Review my monthly cash flow & savings rate"*\n- *"Recommend investments for my profile"*\n- *"How do my active loans and EMIs look?"*\n- *"Explain SIP compounding"*`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const msgText = textToSend || input;
    if (!msgText.trim()) return;

    if (!textToSend) {
      setInput('');
    }

    setMessages(prev => [...prev, { sender: 'user', text: msgText }]);
    setLoading(true);

    try {
      const userId = user?.id || 2;
      const result = await api.ai.chat(userId, msgText, apiKey);
      setMessages(prev => [...prev, { sender: 'bot', text: result.response || "No response received." }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'bot', text: `Sorry, I encountered an error: ${e.message}. Please verify the backend is running.` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = (val) => {
    setApiKey(val);
    if (val.trim()) {
      localStorage.setItem('gemini_api_key', val);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  const renderFormattedText = (text) => {
    // Simple formatter for bold and lists
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;
      
      // Handle markdown headings
      if (content.startsWith('### ')) {
        return <h4 key={idx} style={{ marginTop: '0.75rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{content.replace('### ', '')}</h4>;
      }
      if (content.startsWith('**') && content.endsWith('**')) {
        return <p key={idx} style={{ fontWeight: 600, color: '#fff' }}>{content.replace(/\*\*/g, '')}</p>;
      }
      
      // Handle lists
      if (content.startsWith('- ') || content.startsWith('* ')) {
        const item = content.substring(2);
        // Look for bold within list item
        return (
          <li key={idx} style={{ marginLeft: '1rem', listStyleType: 'disc' }}>
            {formatBold(item)}
          </li>
        );
      }
      
      return <p key={idx}>{formatBold(content)}</p>;
    });
  };

  const formatBold = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#fff' }}>{part}</strong> : part);
  };

  const presets = [
    "Analyze my portfolio risk",
    "Review my cash flow & savings",
    "Recommend assets for my profile",
    "What is my loan & EMI status?",
    "Explain SIP compounding",
    "What are Sovereign Gold Bonds (SGB)?"
  ];

  return (
    <>
      <style>{chatStyle}</style>
      <GlassCard className="chat-container">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={24} color="var(--color-primary)" />
            <div>
              <h3 style={{ margin: 0 }}>AI Financial Advisor</h3>
              <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-secondary)' }}>
                {apiKey ? '🟢 Live Gemini 1.5 Enabled' : '💡 Built-in Intelligent Financial Engine (Active)'}
              </p>
            </div>
          </div>
          
          <button 
            className="api-key-toggle" 
            onClick={() => setShowKeyInput(!showKeyInput)}
          >
            <Key size={16} />
            <span>{apiKey ? 'Change Gemini Key' : 'Add Gemini Key'}</span>
          </button>
        </div>

        {showKeyInput && (
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', animation: 'modalSlideUp 0.2s ease-out' }}>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Paste Gemini API Key (AIzaSy...)" 
              value={apiKey}
              onChange={(e) => handleSaveKey(e.target.value)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            />
            <button className="btn btn-primary" onClick={() => setShowKeyInput(false)} style={{ padding: '0.5rem 1rem' }}>
              Save
            </button>
          </div>
        )}

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`chat-bubble ${msg.sender === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user'}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                {msg.sender === 'bot' ? <Bot size={14} /> : <UserIcon size={14} />}
                <span>{msg.sender === 'bot' ? 'UIP ADVISOR' : 'YOU'}</span>
              </div>
              <div className="chat-text-content">
                {renderFormattedText(msg.text)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble chat-bubble-bot">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                <Bot size={14} />
                <span>UIP ADVISOR</span>
              </div>
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="preset-queries">
          {presets.map((q, idx) => (
            <button key={idx} className="preset-btn" onClick={() => handleSend(q)}>
              {q}
            </button>
          ))}
        </div>

        <div className="chat-input-area">
          <input 
            type="text" 
            className="input-field" 
            placeholder="Ask about your allocations, risk targets, news, or advice..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button 
            className="btn btn-primary" 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </GlassCard>
    </>
  );
};

export default Chatbot;
