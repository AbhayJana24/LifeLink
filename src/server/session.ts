import "server-only";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export type Role = "DONOR" | "REQUESTER" | "ADMIN";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
}

/** Data Access Layer: the single place that reads the session (deduped per request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: (u.phone as string | null | undefined) ?? null,
    role: ((u.role as Role | undefined) ?? "DONOR") satisfies Role,
  };
});

export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") forbidden();
  return user;
}
