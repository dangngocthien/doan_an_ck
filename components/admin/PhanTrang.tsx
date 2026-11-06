import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SO_DONG_MOI_TRANG } from "@/lib/phan-trang";

type Props = {
  duongDan: string; // vd "/admin/phieu-viec"
  thamSo: Record<string, string>; // bộ lọc ĐÃ kiểm tra, để giữ lại khi chuyển trang
  trang: number;
  tongTrang: number;
  tong: number;
};

function taoHref(duongDan: string, thamSo: Record<string, string>, trang: number) {
  const params = new URLSearchParams(thamSo);
  if (trang > 1) params.set("trang", String(trang));
  const chuoi = params.toString();
  return chuoi ? `${duongDan}?${chuoi}` : duongDan;
}

// Luôn có trang đầu, trang cuối và 1 trang kề hai bên trang hiện tại; đoạn bị lược hiện "…"
function danhSachSo(trang: number, tongTrang: number): (number | "…")[] {
  const so = [...new Set([1, tongTrang, trang - 1, trang, trang + 1])]
    .filter((n) => n >= 1 && n <= tongTrang)
    .sort((a, b) => a - b);
  const kq: (number | "…")[] = [];
  so.forEach((n, i) => {
    if (i > 0 && n - so[i - 1] > 1) kq.push("…");
    kq.push(n);
  });
  return kq;
}

function Nut({
  href,
  kichHoat = false,
  children,
}: {
  href: string | null; // null = vô hiệu
  kichHoat?: boolean;
  children: React.ReactNode;
}) {
  const lop = buttonVariants({ variant: "outline", size: "sm" });
  if (href === null) {
    return (
      <span aria-disabled="true" className={cn(lop, "pointer-events-none opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={kichHoat ? "page" : undefined}
      className={cn(
        lop,
        kichHoat &&
          "border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
      )}
    >
      {children}
    </Link>
  );
}

export default function PhanTrang({
  duongDan,
  thamSo,
  trang,
  tongTrang,
  tong,
}: Props) {
  if (tongTrang <= 1) return null;

  const tu = (trang - 1) * SO_DONG_MOI_TRANG + 1;
  const den = Math.min(trang * SO_DONG_MOI_TRANG, tong);

  return (
    <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-[var(--color-text-muted)]">
        Hiển thị {tu}–{den} / {tong}
      </p>

      <nav aria-label="Phân trang" className="flex items-center gap-1">
        <Nut href={trang > 1 ? taoHref(duongDan, thamSo, trang - 1) : null}>
          Trước
        </Nut>

        {/* Điện thoại: chỉ hiện "Trang x/y" cho gọn */}
        <span className="px-2 text-sm text-[var(--color-text-muted)] sm:hidden">
          Trang {trang}/{tongTrang}
        </span>

        {/* Từ 640px: hiện dãy số trang */}
        <div className="hidden items-center gap-1 sm:flex">
          {danhSachSo(trang, tongTrang).map((s, i) =>
            s === "…" ? (
              <span key={`d${i}`} className="px-1 text-sm text-[var(--color-text-muted)]">
                …
              </span>
            ) : (
              <Nut
                key={s}
                href={taoHref(duongDan, thamSo, s)}
                kichHoat={s === trang}
              >
                {s}
              </Nut>
            )
          )}
        </div>

        <Nut href={trang < tongTrang ? taoHref(duongDan, thamSo, trang + 1) : null}>
          Sau
        </Nut>
      </nav>
    </div>
  );
}
