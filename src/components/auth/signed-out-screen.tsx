"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database } from "lucide-react";
import { useStudio } from "@/components/studio-provider";
import { Button } from "@/components/ui/button";

export function SignedOutScreen() {
  const router = useRouter();
  const { setSession } = useStudio();
  const [pending, setPending] = useState(false);

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Database className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold">You are signed out</h1>
        <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
          This studio keeps a local session for John Doe. Sign in again to return to the same diagrams. A future backend can replace this step with real authentication.
        </p>
        <Button
          className="mt-6"
          disabled={pending}
          onClick={() => {
            setPending(true);
            void setSession(true)
              .then(() => router.push("/"))
              .catch(() => setPending(false));
          }}
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}
