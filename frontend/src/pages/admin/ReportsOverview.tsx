import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  RefreshCcw,
  Route,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

interface AnalyticsRecord {
  name?: string;
  value?: number | string;
  month?: string;
  count?: number | string;
  category?: string;
  avgHours?: number | string;
  action?: string;
}

interface ReportsData {
  byCategory: AnalyticsRecord[];
  byStatus: AnalyticsRecord[];
  trends: AnalyticsRecord[];
  resolutionTime: AnalyticsRecord[];
  topActions: AnalyticsRecord[];
}

function toNumber(value: number | string | undefined) {
  return Number(value || 0);
}

export default function ReportsOverview() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reports/analytics');
      setData(res.data.data || null);
    } catch {
      setError('Unable to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KIU_Complaint_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report export complete');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const summary = useMemo(() => {
    const byStatus = data?.byStatus || [];
    const resolutionValues = (data?.resolutionTime || []).map((item) => toNumber(item.avgHours)).filter((value) => value > 0);
    const total = byStatus.reduce((sum, item) => sum + toNumber(item.value), 0);
    const pending = byStatus
      .filter((item) => ['Submitted', 'Under Review', 'Forwarded', 'In Progress', 'Awaiting Student'].includes(String(item.name || '')))
      .reduce((sum, item) => sum + toNumber(item.value), 0);
    const resolved = byStatus
      .filter((item) => ['Resolved', 'Closed'].includes(String(item.name || '')))
      .reduce((sum, item) => sum + toNumber(item.value), 0);
    const averageResolution = resolutionValues.length
      ? (resolutionValues.reduce((sum, value) => sum + value, 0) / resolutionValues.length).toFixed(1)
      : '0.0';

    return {
      total,
      pending,
      resolved,
      averageResolution,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[150px] w-full" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-[320px] w-full" />
          <Skeleton className="h-[320px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-2xl">
        <EmptyState
          icon={BarChart3}
          title="Reports unavailable"
          description={error}
          actionLabel="Open dashboard"
          actionLink="/dashboard/admin"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <section className="app-card px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="app-page-header">
            <p className="app-page-kicker">Reports</p>
            <h1 className="app-page-title">Complaint Reports</h1>
            <p className="app-page-subtitle">Category, status, trend, and resolution activity for complaint management.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-[#34b05a]/25 hover:text-[#34b05a]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-[16px] bg-[#34b05a] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2d9a4e] disabled:bg-slate-300"
            >
              {exporting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total complaints', value: summary.total, icon: FileText, tone: 'bg-[#292929] text-white', iconTone: 'bg-white/12 text-white' },
          { label: 'Pending', value: summary.pending, icon: Clock3, tone: 'bg-[#393836] text-white', iconTone: 'bg-white/10 text-white' },
          { label: 'Resolved', value: summary.resolved, icon: CheckCircle2, tone: 'bg-[#34b05a] text-white', iconTone: 'bg-white/12 text-white' },
          { label: 'Avg resolution (hrs)', value: summary.averageResolution, icon: Route, tone: 'bg-white text-slate-900 border border-slate-200', iconTone: 'bg-[#34b05a]/10 text-[#34b05a]' },
        ].map((card) => (
          <div key={card.label} className={`rounded-[22px] p-5 shadow-[0_18px_40px_-32px_rgba(41,41,41,0.24)] ${card.tone}`}>
            <div className="flex min-h-[136px] flex-col justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${card.iconTone}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="app-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">By status</h2>
          <div className="mt-5 space-y-3">
            {(data?.byStatus || []).length ? (
              data!.byStatus.map((item) => {
                const value = toNumber(item.value);
                const width = summary.total > 0 ? Math.max(8, Math.round((value / summary.total) * 100)) : 8;
                return (
                  <div key={String(item.name)}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-slate-700">{item.name}</span>
                      <span className="font-semibold text-slate-900">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-[#34b05a]" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState icon={BarChart3} title="No status data" description="Complaint status summaries will appear here." />
            )}
          </div>
        </section>

        <section className="app-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">By type</h2>
          <div className="mt-5 space-y-3">
            {(data?.byCategory || []).length ? (
              data!.byCategory.map((item) => {
                const value = toNumber(item.value);
                const width = summary.total > 0 ? Math.max(8, Math.round((value / summary.total) * 100)) : 8;
                return (
                  <div key={String(item.name)}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-slate-700">{item.name}</span>
                      <span className="font-semibold text-slate-900">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-[#292929]" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState icon={FileText} title="No category data" description="Complaint categories will appear here once complaints are filed." />
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="app-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Monthly activity</h2>
          <div className="mt-5 overflow-hidden rounded-[18px] border border-slate-200">
            {(data?.trends || []).length ? (
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3 text-right">Complaints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data!.trends.map((item) => (
                    <tr key={String(item.month)}>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.month}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{toNumber(item.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <EmptyState icon={Clock3} title="No trend data" description="Monthly complaint totals will appear here." />
              </div>
            )}
          </div>
        </section>

        <section className="app-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Resolution actions</h2>
          <div className="mt-5 space-y-3">
            {(data?.topActions || []).length ? (
              data!.topActions.map((item, index) => (
                <div key={`${item.action}-${index}`} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-medium leading-6 text-slate-800">{item.action}</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Used {toNumber(item.count)} times
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No resolution actions"
                description="Resolved complaint actions will appear here after case updates are recorded."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
