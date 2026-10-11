import { useEffect, useRef, useState, type VideoHTMLAttributes } from "react";
import { useResolvedVideoSrc } from "@/lib/video-source";

/** فيديو لا يُحمَّل إلا عند ظهوره على الشاشة، ويتوقف عند الخروج منها لتفريغ الإنترنت للفيديو التالي. */
export function LazyVideo({ src, poster, className, ...rest }: { src: string } & Omit<VideoHTMLAttributes<HTMLVideoElement>, "src">) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const resolved = useResolvedVideoSrc(visible ? src : "");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true);
          void el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={resolved || undefined}
      poster={poster}
      muted
      loop
      playsInline
      preload={visible ? "auto" : "none"}
      onCanPlay={(e) => {
        setReady(true);
        void e.currentTarget.play().catch(() => {});
      }}
      className={`${className ?? ""} transition-opacity duration-500 ${ready || poster ? "opacity-100" : "opacity-0"}`}
      {...rest}
    />
  );
}
