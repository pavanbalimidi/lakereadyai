import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import AzureAD from "next-auth/providers/microsoft-entra-id";
import Okta from "next-auth/providers/okta";
import { z } from "zod";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: { id: string; orgId?: string | null } & DefaultSession["user"];
  }
}

// JWT shape — kept inline because next-auth v5 beta doesn't expose
// `next-auth/jwt` as an augmentable module path.
type AppJWT = {
  sub?: string;
  accessToken?: string;
  orgId?: string | null;
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mode: z.enum(["login", "signup"]).default("login"),
  name: z.string().optional(),
});

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      mode: { label: "Mode", type: "text" },
      name: { label: "Name", type: "text" },
    },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      const { email, password, mode, name } = parsed.data;

      const endpoint = mode === "signup" ? "/v1/auth/signup" : "/v1/auth/login";
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signup" ? { email, password, name } : { email, password },
        ),
      });
      if (!res.ok) return null;
      const { access_token } = (await res.json()) as { access_token: string };

      const meRes = await fetch(`${API}/v1/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!meRes.ok) return null;
      const me = (await meRes.json()) as {
        id: string;
        email: string;
        name: string | null;
        org_id: string | null;
      };

      return {
        id: me.id,
        email: me.email,
        name: me.name,
        orgId: me.org_id,
        accessToken: access_token,
      } as unknown as { id: string; email: string };
    },
  }),
];

if (process.env.AUTH_AZURE_AD_ID && process.env.AUTH_AZURE_AD_SECRET) {
  providers.push(
    AzureAD({
      clientId: process.env.AUTH_AZURE_AD_ID,
      clientSecret: process.env.AUTH_AZURE_AD_SECRET,
      issuer: process.env.AUTH_AZURE_AD_TENANT_ID
        ? `https://login.microsoftonline.com/${process.env.AUTH_AZURE_AD_TENANT_ID}/v2.0`
        : undefined,
    }),
  );
}

if (process.env.AUTH_OKTA_ID && process.env.AUTH_OKTA_SECRET && process.env.AUTH_OKTA_ISSUER) {
  providers.push(
    Okta({
      clientId: process.env.AUTH_OKTA_ID,
      clientSecret: process.env.AUTH_OKTA_SECRET,
      issuer: process.env.AUTH_OKTA_ISSUER,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  providers,
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      const t = token as AppJWT;
      if (user) {
        const u = user as unknown as {
          accessToken?: string;
          orgId?: string | null;
        };
        if (u.accessToken) t.accessToken = u.accessToken;
        if (u.orgId !== undefined) t.orgId = u.orgId;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as AppJWT;
      session.accessToken = t.accessToken;
      if (session.user) {
        session.user.id = t.sub ?? "";
        session.user.orgId = t.orgId ?? null;
      }
      return session;
    },
  },
});
