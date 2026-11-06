"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KetQuaHanhDong } from "@/lib/actions/tho-phieu-viec";

type GiaTri = {
  ten: string;
  don_vi: string;
  so_luong_ton: number;
  gia: number;
};

const TRONG: GiaTri = { ten: "", don_vi: "", so_luong_ton: 0, gia: 0 };
const TRANG_THAI_BAN_DAU: KetQuaHanhDong = {};

export default function VatTuForm({
  tieuDe,
  action,
  giaTri = TRONG,
  tonLucMo,
}: {
  tieuDe: string;
  action: (prev: KetQuaHanhDong, formData: FormData) => Promise<KetQuaHanhDong>;
  giaTri?: GiaTri;
  // Chỉ truyền ở trang SỬA: số tồn lúc mở form, server dùng để phát hiện tồn đã bị đổi.
  tonLucMo?: number;
}) {
  const [state, formAction, dangGui] = useActionState(
    action,
    TRANG_THAI_BAN_DAU,
  );

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>{tieuDe}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {tonLucMo !== undefined && (
            <input type="hidden" name="ton_luc_mo" value={tonLucMo} />
          )}

          <div className="space-y-1">
            <Label htmlFor="ten">Tên vật tư</Label>
            <Input
              id="ten"
              name="ten"
              defaultValue={giaTri.ten}
              required
              className="bg-white text-gray-900"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="don_vi">Đơn vị</Label>
            <Input
              id="don_vi"
              name="don_vi"
              defaultValue={giaTri.don_vi}
              placeholder="cái, mét, cuộn..."
              required
              className="bg-white text-gray-900"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="so_luong_ton">Số lượng tồn kho</Label>
            <Input
              id="so_luong_ton"
              name="so_luong_ton"
              type="number"
              min={0}
              step={1}
              defaultValue={giaTri.so_luong_ton}
              required
              className="bg-white text-gray-900"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="gia">Giá (đồng / đơn vị)</Label>
            <Input
              id="gia"
              name="gia"
              type="number"
              min={0}
              step={1}
              defaultValue={giaTri.gia}
              required
              className="bg-white text-gray-900"
            />
          </div>

          {state.error && (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={dangGui}>
              {dangGui ? "Đang lưu..." : "Lưu"}
            </Button>
            <Link
              href="/admin/vat-tu"
              className={buttonVariants({ variant: "outline" })}
            >
              Hủy
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
