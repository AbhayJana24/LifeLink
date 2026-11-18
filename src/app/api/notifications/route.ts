import { NextResponse } from "next/server";
import { listNotifications } from "@/server/store";

export async function GET() {
  return NextResponse.json({ notifications: listNotifications() });
}
