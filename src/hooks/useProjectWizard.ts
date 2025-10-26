import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface TierInfo {
  id: number;
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
  id?: string;
  file?: File;
  name: string;
  size: number;
  status: 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
}

export interface WizardState {
  jobDescription?: string;
  jdContent?: string;
  roleTitle?: string;
  jobSummary?: string;
  companyName?: string;
  keySkills?: string[];
  experienceLevel?: string;
  candidateSource?: 'own' | 'network';
  uploadedResumes?: UploadedFile[];
  candidateCount?: number;
  selectedTier?: TierInfo;
  projectId?: string;
  project_id?: string;
  proofOfWorkTask?: string;
  evaluationCriteria?: Array<{
    name: string;
    description: string;
  }>;
}

const STORAGE_KEY = 'project_wizard_state';
const hasSessionStorage = () =>
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

const sanitizeForStorage = (state: WizardState): WizardState => {
  if (!state.uploadedResumes?.length) {
    return state;
  }

  return {
    ...state,
    uploadedResumes: state.uploadedResumes.map(({ file, ...rest }) => rest),
  };
};

const loadInitialWizardState = (): WizardState => {
  if (!hasSessionStorage()) return {};

  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return {};

  try {
    return JSON.parse(stored) as WizardState;
  } catch {
    return {};
  }
};

interface ProjectWizardContextValue {
  wizardState: WizardState;
  saveWizardState: (newState: Partial<WizardState>) => void;
  getWizardState: () => WizardState;
  clearWizardState: () => void;
  canProceedToNextStep: (currentStep: number) => boolean;
}

const ProjectWizardContext = createContext<ProjectWizardContextValue | undefined>(undefined);

export const ProjectWizardProvider = ({ children }: { children: ReactNode }) => {
  const [wizardState, setWizardState] = useState<WizardState>(loadInitialWizardState);

  useEffect(() => {
    if (!hasSessionStorage()) return;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeForStorage(wizardState)));
    } catch (error) {
      console.warn('Failed to persist wizard state', error);
    }
  }, [wizardState]);

  const saveWizardState = useCallback((newState: Partial<WizardState>) => {
    setWizardState(prev => {
      const updatedState = { ...prev, ...newState };

      if (hasSessionStorage()) {
        try {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(sanitizeForStorage(updatedState))
          );
        } catch (error) {
          console.warn('Failed to persist wizard state', error);
        }
      }

      return updatedState;
    });
  }, []);

  const getWizardState = useCallback((): WizardState => {
    return wizardState;
  }, [wizardState]);

  const clearWizardState = useCallback(() => {
    setWizardState({});
    if (hasSessionStorage()) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const canProceedToNextStep = useCallback((currentStep: number): boolean => {
    switch (currentStep) {
      case 1: // Job Description
        return !!wizardState.jdContent && wizardState.jdContent.length > 50;
      case 2: // Candidate Source
        if (!wizardState.candidateSource) return false;
        if (wizardState.candidateSource === 'own') {
          return !!wizardState.uploadedResumes && wizardState.uploadedResumes.length > 0;
        }
        return true;
      case 3: // Proof Level Selection
        return !!wizardState.selectedTier;
      case 4: // Magic Moment Snapshot
        return true;
      case 5: // Final CTA
        return true;
      default:
        return false;
    }
  }, [wizardState]);

  const value = useMemo(
    () => ({
      wizardState,
      saveWizardState,
      getWizardState,
      clearWizardState,
      canProceedToNextStep,
    }),
    [wizardState, saveWizardState, getWizardState, clearWizardState, canProceedToNextStep]
  );

  return createElement(ProjectWizardContext.Provider, { value }, children);
};

export const useProjectWizard = () => {
  const context = useContext(ProjectWizardContext);

  if (!context) {
    throw new Error('useProjectWizard must be used within a ProjectWizardProvider');
  }

  return context;
};
