import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Dùng cấu hình nhẹ (không Prisma) vì middleware chạy trong Edge Runtime.
// KHÔNG đổi thành `import { auth } from "@/auth"`.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const vaiTro = (req.auth?.user as { vai_tro?: string } | undefined)?.vai_tro;
  const { pathname } = req.nextUrl;

  const daDangNhap = !!req.auth;

  if (!daDangNhap) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin") && vaiTro !== "ADMIN") {
    return NextResponse.redirect(new URL("/tho/phieu-viec", req.url));
  }

  if (pathname.startsWith("/tho") && vaiTro !== "THO") {
    return NextResponse.redirect(new URL("/admin/phieu-viec", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/tho/:path*"],
};
