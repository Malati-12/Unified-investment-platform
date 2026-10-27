const API_BASE_URL = 'http://localhost:8085/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const api = {
  // Authentication
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(response);
    },
    register: async (name, email, password, phone, role = 'CLIENT') => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, role }),
      });
      return handleResponse(response);
    },
    getUser: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`);
      return handleResponse(response);
    }
  },

  // Portfolios & Investments (Groww / Angel One style)
  portfolios: {
    list: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/portfolios/user/${userId}`);
      return handleResponse(response);
    },
    create: async (userId, name) => {
      const response = await fetch(`${API_BASE_URL}/portfolios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name }),
      });
      return handleResponse(response);
    },
    getHoldings: async (portfolioId) => {
      const response = await fetch(`${API_BASE_URL}/portfolios/${portfolioId}/holdings`);
      return handleResponse(response);
    },
    getTransactions: async (portfolioId) => {
      const response = await fetch(`${API_BASE_URL}/portfolios/${portfolioId}/transactions`);
      return handleResponse(response);
    },
    executeTransaction: async (portfolioId, assetName, assetType, buySell, quantity, price) => {
      const response = await fetch(`${API_BASE_URL}/portfolios/${portfolioId}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetName, assetType, buySell, quantity, price }),
      });
      return handleResponse(response);
    },
    getMarketQuotes: async () => {
      const response = await fetch(`${API_BASE_URL}/portfolios/market-quotes`);
      return handleResponse(response);
    },
    getUserSummary: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/portfolios/user/${userId}/summary`);
      return handleResponse(response);
    }
  },

  // Income & Expenses (Cash Flow)
  cashFlow: {
    list: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/cashflow/user/${userId}`);
      return handleResponse(response);
    },
    create: async (payload) => {
      const response = await fetch(`${API_BASE_URL}/cashflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/cashflow/${id}`, {
        method: 'DELETE',
      });
      return handleResponse(response);
    },
    summary: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/cashflow/user/${userId}/summary`);
      return handleResponse(response);
    }
  },

  // Savings & Interest Engine
  savings: {
    list: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/savings/user/${userId}`);
      return handleResponse(response);
    },
    create: async (payload) => {
      const response = await fetch(`${API_BASE_URL}/savings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/savings/${id}`, {
        method: 'DELETE',
      });
      return handleResponse(response);
    },
    calculateGrowth: async (initialDeposit, monthlyAddition, interestRate, periodYears) => {
      const response = await fetch(`${API_BASE_URL}/savings/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialDeposit, monthlyAddition, interestRate, periodYears }),
      });
      return handleResponse(response);
    },
    runCalculator: async (calcType, payload) => {
      const response = await fetch(`${API_BASE_URL}/savings/calculator/${calcType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    }
  },

  // Loans & EMI Management
  loans: {
    list: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/loans/user/${userId}`);
      return handleResponse(response);
    },
    create: async (payload) => {
      const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
        method: 'DELETE',
      });
      return handleResponse(response);
    },
    getAmortization: async (loanId) => {
      const response = await fetch(`${API_BASE_URL}/loans/${loanId}/amortization`);
      return handleResponse(response);
    },
    payEmi: async (loanId) => {
      const response = await fetch(`${API_BASE_URL}/loans/${loanId}/pay-emi`, {
        method: 'POST',
      });
      return handleResponse(response);
    }
  },

  // Goals
  goals: {
    list: async (portfolioId) => {
      const response = await fetch(`${API_BASE_URL}/goals/portfolio/${portfolioId}`);
      return handleResponse(response);
    },
    listByUser: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/goals/user/${userId}`);
      return handleResponse(response);
    },
    create: async (portfolioIdOrPayload, goalName, targetAmount, targetDate) => {
      let body;
      if (typeof portfolioIdOrPayload === 'object' && portfolioIdOrPayload !== null) {
        body = portfolioIdOrPayload;
      } else {
        body = { portfolioId: portfolioIdOrPayload, goalName, targetAmount, targetDate };
      }
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return handleResponse(response);
    },
    updateStatus: async (goalId, status) => {
      const response = await fetch(`${API_BASE_URL}/goals/${goalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return handleResponse(response);
    },
    delete: async (goalId) => {
      const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
        method: 'DELETE',
      });
      return handleResponse(response);
    }
  },

  // Reports
  reports: {
    getComprehensive: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/reports/user/${userId}/comprehensive`);
      return handleResponse(response);
    }
  },

  // Admin Portal
  admin: {
    getMetrics: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/metrics`);
      return handleResponse(response);
    },
    getClients: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/clients`);
      return handleResponse(response);
    },
    getClientOverview: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/admin/clients/${userId}/overview`);
      return handleResponse(response);
    },
    getDrawbackAnalysis: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/drawback-analysis`);
      return handleResponse(response);
    }
  },

  // Risk Profiling
  risk: {
    getAnalysis: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/risk/user/${userId}`);
      return handleResponse(response);
    },
    updateProfile: async (userId, riskProfile) => {
      const response = await fetch(`${API_BASE_URL}/risk/user/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskProfile }),
      });
      return handleResponse(response);
    }
  },

  // Watchlist
  watchlist: {
    list: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/watchlist/user/${userId}`);
      return handleResponse(response);
    },
    add: async (userId, assetName, assetType) => {
      const response = await fetch(`${API_BASE_URL}/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, assetName, assetType }),
      });
      return handleResponse(response);
    },
    remove: async (id) => {
      const response = await fetch(`${API_BASE_URL}/watchlist/${id}`, {
        method: 'DELETE',
      });
      return handleResponse(response);
    }
  },

  // News
  news: {
    list: async () => {
      const response = await fetch(`${API_BASE_URL}/news`);
      return handleResponse(response);
    },
    summarize: async (newsId) => {
      const response = await fetch(`${API_BASE_URL}/news/summarize/${newsId}`, {
        method: 'POST',
      });
      return handleResponse(response);
    }
  },

  // AI Chat
  ai: {
    chat: async (userId, message, geminiApiKey = null) => {
      const headers = { 'Content-Type': 'application/json' };
      if (geminiApiKey) {
        headers['X-Gemini-Key'] = geminiApiKey;
      }
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ userId, message, geminiApiKey: geminiApiKey || null }),
      });
      return handleResponse(response);
    }
  },

  // Insurance & Protection
  insurance: {
    list: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/insurance/user/${userId}`);
      return handleResponse(response);
    },
    create: async (payload) => {
      const response = await fetch(`${API_BASE_URL}/insurance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    update: async (id, payload) => {
      const response = await fetch(`${API_BASE_URL}/insurance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/insurance/${id}`, {
        method: 'DELETE',
      });
      return handleResponse(response);
    },
    summary: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/insurance/user/${userId}/summary`);
      return handleResponse(response);
    }
  },

  // Indian Income Tax Planner & 80C/80D Optimizer
  tax: {
    getAnalysis: async (userId, customGrossSalary = null) => {
      const url = customGrossSalary 
        ? `${API_BASE_URL}/tax/user/${userId}/analysis?customGrossSalary=${customGrossSalary}`
        : `${API_BASE_URL}/tax/user/${userId}/analysis`;
      const response = await fetch(url);
      return handleResponse(response);
    }
  },

  // CIBIL Credit Score & Health Engine
  cibil: {
    getAnalysis: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/cibil/user/${userId}`);
      return handleResponse(response);
    },
    updateScore: async (userId, cibilScore) => {
      const response = await fetch(`${API_BASE_URL}/cibil/user/${userId}/update-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cibilScore }),
      });
      return handleResponse(response);
    }
  }
};
