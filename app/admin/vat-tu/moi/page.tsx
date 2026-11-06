import { taoVatTu } from "@/lib/actions/vat-tu";
import VatTuForm from "../VatTuForm";

export default function ThemVatTuPage() {
  return <VatTuForm tieuDe="Thêm vật tư" action={taoVatTu} />;
}
