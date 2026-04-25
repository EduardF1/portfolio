import Image from "next/image";

export type Photo = {
  src: string;
  alt: string;
};

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {photos.map((photo, i) => (
        <div
          key={`${photo.src}-${i}`}
          className="relative aspect-square overflow-hidden rounded-lg bg-surface"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
