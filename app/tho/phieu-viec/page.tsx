import Link from "next/link";
import { MapPin, User } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NhanTrangThai } from "@/components/admin/NhanTrangThai";

// buoc: số đoạn của thanh tiến độ được tô (0 = không hiện thanh, dùng cho Đã hủy)
// nut: chữ trên nút đáy thẻ; noiBat = nút hổ phách (bước thợ cần làm ngay)
const CHI_TIET_TRANG_THAI: Record<
  string,
  { buoc: number; mau: string; nut?: string; noiBat?: boolean }
> = {
  MOI: { buoc: 1, mau: "var(--color-info)", nut: "Bắt đầu đi" },
  DANG_DI: {
    buoc: 2,
    mau: "var(--color-accent)",
    nut: "Chụp ảnh trước khi làm",
    noiBat: true,
  },
  DANG_LAM: {
    buoc: 3,
    mau: "var(--color-work)",
    nut: "Ghi vật tư & chụp ảnh sau",
    noiBat: true,
  },
  HOAN_THANH: { buoc: 4, mau: "var(--color-ok)" },
  DA_HUY: { buoc: 0, mau: "var(--color-off)" },
};

const CAC_BUOC = ["Mới", "Đang đi", "Đang làm", "Xong"];

// Lời chào theo giờ Việt Nam (UTC+7)
function loiChao(): string {
  const gio = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours();
  if (gio < 11) return "Chào buổi sáng";
  if (gio < 14) return "Chào buổi trưa";
  if (gio < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default async function ThoPhieuViecPage() {
  const session = await auth();
  const thoId = Number((session?.user as { id?: string })?.id);
  const tenTho = session?.user?.name;

  const danhSach = await prisma.phieuViec.findMany({
    where: { tho_id: thoId },
    orderBy: { ngay_tao: "desc" },
    include: { khach_hang: true },
  });

  const DA_XONG = ["HOAN_THANH", "DA_HUY"];
  // Phiếu đang xử lý lên trước; mỗi nhóm vẫn giữ thứ tự mới nhất trước
  danhSach.sort(
    (a, b) =>
      Number(DA_XONG.includes(a.trang_thai)) -
      Number(DA_XONG.includes(b.trang_thai)),
  );

  const soViecCanLam = danhSach.filter(
    (pv) => !DA_XONG.includes(pv.trang_thai),
  ).length;
  const soDangXuLy = danhSach.filter((pv) =>
    ["DANG_DI", "DANG_LAM"].includes(pv.trang_thai),
  ).length;

  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#145f9c,var(--color-primary-hover))] p-4 text-white">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 h-[170px] w-[170px] rounded-full border-[30px] border-white/[0.06]"
        />
        <p className="relative text-[13px] text-[#b9d0e8]">{loiChao()}</p>
        {tenTho && (
          <h1 className="relative mt-0.5 text-xl font-bold break-words">
            {tenTho}
          </h1>
        )}
        <div className="relative mt-3.5 flex gap-2.5">
          <div className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.13] px-3 py-2.5">
            <b className="block text-xl leading-tight tabular-nums">
              {soViecCanLam}
            </b>
            <span className="text-xs text-[#cfe0f1]">Việc cần làm</span>
          </div>
          <div className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.13] px-3 py-2.5">
            <b className="block text-xl leading-tight tabular-nums">
              {soDangXuLy}
            </b>
            <span className="text-xs text-[#cfe0f1]">Đang xử lý</span>
          </div>
        </div>
      </section>

      {danhSach.length === 0 && (
        <p className="rounded-2xl bg-white p-4 text-sm text-[var(--color-text-muted)] [box-shadow:var(--shadow-card)]">
          Chưa có phiếu việc nào được giao.
        </p>
      )}

      <div className="grid items-start gap-3 sm:grid-cols-2">
        {danhSach.map((pv) => {
          const ct = CHI_TIET_TRANG_THAI[pv.trang_thai] ?? {
            buoc: 0,
            mau: "var(--color-off)",
          };
          return (
            <Link
              key={pv.id}
              href={`/tho/phieu-viec/${pv.id}`}
              style={{ "--c": ct.mau } as React.CSSProperties}
              className="relative block rounded-xl border border-[rgba(19,31,43,0.06)] bg-white p-3.5 pl-[18px] [box-shadow:var(--shadow-card)] before:absolute before:top-3.5 before:bottom-3.5 before:left-0 before:w-1 before:rounded-r before:bg-[var(--c)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 text-[15px] font-semibold break-words">
                  {pv.loai_su_co}
                </h2>
                <span className="shrink-0">
                  <NhanTrangThai trangThai={pv.trang_thai} />
                </span>
              </div>

              <p className="mt-1.5 flex items-start gap-1.5 text-[13px] break-words text-[var(--color-text-muted)]">
                <User size={15} className="mt-[3px] shrink-0" aria-hidden="true" />
                <span>
                  {pv.khach_hang.ten} · {pv.khach_hang.sdt}
                </span>
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-[13px] break-words text-[var(--color-text-muted)]">
                <MapPin size={15} className="mt-[3px] shrink-0" aria-hidden="true" />
                <span>{pv.dia_chi}</span>
              </p>

              {ct.buoc > 0 && (
                <div aria-hidden="true">
                  <div className="mt-3 flex gap-1">
                    {CAC_BUOC.map((_, i) => (
                      <i
                        key={i}
                        className={`h-[5px] flex-1 rounded-full ${
                          i < ct.buoc
                            ? "bg-[var(--c)]"
                            : "bg-[var(--color-border)]"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] font-medium text-[var(--color-text-muted)]">
                    {CAC_BUOC.map((ten) => (
                      <span key={ten}>{ten}</span>
                    ))}
                  </div>
                </div>
              )}

              {ct.nut && (
                <span
                  className={`mt-3 block w-full rounded-[10px] py-3 text-center text-[14.5px] font-semibold ${
                    ct.noiBat
                      ? "bg-[var(--color-accent)] text-[#3a2300] shadow-[0_8px_16px_-8px_rgba(242,163,58,0.8)]"
                      : "bg-[var(--color-primary)] text-white shadow-[0_8px_16px_-8px_rgba(15,76,129,0.6)]"
                  }`}
                >
                  {ct.nut}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
