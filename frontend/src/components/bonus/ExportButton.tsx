"use client";

import { useState } from "react";
import { Download, FileText, FileCode, Loader2, ChevronDown } from "lucide-react";
import { exportMeeting, triggerDownload, type ExportFormat } from "@/api/exportApi";
import { useToast } from "@/components/ui/use-toast";

interface ExportButtonProps {
  meetingId: string;
}

const formats: { label: string; value: ExportFormat; icon: React.ReactNode; description: string }[] = [
  { label: "Markdown", value: "md", icon: <FileCode className="h-3.5 w-3.5" />, description: ".md file" },
  { label: "Plain Text", value: "txt", icon: <FileText className="h-3.5 w-3.5" />, description: ".txt file" },
  { label: "PDF (HTML)", value: "pdf", icon: <Download className="h-3.5 w-3.5" />, description: "print to PDF" },
];

export function ExportButton({ meetingId }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: ExportFormat) => {
    setLoading(format);
    setOpen(false);
    try {
      const { blob, filename } = await exportMeeting(meetingId, format);
      triggerDownload(blob, filename);
      toast({ title: `Exported as ${format.toUpperCase()}`, variant: "success" });
    } catch {
      toast({ title: "Export failed", variant: "error" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border disabled:opacity-50"
        title="Export meeting"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">Export</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
            {formats.map((f) => (
              <button
                key={f.value}
                onClick={() => handleExport(f.value)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
              >
                <span className="text-muted-foreground">{f.icon}</span>
                <div>
                  <div className="font-medium text-foreground">{f.label}</div>
                  <div className="text-[10px] text-muted-foreground">{f.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
