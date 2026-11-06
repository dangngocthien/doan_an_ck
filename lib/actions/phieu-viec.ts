"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";
import * as phieuViecService from "@/lib/services/phieu-viec";

// Kiểm tra người gọi là ADMIN (middleware chỉ chặn route, không chặn gọi trực tiếp Server Action)
async function laAdmin() {
  const session = await auth();
  return (
    (session?.user as { vai_tro?: string } | undefined)?.vai_tro === "ADMIN"
  );
}

const LOI_KHONG_CO_QUYEN = "Bạn không có quyền thực hiện thao tác này.";

export type TrangThaiFormPhieuViec = { error?: string };

export async function taoPhieuViec(
  _prevState: TrangThaiFormPhieuViec,
  formData: FormData,
): Promise<TrangThaiFormPhieuViec> {
  if (!(await laAdmin())) return { error: LOI_KHONG_CO_QUYEN };

  try {
    await phieuViecService.taoPhieuViec({
      che_do_khach: formData.get("che_do_khach"),
      khach_hang_id: formData.get("khach_hang_id"),
      khach_ten: formData.get("khach_ten"),
      khach_sdt: formData.get("khach_sdt"),
      khach_dia_chi: formData.get("khach_dia_chi"),
      loai_su_co: formData.get("loai_su_co"),
      muc_do_uu_tien: formData.get("muc_do_uu_tien"),
      dia_chi: formData.get("dia_chi"),
      ghi_chu: formData.get("ghi_chu"),
      tho_id: formData.get("tho_id"),
      vi_do: formData.get("vi_do"),
      kinh_do: formData.get("kinh_do"),
    });
  } catch (loi) {
    if (loi instanceof LoiNghiepVu) return { error: loi.message };
    throw loi;
  }

  revalidatePath("/admin/phieu-viec");
  redirect("/admin/phieu-viec"); // ngoài try/catch vì redirect hoạt động bằng cách ném lỗi
}

export async function capNhatPhieuViec(
  id: number,
  _prevState: TrangThaiFormPhieuViec,
  formData: FormData,
): Promise<TrangThaiFormPhieuViec> {
  if (!(await laAdmin())) return { error: LOI_KHONG_CO_QUYEN };

  try {
    await phieuViecService.capNhatPhieuViec(id, {
      muc_do_uu_tien: formData.get("muc_do_uu_tien"),
      trang_thai: formData.get("trang_thai"),
      dia_chi: formData.get("dia_chi"),
      ghi_chu: formData.get("ghi_chu"),
      tho_id: formData.get("tho_id"),
    });
  } catch (loi) {
    if (loi instanceof LoiNghiepVu) return { error: loi.message };
    throw loi;
  }

  revalidatePath("/admin/phieu-viec");
  redirect("/admin/phieu-viec");
}

// Hủy phiếu: nút ở danh sách, không có chỗ hiện lỗi nên giữ hành vi cũ:
// phiếu không hủy được nữa (vừa Hoàn thành/đã hủy ở nơi khác) thì chỉ làm mới danh sách để nút biến mất.
export async function huyPhieuViec(id: number): Promise<void> {
  if (!(await laAdmin())) throw new Error(LOI_KHONG_CO_QUYEN);

  try {
    await phieuViecService.huyPhieuViec(id);
  } catch (loi) {
    if (!(loi instanceof LoiNghiepVu)) throw loi;
  }

  revalidatePath("/admin/phieu-viec");
  revalidatePath("/admin/bao-cao");
}
