"use server";

import { prisma } from "@/lib/prisma";
import { chuanHoaSdt, LOI_SDT } from "@/lib/chuan-hoa-sdt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Kiểm tra người gọi là ADMIN (middleware chỉ chặn route, không chặn gọi trực tiếp Server Action)
async function laAdmin() {
  const session = await auth();
  return (session?.user as { vai_tro?: string } | undefined)?.vai_tro === "ADMIN";
}

const LOI_KHONG_CO_QUYEN = "Bạn không có quyền thực hiện thao tác này.";

export type TrangThaiKhachHang = {
  loi?: string;
  // Giữ lại giá trị người dùng đã nhập (form tự xóa sau mỗi lần gửi)
  giaTri?: { ten: string; sdt: string; dia_chi: string };
};

export async function taoKhachHang(
  _truocDo: TrangThaiKhachHang,
  formData: FormData
): Promise<TrangThaiKhachHang> {
  if (!(await laAdmin())) return { loi: LOI_KHONG_CO_QUYEN };
  const giaTri = {
    ten: formData.get("ten") as string,
    sdt: formData.get("sdt") as string,
    dia_chi: formData.get("dia_chi") as string,
  };

  const sdt = chuanHoaSdt(giaTri.sdt);
  if (!sdt) return { loi: LOI_SDT, giaTri };

  await prisma.khachHang.create({ data: { ...giaTri, sdt } });

  revalidatePath("/admin/khach-hang");
  redirect("/admin/khach-hang");
}

export async function capNhatKhachHang(
  id: number,
  _truocDo: TrangThaiKhachHang,
  formData: FormData
): Promise<TrangThaiKhachHang> {
  if (!(await laAdmin())) return { loi: LOI_KHONG_CO_QUYEN };
  const giaTri = {
    ten: formData.get("ten") as string,
    sdt: formData.get("sdt") as string,
    dia_chi: formData.get("dia_chi") as string,
  };

  const sdt = chuanHoaSdt(giaTri.sdt);
  if (!sdt) return { loi: LOI_SDT, giaTri };

  await prisma.khachHang.update({
    where: { id },
    data: { ...giaTri, sdt },
  });

  revalidatePath("/admin/khach-hang");
  redirect("/admin/khach-hang");
}

export async function ngungHoatDongKhachHang(id: number) {
  if (!(await laAdmin())) throw new Error(LOI_KHONG_CO_QUYEN);
  await prisma.khachHang.update({
    where: { id },
    data: { dang_hoat_dong: false },
  });

  revalidatePath("/admin/khach-hang");
  redirect("/admin/khach-hang");
}
