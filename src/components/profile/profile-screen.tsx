"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStudio } from "@/components/studio-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileScreen() {
  const router = useRouter();
  const { snapshot, updateProfile, setSession } = useStudio();
  const user = snapshot?.user;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? "");
  const [pending, setPending] = useState(false);
  if (!user) return null;

  return (
    <div className="animate-fade-in mx-auto max-w-xl px-6 py-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">This profile is stored locally with the rest of the studio data.</p>
      <section className="mt-5 space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <Avatar initials={user.initials} className="h-12 w-12 text-sm" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-[12px] text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Input id="role" value={role} onChange={(event) => setRole(event.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button
            disabled={pending}
            onClick={() => {
              setPending(true);
              void updateProfile({ name, email, role }).finally(() => setPending(false));
            }}
          >
            Save profile
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void setSession(false).then(() => router.push("/signed-out"));
            }}
          >
            Log out
          </Button>
        </div>
      </section>
    </div>
  );
}
