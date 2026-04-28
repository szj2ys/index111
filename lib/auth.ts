import { auth } from "@/auth"

export interface Session {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
  }
}

export async function getSession(): Promise<Session | null> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) return null
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    },
  }
}

export async function getGoogleToken(userId: string) {
  const { db } = await import("@/db")
  const { users } = await import("@/db/schema")
  const { eq } = await import("drizzle-orm")

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  return user?.googleAccessToken || null
}
