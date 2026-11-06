import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  const vaiTro = (session.user as { vai_tro?: string } | undefined)?.vai_tro;
  redirect(vaiTro === "ADMIN" ? "/admin/phieu-viec" : "/tho/phieu-viec");
}
