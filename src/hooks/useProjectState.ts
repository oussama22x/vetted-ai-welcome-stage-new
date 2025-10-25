import { useState } from "react";
import { TierInfo, UploadedFile } from "./useChatFlow";

export interface CandidateInfo {
  id: string;
  fileName: string;
  parsedName: string;
  status: 'awaiting' | 'scoring' | 'scored';
}

export interface ProjectState {
  projectId: string;
  roleTitle: string;
  tier: TierInfo;
  candidateSource: 'own' | 'network';
  candidateCount: number;
  uploadedCandidates: CandidateInfo[];
  status: 'pending' | 'awaiting_setup_call' | 'awaiting' | 'scoring' | 'ready' | 'pending_activation' | 'activation_in_progress' | 'in_progress' | 'completed';
  progress: {
    hoursElapsed: number;
    totalHours: 48;
    percentage: number;
  };
  paymentStatus: 'paid' | 'pending';
}

export const useProjectState = (initialState?: Partial<ProjectState>) => {
  const [project, setProject] = useState<ProjectState>({
    projectId: initialState?.projectId || generateProjectId(),
    roleTitle: initialState?.roleTitle || '',
    tier: initialState?.tier || { id: 2, name: 'Scenario Fit', description: '', anchorPrice: 200, pilotPrice: 20, features: [] },
    candidateSource: initialState?.candidateSource || 'own',
    candidateCount: initialState?.candidateCount || 0,
    uploadedCandidates: initialState?.uploadedCandidates || [],
    status: initialState?.status || 'pending_activation',
    progress: initialState?.progress || {
      hoursElapsed: 0,
      totalHours: 48,
      percentage: 0,
    },
    paymentStatus: initialState?.paymentStatus || 'pending',
  });

  const updateProjectStatus = (status: 'pending' | 'awaiting_setup_call' | 'awaiting' | 'scoring' | 'ready' | 'pending_activation' | 'activation_in_progress' | 'in_progress' | 'completed') => {
    setProject(prev => ({ ...prev, status }));
  };

  const updateCandidateStatus = (candidateId: string, status: 'awaiting' | 'scoring' | 'scored') => {
    setProject(prev => ({
      ...prev,
      uploadedCandidates: prev.uploadedCandidates.map(c =>
        c.id === candidateId ? { ...c, status } : c
      ),
    }));
  };

  const updateProgress = (hoursElapsed: number) => {
    const percentage = Math.min((hoursElapsed / 48) * 100, 100);
    setProject(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        hoursElapsed,
        percentage,
      },
    }));
  };

  const parseCandidatesFromFiles = (files: UploadedFile[]): CandidateInfo[] => {
    return files.map((file, index) => ({
      id: `candidate-${index + 1}`,
      fileName: file.name,
      parsedName: extractNameFromFile(file.name),
      status: 'awaiting' as const,
    }));
  };

  return {
    project,
    updateProjectStatus,
    updateCandidateStatus,
    updateProgress,
    parseCandidatesFromFiles,
  };
};

function generateProjectId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function extractNameFromFile(fileName: string): string {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const parts = nameWithoutExt.split(/[-_]/);
  
  return parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
    .replace(/resume|cv|application/gi, '')
    .trim() || nameWithoutExt;
}
