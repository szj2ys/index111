import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { sites } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getDefaultUserId } from "@/lib/guest"

const DEFAULT_USER_ID = getDefaultUserId()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, id), eq(sites.userId, DEFAULT_USER_ID)),
  })

  if (!site) {
    return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 })
  }

  const newValue = !site.autoSubmitEnabled

  await db
    .update(sites)
    .set({ autoSubmitEnabled: newValue, updatedAt: new Date() })
    .where(eq(sites.id, id))

  return NextResponse.json({ success: true, autoSubmitEnabled: newValue })
}
