"use client";

import { useActionState } from "react";
import type { TrangThaiKhachHang } from "@/lib/actions/khach-hang";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  action: (
    truocDo: TrangThaiKhachHang,
    formData: FormData
  ) => Promise<TrangThaiKhachHang>;
  giaTriBanDau?: { ten: string; sdt: string; dia_chi: string };
  nhanNut: string;
};

export default function KhachHangForm({ action, giaTriBanDau, nhanNut }: Props) {
  const [trangThai, formAction, dangGui] = useActionState<
    TrangThaiKhachHang,
    FormData
  >(action, {});

  // Sau khi gửi lỗi, ưu tiên giá trị vừa nhập thay vì giá trị ban đầu
  const giaTri = trangThai.giaTri ?? giaTriBanDau;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="ten">Tên</Label>
        <Input
          id="ten"
          name="ten"
          type="text"
          required
          defaultValue={giaTri?.ten}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="sdt">Số điện thoại</Label>
        <Input
          id="sdt"
          name="sdt"
          type="text"
          required
          pattern="0[35789][0-9]{8}"
          maxLength={10}
          title="Nhập đủ 10 số di động, đầu số 03, 05, 07, 08 hoặc 09"
          defaultValue={giaTri?.sdt}
          aria-invalid={trangThai.loi ? true : undefined}
          className="mt-1"
        />
        {trangThai.loi && (
          <p role="alert" className="mt-1 text-sm text-[var(--color-danger)]">
            {trangThai.loi}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="dia_chi">Địa chỉ</Label>
        <Input
          id="dia_chi"
          name="dia_chi"
          type="text"
          required
          defaultValue={giaTri?.dia_chi}
          className="mt-1"
        />
      </div>

      <Button type="submit" className="w-full" disabled={dangGui}>
        {nhanNut}
      </Button>
    </form>
  );
}
