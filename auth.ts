import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

// Bản ĐẦY ĐỦ (có Prisma) — chỉ dùng ở server component, server action, route handler.
// KHÔNG import file này trong middleware.ts (middleware dùng auth.config.ts).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const nguoiDung = await prisma.nguoiDung.findUnique({
          where: { email },
        });
        if (!nguoiDung || !nguoiDung.dang_hoat_dong) return null;

        const hopLe = await bcrypt.compare(password, nguoiDung.mat_khau_hash);
        if (!hopLe) return null;

        return {
          id: String(nguoiDung.id),
          name: nguoiDung.ten,
          email: nguoiDung.email,
          vai_tro: nguoiDung.vai_tro,
        };
      },
    }),
  ],
});
