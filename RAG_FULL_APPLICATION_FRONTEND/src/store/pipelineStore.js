import { create } from 'zustand';

export const usePipelineStore = create((set) => ({
  documents: [],
  selectedDoc: null,
  currentAnswer: '',
  sources: [],
  steps: [],
  isQuerying: false,
  isIngesting: false,
  activeJob: null,
  history: [],
  
  setDocuments: (documents) => set({ documents }),
  setSelectedDoc: (selectedDoc) => set({ selectedDoc }),
  setAnswer: (answer) => set({ currentAnswer: answer }),
  setSources: (sources) => set({ sources }),
  addStep: (step) => set((state) => ({ steps: [...state.steps, step] })),
  clearSteps: () => set({ steps: [] }),
  setQuerying: (isQuerying) => set({ isQuerying }),
  setIngesting: (isIngesting) => set({ isIngesting }),
  setActiveJob: (activeJob) => set({ activeJob }),
  addHistory: (item) => set((state) => ({ history: [item, ...state.history] })),
  clearHistory: () => set({ history: [] }),
}));
