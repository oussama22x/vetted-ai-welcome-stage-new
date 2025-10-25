import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectsTable } from '@/components/ops/ProjectsTable';
import { FilterBar } from '@/components/ops/FilterBar';
import { ResumeDrawer } from '@/components/ops/ResumeDrawer';
import { ShortlistUploadModal } from '@/components/ops/ShortlistUploadModal';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function OpsConsole() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [tierId, setTierId] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [selectedProjectForResumes, setSelectedProjectForResumes] = useState<string | null>(null);
  const [selectedProjectForShortlist, setSelectedProjectForShortlist] = useState<string | null>(null);

  const { data: projects, isLoading } = useProjects({
    status: status === 'all' ? undefined : status,
    tierId: tierId === 'all' ? undefined : parseInt(tierId),
    search: search || undefined,
    sortBy: sortBy as 'created_at' | 'sla_deadline'
  });

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setTierId('all');
    setSortBy('created_at');
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Ops Console</h1>
          <p className="text-sm text-muted-foreground">
            Manage recruiter projects, candidate uploads, and shortlist progress
          </p>
        </div>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          tierId={tierId}
          onTierChange={setTierId}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onClearFilters={handleClearFilters}
        />

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading projects...
          </div>
        ) : (
          <ProjectsTable
            projects={projects || []}
            onViewResumes={setSelectedProjectForResumes}
            onUploadShortlist={setSelectedProjectForShortlist}
          />
        )}
      </main>

      <ResumeDrawer
        projectId={selectedProjectForResumes}
        onClose={() => setSelectedProjectForResumes(null)}
      />

      <ShortlistUploadModal
        projectId={selectedProjectForShortlist}
        onClose={() => setSelectedProjectForShortlist(null)}
      />
    </div>
  );
}
