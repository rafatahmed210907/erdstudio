import { Suspense } from "react";
import { ImportExportScreen } from "@/components/import/import-export-screen";

export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading import and export…</div>}>
      <ImportExportScreen />
    </Suspense>
  );
}
