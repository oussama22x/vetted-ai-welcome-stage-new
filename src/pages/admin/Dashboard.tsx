import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface AdminDashboardMetrics {
  total_signups: number;
  projects_created: number;
  calls_booked: number;
  awaiting_activation: number;
}

const DEFAULT_METRICS: AdminDashboardMetrics = {
  total_signups: 0,
  projects_created: 0,
  calls_booked: 0,
  awaiting_activation: 0,
};

const numberFormatter = new Intl.NumberFormat("en-US");

const percentageFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const formatCount = (value?: number) => numberFormatter.format(value ?? 0);
const formatPercentage = (value: number) => `${percentageFormatter.format(value)}%`;

const StatCard = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {description ? (
        <CardDescription>{description}</CardDescription>
      ) : null}
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const {
    data: metrics,
    isLoading,
    isError,
    refetch,
  } = useQuery<AdminDashboardMetrics>({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_metrics" as any);

      if (error) {
        throw error;
      }

      return data ?? DEFAULT_METRICS;
    },
    refetchOnWindowFocus: false,
  });

  const projectToCallRate = useMemo(() => {
    if (!metrics || metrics.projects_created === 0) {
      return 0;
    }

    return (metrics.calls_booked / metrics.projects_created) * 100;
  }, [metrics]);

  const metricsData = metrics ?? DEFAULT_METRICS;

  if (isLoading) {
    return (
      <>
        <AdminHeader />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground">
              Core metrics that power the validation experiment and operational
              pipeline.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh metrics
          </Button>
        </header>

        {isError ? (
          <Card>
            <CardHeader>
              <CardTitle>Unable to load metrics</CardTitle>
              <CardDescription>
                Something went wrong while retrieving the dashboard metrics. Try
                refreshing the data.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Validation Funnel
            </h2>
            <p className="text-muted-foreground">
              Track how teams move from signup to an activation-ready project.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Signups"
              value={formatCount(metricsData.total_signups)}
            />
            <StatCard
              title="Projects Created"
              value={formatCount(metricsData.projects_created)}
            />
            <StatCard
              title="Setup Calls Booked"
              value={formatCount(metricsData.calls_booked)}
            />
            <StatCard
              title="Project-to-Call Rate %"
              value={formatPercentage(projectToCallRate)}
              description="Calculated from projects created versus activation calls booked."
            />
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Operational Pipeline
            </h2>
            <p className="text-muted-foreground">
              Understand the activation workload currently queued and in
              progress.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <StatCard
              title="Projects Awaiting Activation"
              value={formatCount(metricsData.awaiting_activation)}
            />
            <StatCard
              title="Projects in Progress"
              value={formatCount(metricsData.calls_booked)}
              description="Projects where activation calls are already booked."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
