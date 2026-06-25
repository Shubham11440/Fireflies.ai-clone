"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useNotes, useUpdateNotes } from "@/api/queries/useNotes";
import {
  Highlighter,
  Lightbulb,
  HelpCircle,
  ArrowRight,
  Plus,
  X,
  Loader2,
  CheckCircle,
  StickyNote,
} from "lucide-react";

interface NoteSection {
  id: string;
  title: string;
  icon: string;
  items: string[];
}

const DEFAULT_SECTIONS: Omit<NoteSection, "id">[] = [
  { title: "Highlights", icon: "highlighter", items: [] },
  { title: "Decisions", icon: "lightbulb", items: [] },
  { title: "Questions", icon: "help", items: [] },
  { title: "Follow-ups", icon: "arrow", items: [] },
];

function SectionIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case "highlighter":
      return <Highlighter className={className} />;
    case "lightbulb":
      return <Lightbulb className={className} />;
    case "help":
      return <HelpCircle className={className} />;
    case "arrow":
      return <ArrowRight className={className} />;
    default:
      return <StickyNote className={className} />;
  }
}

interface SectionCardProps {
  section: NoteSection;
  onUpdate: (id: string, items: string[]) => void;
}

function SectionCard({ section, onUpdate }: SectionCardProps) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    onUpdate(section.id, [...section.items, text]);
    setNewItem("");
  };

  const removeItem = (index: number) => {
    onUpdate(
      section.id,
      section.items.filter((_, i) => i !== index)
    );
  };

  const editItem = (index: number, text: string) => {
    const updated = [...section.items];
    updated[index] = text;
    onUpdate(section.id, updated);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 border-b border-border">
        <SectionIcon icon={section.icon} className="h-3.5 w-3.5 text-fireflies-yellow" />
        <span className="text-xs font-semibold text-foreground">{section.title}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{section.items.length}</span>
      </div>
      <div className="px-3 py-2 space-y-1 min-h-[40px]">
        {section.items.length === 0 && (
          <p className="text-[11px] text-muted-foreground py-1">No items yet</p>
        )}
        {section.items.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5 group">
            <span className="text-fireflies-yellow mt-1.5 text-xs">•</span>
            <input
              value={item}
              onChange={(e) => editItem(i, e.target.value)}
              className="flex-1 text-sm text-foreground bg-transparent border-none outline-none py-0.5 placeholder:text-muted-foreground"
            />
            <button
              onClick={() => removeItem(i)}
              className="p-0.5 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-border">
        <div className="flex items-center gap-1">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder={`Add to ${section.title.toLowerCase()}…`}
            className="flex-1 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={addItem}
            disabled={!newItem.trim()}
            className="p-1 rounded text-muted-foreground hover:text-fireflies-yellow disabled:opacity-30 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface NotesData {
  sections?: { id: string; title: string; items: string[] }[];
}

function sectionsToMarkdown(sections: NoteSection[]): string {
  return sections
    .filter((s) => s.items.length > 0)
    .map((s) => {
      const header = `## ${s.title}`;
      const items = s.items.map((i) => `- ${i}`).join("\n");
      return `${header}\n${items}`;
    })
    .join("\n\n");
}

function parseNotesJson(notesJson: string | null): NoteSection[] | null {
  if (!notesJson) return null;
  try {
    const data = JSON.parse(notesJson) as NotesData;
    if (Array.isArray(data.sections) && data.sections.length > 0) {
      return data.sections.map((s, i) => ({
        id: s.id || `section-${i}`,
        title: s.title || DEFAULT_SECTIONS[i]?.title || "Notes",
        icon: DEFAULT_SECTIONS[i]?.icon || "highlighter",
        items: Array.isArray(s.items) ? s.items : [],
      }));
    }
  } catch {
    // ignore
  }
  return null;
}

function migrateFromMarkdown(markdown: string): NoteSection[] {
  const sections = DEFAULT_SECTIONS.map((s, i) => ({
    ...s,
    id: `section-${i}`,
  }));

  if (!markdown) return sections;

  const lines = markdown.split("\n");
  let currentSection = -1;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      const title = headingMatch[1].trim().toLowerCase();
      const idx = sections.findIndex(
        (s) => s.title.toLowerCase() === title
      );
      if (idx >= 0) {
        currentSection = idx;
      }
    } else if (line.startsWith("- ") && currentSection >= 0) {
      sections[currentSection].items.push(line.slice(2).trim());
    }
  }

  return sections;
}

interface StructuredNotesEditorProps {
  meetingId: string;
}

export function StructuredNotesEditor({ meetingId }: StructuredNotesEditorProps) {
  const { data: notes, isLoading } = useNotes(meetingId);
  const updateMutation = useUpdateNotes(meetingId);
  const [sections, setSections] = useState<NoteSection[]>([]);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // Hydrate from server data
  useEffect(() => {
    if (!notes || initializedRef.current) return;
    initializedRef.current = true;

    const fromJson = parseNotesJson(notes.notes_json);
    if (fromJson) {
      setSections(fromJson);
    } else {
      setSections(migrateFromMarkdown(notes.notes_markdown || ""));
    }
  }, [notes]);

  // Auto-save with debounce
  const save = useCallback(
    (newSections: NoteSection[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveState("unsaved");

      debounceRef.current = setTimeout(() => {
        setSaveState("saving");
        const json = JSON.stringify({ sections: newSections });
        const markdown = sectionsToMarkdown(newSections);
        updateMutation.mutate(
          { notes_json: json, notes_markdown: markdown },
          {
            onSuccess: () => setSaveState("saved"),
            onError: () => setSaveState("unsaved"),
          }
        );
      }, 1500);
    },
    [updateMutation]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSectionUpdate = useCallback(
    (id: string, items: string[]) => {
      const newSections = sections.map((s) =>
        s.id === id ? { ...s, items } : s
      );
      setSections(newSections);
      save(newSections);
    },
    [sections, save]
  );

  const wordCount = sections.reduce(
    (acc, s) => acc + s.items.join(" ").split(/\s+/).filter(Boolean).length,
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border text-[11px] text-muted-foreground shrink-0">
        {saveState === "saved" && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            Saved
          </span>
        )}
        {saveState === "saving" && (
          <span className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving…
          </span>
        )}
        {saveState === "unsaved" && <span>Unsaved changes</span>}
        <span className="ml-auto">{wordCount} words</span>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            onUpdate={handleSectionUpdate}
          />
        ))}
      </div>
    </div>
  );
}
