import type { StatusMessage, StatusTone } from "@/components/reportFormTypes";

const statusToneClass: Record<StatusTone, string> = {
  info: "border-line bg-surface text-ink-muted",
  success: "border-primary/20 bg-primary/5 text-primary",
  warning: "border-marker-warn/30 bg-marker-warn/5 text-ink-muted",
  error: "border-marker-danger/30 bg-marker-danger/5 text-marker-danger",
};

interface Props {
  readonly status: StatusMessage;
  readonly className?: string;
}

export default function StatusPill({ status, className = "" }: Props) {
  return (
    <p
      className={`rounded-md border px-3 py-2 text-xs font-medium ${statusToneClass[status.tone]} ${className}`}
    >
      {status.text}
    </p>
  );
}

