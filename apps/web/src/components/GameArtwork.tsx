import type { ImgHTMLAttributes } from 'react';

type GameArtworkProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'decoding' | 'height' | 'loading' | 'srcSet' | 'width'> & {
  src: string;
  eager?: boolean;
  sizes?: string;
};

function responsiveVariant(src: string, width: 360 | 600): string {
  return src.endsWith('.webp') ? `${src.slice(0, -5)}-${width}w.webp` : src;
}

export function GameArtwork({
  src,
  alt,
  eager = false,
  sizes = '(max-width: 760px) 92vw, 38rem',
  ...props
}: GameArtworkProps) {
  return (
    <img
      {...props}
      src={src}
      srcSet={`${responsiveVariant(src, 360)} 360w, ${responsiveVariant(src, 600)} 600w, ${src} 1200w`}
      sizes={sizes}
      width={1200}
      height={675}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
    />
  );
}
