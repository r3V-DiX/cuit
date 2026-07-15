// admin-ui/components/ui/JsonViewer.tsx
// Safe, styled JSON renderer for audit logs and metadata fields.

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

export default function JsonViewer({ data, className = '' }: JsonViewerProps) {
  let content = '';
  try {
    if (data === undefined) {
      content = 'undefined';
    } else {
      content = JSON.stringify(data, null, 2);
    }
  } catch {
    content = 'Error parsing JSON';
  }

  return (
    <pre
      className={`max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[11px] text-slate-700 ${className}`}
    >
      <code>{content}</code>
    </pre>
  );
}
