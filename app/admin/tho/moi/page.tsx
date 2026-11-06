"use client";

import { useActionState } from "react";
import { taoTho } from "@/lib/actions/tho";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ThemThoPage() {
  const [state, formAction, dangXuLy] = useActionState(taoTho, {});

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Thêm thợ</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="ten">Tên</Label>
            <Input id="ten" name="ten" type="text" required className="mt-1" />
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
              placeholder="VD: 25 Lê Thánh Tôn, Phường Bến Nghé, Quận 1"
              className="mt-1"
            />
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Dùng để gợi ý thợ gần khách. Có thể để trống, thêm sau ở trang sửa
              thợ.
            </p>
          </div>

          <div>
            <Label htmlFor="mat_khau">Mật khẩu</Label>
            <Input
              id="mat_khau"
              name="mat_khau"
              type="password"
              required
              minLength={6}
              className="mt-1"
            />
          </div>

          {state.error && (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
          )}

          <Button type="submit" disabled={dangXuLy} className="w-full">
            {dangXuLy ? "Đang lưu..." : "Lưu"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
