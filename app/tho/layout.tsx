import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DangXuatButton from "@/components/DangXuatButton";
import ThoDieuHuong from "@/components/tho/ThoDieuHuong";

export default async function ThoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const vaiTro = (session?.user as { vai_tro?: string })?.vai_tro;

  if (!session) {
    redirect("/login");
  }
  if (vaiTro !== "THO") {
    redirect("/");
  }

  return (
    <div className="flex h-dvh flex-col bg-[var(--color-surface)]">
      <header className="flex items-center gap-6 bg-[linear-gradient(160deg,#145f9c,var(--color-primary-hover))] px-4 py-3 sm:px-6">
        <span className="font-semibold text-white">Trang thợ</span>

        {/* Laptop: tab nằm trên header */}
        <div className="flex-1">
          <ThoDieuHuong kieu="header" />
        </div>

        {/* Laptop: đăng xuất ở header. Điện thoại: nút này nằm trong trang Hồ sơ */}
        <div className="hidden sm:block">
          <DangXuatButton nenToi />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

      {/* Điện thoại: thanh tab dưới đáy (nằm trong luồng flex nên không che nội dung) */}
      <ThoDieuHuong kieu="day" />
    </div>
  );
}
