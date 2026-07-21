import { ReportsDashboard } from "@/components/reports/ReportsDashboard";

export default function ReportsPage() {
  return (
    <div className="flex flex-col min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Rapports financiers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Analyses et tendances</p>
      </div>
      <ReportsDashboard />
    </div>
  );
}
