"use client";

import { useState, useCallback } from "react";
import {
  useActionItems,
  useUpdateActionItem,
  useCreateActionItem,
} from "@/api/queries/useActionItems";
import { Check, Plus, Trash2, Loader2 } from "lucide-react";

interface ActionItemsListProps {
  meetingId: string;
}

export function ActionItemsList({ meetingId }: ActionItemsListProps) {
  const { data: items, isLoading } = useActionItems(meetingId);
  const updateMutation = useUpdateActionItem(meetingId);
  const createMutation = useCreateActionItem(meetingId);
  const [newItemText, setNewItemText] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const toggleComplete = useCallback(
    (itemId: string, current: boolean) => {
      updateMutation.mutate({
        itemId,
        body: { is_completed: !current },
      });
    },
    [updateMutation]
  );

  const handleAdd = useCallback(() => {
    if (!newItemText.trim()) return;
    createMutation.mutate(
      { text: newItemText.trim() },
      {
        onSuccess: () => {
          setNewItemText("");
          setShowAdd(false);
        },
      }
    );
  }, [newItemText, createMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Action items list */}
      <div className="space-y-1">
        {items && items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 py-2 px-2 rounded-md group transition-colors ${
                item.is_completed ? "opacity-60" : "hover:bg-muted/50"
              }`}
            >
              <button
                onClick={() => toggleComplete(item.id, item.is_completed)}
                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  item.is_completed
                    ? "bg-fireflies-yellow border-fireflies-yellow text-fireflies-navy"
                    : "border-border hover:border-fireflies-yellow"
                }`}
              >
                {item.is_completed && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    item.is_completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {item.text}
                </p>
                {(item.assignee || item.due_date) && (
                  <div className="flex gap-2 mt-1">
                    {item.assignee && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {item.assignee}
                      </span>
                    )}
                    {item.due_date && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {item.due_date}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No action items yet.
          </p>
        )}
      </div>

      {/* Add new */}
      {showAdd ? (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="New action item..."
            className="flex-1 h-8 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={!newItemText.trim()}
            className="px-3 h-8 rounded-md bg-fireflies-yellow text-fireflies-navy text-xs font-semibold hover:bg-fireflies-yellow/90 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAdd(false); setNewItemText(""); }}
            className="px-2 h-8 rounded-md text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add action item
        </button>
      )}
    </div>
  );
}
