import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DangXuatButton from "@/components/DangXuatButton";

// 00:00 ngày 1 của tháng hiện tại, theo giờ Việt Nam
function dauThangGioVN(): Date {
  const phan = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const nam = phan.find((p) => p.type === "year")?.value;
  const thang = phan.find((p) => p.type === "month")?.value;
  return new Date(`${nam}-${thang}-01T00:00:00.000+07:00`);
}

export default async function ThoHoSoPage() {
  const session = await auth();
  const thoId = Number((session?.user as { id?: string })?.id);

  const [nguoiDung, dangXuLy, hoanThanhThangNay, tongHoanThanh] =
    await Promise.all([
      prisma.nguoiDung.findUnique({
        where: { id: thoId },
        select: { ten: true, sdt: true, email: true, dia_chi: true },
      }),
      prisma.phieuViec.count({
        where: {
          tho_id: thoId,
          trang_thai: { in: ["MOI", "DANG_DI", "DANG_LAM"] },
        },
      }),
      prisma.phieuViec.count({
        where: {
          tho_id: thoId,
          trang_thai: "HOAN_THANH",
          ngay_hoan_thanh: { gte: dauThangGioVN() },
        },
      }),
      prisma.phieuViec.count({
        where: { tho_id: thoId, trang_thai: "HOAN_THANH" },
      }),
    ]);

  if (!nguoiDung) {
    notFound();
  }

  // Tên Việt: chữ cuối là tên gọi → lấy chữ cái đầu của chữ cuối
  const chuCai =
    nguoiDung.ten.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? "?";

  const thongKe = [
    { nhan: "Đang xử lý", so: dangXuLy },
    { nhan: "Hoàn thành tháng này", so: hoanThanhThangNay },
    { nhan: "Tổng hoàn thành", so: tongHoanThanh },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-3">
      <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#145f9c,var(--color-primary-hover))] p-4 text-white">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 h-[170px] w-[170px] rounded-full border-[30px] border-white/[0.06]"
        />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.13] text-2xl font-semibold">
            {chuCai}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold break-words">{nguoiDung.ten}</h1>
            <p className="text-[13px] text-[#b9d0e8]">Thợ sửa chữa</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[rgba(19,31,43,0.06)] bg-white px-4 [box-shadow:var(--shadow-card)]">
        <dl className="text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <Phone size={16} aria-hidden="true" />
              Số điện thoại
            </dt>
            <dd className="font-medium">{nguoiDung.sdt}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] py-3">
            <dt className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <Mail size={16} aria-hidden="true" />
              Email
            </dt>
            <dd className="text-right font-medium break-all">
              {nguoiDung.email}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 border-t border-[var(--color-border)] py-3">
            <dt className="flex shrink-0 items-center gap-2 text-[var(--color-text-muted)]">
              <MapPin size={16} aria-hidden="true" />
              Địa chỉ nhà
            </dt>
            <dd className="text-right font-medium break-words">
              {nguoiDung.dia_chi || (
                <span className="font-normal text-[var(--color-text-muted)]">
                  Chưa cập nhật
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {thongKe.map((o) => (
          <div
            key={o.nhan}
            className="rounded-xl border border-[rgba(19,31,43,0.06)] bg-white p-3 text-center [box-shadow:var(--shadow-card)]"
          >
            <div className="text-2xl font-bold text-[var(--color-primary)] tabular-nums">
              {o.so}
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-muted)]">
              {o.nhan}
            </div>
          </div>
        ))}
      </div>

      {/* Điện thoại: đăng xuất nằm ở đây. Laptop: đã có ở header */}
      <div className="sm:hidden [&_button]:w-full [&_button]:bg-white [&_button]:py-2.5 [&_button]:font-medium">
        <DangXuatButton />
      </div>
    </div>
  );
}
