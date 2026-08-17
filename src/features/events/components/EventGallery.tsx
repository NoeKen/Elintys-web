'use client';

import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { publicEventCopy as copy } from '@/features/events/i18n/public-event.copy';
import { cn } from '@/shared/lib/utils';
import { getOptimizedMediaUrl } from '@/shared/lib/media';
import type { MediaImageSource } from '@/shared/types/media.types';

export function EventGallery({ images, title }: { images: MediaImageSource[]; title: string }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex == null ? undefined : images[selectedIndex];
  const move = (direction: -1 | 1) => {
    setSelectedIndex((current) => current == null
      ? current
      : (current + direction + images.length) % images.length);
  };

  return (
    <>
      <div className="public-event-gallery-grid">
        {images.slice(0, 6).map((image, index) => (
          <button
            key={`${getOptimizedMediaUrl(image, 'card')}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={cn('public-event-gallery-tile', index === 0 && 'public-event-gallery-featured')}
            aria-label={copy.openImage.replace('{index}', String(index + 1))}
          >
            <Image
              src={getOptimizedMediaUrl(image, 'card')}
              alt={`${title} — image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </button>
        ))}
      </div>

      <Dialog.Root open={selectedIndex != null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        {selected && (
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[70] bg-navy-dark/85 backdrop-blur-md" />
            <Dialog.Content
              className="fixed inset-0 z-[71] flex items-center justify-center p-4 focus:outline-none sm:p-8"
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') move(-1);
                if (event.key === 'ArrowRight') move(1);
              }}
            >
              <Dialog.Title className="sr-only">{copy.gallery}</Dialog.Title>
              <Dialog.Description className="sr-only">{copy.galleryHint}</Dialog.Description>
              <div className="relative h-[min(78dvh,760px)] w-[min(92vw,1180px)] overflow-hidden rounded-3xl bg-navy-dark shadow-2xl">
                <Image
                  src={getOptimizedMediaUrl(selected, 'cover')}
                  alt={`${title} — image ${(selectedIndex ?? 0) + 1}`}
                  fill
                  className="object-contain"
                  sizes="92vw"
                  priority
                />
              </div>
              {images.length > 1 && (
                <>
                  <button type="button" onClick={() => move(-1)} className="public-event-lightbox-control left-5 sm:left-8" aria-label="Image précédente">
                    <ChevronLeft aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => move(1)} className="public-event-lightbox-control right-5 sm:right-8" aria-label="Image suivante">
                    <ChevronRight aria-hidden="true" />
                  </button>
                </>
              )}
              <Dialog.Close asChild>
                <button type="button" className="public-event-lightbox-close" aria-label="Fermer la galerie">
                  <X aria-hidden="true" />
                </button>
              </Dialog.Close>
              <p className="fixed bottom-6 left-1/2 z-[72] -translate-x-1/2 rounded-full bg-navy-dark/80 px-4 py-2 text-sm font-bold text-white" aria-live="polite">
                {(selectedIndex ?? 0) + 1} / {images.length}
              </p>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </>
  );
}
