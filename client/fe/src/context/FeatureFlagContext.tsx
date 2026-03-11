import React, { createContext, useContext, useEffect, useState } from 'react';

interface FeatureFlagContextType {
  aiInsightsEnabled: boolean;
  toggleAIInsights: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  aiInsightsEnabled: false,
  toggleAIInsights: () => {},
});

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [aiInsightsEnabled, setAIInsightsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('ff_ai_insights');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('ff_ai_insights', String(aiInsightsEnabled));
  }, [aiInsightsEnabled]);

  const toggleAIInsights = () => setAIInsightsEnabled((prev) => !prev);

  return (
    <FeatureFlagContext.Provider value={{ aiInsightsEnabled, toggleAIInsights }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
