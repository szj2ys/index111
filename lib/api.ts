import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export interface ApiError {
  code: string;
  message: string;
}

export function unauthorized(message = "Please sign in") {
  return NextResponse.json(
    { success: false, error: { code: "UNAUTHORIZED", message } },
    { status: 401 }
  );
}

export function notFound(message = "Not found") {
  return NextResponse.json(
    { success: false, error: { code: "NOT_FOUND", message } },
    { status: 404 }
  );
}

export function badRequest(message: string) {
  return NextResponse.json(
    { success: false, error: { code: "VALIDATION_ERROR", message } },
    { status: 400 }
  );
}

export function internalError(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error";
  console.error("API error:", error);
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_ERROR", message } },
    { status: 500 }
  );
}

export function success<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

export async function requireAuth(request?: NextRequest): Promise<
  | { userId: string }
  | { response: ReturnType<typeof unauthorized> }
> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { response: unauthorized() };
  }
  return { userId: session.user.id };
}
