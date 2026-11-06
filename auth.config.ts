import type { NextAuthConfig } from "next-auth";

/**
 * Cấu hình NextAuth "nhẹ" — dùng được trong Edge Runtime (middleware).
 *
 * QUY TẮC: file này KHÔNG ĐƯỢC import Prisma, bcryptjs, hay bất cứ thứ gì
 * cần Node.js. Nếu thêm vào, middleware sẽ lại lỗi `mariadb ... replace`.
 * Phần cần database (Credentials + Prisma) nằm ở `auth.ts`.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  // providers thật được khai báo trong auth.ts
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.vai_tro = (user as { vai_tro: string }).vai_tro;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { vai_tro?: string }).vai_tro =
          token.vai_tro as string;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
