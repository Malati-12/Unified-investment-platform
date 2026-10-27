import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { Newspaper, Sparkles, Calendar, ArrowRight, X } from 'lucide-react';

const newsStyle = `
.news-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .news-grid {
    grid-template-columns: 1fr;
  }
}

.news-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.news-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  color: #fff;
}

.news-summary-original {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.summary-modal-content {
  max-width: 550px;
  width: 100%;
  animation: modalSlideUp 0.3s ease-out;
}

.summary-text-block {
  line-height: 1.6;
  font-size: 0.95rem;
}

.summary-text-block h3 {
  margin-top: 1rem;
  color: var(--color-secondary);
  font-weight: 600;
}

.summary-text-block li {
  margin-left: 1.25rem;
  list-style-type: disc;
}
`;

const MarketNewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await api.news.list();
      setNews(data);
    } catch (e) {
      console.error("Error fetching news list", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (id) => {
    setSummarizing(true);
    try {
      const result = await api.news.summarize(id);
      setSelectedSummary(result);
    } catch (e) {
      console.error("Error summarizing news", e);
    } finally {
      setSummarizing(false);
    }
  };

  const formatAIContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;
      if (content.startsWith('### ')) {
        return <h3 key={idx} style={{ color: 'var(--color-secondary)', margin: '1rem 0 0.5rem 0', fontSize: '1.1rem' }}>{content.replace('### ', '')}</h3>;
      }
      if (content.startsWith('- ')) {
        const item = content.substring(2);
        return <li key={idx} style={{ marginLeft: '1.25rem' }}>{formatBold(item)}</li>;
      }
      return <p key={idx} style={{ margin: '0.4rem 0' }}>{formatBold(content)}</p>;
    });
  };

  const formatBold = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#fff' }}>{part}</strong> : part);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><h3>Loading Market News...</h3></div>;
  }

  return (
    <div>
      <style>{newsStyle}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Financial Market News</h1>
          <p style={{ margin: 0 }}>Stay informed on global markets and run AI-generated bullet points digests.</p>
        </div>
      </div>

      <div className="news-grid">
        {news.map(story => (
          <GlassCard key={story.id} className="news-card">
            <div className="news-meta">
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                {story.category}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={12} />
                <span>{new Date(story.publishedDate).toLocaleDateString()}</span>
              </div>
            </div>

            <h2 className="news-title">{story.title}</h2>
            <p className="news-summary-original">{story.summary}</p>

            <button 
              className="btn btn-primary" 
              onClick={() => handleSummarize(story.id)}
              disabled={summarizing}
              style={{ marginTop: 'auto', alignSelf: 'flex-start', fontSize: '0.85rem' }}
            >
              <Sparkles size={16} />
              <span>AI Digest</span>
            </button>
          </GlassCard>
        ))}
      </div>

      {/* Summary Dialog Modal */}
      {selectedSummary && (
        <div className="modal-overlay" onClick={() => setSelectedSummary(null)}>
          <div className="modal-content summary-modal-content" onClick={(e) => e.stopPropagation()}>
            <GlassCard style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} color="var(--color-primary)" />
                  <h3 style={{ margin: 0 }}>AI News Summarizer</h3>
                </div>
                <button className="btn" onClick={() => setSelectedSummary(null)} style={{ border: 'none', background: 'transparent', padding: '0.25rem' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="summary-text-block">
                {formatAIContent(selectedSummary.aiSummary)}
              </div>

              <button 
                className="btn" 
                onClick={() => setSelectedSummary(null)}
                style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
              >
                Close Digest
              </button>
            </GlassCard>
          </div>
        </div>
      )}

      {summarizing && (
        <div className="modal-overlay">
          <GlassCard style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Sparkles size={20} className="spinning" color="var(--color-primary)" />
            <h3 style={{ margin: 0 }}>Generating AI Digest...</h3>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default MarketNewsPage;
