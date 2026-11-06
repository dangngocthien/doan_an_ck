"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { FileText, MapPin, User, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { NhanTrangThai } from "@/components/admin/NhanTrangThai";
import {
  chuyenTrangThaiTiepTheo,
  taiAnhPhieuViec,
  xoaAnhPhieuViec,
  type KetQuaHanhDong,
} from "@/lib/actions/tho-phieu-viec";
import { lyDoKhongChupAnh } from "@/lib/anh-phieu-viec";

const NHAN_NUT_TIEP_THEO: Record<string, string> = {
  MOI: "Bắt đầu di chuyển",
  DANG_DI: "Bắt đầu sửa chữa",
  DANG_LAM: "Hoàn thành công việc",
};

// buoc: số đoạn của thanh tiến độ được tô (0 = không hiện thanh, dùng cho Đã hủy)
const CHI_TIET_TRANG_THAI: Record<string, { buoc: number; mau: string }> = {
  MOI: { buoc: 1, mau: "var(--color-info)" },
  DANG_DI: { buoc: 2, mau: "var(--color-accent)" },
  DANG_LAM: { buoc: 3, mau: "var(--color-work)" },
  HOAN_THANH: { buoc: 4, mau: "var(--color-ok)" },
  DA_HUY: { buoc: 0, mau: "var(--color-off)" },
};

const CAC_BUOC = ["Mới", "Đang đi", "Đang làm", "Xong"];

type Anh = { id: number; loai: "TRUOC" | "SAU"; url: string };

type PhieuViecChiTiet = {
  id: number;
  loai_su_co: string;
  trang_thai: string;
  dia_chi: string;
  ghi_chu: string | null;
  khach_hang: { ten: string; sdt: string };
  anh_phieu_viec: Anh[];
};

const TRANG_THAI_BAN_DAU: KetQuaHanhDong = {};

export default function ThoPhieuViecForm({
  phieuViec,
  lyDoKhoaNut,
}: {
  phieuViec: PhieuViecChiTiet;
  lyDoKhoaNut?: string;
}) {
  const chuyenTrangThaiVoiId = chuyenTrangThaiTiepTheo.bind(null, phieuViec.id);
  const [stateTrangThai, formActionTrangThai, dangDoiTrangThai] =
    useActionState(chuyenTrangThaiVoiId, TRANG_THAI_BAN_DAU);

  const nutTiepTheo = NHAN_NUT_TIEP_THEO[phieuViec.trang_thai];
  const anhTruoc = phieuViec.anh_phieu_viec.filter((a) => a.loai === "TRUOC");
  const anhSau = phieuViec.anh_phieu_viec.filter((a) => a.loai === "SAU");
  const ct = CHI_TIET_TRANG_THAI[phieuViec.trang_thai] ?? {
    buoc: 0,
    mau: "var(--color-off)",
  };

  // Chốt chặn ảnh (server cũng kiểm tra lại): đây chỉ để khóa nút kèm lý do cho thợ thấy
  let lyDoThieuAnh: string | undefined;
  if (phieuViec.trang_thai === "DANG_DI" && anhTruoc.length === 0) {
    lyDoThieuAnh = "Cần chụp ít nhất 1 ảnh trước khi làm để bắt đầu sửa chữa.";
  }
  if (phieuViec.trang_thai === "DANG_LAM" && anhSau.length === 0) {
    lyDoThieuAnh =
      "Cần chụp ít nhất 1 ảnh sau khi làm để hoàn thành công việc.";
  }
  const lyDoKhoa = lyDoThieuAnh ?? lyDoKhoaNut;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/tho/phieu-viec"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        ← Quay lại danh sách
      </Link>

      <section
        style={{ "--c": ct.mau } as React.CSSProperties}
        className="relative rounded-2xl border border-[rgba(19,31,43,0.06)] bg-white p-4 pl-5 [box-shadow:var(--shadow-card)] before:absolute before:top-4 before:bottom-4 before:left-0 before:w-1 before:rounded-r before:bg-[var(--c)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-lg font-semibold break-words">
            {phieuViec.loai_su_co}
          </h1>
          <span className="shrink-0">
            <NhanTrangThai trangThai={phieuViec.trang_thai} />
          </span>
        </div>

        <div className="mt-3 space-y-1.5 text-sm break-words">
          <p className="flex items-start gap-2">
            <User
              size={16}
              className="mt-0.5 shrink-0 text-[var(--color-text-muted)]"
              aria-hidden="true"
            />
            <span>
              <span className="sr-only">Khách hàng: </span>
              {phieuViec.khach_hang.ten} · {phieuViec.khach_hang.sdt}
            </span>
          </p>
          <p className="flex items-start gap-2">
            <MapPin
              size={16}
              className="mt-0.5 shrink-0 text-[var(--color-text-muted)]"
              aria-hidden="true"
            />
            <span>
              <span className="sr-only">Địa chỉ: </span>
              {phieuViec.dia_chi}
            </span>
          </p>
          {phieuViec.ghi_chu && (
            <p className="flex items-start gap-2">
              <FileText
                size={16}
                className="mt-0.5 shrink-0 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <span>
                <span className="font-medium">Ghi chú:</span>{" "}
                {phieuViec.ghi_chu}
              </span>
            </p>
          )}
        </div>

        {ct.buoc > 0 && (
          <div aria-hidden="true">
            <div className="mt-4 flex gap-1">
              {CAC_BUOC.map((_, i) => (
                <i
                  key={i}
                  className={`h-[5px] flex-1 rounded-full ${
                    i < ct.buoc ? "bg-[var(--c)]" : "bg-[var(--color-border)]"
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

        {nutTiepTheo && (
          <form action={formActionTrangThai} className="mt-4">
            <Button
              type="submit"
              disabled={dangDoiTrangThai || !!lyDoKhoa}
              className="w-full sm:w-auto"
            >
              {dangDoiTrangThai ? "Đang cập nhật..." : nutTiepTheo}
            </Button>
            {lyDoKhoa && (
              <p className="mt-3 rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-sm text-[var(--color-warn-text)]">
                {lyDoKhoa}
              </p>
            )}
          </form>
        )}
        {stateTrangThai.error && (
          <p className="mt-3 text-sm text-[var(--color-danger)]">
            {stateTrangThai.error}
          </p>
        )}
      </section>

      <KhuAnh
        tieuDe="Ảnh trước khi làm"
        moTa="Chụp hiện trạng khi vừa tới nơi, trước khi sửa."
        loai="TRUOC"
        phieuViecId={phieuViec.id}
        trangThai={phieuViec.trang_thai}
        danhSachAnh={anhTruoc}
      />
      <KhuAnh
        tieuDe="Ảnh sau khi làm"
        moTa="Chụp kết quả sau khi sửa xong."
        loai="SAU"
        phieuViecId={phieuViec.id}
        trangThai={phieuViec.trang_thai}
        danhSachAnh={anhSau}
      />
    </div>
  );
}

function KhuAnh({
  tieuDe,
  moTa,
  loai,
  phieuViecId,
  trangThai,
  danhSachAnh,
}: {
  tieuDe: string;
  moTa: string;
  loai: "TRUOC" | "SAU";
  phieuViecId: number;
  trangThai: string;
  danhSachAnh: Anh[];
}) {
  const taiAnhVoiId = taiAnhPhieuViec.bind(null, phieuViecId, loai);
  const [state, formAction, dangTai] = useActionState(
    taiAnhVoiId,
    TRANG_THAI_BAN_DAU,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // null = đang trong bước được phép chụp; chuỗi = lý do đang khóa
  const lyDoKhoa = lyDoKhongChupAnh(loai, trangThai);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{tieuDe}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-[var(--color-text-muted)]">{moTa}</p>

        <div className="mb-3 flex flex-wrap gap-3">
          {danhSachAnh.map((a) => (
            <AnhThuNho key={a.id} anh={a} tieuDe={tieuDe} choXoa={!lyDoKhoa} />
          ))}
          {danhSachAnh.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Chưa có ảnh.
            </p>
          )}
        </div>

        {lyDoKhoa ? (
          <p className="text-sm text-[var(--color-text-muted)]">{lyDoKhoa}</p>
        ) : (
          <form ref={formRef} action={formAction}>
            {/* Chọn ảnh xong là tải lên luôn, không còn nút "Tải lên" để quên bấm */}
            <input
              type="file"
              name="anh"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(e) => {
                if (e.target.files?.length) formRef.current?.requestSubmit();
              }}
              className="w-full min-w-0 text-sm text-[var(--color-text-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary-soft)] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[var(--color-primary)]"
            />
            {dangTai && (
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Đang tải ảnh lên...
              </p>
            )}
          </form>
        )}
        {state.error && (
          <p className="mt-2 text-sm text-[var(--color-danger)]">
            {state.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AnhThuNho({
  anh,
  tieuDe,
  choXoa,
}: {
  anh: Anh;
  tieuDe: string;
  choXoa: boolean;
}) {
  const xoaVoiId = xoaAnhPhieuViec.bind(null, anh.id);
  const [state, formAction, dangXoa] = useActionState(
    xoaVoiId,
    TRANG_THAI_BAN_DAU,
  );

  return (
    <div className="w-24">
      <div className="relative h-24 w-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={anh.url}
          alt={tieuDe}
          className="h-24 w-24 rounded-xl border border-[var(--color-border)] object-cover"
        />
        {choXoa && (
          <form
            action={formAction}
            onSubmit={(e) => {
              if (!window.confirm("Xóa ảnh này?")) e.preventDefault();
            }}
            className="absolute right-1 top-1"
          >
            <button
              type="submit"
              disabled={dangXoa}
              aria-label="Xóa ảnh"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </form>
        )}
      </div>
      {state.error && (
        <p className="mt-1 break-words text-xs text-[var(--color-danger)]">
          {state.error}
        </p>
      )}
    </div>
  );
}
