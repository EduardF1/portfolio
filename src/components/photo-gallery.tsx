import Image from "next/image";
import { responsiveGridColsClass } from "@/lib/grid-cols";

export type Photo = {
  src: string;
  alt: string;
};

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  if (!photos || photos.length === 0) return null;

  // Collapse the grid when the gallery has fewer photos than the
  // ideal max — a 1- or 2-photo trip should not render with empty
  // columns at sm:/lg: breakpoints.
  return (
    <div className={`grid ${responsiveGridColsClass(photos.length, 3)} gap-3`}>
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
