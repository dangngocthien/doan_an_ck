"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { lyDoKhongChupAnh } from "@/lib/anh-phieu-viec";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";
import * as trangThaiService from "@/lib/services/trang-thai-phieu-viec";

export type KetQuaHanhDong = { error?: string };

async function layIdThoDangDangNhap(): Promise<number | null> {
  const session = await auth();
  const vaiTro = (session?.user as { vai_tro?: string })?.vai_tro;
  const idRaw = (session?.user as { id?: string })?.id;
  if (vaiTro !== "THO" || !idRaw) return null;
  return Number(idRaw);
}

// Lớp mỏng: kiểm tra THO, gọi service, đổi LoiNghiepVu thành { error }.
// Logic (đúng 1 bước, chốt chặn ảnh/vật tư) nằm ở lib/services/trang-thai-phieu-viec.ts.
export async function chuyenTrangThaiTiepTheo(
  phieuViecId: number,
  _prevState: KetQuaHanhDong,
  _formData: FormData,
): Promise<KetQuaHanhDong> {
  const thoId = await layIdThoDangDangNhap();
  if (!thoId) {
    return { error: "Không xác định được thợ đang đăng nhập." };
  }

  try {
    await trangThaiService.chuyenTrangThaiTiepTheo(thoId, phieuViecId);
  } catch (e) {
    if (e instanceof LoiNghiepVu) return { error: e.message };
    throw e;
  }

  revalidatePath(`/tho/phieu-viec/${phieuViecId}`);
  revalidatePath("/tho/phieu-viec");
  return {};
}

const DINH_DANG_ANH_CHO_PHEP = ["image/jpeg", "image/png", "image/webp"];
const DUNG_LUONG_ANH_TOI_DA = 5 * 1024 * 1024; // 5MB

export async function taiAnhPhieuViec(
  phieuViecId: number,
  loai: "TRUOC" | "SAU",
  _prevState: KetQuaHanhDong,
  formData: FormData,
): Promise<KetQuaHanhDong> {
  const thoId = await layIdThoDangDangNhap();
  if (!thoId) {
    return { error: "Không xác định được thợ đang đăng nhập." };
  }

  const phieu = await prisma.phieuViec.findUnique({
    where: { id: phieuViecId },
  });
  if (!phieu || phieu.tho_id !== thoId) {
    return { error: "Bạn không có quyền tải ảnh cho phiếu này." };
  }

  const lyDoKhoa = lyDoKhongChupAnh(loai, phieu.trang_thai);
  if (lyDoKhoa) {
    return { error: lyDoKhoa };
  }

  const file = formData.get("anh") as File | null;
  if (!file || file.size === 0) {
    return { error: "Vui lòng chọn ảnh." };
  }
  if (!DINH_DANG_ANH_CHO_PHEP.includes(file.type)) {
    return { error: "Chỉ nhận ảnh định dạng JPG, PNG hoặc WebP." };
  }
  if (file.size > DUNG_LUONG_ANH_TOI_DA) {
    return { error: "Ảnh vượt quá 5MB." };
  }

  const duoiFile = file.name.split(".").pop() || "jpg";
  const tenFile = `${randomUUID()}.${duoiFile}`;
  const thuMucLuu = path.join(process.cwd(), "public", "uploads");
  await mkdir(thuMucLuu, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(thuMucLuu, tenFile), buffer);

  await prisma.anhPhieuViec.create({
    data: {
      phieu_viec_id: phieuViecId,
      loai,
      url: `/uploads/${tenFile}`,
    },
  });

  revalidatePath(`/tho/phieu-viec/${phieuViecId}`);
  return {};
}

export async function xoaAnhPhieuViec(
  anhId: number,
  _prevState: KetQuaHanhDong,
  _formData: FormData,
): Promise<KetQuaHanhDong> {
  const thoId = await layIdThoDangDangNhap();
  if (!thoId) {
    return { error: "Không xác định được thợ đang đăng nhập." };
  }

  const anh = await prisma.anhPhieuViec.findUnique({
    where: { id: anhId },
    include: { phieu_viec: true },
  });
  if (!anh || anh.phieu_viec.tho_id !== thoId) {
    return { error: "Bạn không có quyền xóa ảnh này." };
  }

  const lyDoKhoa = lyDoKhongChupAnh(anh.loai, anh.phieu_viec.trang_thai);
  if (lyDoKhoa) {
    return { error: lyDoKhoa };
  }

  await prisma.anhPhieuViec.delete({ where: { id: anhId } });

  // Xóa luôn file trong public/uploads. basename để không thể thoát ra ngoài thư mục;
  // nếu file đã mất thì bỏ qua (bản ghi DB đã xóa xong).
  const tenFile = path.basename(anh.url);
  await unlink(path.join(process.cwd(), "public", "uploads", tenFile)).catch(
    () => {},
  );

  revalidatePath(`/tho/phieu-viec/${anh.phieu_viec_id}`);
  return {};
}
