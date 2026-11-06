import Link from "next/link";

export default function TrangKhongTimThay() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-white p-6 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm font-medium text-[var(--color-text-muted)]">404</p>
        <h1 className="mt-1 text-xl font-semibold text-[var(--color-primary)]">
          Không tìm thấy trang
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Đường dẫn không đúng hoặc dữ liệu này không còn tồn tại.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
