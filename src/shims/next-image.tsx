/**
 * `next/image` shim — renders a plain <img>.
 *
 * Loses Next's automatic optimization but preserves the prop names the
 * codebase already uses (src/alt/width/height/className/style/priority).
 */

import { forwardRef, type ImgHTMLAttributes } from "react";

type StaticImageData = {
  src: string;
  height?: number;
  width?: number;
  blurDataURL?: string;
};

type Src = string | StaticImageData;

export interface NextImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "loading"> {
  src: Src;
  alt: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  loader?: (config: { src: string; width: number; quality?: number }) => string;
  unoptimized?: boolean;
  loading?: "lazy" | "eager";
}

function srcToString(src: Src): string {
  if (typeof src === "string") return src;
  return src.src;
}

const Image = forwardRef<HTMLImageElement, NextImageProps>(function NextImage(
  {
    src,
    alt,
    width,
    height,
    priority,
    fill,
    sizes: _sizes,
    quality: _quality,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    loader: _loader,
    unoptimized: _unoptimized,
    loading,
    style,
    ...rest
  },
  ref,
) {
  const fillStyle = fill
    ? {
        position: "absolute" as const,
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: style?.objectFit ?? "cover",
      }
    : null;
  return (
    <img
      ref={ref}
      src={srcToString(src)}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding="async"
      style={{ ...fillStyle, ...style }}
      {...rest}
    />
  );
});

export default Image;
export type { StaticImageData };
