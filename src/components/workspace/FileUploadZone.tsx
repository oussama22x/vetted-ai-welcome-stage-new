import { useRef } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadedFile } from "@/hooks/useChatFlow";

interface FileUploadZoneProps {
  files: UploadedFile[];
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFilesSelected: (files: FileList | File[]) => void;
  onRemoveFile: (fileId: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getProgressColor = (progress: number): string => {
  if (progress < 50) return 'bg-secondary';
  return 'bg-primary';
};

export const FileUploadZone = ({
  files,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFilesSelected,
  onRemoveFile,
}: FileUploadZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={handleClick}
        className={cn(
          "relative min-h-[200px] rounded-xl border-2 border-dashed transition-all cursor-pointer",
          "flex flex-col items-center justify-center gap-3 p-8",
          isDragging
            ? "border-primary bg-secondary/50"
            : "border-secondary hover:border-primary/50 hover:bg-secondary/20"
        )}
      >
        <Upload className="w-16 h-16 text-primary" />
        <div className="text-center space-y-1">
          <p className="text-base font-medium text-foreground">
            Drag and drop resumes here, or click to browse
          </p>
          <p className="text-sm text-muted-foreground">
            PDF, DOC, DOCX • Max 10MB per file • Up to 20 files
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "rounded-lg border p-4 transition-all",
                file.status === 'error'
                  ? "border-destructive bg-destructive/5"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {file.status === 'complete' ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : file.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(file.id);
                      }}
                      className="flex-shrink-0 h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {file.status === 'uploading' && (
                    <div className="space-y-1">
                      <Progress 
                        value={file.progress} 
                        className={cn("h-2", getProgressColor(file.progress))}
                      />
                      <p className="text-xs text-muted-foreground">
                        {Math.round(file.progress)}% uploaded
                      </p>
                    </div>
                  )}
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-destructive">{file.error}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && files.every(f => f.status === 'complete') && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
          <p className="text-sm text-success-foreground">
            ✓ {files.length} resume{files.length > 1 ? 's' : ''} uploaded successfully
          </p>
        </div>
      )}
    </div>
  );
};
