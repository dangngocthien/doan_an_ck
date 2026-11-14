"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

// Hộp thoại phủ lên trang hiện tại. Đóng bằng router.back() để URL và lịch sử trình duyệt luôn khớp
// với những gì đang hiển thị (nút Quay lại của trình duyệt cũng đóng được hộp thoại).
// tieuDe: tên hộp thoại cho trình đọc màn hình. rong: độ rộng tối đa (class Tailwind), mặc định max-w-2xl.
export default function HopThoai({
  tieuDe,
  rong = "max-w-2xl",
  children,
}: {
  tieuDe: string;
  rong?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Nhấn Esc để đóng
  useEffect(() => {
    function khiNhanPhim(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    window.addEventListener("keydown", khiNhanPhim);
    return () => window.removeEventListener("keydown", khiNhanPhim);
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#131f2b]/40 p-4"
      onClick={() => router.back()}
      role="dialog"
      aria-modal="true"
      aria-label={tieuDe}
    >
      <div
        className={`max-h-[90vh] w-full ${rong} overflow-y-auto overscroll-contain rounded-2xl bg-[var(--color-surface)] p-4 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chiều cao 0 + sticky: nút Đóng nằm ở góc trên phải và luôn hiện khi cuộn */}
        <div className="sticky top-0 z-10 h-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Đóng"
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] shadow-sm hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
