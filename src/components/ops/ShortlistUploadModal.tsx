import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateProjectStatus } from '@/hooks/useProjects';
import { toast } from 'sonner';

interface ShortlistUploadModalProps {
  projectId: string | null;
  onClose: () => void;
}

export const ShortlistUploadModal = ({ projectId, onClose }: ShortlistUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const updateStatus = useUpdateProjectStatus();

  const handleUpload = async () => {
    if (!projectId || !file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('file', file);

      const { data, error: functionError } = await supabase.functions.invoke(
        'secure-shortlist-upload',
        {
          body: formData,
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Failed to upload shortlist');
      }

      const filePath = data?.file_path as string | undefined;
      const sanitizedFileName = data?.sanitized_name as string | undefined;

      if (!filePath) {
        throw new Error('Upload failed: missing file path');
      }

      // Create evaluation record
      const { error: evalError } = await supabase.from('evaluations').insert({
        project_id: projectId,
        shortlist_file_path: filePath,
        evaluation_notes: notes
      });

      if (evalError) throw evalError;

      // Update project status to ready
      await updateStatus.mutateAsync({ projectId, status: 'ready' });

      // Log analytics
      await supabase.from('analytics_events').insert({
        event_type: 'ops_shortlist_uploaded',
        project_id: projectId,
        metadata: {
          file_name: sanitizedFileName || file.name,
          original_file_name: file.name,
        }
      });

      toast.success('Shortlist uploaded successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload shortlist');
    } finally {
      setUploading(false);
    }
  };

  if (!projectId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Upload Shortlist</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">CSV File</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                id="file"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {file ? file.name : 'Click to upload CSV'}
                </p>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any feedback or notes for the recruiter..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? 'Uploading...' : 'Upload & Mark Ready'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
