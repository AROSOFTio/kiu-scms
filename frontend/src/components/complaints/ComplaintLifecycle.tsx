import { CheckCircle2, Clock3, FileWarning, MessageSquareMore, Route, ShieldAlert, UserRound, XCircle } from 'lucide-react';

export const LIFECYCLE_STATUSES = [
  'Submitted',
  'Under Review',
  'Forwarded',
  'In Progress',
  'Awaiting Student',
  'Resolved',
  'Closed',
  'Rejected',
] as const;

export const ROUTING_DESTINATIONS = [
  'Exams office',
  'Lecturer',
  'Department',
  'Finance',
  'Registry',
  'ICT',
  'Welfare',
  'Other unit',
] as const;

type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export type ActivityEntry = {
  id: number | string;
  kind: 'status' | 'note';
  status?: string;
  title: string;
  summary: string;
  actor: string;
  timestamp: string;
};

function resolveStatus(status?: string): LifecycleStatus | string {
  return status || 'Submitted';
}

export function getComplaintStatusTone(status?: string) {
  switch (resolveStatus(status)) {
    case 'Submitted':
      return 'border-slate-200 bg-slate-100 text-slate-700';
    case 'Under Review':
      return 'border-blue-100 bg-blue-50 text-blue-700';
    case 'Forwarded':
      return 'border-cyan-100 bg-cyan-50 text-cyan-700';
    case 'In Progress':
      return 'border-amber-100 bg-amber-50 text-amber-700';
    case 'Awaiting Student':
      return 'border-violet-100 bg-violet-50 text-violet-700';
    case 'Resolved':
      return 'border-emerald-100 bg-emerald-50 text-emerald-700';
    case 'Closed':
      return 'border-emerald-100 bg-emerald-100 text-emerald-800';
    case 'Rejected':
      return 'border-rose-100 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-white text-slate-700';
  }
}

export function getComplaintStatusIcon(status?: string) {
  switch (resolveStatus(status)) {
    case 'Submitted':
      return Clock3;
    case 'Under Review':
      return MessageSquareMore;
    case 'Forwarded':
      return Route;
    case 'In Progress':
      return FileWarning;
    case 'Awaiting Student':
      return UserRound;
    case 'Resolved':
    case 'Closed':
      return CheckCircle2;
    case 'Rejected':
      return XCircle;
    default:
      return ShieldAlert;
  }
}

export function ComplaintStatusBadge({ status, className = '' }: { status?: string; className?: string }) {
  const Icon = getComplaintStatusIcon(status);
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${getComplaintStatusTone(status)} ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {status || 'Submitted'}
    </span>
  );
}

function resolveActorName(event: {
  created_by_name?: string;
  actor?: string;
  first_name?: string;
  last_name?: string;
}) {
  if (event.created_by_name) return event.created_by_name;
  if (event.actor) return event.actor;
  const name = [event.first_name, event.last_name].filter(Boolean).join(' ').trim();
  return name || 'System';
}

function resolveTimestamp(event: { changed_at?: string; created_at?: string; timestamp?: string }) {
  return event.changed_at || event.created_at || event.timestamp || '';
}

function describeStatusEvent(status: string, remarks: string, actor: string) {
  switch (status) {
    case 'Submitted':
      return {
        title: `Submitted by ${actor}`,
        summary: remarks || 'Complaint received and logged.',
      };
    case 'Under Review':
      return {
        title: `Reviewed by ${actor}`,
        summary: remarks || 'Complaint moved into review.',
      };
    case 'Forwarded':
      return {
        title: remarks.startsWith('Forwarded to') ? remarks.split('. ')[0] : `Forwarded by ${actor}`,
        summary: remarks,
      };
    case 'In Progress':
      return {
        title: `In progress update by ${actor}`,
        summary: remarks || 'Work is ongoing.',
      };
    case 'Awaiting Student':
      return {
        title: `Awaiting student response`,
        summary: remarks || `Update posted by ${actor}.`,
      };
    case 'Resolved':
      return {
        title: `Resolved by ${actor}`,
        summary: remarks || 'Complaint marked as resolved.',
      };
    case 'Closed':
      return {
        title: `Closed by ${actor}`,
        summary: remarks || 'Complaint closed.',
      };
    case 'Rejected':
      return {
        title: `Rejected by ${actor}`,
        summary: remarks || 'Complaint rejected.',
      };
    default:
      return {
        title: `Status changed by ${actor}`,
        summary: remarks || status,
      };
  }
}

export function createStatusActivity(event: {
  id: number | string;
  status: string;
  remarks?: string;
  created_by_name?: string;
  first_name?: string;
  last_name?: string;
  changed_at?: string;
  created_at?: string;
}) {
  const actor = resolveActorName(event);
  const remarks = event.remarks || '';
  const description = describeStatusEvent(event.status, remarks, actor);

  return {
    id: `status-${event.id}`,
    kind: 'status' as const,
    status: event.status,
    title: description.title,
    summary: description.summary,
    actor,
    timestamp: resolveTimestamp(event),
  };
}

export function createInternalNoteActivity(note: {
  id: number | string;
  note: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}) {
  const actor = resolveActorName(note);

  return {
    id: `note-${note.id}`,
    kind: 'note' as const,
    title: `Note added by ${actor}`,
    summary: note.note,
    actor,
    timestamp: note.created_at,
  };
}

export function ComplaintActivityTimeline({
  entries,
  emptyLabel = 'No activity recorded yet.',
}: {
  entries: ActivityEntry[];
  emptyLabel?: string;
}) {
  if (!entries.length) {
    return <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">{emptyLabel}</div>;
  }

  return (
    <div className="space-y-5">
      {entries.map((entry, index) => {
        const isStatus = entry.kind === 'status';
        const Icon = isStatus ? getComplaintStatusIcon(entry.status) : MessageSquareMore;

        return (
          <div key={entry.id} className="relative pl-8">
            {index < entries.length - 1 && <div className="absolute left-[7px] top-8 bottom-[-20px] w-px bg-slate-200" />}
            <div className={`absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full border ${isStatus ? getComplaintStatusTone(entry.status) : 'border-slate-200 bg-white text-slate-500'}`}>
              <Icon className="h-2.5 w-2.5" />
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{entry.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{entry.summary}</p>
                </div>
                <div className="shrink-0 text-[11px] font-medium text-slate-400">
                  {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Pending'}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <span>{entry.kind === 'note' ? 'Internal note' : entry.status}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{entry.actor}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
