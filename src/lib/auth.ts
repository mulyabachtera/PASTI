import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("NIP/Email dan password wajib diisi");
        }
        
        const identifier = credentials.email.trim();
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier.toLowerCase() },
              { nip: identifier }
            ]
          }
        });
        
        if (!user || !user?.password) {
          throw new Error("NIP/Email atau password salah");
        }
        
        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );
        
        if (!isCorrectPassword) {
          throw new Error("NIP/Email atau password salah");
        }

        if (!user.isEmailVerified) {
          throw new Error("Email akun ini belum diverifikasi. Silakan hubungi Super Admin untuk verifikasi.");
        }
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          nip: user.nip,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role as string;
        token.nip = (user as { nip?: string | null }).nip;
        token.isEmailVerified = (user as { isEmailVerified?: boolean }).isEmailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = (token.id || token.sub) as string;
        (session.user as any).role = token.role as string;
        (session.user as any).nip = token.nip as string | null;
        (session.user as any).isEmailVerified = token.isEmailVerified as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "sim-pasti-super-secret-key-2026",
};
