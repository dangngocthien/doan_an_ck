"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Users,
  Wrench,
  Boxes,
  Receipt,
  BarChart3,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MUC_DIEU_HUONG = [
  { href: "/admin/phieu-viec", label: "Phiếu việc", icon: ClipboardList },
  { href: "/admin/khach-hang", label: "Khách hàng", icon: Users },
  { href: "/admin/tho", label: "Thợ", icon: Wrench },
  { href: "/admin/vat-tu", label: "Vật tư", icon: Boxes },
  { href: "/admin/hoa-don", label: "Hóa đơn", icon: Receipt },
  { href: "/admin/bao-cao", label: "Báo cáo", icon: BarChart3 },
];

export default function AdminSidebar({
  onChonMuc,
}: {
  onChonMuc?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-white shadow-[8px_0_32px_-16px_rgba(19,31,43,0.1)]">
      <div className="flex items-center gap-3 px-5 pb-5 pt-5">
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--color-primary)] shadow-[0_6px_14px_-4px_rgba(15,76,129,0.55)]">
          <Zap className="h-5 w-5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">
            Điện Nước Quản Lý
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Khu vực quản trị
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {MUC_DIEU_HUONG.map((muc) => {
          const dangMo =
            pathname === muc.href || pathname.startsWith(muc.href + "/");
          const Icon = muc.icon;

          return (
            <Link
              key={muc.href}
              href={muc.href}
              onClick={onChonMuc}
              aria-current={dangMo ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
                dangMo &&
                  "bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] before:absolute before:-left-3 before:bottom-2 before:top-2 before:w-1 before:rounded-r before:bg-[var(--color-accent)]",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {muc.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
