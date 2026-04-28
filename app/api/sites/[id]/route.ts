import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { success, unauthorized, notFound, internalError } from "@/lib/api";
import { eq, and } from "drizzle-orm";

async function getOwnedSite(userId: string, siteId: string) {
  return db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, userId)),
    with: { urls: true },
  });
}

// GET /api/sites/[id] - Get site details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return unauthorized();
  }

  try {
    const { id } = await params;
    const site = await getOwnedSite(session.user.id, id);

    if (!site) {
      return notFound("Site not found");
    }

    return success(site);
  } catch (error) {
    return internalError(error);
  }
}

// PATCH /api/sites/[id] - Update site
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return unauthorized();
  }

  try {
    const { id } = await params;
    const site = await getOwnedSite(session.user.id, id);

    if (!site) {
      return notFound("Site not found");
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.autoSubmitEnabled !== undefined) {
      updateData.autoSubmitEnabled = body.autoSubmitEnabled;
    }
    if (body.sitemapUrl !== undefined) {
      updateData.sitemapUrl = body.sitemapUrl;
    }

    await db.update(sites).set(updateData).where(eq(sites.id, id));

    const updatedSite = await db.query.sites.findFirst({
      where: eq(sites.id, id),
    });

    return success(updatedSite);
  } catch (error) {
    return internalError(error);
  }
}

// DELETE /api/sites/[id] - Delete site
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return unauthorized();
  }

  try {
    const { id } = await params;
    const site = await getOwnedSite(session.user.id, id);

    if (!site) {
      return notFound("Site not found");
    }

    await db.delete(sites).where(eq(sites.id, id));

    return success({ message: "Site deleted successfully" });
  } catch (error) {
    return internalError(error);
  }
}
