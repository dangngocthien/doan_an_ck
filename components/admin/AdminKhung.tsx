"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";

export default function AdminKhung({
  nutDangXuat,
  children,
}: {
  nutDangXuat: React.ReactNode;
  children: React.ReactNode;
}) {
  const [moMenu, setMoMenu] = useState(false);

  // Nhấn Esc để đóng ngăn kéo
  useEffect(() => {
    if (!moMenu) return;
    function khiNhanPhim(e: KeyboardEvent) {
      if (e.key === "Escape") setMoMenu(false);
    }
    window.addEventListener("keydown", khiNhanPhim);
    return () => window.removeEventListener("keydown", khiNhanPhim);
  }, [moMenu]);

  return (
    <div className="flex h-screen bg-[var(--color-surface)]">
      {/* Lớp mờ phía sau ngăn kéo (chỉ màn nhỏ) */}
      {moMenu && (
        <div
          className="fixed inset-0 z-30 bg-[#131f2b]/40 lg:hidden"
          onClick={() => setMoMenu(false)}
          aria-hidden="true"
        />
      )}

      {/* Màn nhỏ: ngăn kéo trượt từ trái. Từ 1024px: sidebar cố định như cũ */}
      <div
        id="admin-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 transition-[transform,visibility] duration-200 lg:visible lg:static lg:translate-x-0",
          moMenu ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <AdminSidebar onChonMuc={() => setMoMenu(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-3 sm:px-6 lg:justify-end">
          <button
            type="button"
            onClick={() => setMoMenu(true)}
            aria-label="Mở menu"
            aria-expanded={moMenu}
            aria-controls="admin-sidebar"
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 hover:bg-[var(--color-surface)] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          {nutDangXuat}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
