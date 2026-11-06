"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, User } from "lucide-react";

const DANH_SACH_MUC = [
  { href: "/tho/phieu-viec", nhan: "Phiếu việc", Icon: ClipboardList },
  { href: "/tho/ho-so", nhan: "Hồ sơ", Icon: User },
];

// kieu = "header": tab ngang trên header, chỉ hiện từ 640px (laptop)
// kieu = "day":    thanh tab dưới đáy, chỉ hiện dưới 640px (điện thoại)
export default function ThoDieuHuong({ kieu }: { kieu: "header" | "day" }) {
  const duongDan = usePathname();

  // startsWith để trang chi tiết /tho/phieu-viec/12 vẫn tính là tab "Phiếu việc"
  const dangChon = (href: string) => duongDan.startsWith(href);

  if (kieu === "header") {
    return (
      <nav className="hidden items-center gap-1 sm:flex">
        {DANH_SACH_MUC.map(({ href, nhan, Icon }) => {
          const chon = dangChon(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={chon ? "page" : undefined}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                chon
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Icon
                size={16}
                className={chon ? "text-[var(--color-accent)]" : ""}
              />
              {nhan}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex border-t border-[var(--color-border)] bg-white px-4 pt-2 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:hidden">
      {DANH_SACH_MUC.map(({ href, nhan, Icon }) => {
        const chon = dangChon(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={chon ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs ${
              chon
                ? "bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]"
                : "font-medium text-[var(--color-text-muted)]"
            }`}
          >
            <Icon size={20} />
            {nhan}
          </Link>
        );
      })}
    </nav>
  );
}
