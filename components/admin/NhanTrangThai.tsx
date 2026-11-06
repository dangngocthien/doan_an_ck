import { cn } from "@/lib/utils";

type Kieu = "info" | "warn" | "work" | "ok" | "off" | "danger";

const MAU_NHAN: Record<Kieu, string> = {
  info: "bg-[var(--color-info-bg)] text-[var(--color-info)]",
  warn: "bg-[var(--color-accent-soft)] text-[var(--color-warn-text)]",
  work: "bg-[var(--color-work-bg)] text-[var(--color-work)]",
  ok: "bg-[var(--color-ok-bg)] text-[var(--color-ok)]",
  off: "bg-[var(--color-off-bg)] text-[var(--color-off)]",
  danger: "bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
};

// Nhãn màu dùng chung (có chấm tròn đầu nhãn)
export function Nhan({
  kieu,
  children,
  className,
}: {
  kieu: Kieu;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        MAU_NHAN[kieu],
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

const TRANG_THAI_PHIEU: Record<string, { nhan: string; kieu: Kieu }> = {
  MOI: { nhan: "Mới", kieu: "info" },
  DANG_DI: { nhan: "Đang đi", kieu: "warn" },
  DANG_LAM: { nhan: "Đang làm", kieu: "work" },
  HOAN_THANH: { nhan: "Hoàn thành", kieu: "ok" },
  DA_HUY: { nhan: "Đã hủy", kieu: "off" },
};

export function NhanTrangThai({ trangThai }: { trangThai: string }) {
  const t = TRANG_THAI_PHIEU[trangThai];
  return <Nhan kieu={t?.kieu ?? "off"}>{t?.nhan ?? trangThai}</Nhan>;
}

const UU_TIEN: Record<string, { nhan: string; chamClass: string }> = {
  CAO: {
    nhan: "Cao",
    chamClass:
      "bg-[var(--color-danger)] shadow-[0_0_0_4px_var(--color-danger-bg)]",
  },
  TRUNG_BINH: {
    nhan: "Trung bình",
    chamClass:
      "bg-[var(--color-accent)] shadow-[0_0_0_4px_var(--color-accent-soft)]",
  },
  THAP: {
    nhan: "Thấp",
    chamClass: "bg-[#9fb0c0] shadow-[0_0_0_4px_#eef2f6]",
  },
};

// Mức ưu tiên: chấm màu + chữ
export function ChamUuTien({ mucDo }: { mucDo: string }) {
  const u = UU_TIEN[mucDo];
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={cn("h-2 w-2 rounded-full", u?.chamClass)}
      />
      {u?.nhan ?? mucDo}
    </span>
  );
}

function chuCaiDau(ten: string): string {
  const tu = ten.trim().split(/\s+/).filter(Boolean);
  if (tu.length === 0) return "?";
  const dau = tu[0][0];
  const cuoi = tu.length > 1 ? tu[tu.length - 1][0] : "";
  return (dau + cuoi).toUpperCase();
}

// Avatar chữ cái đầu + tên
export function AvatarTen({ ten }: { ten: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary)]"
      >
        {chuCaiDau(ten)}
      </span>
      {ten}
    </span>
  );
}
