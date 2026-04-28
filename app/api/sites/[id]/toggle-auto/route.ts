import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/db"
import { sites } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, id), eq(sites.userId, session.user.id)),
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
