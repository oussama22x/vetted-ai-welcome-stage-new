import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SignupContext from "./pages/SignupContext";
import Dashboard from "./pages/Dashboard";
import JdUpload from "./pages/workspace/JdUpload";
// Archived - see src/pages/workspace/_archive/
// import JdConfirm from "./pages/workspace/JdConfirm";
// import CandidatePreview from "./pages/workspace/CandidatePreview";
import ConfirmRoleSummary from "./pages/workspace/new/ConfirmRoleSummary";
import ReviewRoleDNA from "./pages/workspace/new/ReviewRoleDNA";
import GenerateAudition from "./pages/workspace/new/generate-audition";
import DeployOptions from "./pages/workspace/new/deploy-options";
import NetworkConfirmed from "./pages/workspace/new/network-confirmed";
import Checkout from "./pages/Checkout";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import AccountSettings from "./pages/AccountSettings";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/admin/Dashboard";
import OpsConsole from "./pages/OpsConsole";
import NotFound from "./pages/NotFound";
import { ProjectWizardProvider } from "./hooks/useProjectWizard";
import { SignupFlowProvider } from "./hooks/useSignupFlow";
import AdminContextBanner from "./components/admin/AdminContextBanner";

const App = () => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ProjectWizardProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SignupFlowProvider>
              <AdminContextBanner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/signup/context" element={<SignupContext />} />

                <Route path="/workspace" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/workspace/new/jd-upload" element={
                  <ProtectedRoute>
                    <JdUpload />
                  </ProtectedRoute>
                } />
                <Route path="/workspace/new/confirm-role-summary" element={
                  <ProtectedRoute>
                    <ConfirmRoleSummary />
                  </ProtectedRoute>
                } />
                <Route path="/workspace/new/review-role-dna" element={
                  <ProtectedRoute>
                    <ReviewRoleDNA />
                  </ProtectedRoute>
                } />
                <Route path="/workspace/new/generate-audition" element={
                  <ProtectedRoute>
                    <GenerateAudition />
                  </ProtectedRoute>
                } />
                <Route path="/workspace/new/deploy-options" element={
                  <ProtectedRoute>
                    <DeployOptions />
                  </ProtectedRoute>
                } />
                <Route path="/workspace/new/network-confirmed" element={
                  <ProtectedRoute>
                    <NetworkConfirmed />
                  </ProtectedRoute>
                } />

                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } />

                <Route path="/workspace/project/:projectId" element={
                  <ProtectedRoute>
                    <ProjectDetailPage />
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AccountSettings />
                  </ProtectedRoute>
                } />

                <Route path="/admin/login" element={<AdminAuth />} />

                <Route path="/admin/dashboard" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/ops" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Navigate to="/admin/ops" replace />
                  </ProtectedRoute>
                } />

                <Route path="/admin/ops" element={
                  <ProtectedRoute requireAdmin={true}>
                    <OpsConsole />
                  </ProtectedRoute>
                } />

                <Route path="/admin/projects" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Navigate to="/admin/ops" replace />
                  </ProtectedRoute>
                } />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SignupFlowProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ProjectWizardProvider>
    </QueryClientProvider>
  );
};

export default App;
