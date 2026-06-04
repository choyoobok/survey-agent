import { create } from 'zustand';
import { Survey, Statistics } from './types';

interface SurveyState {
  currentSurvey: Survey | null;
  responses: Record<string, string | number>;
  statistics: Statistics | null;
  interpretation: string | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  setCurrentSurvey: (survey: Survey | null) => void;
  setResponse: (questionId: string, value: string | number) => void;
  setResponses: (responses: Record<string, string | number>) => void;
  clearResponses: () => void;
  setStatistics: (stats: Statistics) => void;
  setInterpretation: (text: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSurveyStore = create<SurveyState>((set) => ({
  currentSurvey: null,
  responses: {},
  statistics: null,
  interpretation: null,
  isLoading: false,
  error: null,

  setCurrentSurvey: (survey) => set({ currentSurvey: survey }),
  setResponse: (questionId, value) =>
    set((state) => ({
      responses: { ...state.responses, [questionId]: value }
    })),
  setResponses: (responses) => set({ responses }),
  clearResponses: () => set({ responses: {} }),
  setStatistics: (stats) => set({ statistics: stats }),
  setInterpretation: (text) => set({ interpretation: text }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
}));
