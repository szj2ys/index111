import { auth } from "@/auth"

export { signIn, signOut } from "@/auth"

export async function getGoogleToken(userId: string) {
  const { db } = await import("@/db")
  const { users } = await import("@/db/schema")
  const { eq } = await import("drizzle-orm")

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  return user?.googleAccessToken || null
}

export async function getSession() {
  return await auth()
}
