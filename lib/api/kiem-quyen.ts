import { auth } from "@/auth";
import { LoiNghiepVu } from "@/lib/services/loi-nghiep-vu";

// middleware.ts chỉ chặn /admin và /tho, KHÔNG chặn /api,
// nên MỖI route /api/v1 phải tự gọi hàm này ở đầu.
// Không đăng nhập => 401, sai vai trò => 403 (JSON, không redirect).

export type VaiTro = "ADMIN" | "THO";

export type NguoiDungDangNhap = {
  id: number;
  ten: string | null;
  email: string | null;
  vai_tro: VaiTro;
};

// vaiTroChoPhep bỏ trống = chỉ cần đã đăng nhập.
export async function yeuCauDangNhap(
  vaiTroChoPhep?: VaiTro[],
): Promise<NguoiDungDangNhap> {
  const session = await auth();
  const user = session?.user as
    | {
        id?: string;
        name?: string | null;
        email?: string | null;
        vai_tro?: string;
      }
    | undefined;

  const id = Number(user?.id);
  if (
    !user ||
    !Number.isInteger(id) ||
    id <= 0 ||
    (user.vai_tro !== "ADMIN" && user.vai_tro !== "THO")
  )
    throw new LoiNghiepVu("Bạn chưa đăng nhập.", 401);

  if (vaiTroChoPhep && !vaiTroChoPhep.includes(user.vai_tro))
    throw new LoiNghiepVu("Bạn không có quyền thực hiện thao tác này.", 403);

  return {
    id,
    ten: user.name ?? null,
    email: user.email ?? null,
    vai_tro: user.vai_tro,
  };
}
