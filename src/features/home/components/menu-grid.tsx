import Image from "next/image";
import Link from "next/link";

type MenuItem = {
  label: string;
  icon: string;
  href?: string;
};

const items: MenuItem[] = [
  { label: "収穫登録", icon: "harvest", href: "/harvest/new" },
  { label: "選果登録", icon: "sorting", href: "/sorting/new" },
  { label: "追熟開始", icon: "ripening", href: "/ripening/new" },
  { label: "在庫確認", icon: "cold" },
  { label: "出荷処理", icon: "shipping" },
  { label: "納品書作成", icon: "orders" },
];

const cardClass =
  "flex aspect-[13/12] flex-col items-center justify-center gap-[5%] rounded-[20px] bg-white shadow-[0_8px_22px_-10px_rgba(55,75,35,0.14)] transition active:scale-[0.98]";

function CardContent({ item }: { item: MenuItem }) {
  return (
    <>
      <span className="relative aspect-square w-[41%]">
        <Image
          src={`/assets/icons/watercolor/${item.icon}-256.png`}
          alt=""
          fill
          sizes="(max-width: 440px) 22vw, 96px"
          className="object-contain"
        />
      </span>
      <span className="text-[clamp(0.85rem,4cqw,1rem)] font-bold text-kiwi-ink">
        {item.label}
      </span>
    </>
  );
}

export function MenuGrid() {
  return (
    <nav className="grid grid-cols-2 gap-x-2.5 gap-y-4 px-[7%]">
      {items.map((item) =>
        item.href ? (
          <Link key={item.label} href={item.href} className={cardClass}>
            <CardContent item={item} />
          </Link>
        ) : (
          <button
            key={item.label}
            type="button"
            disabled
            className={`${cardClass} opacity-80`}
          >
            <CardContent item={item} />
          </button>
        ),
      )}
    </nav>
  );
}
