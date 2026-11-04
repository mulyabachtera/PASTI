import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const authHandler = NextAuth(authOptions);

async function handler(req: any, ctx: any) {
  const headers = req.headers;
  const protocol = headers.get?.("x-forwarded-proto") || (headers.get?.("referer")?.startsWith("https") ? "https" : "http");
  const host = headers.get?.("x-forwarded-host") || headers.get?.("host");
  
  if (host) {
    process.env.NEXTAUTH_URL = `${protocol}://${host}`;
  }
  
  return authHandler(req, ctx);
}

export { handler as GET, handler as POST };
