import { useState, ReactNode } from "react";

export interface TierInfo {
  id: 1 | 2 | 3;
  name: string;
  description: string;
  anchorPrice: number;
  pilotPrice: number;
  features: string[];
  bestFor?: string;
  whatItIs?: string;
  output?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string | ReactNode;
  timestamp: Date;
  stepId?: number;
}

export interface WorkspaceState {
  currentStep: number;
  stepHistory: number[];
  messages: ChatMessage[];
  
  jobDescription: string;
  jobSummary: string;
  jobTitle: string;
  candidateSource: 'own' | 'network' | null;
  candidateExperienceConfirmed: boolean;
  uploadedResumes: UploadedFile[];
  selectedTier: TierInfo | null;
  candidateCount: number;
  
  isTyping: boolean;
  awaitingConfirmation: boolean;
}

export const useChatFlow = () => {
  const [state, setState] = useState<WorkspaceState>({
    currentStep: 1,
    stepHistory: [],
    messages: [
      {
        id: 'welcome',
        type: 'assistant',
        content: "👋 Welcome to VettedAI. I'll help you set up your first vetting project. This takes about 5 minutes. Let's start by understanding the role you're hiring for.",
        timestamp: new Date(),
        stepId: 1,
      }
    ],
    jobDescription: '',
    jobSummary: '',
    jobTitle: '',
    candidateSource: null,
    candidateExperienceConfirmed: false,
    uploadedResumes: [],
    selectedTier: null,
    candidateCount: 0,
    isTyping: false,
    awaitingConfirmation: false,
  });

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          ...message,
          id: Date.now().toString() + Math.random(),
          timestamp: new Date(),
        },
      ],
    }));
  };

  const setTyping = (isTyping: boolean) => {
    setState(prev => ({ ...prev, isTyping }));
  };

  const updateJobDescription = (jd: string, summary: string, jobTitle: string) => {
    setState(prev => ({
      ...prev,
      jobDescription: jd,
      jobSummary: summary,
      jobTitle: jobTitle,
      stepHistory: [...prev.stepHistory, prev.currentStep],
      currentStep: 2,
    }));
  };

  const updateJDConfirmation = (roleTitle: string, summary: string) => {
    setState(prev => ({
      ...prev,
      jobTitle: roleTitle,
      jobSummary: summary,
      stepHistory: [...prev.stepHistory, prev.currentStep],
      currentStep: 3,
    }));
  };

  const updateCandidateSource = (source: 'own' | 'network', resumes?: UploadedFile[]) => {
    setState(prev => ({
      ...prev,
      candidateSource: source,
      uploadedResumes: resumes || [],
      candidateCount: resumes?.length || 0,
      stepHistory: [...prev.stepHistory, prev.currentStep],
      currentStep: 4,
    }));
  };

  const confirmCandidateExperience = () => {
    setState(prev => ({
      ...prev,
      candidateExperienceConfirmed: true,
      stepHistory: [...prev.stepHistory, prev.currentStep],
      currentStep: 5,
    }));
  };

  const updateSelectedTier = (tier: TierInfo) => {
    setState(prev => ({
      ...prev,
      selectedTier: tier,
      stepHistory: [...prev.stepHistory, prev.currentStep],
      currentStep: 6,
    }));
  };

  const goToStep = (step: number) => {
    setState(prev => ({
      ...prev,
      stepHistory: [...prev.stepHistory, prev.currentStep],
      currentStep: step,
    }));
  };

  const goToPreviousStep = () => {
    if (state.stepHistory.length === 0) return;
    
    const previousStep = state.stepHistory[state.stepHistory.length - 1];
    setState(prev => ({
      ...prev,
      currentStep: previousStep,
      stepHistory: prev.stepHistory.slice(0, -1),
    }));
  };

  const goToNextStep = () => {
    if (!canGoForward()) return;
    
    setState(prev => ({
      ...prev,
      stepHistory: [...prev.stepHistory, prev.currentStep],
      currentStep: prev.currentStep + 1,
    }));
  };

  const canGoBack = () => {
    return state.stepHistory.length > 0 && state.currentStep > 1;
  };

  const canGoForward = () => {
    switch (state.currentStep) {
      case 1:
        return state.jobDescription.length > 0;
      case 2:
        return state.jobTitle.trim().length > 0 && state.jobSummary.trim().length > 0;
      case 3:
        return state.candidateSource !== null && (state.candidateSource === 'network' || state.uploadedResumes.length > 0);
      case 4:
        return state.candidateExperienceConfirmed;
      case 5:
        return state.selectedTier !== null;
      case 6:
        return false;
      default:
        return false;
    }
  };

  const resetFlow = () => {
    setState({
      currentStep: 1,
      stepHistory: [],
      messages: [
        {
          id: 'welcome',
          type: 'assistant',
          content: "👋 Welcome to VettedAI. I'll help you set up your first vetting project. This takes about 5 minutes. Let's start by understanding the role you're hiring for.",
          timestamp: new Date(),
          stepId: 1,
        }
      ],
      jobDescription: '',
      jobSummary: '',
      jobTitle: '',
      candidateSource: null,
      candidateExperienceConfirmed: false,
      uploadedResumes: [],
      selectedTier: null,
      candidateCount: 0,
      isTyping: false,
      awaitingConfirmation: false,
    });
  };

  return {
    state,
    addMessage,
    setTyping,
    updateJobDescription,
    updateJDConfirmation,
    updateCandidateSource,
    confirmCandidateExperience,
    updateSelectedTier,
    goToStep,
    goToPreviousStep,
    goToNextStep,
    canGoBack,
    canGoForward,
    resetFlow,
  };
};
