import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/db"
import { users, accounts } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"

async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) return null
  return res.json() as Promise<{ access_token: string; expires_in: number; refresh_token?: string }>
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/webmasters.readonly",
            "https://www.googleapis.com/auth/indexing",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || !profile?.email) return false

      const email = profile.email as string
      const name = (profile.name as string) || email
      const image = (profile.picture as string) || null

      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      })

      let userId: string
      if (!existing) {
        userId = uuidv4()
        await db.insert(users).values({
          id: userId,
          email,
          name,
          image,
          googleAccessToken: account.access_token ?? null,
          googleRefreshToken: account.refresh_token ?? null,
          tokenExpiresAt: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
          planTier: "free",
          maxSites: 1,
          maxUrlsPerSite: 1000,
        })
      } else {
        userId = existing.id
        await db.update(users).set({
          name: name || existing.name,
          image: image || existing.image,
          googleAccessToken: account.access_token ?? existing.googleAccessToken,
          googleRefreshToken: account.refresh_token ?? existing.googleRefreshToken,
          tokenExpiresAt: account.expires_at
            ? new Date(account.expires_at * 1000)
            : existing.tokenExpiresAt,
        }).where(eq(users.id, userId))
      }

      // Upsert account
      const existingAccount = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.provider, account.provider),
          eq(accounts.providerAccountId, account.providerAccountId)
        ),
      })

      if (!existingAccount) {
        await db.insert(accounts).values({
          id: uuidv4(),
          userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token ?? null,
          access_token: account.access_token ?? null,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state as string | null,
        })
      } else {
        await db.update(accounts).set({
          refresh_token: account.refresh_token ?? existingAccount.refresh_token,
          access_token: account.access_token ?? existingAccount.access_token,
          expires_at: account.expires_at ?? existingAccount.expires_at,
        }).where(eq(accounts.id, existingAccount.id))
      }

      return true
    },

    async jwt({ token, account, user }) {
      if (account && user) {
        // Initial sign in
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email!),
        })
        token.userId = dbUser?.id ?? user.id
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }

      // Refresh access token if it will expire within 5 minutes
      const now = Math.floor(Date.now() / 1000)
      if (token.expiresAt && (token.expiresAt as number) < now + 300 && token.refreshToken) {
        try {
          const refreshed = await refreshGoogleToken(token.refreshToken as string)
          if (refreshed) {
            token.accessToken = refreshed.access_token
            token.expiresAt = now + refreshed.expires_in
            if (refreshed.refresh_token) {
              token.refreshToken = refreshed.refresh_token
            }
            await db.update(users).set({
              googleAccessToken: refreshed.access_token,
              tokenExpiresAt: new Date((token.expiresAt as number) * 1000),
            }).where(eq(users.id, token.userId as string))
          }
        } catch (e) {
          console.error("Token refresh failed:", e)
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string | undefined
        session.refreshToken = token.refreshToken as string | undefined
        session.expiresAt = token.expiresAt as number | undefined
        if (session.user) {
          session.user.id = token.userId as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
})
