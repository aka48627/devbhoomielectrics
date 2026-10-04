import ShopApp from "@/components/ShopApp";
import { ShopProvider } from "@/lib/shop";

export default function Home() {
  return (
    <ShopProvider>
      <ShopApp />
    </ShopProvider>
  );
}
