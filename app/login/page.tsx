"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);

  async function xuLyDangNhap(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoi("");
    setDangGui(true);

    const form = new FormData(e.currentTarget);
    const ketQua = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setDangGui(false);

    if (ketQua?.error) {
      setLoi("Email hoặc mật khẩu không đúng.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={xuLyDangNhap}
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-gray-900">Đăng nhập</h1>
        <p className="mt-1 text-sm text-gray-600">
          Hệ thống quản lý dịch vụ sửa chữa điện nước
        </p>

        <label
          htmlFor="email"
          className="mt-6 block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />

        <label
          htmlFor="password"
          className="mt-4 block text-sm font-medium text-gray-700"
        >
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />

        {loi && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {loi}
          </p>
        )}

        <button
          type="submit"
          disabled={dangGui}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {dangGui ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
