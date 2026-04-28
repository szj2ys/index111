import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/db"
import { urls } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { url, siteId } = await request.json()

  const { getGoogleToken } = await import("@/lib/auth")
  const accessToken = await getGoogleToken(session.user.id)

  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Google token not found" }, { status: 403 })
  }

  try {
    const { google } = await import("googleapis")
    const webmasters = google.webmasters({ version: "v3" })
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })

    // Try to get URL info from Search Console
    const siteUrl = new URL(url).origin + "/"
    const response = await webmasters.urlTestingTools.run(
      {
        auth,
        requestBody: {
          url,
          requestScreenshot: false,
        },
      }
    ).catch(() => null)

    // Fallback: check if URL has been submitted recently
    const urlRecord = await db.query.urls.findFirst({
      where: and(eq(urls.id, id), eq(urls.siteId, siteId)),
    })

    let status = "unknown"
    if (urlRecord?.lastSubmittedGoogle && !urlRecord.indexStatus) {
      status = "pending"
    }

    // If we got a successful response, mark as indexed
    if (response?.data?.mobileFriendliness === "MOBILE_FRIENDLY") {
      status = "indexed"
    }

    await db
      .update(urls)
      .set({ indexStatus: status, updatedAt: new Date() })
      .where(eq(urls.id, id))

    return NextResponse.json({ success: true, status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
