type EventFeaturedImageProps = {
  name: string;
  alt?: string | null;
  smUrl?: string | null;
  mdUrl?: string | null;
  lgUrl?: string | null;
  className?: string;
  sizes?: string;
};

export function EventFeaturedImage({
  name,
  alt,
  smUrl,
  mdUrl,
  lgUrl,
  className,
  sizes = "(max-width: 768px) 100vw, 720px"
}: EventFeaturedImageProps) {
  const src = mdUrl || lgUrl || smUrl;
  if (!src) return null;

  const srcSet = [
    smUrl ? `${smUrl} 480w` : null,
    mdUrl ? `${mdUrl} 768w` : null,
    lgUrl ? `${lgUrl} 1280w` : null
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <picture>
      {srcSet && <source type="image/webp" srcSet={srcSet} sizes={sizes} />}
      <img
        src={src}
        alt={alt?.trim() || `Imagen destacada del evento ${name}`}
        loading="lazy"
        className={className}
      />
    </picture>
  );
}
