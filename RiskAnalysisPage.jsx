import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { ShieldCheck, HelpCircle, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const questions = [
  {
    id: 1,
    text: "What is your primary investment goal?",
    options: [
      { text: "Capital preservation and stable income", points: 1 },
      { text: "A mix of safety and moderate growth", points: 3 },
      { text: "Maximum capital growth over the long run", points: 5 }
    ]
  },
  {
    id: 2,
    text: "What is your investment time horizon?",
    options: [
      { text: "Less than 2 years", points: 1 },
      { text: "3 to 7 years", points: 3 },
      { text: "More than 7 years", points: 5 }
    ]
  },
  {
    id: 3,
    text: "If your portfolio fell 20% in a month due to market correction, what would you do?",
    options: [
      { text: "Sell all remaining holdings to avoid further losses", points: 1 },
      { text: "Do nothing and wait for market recovery", points: 3 },
      { text: "Buy more assets at discount prices", points: 5 }
    ]
  },
  {
    id: 4,
    text: "How would you describe your knowledge of financial investments?",
    options: [
      { text: "Novice - I don't understand index funds or volatility", points: 1 },
      { text: "Intermediate - I understand stocks, bonds, and mutual funds", points: 3 },
      { text: "Advanced - I trade options, cryptocurrencies, and index ETFs", points: 5 }
    ]
  },
  {
    id: 5,
    text: "What is your primary source of income?",
    options: [
      { text: "Retirement pension / interest earnings", points: 1 },
      { text: "Stable salary / employment income", points: 3 },
      { text: "Self-employed / variable commission", points: 5 }
    ]
  }
];

const RiskAnalysisPage = () => {
  const { user, refreshUser } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showSurvey, setShowSurvey] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, [user]);

  const fetchAnalysis = async () => {
    if (!user) return;
    try {
      const data = await api.risk.getAnalysis(user.id);
      setAnalysis(data);
      if (data.riskProfile === 'UNASSESSED') {
        setShowSurvey(true);
      }
    } catch (e) {
      console.error("Error loading risk assessment data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (points) => {
    setAnswers({
      ...answers,
      [currentQuestion]: points
    });

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate final score
      const totalPoints = Object.values({ ...answers, [currentQuestion]: points })
        .reduce((sum, p) => sum + p, 0);
      submitRiskProfile(totalPoints);
    }
  };

  const submitRiskProfile = async (points) => {
    setLoading(true);
    let profile = 'MODERATE';
    if (points <= 8) {
      profile = 'CONSERVATIVE';
    } else if (points >= 18) {
      profile = 'AGGRESSIVE';
    }

    try {
      await api.risk.updateProfile(user.id, profile);
      await refreshUser();
      setShowSurvey(false);
      setCurrentQuestion(0);
      setAnswers({});
      await fetchAnalysis();
    } catch (e) {
      console.error("Error saving risk profile", e);
    } finally {
      setLoading(false);
    }
  };

  // Setup Chart Data (Target vs Actual)
  const getChartData = () => {
    if (!analysis) return null;
    const labels = ['Stocks', 'Mutual Funds', 'ETFs', 'Bonds', 'Crypto'];
    return {
      labels,
      datasets: [
        {
          label: 'Target Weight (%)',
          data: [
            analysis.targetAllocation.STOCKS || 0,
            analysis.targetAllocation.MUTUAL_FUNDS || 0,
            analysis.targetAllocation.ETFS || 0,
            analysis.targetAllocation.BONDS || 0,
            analysis.targetAllocation.CRYPTO || 0,
          ],
          backgroundColor: 'rgba(99, 102, 241, 0.4)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
        {
          label: 'Actual Weight (%)',
          data: [
            analysis.actualAllocation.STOCKS || 0,
            analysis.actualAllocation.MUTUAL_FUNDS || 0,
            analysis.actualAllocation.ETFS || 0,
            analysis.actualAllocation.BONDS || 0,
            analysis.actualAllocation.CRYPTO || 0,
          ],
          backgroundColor: 'rgba(6, 182, 212, 0.6)',
          borderColor: 'rgba(6, 182, 212, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9ca3af',
          font: { family: 'Outfit' }
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9ca3af', font: { family: 'Outfit' }, callback: (val) => `${val}%` }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
      }
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><h3>Loading Analysis...</h3></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Risk Analysis & Rebalancing</h1>
          <p style={{ margin: 0 }}>Align actual holding weights with target risk allocation models.</p>
        </div>
        {!showSurvey && (
          <button className="btn" onClick={() => setShowSurvey(true)}>
            Retake Assessment
          </button>
        )}
      </div>

      {showSurvey ? (
        <GlassCard className="modal-content" style={{ maxWidth: '600px', margin: '3rem auto', padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <HelpCircle size={24} color="var(--color-primary)" />
            <h3 style={{ margin: 0 }}>Risk Assessor: Question {currentQuestion + 1} of {questions.length}</h3>
          </div>

          <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            {questions[currentQuestion].text}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions[currentQuestion].options.map((opt, idx) => (
              <button 
                key={idx}
                className="btn glass-panel-interactive"
                onClick={() => handleSelectOption(opt.points)}
                style={{ textAlign: 'left', padding: '1rem 1.5rem', justifyContent: 'space-between' }}
              >
                <span>{opt.text}</span>
                <ArrowRight size={16} color="var(--text-secondary)" />
              </button>
            ))}
          </div>
        </GlassCard>
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
          {/* Charts panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <GlassCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Allocation Variance: Target vs Actual</h3>
                <span className="badge badge-primary">
                  {analysis?.riskProfile} PROFILE
                </span>
              </div>
              <div style={{ height: '320px' }}>
                <Bar data={getChartData()} options={chartOptions} />
              </div>
            </GlassCard>

            {/* Detailed rebalancing advice */}
            <GlassCard style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Sparkles size={24} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>AI Rebalancing Advice</h3>
                <p style={{ lineHeight: '1.6' }}>{analysis?.recommendation}</p>
              </div>
            </GlassCard>
          </div>

          {/* Allocation targets info */}
          <GlassCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <ShieldCheck size={22} color="var(--color-success)" />
              <h3 style={{ margin: 0 }}>Target Allocation Weights</h3>
            </div>
            
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Standard weights optimized for your volatility profile:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {analysis && Object.entries(analysis.targetAllocation).map(([asset, weight]) => (
                <div key={asset} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {asset.toLowerCase().replace('_', ' ')}
                    </span>
                    <strong>{weight}%</strong>
                  </div>
                  <div className="progress-bar-container" style={{ margin: 0, height: '6px' }}>
                    <div className="progress-bar-fill" style={{ width: `${weight}%`, background: 'var(--color-primary)' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default RiskAnalysisPage;
