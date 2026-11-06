"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";
import * as hoaDonService from "@/lib/services/hoa-don";

export type TrangThaiFormHoaDon = { error?: string; thanhCong?: boolean };

// Lớp mỏng cho giao diện web: kiểm tra ADMIN, đọc FormData, gọi service, đổi LoiNghiepVu thành { error }.
// Logic nghiệp vụ nằm ở lib/services/hoa-don.ts (dùng chung với API).

async function laAdmin() {
  const session = await auth();
  const nguoiDung = session?.user as { vai_tro?: string } | undefined;
  return nguoiDung?.vai_tro === "ADMIN";
}

export async function lapHoaDon(
  phieuViecId: number,
  _prevState: TrangThaiFormHoaDon,
  formData: FormData,
): Promise<TrangThaiFormHoaDon> {
  if (!(await laAdmin())) {
    return { error: "Bạn không có quyền thực hiện thao tác này." };
  }

  let hoaDonId: number;
  try {
    hoaDonId = await hoaDonService.lapHoaDon(
      phieuViecId,
      formData.get("tien_cong"),
    );
  } catch (e) {
    if (e instanceof LoiNghiepVu) return { error: e.message };
    throw e;
  }

  // redirect() ném lỗi để chuyển trang nên phải đặt NGOÀI try/catch
  revalidatePath("/admin/hoa-don");
  redirect(`/admin/hoa-don/${hoaDonId}`);
}

export async function doiTrangThaiThanhToan(
  id: number,
  trangThai: "DA_THU" | "CON_NO",
): Promise<void> {
  if (!(await laAdmin())) throw new Error("Không có quyền.");

  await hoaDonService.doiTrangThaiThanhToan(id, trangThai);

  revalidatePath("/admin/hoa-don");
  revalidatePath(`/admin/hoa-don/${id}`);
}

export async function capNhatTienCong(
  hoaDonId: number,
  _prevState: TrangThaiFormHoaDon,
  formData: FormData,
): Promise<TrangThaiFormHoaDon> {
  if (!(await laAdmin())) {
    return { error: "Bạn không có quyền thực hiện thao tác này." };
  }

  try {
    await hoaDonService.capNhatTienCong(hoaDonId, formData.get("tien_cong"));
  } catch (e) {
    if (e instanceof LoiNghiepVu) return { error: e.message };
    throw e;
  }

  revalidatePath("/admin/hoa-don");
  revalidatePath(`/admin/hoa-don/${hoaDonId}`);
  revalidatePath("/admin/bao-cao");
  return { thanhCong: true };
}
