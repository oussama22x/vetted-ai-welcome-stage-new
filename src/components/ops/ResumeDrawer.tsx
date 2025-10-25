import { X, DownloadCloud, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useResumes } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResumeDrawerProps {
  projectId: string | null;
  onClose: () => void;
}

export const ResumeDrawer = ({ projectId, onClose }: ResumeDrawerProps) => {
  const { data: resumes, isLoading } = useResumes(projectId || '');

  const downloadResume = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      await supabase.from('analytics_events').insert({
        event_type: 'ops_resume_downloaded',
        project_id: projectId,
        metadata: { file_name: fileName }
      });

      toast.success('Resume downloaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download resume');
    }
  };

  if (!projectId) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-card border-l border-border shadow-lg animate-slide-in-right z-50">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Uploaded Resumes</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading resumes...
            </div>
          )}

          {!isLoading && resumes && resumes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No resumes uploaded yet</p>
            </div>
          )}

          {resumes?.map((resume) => (
            <div
              key={resume.id}
              className="bg-muted/30 rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{resume.parsed_name || resume.file_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{resume.file_name}</p>
                  {resume.parsed_email && (
                    <p className="text-xs text-muted-foreground">{resume.parsed_email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className={
                    resume.status === 'scored'
                      ? 'bg-[#D1FAE5] text-[#22C55E]'
                      : resume.status === 'scoring'
                      ? 'bg-[#FEF3C7] text-[#F59E0B]'
                      : 'bg-[#D6D1FF] text-[#5A4FCF]'
                  }
                >
                  {resume.status}
                </Badge>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadResume(resume.file_path!, resume.file_name)}
                >
                  <DownloadCloud className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
