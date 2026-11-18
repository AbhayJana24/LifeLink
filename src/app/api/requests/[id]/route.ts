import { NextResponse } from "next/server";
import {
  getRequestById,
  respondToBloodRequest,
  updateRequestStatus,
} from "@/server/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const req = getRequestById(id);
  if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  return NextResponse.json({ request: req });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();

  if (body.status && ["OPEN", "FULFILLED", "CANCELLED"].includes(body.status)) {
    const updated = updateRequestStatus(id, body.status);
    if (!updated) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ request: updated });
  }

  if (body.donorId && ["ACCEPTED", "DECLINED", "DONATED"].includes(body.action)) {
    const updated = await respondToBloodRequest({
      requestId: id,
      donorId: String(body.donorId),
      action: body.action,
    });
    if (!updated) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
