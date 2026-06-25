import { Suspense } from "react";
import SearchPage from "./page";

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>}>
      <SearchPage />
    </Suspense>
  );
  
}
