import { useEffect, useState, type ImgHTMLAttributes } from 'react';

type GameArtworkProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'decoding' | 'height' | 'loading' | 'srcSet' | 'width'> & {
  src: string;
  eager?: boolean;
  sizes?: string;
};

function responsiveVariant(src: string, width: 360 | 600): string {
  return src.endsWith('.webp') ? `${src.slice(0, -5)}-${width}w.webp` : src;
}

function primaryArtwork(src: string): string {
  return src.endsWith('/ships/base/rustlight-tug.webp') ? '/ships/base/rustlight-tug.svg' : src;
}

function fallbackArtwork(src: string): string | null {
  return src.endsWith('/ships/base/rustlight-tug.webp') ? '/ships/base/rustlight-tug.svg' : null;
}

export function GameArtwork({
  src,
  alt,
  eager = false,
  sizes = '(max-width: 760px) 92vw, 38rem',
  onError,
  ...props
}: GameArtworkProps) {
  const [resolvedSrc, setResolvedSrc] = useState(() => primaryArtwork(src));
  useEffect(() => setResolvedSrc(primaryArtwork(src)), [src]);
  const fallback = fallbackArtwork(src);
  const srcSet = resolvedSrc.endsWith('.webp')
    ? `${responsiveVariant(resolvedSrc, 360)} 360w, ${responsiveVariant(resolvedSrc, 600)} 600w, ${resolvedSrc} 1200w`
    : undefined;

  return (
    <img
      {...props}
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={sizes}
      width={1200}
      height={675}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      onError={event => {
        onError?.(event);
        if (fallback && resolvedSrc !== fallback) setResolvedSrc(fallback);
      }}
    />
  );
}
