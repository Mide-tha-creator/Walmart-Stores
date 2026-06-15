"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoAuth } from "@/components/providers/demo-auth-provider";
import { SurfaceCard } from "@/components/shared/surface-card";
import { getDefaultWalmartHomePath } from "@/lib/navigation/routes";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useDemoAuth();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || "seller@company.internal");
    router.push(getDefaultWalmartHomePath());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <SurfaceCard className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-bold">Sign in</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Access your Walmart Seller Center analytics workspace with your
          organization credentials.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Continue to dashboard
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-primary hover:underline">
            Back to store picker
          </Link>
        </p>
      </SurfaceCard>
    </div>
  );
}
