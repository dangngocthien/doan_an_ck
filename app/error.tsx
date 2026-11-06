"use client";

import Link from "next/link";

// Không hiển thị error.message: tránh lộ lỗi hệ thống ra người dùng
export default function TrangLoi({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-white p-6 text-center shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold text-[var(--color-primary)]">
          Đã có lỗi xảy ra
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Hệ thống chưa xử lý được yêu cầu của bạn. Hãy thử lại; nếu vẫn lỗi,
          vui lòng liên hệ quản trị viên.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-surface)]"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
