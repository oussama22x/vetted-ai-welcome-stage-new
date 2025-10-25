import { useState } from "react";
import { Upload, Network, FileText, X, CheckCircle } from "lucide-react";
import { ChatMessage } from "../ChatMessage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileUploadZone } from "../FileUploadZone";
import { UploadedFile } from "@/hooks/useChatFlow";
import { useFileUpload } from "@/hooks/useFileUpload";

interface CandidateSourceStepV2Props {
  onComplete: (source: 'own' | 'network', files?: UploadedFile[]) => void;
  onAddMessage: (msg: { type: 'user' | 'assistant'; content: string }) => void;
}

export const CandidateSourceStepV2 = ({ onComplete, onAddMessage }: CandidateSourceStepV2Props) => {
  const [selected, setSelected] = useState<'own' | 'network' | null>(null);
  const {
    files: uploadedFiles,
    isDragging,
    handleFiles,
    removeFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useFileUpload();

  const handleSelect = (source: 'own' | 'network') => {
    setSelected(source);
  };

  const handleContinue = () => {
    if (!selected) return;

    // Add user's choice as message
    onAddMessage({
      type: 'user',
      content: selected === 'own' 
        ? `I'll upload my own candidates (${uploadedFiles.length} uploaded)`
        : "Use VettedAI's candidate network"
    });
    
    // Add assistant response
    const response = selected === 'own'
      ? "Perfect! I've received your candidates. Let's preview what they'll see."
      : "Great! I'll connect you with our pre-vetted network.";
    
    onAddMessage({
      type: 'assistant',
      content: response
    });
    
    setTimeout(() => {
      onComplete(selected, selected === 'own' ? uploadedFiles : undefined);
    }, 300);
  };

  const canContinue = () => {
    if (!selected) return false;
    if (selected === 'network') return true;
    return uploadedFiles.length > 0 && uploadedFiles.length <= 50;
  };

  return (
    <div className="space-y-6">
      <ChatMessage
        type="assistant"
        content="We'll send your candidates a unique Proof of Work task, generated from your Job Description. Who are the candidates for this role?"
        delay={0}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect('own')}
          className={cn(
            "group relative p-6 rounded-xl border-2 transition-all duration-250",
            "hover:-translate-y-1 hover:shadow-md",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            selected === 'own'
              ? "border-primary bg-secondary/30"
              : "border-border bg-card hover:border-primary/50"
          )}
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Upload My Own Candidates</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload resumes of candidates you've already sourced
              </p>
            </div>
          </div>
          {selected === 'own' && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        <button
          onClick={() => handleSelect('network')}
          className={cn(
            "group relative p-6 rounded-xl border-2 transition-all duration-250",
            "hover:-translate-y-1 hover:shadow-md",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            selected === 'network'
              ? "border-primary bg-secondary/30"
              : "border-border bg-card hover:border-primary/50"
          )}
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Network className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Use VettedAI Network</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Let us source pre-vetted candidates from our network
              </p>
            </div>
          </div>
          {selected === 'network' && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>

      {/* File Upload Zone - Shown when "own" is selected */}
      {selected === 'own' && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-sm text-muted-foreground">
            Up to 50 candidates for this pilot project
          </div>
          <FileUploadZone
            files={uploadedFiles}
            isDragging={isDragging}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onFilesSelected={handleFiles}
            onRemoveFile={removeFile}
          />

          {uploadedFiles.length > 50 && (
            <div className="text-sm text-destructive">
              Please remove {uploadedFiles.length - 50} file(s) to meet the 50 candidate limit.
            </div>
          )}
        </div>
      )}

      {/* Network Info Box */}
      {selected === 'network' && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-fade-in">
          <h4 className="font-medium text-sm mb-2">How our Network Sourcing works for the pilot:</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sourcing is included at no extra cost for this pilot project. We'll identify and reach out 
            to qualified candidates from our network within the same 48-72 hour delivery window.
          </p>
        </div>
      )}

      {/* Continue Button */}
      {selected && (
        <div className="flex justify-center pt-4 animate-fade-in">
          <Button 
            onClick={handleContinue} 
            size="lg" 
            disabled={!canContinue()}
            className="gap-2"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
};