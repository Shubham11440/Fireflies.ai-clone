"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, PenLine, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCreateMeeting } from "@/api/queries/useMeetings";
import { TranscriptPasteInput } from "@/components/meetings/TranscriptPasteInput";
import { FileUploadDropzone } from "@/components/meetings/FileUploadDropzone";
import { CreateMeetingForm } from "@/components/meetings/CreateMeetingForm";

type Tab = "paste" | "upload" | "form";

const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: "paste", label: "Paste Transcript", icon: FileText },
  { id: "upload", label: "Upload File", icon: Upload },
  { id: "form", label: "Manual Entry", icon: PenLine },
];

export default function CreateMeetingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("paste");
  const router = useRouter();
  const createMutation = useCreateMeeting();

  const handleSuccess = (meetingId: string) => {
    router.push(`/m/${meetingId}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Meeting</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a meeting by pasting a transcript, uploading a file, or entering details manually.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-fireflies-yellow text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === "paste" && (
          <TranscriptPasteInput
            isLoading={createMutation.isPending}
            onSubmit={(data) =>
              createMutation.mutate(data, {
                onSuccess: (res) => handleSuccess(res.id),
              })
            }
          />
        )}
        {activeTab === "upload" && (
          <FileUploadDropzone
            isLoading={createMutation.isPending}
            onSubmit={(data) =>
              createMutation.mutate(data, {
                onSuccess: (res) => handleSuccess(res.id),
              })
            }
          />
        )}
        {activeTab === "form" && (
          <CreateMeetingForm
            isLoading={createMutation.isPending}
            onSubmit={(data) =>
              createMutation.mutate(data, {
                onSuccess: (res) => handleSuccess(res.id),
              })
            }
          />
        )}
      </div>

      {/* Error */}
      {createMutation.isError && (
        <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {createMutation.error?.message || "Failed to create meeting. Please try again."}
        </div>
      )}
    </div>
  );
}
