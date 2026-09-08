'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Trash2, UploadCloud } from 'lucide-react';
import { eventsService } from '@/features/events/services/events.service';
import { eventMediaService } from '@/features/events/services/event-media.service';
import { getUserFacingError } from '@/shared/lib/user-facing-error';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';
import { Modal } from '@/shared/ui/Modal';
import { cn } from '@/shared/lib/utils';
import type { MediaImage, MediaImageSource } from '@/shared/types/media.types';
import type { EventMediaState } from '@/features/events/services/event-media.service';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

const COVER_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const GALLERY_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MEDIA_MAX_GALLERY_IMAGES = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveCoverUrl(coverImage: MediaImageSource): string {
  return typeof coverImage === 'string' ? coverImage : coverImage.url;
}

function validateFiles(
  files: File[],
  maxBytes: number,
): string | null {
  for (const file of files) {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return `Le fichier "${file.name}" n'est pas un format accepté (JPEG, PNG, WebP, AVIF).`;
    }
    if (file.size > maxBytes) {
      return `Le fichier "${file.name}" dépasse la taille maximale de ${Math.round(maxBytes / 1024 / 1024)} Mo.`;
    }
  }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ConfirmDeleteDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  isPending,
}: ConfirmDeleteDialogProps) {
  return (
    <Modal open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }} title={title} description={description}>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="premium-button-ghost min-h-[44px] rounded-full px-5 text-sm font-semibold disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="min-h-[44px] rounded-full bg-destructive px-5 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
        >
          {isPending ? 'Suppression…' : 'Supprimer'}
        </button>
      </div>
    </Modal>
  );
}

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  label: string;
  hint: string;
  isLoading?: boolean;
  className?: string;
}

function UploadZone({ onFilesSelected, multiple = false, label, hint, isLoading = false, className }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    onFilesSelected(Array.from(files));
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-event-outline-subtle/60 bg-event-surface/40 p-10 text-center transition-colors',
        isDragOver && 'border-event-teal bg-teal-pale/30',
        isLoading && 'pointer-events-none opacity-60',
        className,
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-event-surface text-event-teal">
        <UploadCloud size={26} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-event-petrol">{label}</p>
        <p className="mt-1 text-xs text-event-muted">{hint}</p>
      </div>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
        className="premium-button min-h-[44px] px-6 text-sm disabled:opacity-50"
      >
        {isLoading ? 'Téléversement…' : 'Parcourir'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        multiple={multiple}
        className="sr-only"
        aria-label={label}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EventMediasPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Hidden file input refs
  const coverReplaceRef = useRef<HTMLInputElement>(null);
  const galleryAddRef = useRef<HTMLInputElement>(null);

  // Validation error messages
  const [coverValidationError, setCoverValidationError] = useState<string | null>(null);
  const [galleryValidationError, setGalleryValidationError] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteCoverOpen, setDeleteCoverOpen] = useState(false);
  const [deleteGalleryPublicId, setDeleteGalleryPublicId] = useState<string | null>(null);

  // ── Event query ──────────────────────────────────────────────────────────
  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.get(id),
    staleTime: 30_000,
  });

  // ── Helpers to sync EventMediaState → event cache ────────────────────────
  function applyMediaState(updated: EventMediaState) {
    queryClient.setQueryData(['event', id], (prev: typeof event) => {
      if (!prev) return prev;
      return { ...prev, coverImage: updated.coverImage, gallery: updated.gallery };
    });
  }

  // ── Cover mutations ──────────────────────────────────────────────────────
  const uploadCover = useMutation({
    mutationFn: (file: File) => eventMediaService.uploadCover(id, file),
    onSuccess: (updated) => {
      applyMediaState(updated);
      setCoverValidationError(null);
    },
  });

  const deleteCover = useMutation({
    mutationFn: () => eventMediaService.deleteCover(id),
    onSuccess: (updated) => {
      applyMediaState(updated);
      setDeleteCoverOpen(false);
    },
  });

  // ── Gallery mutations ────────────────────────────────────────────────────
  const uploadGallery = useMutation({
    mutationFn: (files: File[]) => eventMediaService.uploadGallery(id, files),
    onSuccess: (updated) => {
      applyMediaState(updated);
      setGalleryValidationError(null);
      // Reset input so re-selecting same file triggers onChange
      if (galleryAddRef.current) galleryAddRef.current.value = '';
    },
  });

  const deleteGalleryImage = useMutation({
    mutationFn: (publicId: string) => eventMediaService.deleteGalleryImage(id, publicId),
    onSuccess: (updated) => {
      applyMediaState(updated);
      setDeleteGalleryPublicId(null);
    },
  });

  // ── File picker handlers ─────────────────────────────────────────────────
  function handleCoverFiles(files: File[]) {
    const [file] = files;
    if (!file) return;
    const error = validateFiles([file], COVER_MAX_BYTES);
    if (error) { setCoverValidationError(error); return; }
    setCoverValidationError(null);
    uploadCover.mutate(file);
  }

  function handleGalleryFiles(files: File[]) {
    const currentCount = event?.gallery?.length ?? 0;
    if (currentCount + files.length > MEDIA_MAX_GALLERY_IMAGES) {
      setGalleryValidationError(
        `Vous ne pouvez pas dépasser ${MEDIA_MAX_GALLERY_IMAGES} images dans la galerie. (${currentCount} / ${MEDIA_MAX_GALLERY_IMAGES} déjà ajoutées)`
      );
      return;
    }
    const error = validateFiles(files, GALLERY_MAX_BYTES);
    if (error) { setGalleryValidationError(error); return; }
    setGalleryValidationError(null);
    uploadGallery.mutate(files);
  }

  // ── Loading / error states ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 space-y-6" aria-busy="true">
        <div className="premium-skeleton h-56 rounded-3xl" />
        <div className="premium-skeleton h-96 rounded-3xl" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <section className="m-6 rounded-3xl bg-terracotta-pale/70 p-7 text-center shadow-event-soft">
        <ImageIcon className="mx-auto text-event-muted" size={32} aria-hidden="true" />
        <h1 className="mt-4 font-serif text-2xl text-event-petrol">Événement introuvable</h1>
        <p className="mt-2 text-sm text-event-muted">
          Impossible de charger les médias de cet événement.
        </p>
      </section>
    );
  }

  const coverImage = event.coverImage ?? null;
  const gallery: MediaImage[] = event.gallery ?? [];
  const galleryCount = gallery.length;
  const canAddGallery = galleryCount < MEDIA_MAX_GALLERY_IMAGES;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-event-teal">
          Contenu visuel
        </p>
        <h1 className="mt-1 font-serif text-[clamp(2rem,4vw,3rem)] leading-none text-event-petrol">
          Médias
        </h1>
        <p className="mt-2 text-sm text-event-muted">{event.title}</p>
      </header>

      {/* ── Section 1: Cover image ────────────────────────────────────── */}
      <section
        aria-labelledby="cover-heading"
        className="rounded-3xl bg-white p-6 shadow-event-soft"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="cover-heading" className="font-serif text-2xl text-event-petrol">
              Image de couverture
            </h2>
            <p className="mt-1 text-sm text-event-muted">
              Visible en tête de votre page événement publique.
            </p>
          </div>
          {coverImage && (
            <div className="flex shrink-0 gap-2">
              {/* Replace button */}
              <button
                type="button"
                onClick={() => coverReplaceRef.current?.click()}
                disabled={uploadCover.isPending}
                className="premium-button-secondary min-h-[44px] rounded-full px-4 text-sm font-semibold disabled:opacity-50"
              >
                {uploadCover.isPending ? 'Téléversement…' : 'Remplacer'}
              </button>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => setDeleteCoverOpen(true)}
                disabled={deleteCover.isPending}
                aria-label="Retirer l'image de couverture"
                className="min-h-[44px] rounded-full border border-destructive/30 bg-white px-4 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50 transition-colors"
              >
                Retirer
              </button>
              {/* Hidden replace input */}
              <input
                ref={coverReplaceRef}
                type="file"
                accept={ALLOWED_MIME_TYPES.join(',')}
                className="sr-only"
                aria-label="Remplacer l'image de couverture"
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  e.target.value = '';
                  handleCoverFiles(files);
                }}
              />
            </div>
          )}
        </div>

        <div className="mt-6">
          {coverImage ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-event-surface">
              <Image
                src={resolveCoverUrl(coverImage)}
                alt={`Image de couverture de ${event.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 960px"
                priority
              />
            </div>
          ) : (
            <UploadZone
              label="Glissez-déposez votre image de couverture ici"
              hint="JPEG, PNG, WebP ou AVIF — 10 Mo max"
              onFilesSelected={handleCoverFiles}
              isLoading={uploadCover.isPending}
            />
          )}
        </div>

        {/* Cover validation error */}
        {coverValidationError && (
          <FormErrorAlert error={coverValidationError} className="mt-4" />
        )}
        {/* Cover mutation error */}
        {uploadCover.isError && !coverValidationError && (
          <FormErrorAlert
            error={getUserFacingError(uploadCover.error, {
              fallback: "L'image de couverture n'a pas pu être téléversée. Vérifiez le format et réessayez.",
            })}
            className="mt-4"
          />
        )}
        {deleteCover.isError && (
          <FormErrorAlert
            error={getUserFacingError(deleteCover.error, {
              fallback: "Impossible de retirer l'image de couverture. Réessayez.",
            })}
            className="mt-4"
          />
        )}
      </section>

      {/* ── Section 2: Gallery ───────────────────────────────────────── */}
      <section
        aria-labelledby="gallery-heading"
        className="rounded-3xl bg-white p-6 shadow-event-soft"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="gallery-heading" className="font-serif text-2xl text-event-petrol">
              Galerie
            </h2>
            <p className="mt-1 text-sm text-event-muted">
              <span className="font-semibold text-event-petrol">{galleryCount}</span>
              <span className="text-event-outline"> / {MEDIA_MAX_GALLERY_IMAGES}</span>
              {' '}images
            </p>
          </div>
          {canAddGallery && (
            <>
              <button
                type="button"
                onClick={() => galleryAddRef.current?.click()}
                disabled={uploadGallery.isPending}
                className="premium-button min-h-[44px] rounded-full px-5 text-sm font-semibold disabled:opacity-50"
              >
                {uploadGallery.isPending ? 'Ajout en cours…' : 'Ajouter des photos'}
              </button>
              <input
                ref={galleryAddRef}
                type="file"
                accept={ALLOWED_MIME_TYPES.join(',')}
                multiple
                className="sr-only"
                aria-label="Ajouter des photos à la galerie"
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  e.target.value = '';
                  handleGalleryFiles(files);
                }}
              />
            </>
          )}
        </div>

        <div className="mt-6">
          {gallery.length === 0 ? (
            <UploadZone
              label="Ajoutez des photos qui racontent votre événement."
              hint="JPEG, PNG, WebP ou AVIF — 10 Mo max par image — jusqu'à 20 photos"
              onFilesSelected={handleGalleryFiles}
              multiple
              isLoading={uploadGallery.isPending}
            />
          ) : (
            <ul
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
              aria-label="Galerie d'images"
            >
              {gallery.map((image: MediaImage) => (
                <li key={image.publicId} className="group relative">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-event-surface">
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* Delete overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <button
                        type="button"
                        onClick={() => setDeleteGalleryPublicId(image.publicId)}
                        aria-label="Supprimer cette photo de la galerie"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-destructive opacity-0 shadow-md transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}

              {/* Inline add tile when gallery has items but space remains */}
              {canAddGallery && (
                <li>
                  <button
                    type="button"
                    onClick={() => galleryAddRef.current?.click()}
                    disabled={uploadGallery.isPending}
                    aria-label="Ajouter des photos à la galerie"
                    className={cn(
                      'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-event-outline-subtle/60 bg-event-surface/40 text-event-muted transition-colors hover:border-event-teal hover:text-event-teal',
                      'aspect-square disabled:opacity-50',
                    )}
                  >
                    <UploadCloud size={22} aria-hidden="true" />
                    <span className="text-xs font-semibold">Ajouter</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Gallery validation error */}
        {galleryValidationError && (
          <FormErrorAlert error={galleryValidationError} className="mt-4" />
        )}
        {/* Gallery upload mutation error */}
        {uploadGallery.isError && !galleryValidationError && (
          <FormErrorAlert
            error={getUserFacingError(uploadGallery.error, {
              fallback: "Les images n'ont pas pu être ajoutées. Vérifiez le format et réessayez.",
            })}
            className="mt-4"
          />
        )}
        {/* Gallery delete mutation error */}
        {deleteGalleryImage.isError && (
          <FormErrorAlert
            error={getUserFacingError(deleteGalleryImage.error, {
              fallback: "Impossible de supprimer cette photo. Réessayez.",
            })}
            className="mt-4"
          />
        )}
      </section>

      {/* ── Confirm delete cover ─────────────────────────────────────── */}
      <ConfirmDeleteDialog
        open={deleteCoverOpen}
        title="Retirer l'image de couverture"
        description="Cette action est irréversible. L'image sera définitivement retirée de votre événement."
        onConfirm={() => deleteCover.mutate()}
        onCancel={() => setDeleteCoverOpen(false)}
        isPending={deleteCover.isPending}
      />

      {/* ── Confirm delete gallery image ─────────────────────────────── */}
      <ConfirmDeleteDialog
        open={deleteGalleryPublicId !== null}
        title="Supprimer cette photo"
        description="Cette photo sera définitivement retirée de la galerie de votre événement."
        onConfirm={() => {
          if (deleteGalleryPublicId) deleteGalleryImage.mutate(deleteGalleryPublicId);
        }}
        onCancel={() => setDeleteGalleryPublicId(null)}
        isPending={deleteGalleryImage.isPending}
      />
    </div>
  );
}
