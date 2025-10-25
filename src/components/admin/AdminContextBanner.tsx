import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const WORKSPACE_PATH_PREFIX = "/workspace";

const AdminContextBanner = () => {
  const location = useLocation();
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return null;
  }

  const isOnWorkspaceRoute = location.pathname.startsWith(WORKSPACE_PATH_PREFIX);

  if (!isOnWorkspaceRoute || !isAdmin) {
    return null;
  }

  return (
    <div className="bg-amber-100 text-amber-900 border-b border-amber-200">
      <div className="max-w-[960px] mx-auto px-6 py-2 text-sm text-center">
        You are viewing your recruiter workspace.{' '}
        <Link
          to="/admin/dashboard"
          className="font-medium underline underline-offset-2 hover:text-amber-700"
        >
          [Return to Admin Panel]
        </Link>
      </div>
    </div>
  );
};

export default AdminContextBanner;
