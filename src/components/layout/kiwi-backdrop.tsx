import Image from "next/image";

const DECOR = [
  {
    src: "/assets/decor/png/watercolor-green-wash.png",
    w: 1024,
    h: 640,
    className: "left-0 top-0 w-[58%] -translate-x-[18%] -translate-y-[12%]",
  },
  {
    src: "/assets/decor/png/watercolor-yellow-seeds.png",
    w: 1024,
    h: 640,
    className: "right-0 top-0 w-[64%] translate-x-[16%] -translate-y-[10%]",
  },
  {
    src: "/assets/decor/png/watercolor-kiwi-cluster-left.png",
    w: 1024,
    h: 768,
    className: "left-0 bottom-0 w-[66%] -translate-x-[20%] translate-y-[14%]",
  },
  {
    src: "/assets/decor/png/watercolor-kiwi-cluster-right.png",
    w: 1024,
    h: 768,
    className: "right-0 bottom-0 w-[56%] translate-x-[16%] translate-y-[12%]",
  },
] as const;

/**
 * Fixed, scroll-safe page background: a solid kiwi-cream fill plus watercolor
 * kiwi decor pinned to the corners of the content column. Because it is
 * `fixed`, the decor stays put while the page scrolls — it reads as a
 * persistent frame instead of a wallpaper that runs out below the fold.
 *
 * Rendered once per surface (in the route-group layout), behind everything.
 */
export function KiwiBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-kiwi-cream"
    >
      <div className="relative mx-auto h-full w-full max-w-[460px]">
        {DECOR.map((d) => (
          <Image
            key={d.src}
            src={d.src}
            alt=""
            width={d.w}
            height={d.h}
            priority
            sizes="460px"
            className={`absolute h-auto select-none ${d.className}`}
          />
        ))}
      </div>
    </div>
  );
}
