export interface Session {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
  }
}

export async function getSession(): Promise<Session> {
  return {
    user: {
      id: "test-user-001",
      email: "test@index111.app",
      name: "Test User",
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
