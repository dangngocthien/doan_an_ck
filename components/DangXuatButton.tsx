import { signOut } from "@/auth";

export default function DangXuatButton({
  nenToi = false,
}: {
  nenToi?: boolean;
}) {
  const kieu = nenToi
    ? "border-white/40 text-white hover:bg-white/10"
    : "border-gray-300 text-gray-700 hover:bg-gray-100";

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className={`rounded-md border px-3 py-1.5 text-sm ${kieu}`}
      >
        Đăng xuất
      </button>
    </form>
  );
}
