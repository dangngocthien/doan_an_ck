"use client";

import { useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TrangThaiFormTho } from "@/lib/actions/tho";

type Tho = {
  id: number;
  ten: string;
  sdt: string;
  email: string;
  dia_chi: string | null;
  co_vi_tri: boolean;
};

export default function SuaThoForm({
  tho,
  capNhatAction,
  ngungHoatDongAction,
}: {
  tho: Tho;
  capNhatAction: (
    prevState: TrangThaiFormTho,
    formData: FormData,
  ) => Promise<TrangThaiFormTho>;
  ngungHoatDongAction: () => Promise<void>;
}) {
  const [state, formAction, dangXuLy] = useActionState(capNhatAction, {});

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Sửa thợ</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="ten">Tên</Label>
            <Input
              id="ten"
              name="ten"
              type="text"
              required
              defaultValue={tho.ten}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="sdt">Số điện thoại</Label>
            <Input
              id="sdt"
              name="sdt"
              type="tel"
              required
              pattern="0[35789][0-9]{8}"
              maxLength={10}
              title="Nhập đủ 10 số di động, đầu số 03, 05, 07, 08 hoặc 09"
              defaultValue={tho.sdt}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={tho.email}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="dia_chi">Địa chỉ nhà</Label>
            <Input
              id="dia_chi"
              name="dia_chi"
              type="text"
              maxLength={191}
              defaultValue={tho.dia_chi ?? ""}
              placeholder="VD: 25 Lê Thánh Tôn, Phường Bến Nghé, Quận 1"
              className="mt-1"
            />
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Dùng để gợi ý thợ gần khách. Hệ thống tự xác định vị trí khi lưu.
            </p>
            <p
              className={`mt-1 text-sm ${
                tho.co_vi_tri
                  ? "text-[var(--color-ok)]"
                  : "text-[var(--color-warn-text)]"
              }`}
            >
              {tho.co_vi_tri
                ? "Đã xác định được vị trí nhà."
                : "Chưa xác định được vị trí: thợ này sẽ xếp cuối khi gợi ý thợ gần."}
            </p>
          </div>

          {state.error && (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
          )}

          <Button type="submit" disabled={dangXuLy} className="w-full">
            {dangXuLy ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>

        <form action={ngungHoatDongAction} className="mt-4">
          <Button type="submit" variant="danger" size="sm">
            Ngừng hoạt động thợ này
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
