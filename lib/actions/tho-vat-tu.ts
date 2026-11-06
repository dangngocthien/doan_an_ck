"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { KetQuaHanhDong } from "@/lib/actions/tho-phieu-viec";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";
import * as vatTuSuDungService from "@/lib/services/vat-tu-su-dung";

// Lớp mỏng cho giao diện web: kiểm tra THO, đọc FormData, gọi service, đổi LoiNghiepVu thành { error }.
// Logic nghiệp vụ nằm ở lib/services/vat-tu-su-dung.ts (dùng chung với API).

export async function ghiVatTuPhieuViec(
  phieuViecId: number,
  _prev: KetQuaHanhDong,
  formData: FormData,
): Promise<KetQuaHanhDong> {
  const session = await auth();
  const user = session?.user as { id?: string; vai_tro?: string } | undefined;
  if (user?.vai_tro !== "THO") return { error: "Không có quyền thực hiện." };
  const thoId = Number(user.id);

  try {
    await vatTuSuDungService.ghiVatTu(
      thoId,
      phieuViecId,
      Number(formData.get("vat_tu_id")),
      Number(formData.get("so_luong")),
    );
  } catch (e) {
    if (e instanceof LoiNghiepVu) return { error: e.message };
    throw e;
  }

  revalidatePath(`/tho/phieu-viec/${phieuViecId}`);
  revalidatePath("/admin/vat-tu");
  return {};
}

// Thợ xác nhận (hoặc bỏ xác nhận) "ca này không dùng vật tư"
export async function datKhongDungVatTu(
  phieuViecId: number,
  giaTri: boolean,
  _prev: KetQuaHanhDong,
  _formData: FormData,
): Promise<KetQuaHanhDong> {
  const session = await auth();
  const user = session?.user as { id?: string; vai_tro?: string } | undefined;
  if (user?.vai_tro !== "THO") return { error: "Không có quyền thực hiện." };
  const thoId = Number(user.id);

  try {
    await vatTuSuDungService.datKhongDungVatTu(thoId, phieuViecId, giaTri);
  } catch (e) {
    if (e instanceof LoiNghiepVu) return { error: e.message };
    throw e;
  }

  revalidatePath(`/tho/phieu-viec/${phieuViecId}`);
  return {};
}

// Thợ xóa 1 dòng vật tư ghi nhầm (kho tự cộng lại)
export async function xoaVatTuSuDung(
  phieuViecId: number,
  dongId: number,
): Promise<KetQuaHanhDong> {
  const session = await auth();
  const user = session?.user as { id?: string; vai_tro?: string } | undefined;
  if (user?.vai_tro !== "THO") return { error: "Không có quyền thực hiện." };
  const thoId = Number(user.id);

  try {
    await vatTuSuDungService.xoaVatTuSuDung(thoId, phieuViecId, dongId);
  } catch (e) {
    if (e instanceof LoiNghiepVu) return { error: e.message };
    throw e;
  }

  revalidatePath(`/tho/phieu-viec/${phieuViecId}`);
  revalidatePath("/admin/vat-tu");
  return {};
}
