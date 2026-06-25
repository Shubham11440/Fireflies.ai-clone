"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, FileText, MessageSquare, CheckSquare, ArrowLeft } from "lucide-react";
import { useGlobalSearch } from "@/api/queries/useGlobalSearch";
import type { SearchHit, SearchType } from "@/api/searchApi";


const TYPE_LABELS: Record<SearchType, string> = {
  all: "All",
  transcript: "Transcript",
  summary: "Summary",
  action_item: "Action Items",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  transcript: <MessageSquare className="h-3.5 w-3.5" />,
  summary: <FileText className="h-3.5 w-3.5" />,
  action_item: <CheckSquare className="h-3.5 w-3.5" />,
};

const TYPE_COLORS: Record<string, string> = {
  transcript: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  summary: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
  action_item: "text-green-500 bg-green-50 dark:bg-green-900/20",
};

function SnippetText({ html }: { html: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      className="[&_mark]:bg-fireflies-yellow/40 [&_mark]:rounded [&_mark]:px-0.5 [&_mark]:font-medium"
    />
  );
}

// Group hits by meeting
function groupByMeeting(items: SearchHit[]): Map<string, { title: string; hits: SearchHit[] }> {
  const map = new Map<string, { title: string; hits: SearchHit[] }>();
  for (const item of items) {
    if (!map.has(item.meeting_id)) {
      map.set(item.meeting_id, { title: item.title, hits: [] });
    }
    map.get(item.meeting_id)!.hits.push(item);
  }
  return map;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isFetching } = useGlobalSearch(debouncedQ, searchType);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        setDebouncedQ(val);
        // Sync URL
        const url = new URL(window.location.href);
        if (val) url.searchParams.set("q", val);
        else url.searchParams.delete("q");
        router.replace(url.pathname + url.search, { scroll: false });
      }, 300);
      setDebounceTimer(timer);
    },
    [debounceTimer, router]
  );

  const grouped = useMemo(
    () => groupByMeeting(data?.items ?? []),
    [data]
  );

  const hitLink = (hit: SearchHit) => {
    const base = `/m/${hit.meeting_id}`;
    if (hit.type === "transcript" && hit.line_id) {
      return `${base}?highlight=${hit.line_id}`;
    }
    return base;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Meetings
      </Link>

      {/* Search header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Global Search</h1>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search across all meetings, transcripts, summaries…"
            autoFocus
            className="w-full pl-9 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-fireflies-yellow/40 transition-shadow"
          />
          {(isLoading || isFetching) && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Type filters */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {(Object.keys(TYPE_LABELS) as SearchType[]).map((t) => (
            <button
              key={t}
              onClick={() => setSearchType(t)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                searchType === t
                  ? "bg-fireflies-yellow text-fireflies-navy font-semibold border-fireflies-yellow"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {debouncedQ.length < 2 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Type at least 2 characters to search</p>
        </div>
      ) : data && data.total === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">No results found</p>
          <p className="text-sm">Try different keywords or check your spelling</p>
        </div>
      ) : (
        <>
          {data && (
            <p className="text-xs text-muted-foreground mb-4">
              {data.total} result{data.total !== 1 ? "s" : ""} for &ldquo;{debouncedQ}&rdquo;
            </p>
          )}

          {/* Grouped results */}
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([meetingId, group]) => (
              <div key={meetingId} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Meeting header */}
                <Link
                  href={`/m/${meetingId}`}
                  className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border hover:bg-muted/60 transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-semibold text-sm text-foreground truncate">
                    {group.title}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    {group.hits.length} hit{group.hits.length !== 1 ? "s" : ""}
                  </span>
                </Link>

                {/* Hits */}
                <div className="divide-y divide-border/50">
                  {group.hits.map((hit, i) => (
                    <Link
                      key={`${hit.line_id ?? hit.type}-${i}`}
                      href={hitLink(hit)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                    >
                      <span
                        className={`shrink-0 mt-0.5 p-1 rounded ${TYPE_COLORS[hit.type]}`}
                      >
                        {TYPE_ICONS[hit.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          <SnippetText html={hit.snippet} />
                        </p>
                        {hit.offset !== null && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            At {Math.floor(hit.offset / 60)}:{String(Math.floor(hit.offset % 60)).padStart(2, "0")}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded mt-0.5">
                        {hit.type.replace("_", " ")}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
