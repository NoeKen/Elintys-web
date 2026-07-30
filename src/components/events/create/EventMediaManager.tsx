'use client';

import Image from 'next/image';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { eventCreationCopy as copy, formatEventCreationCopy } from '@/features/events/i18n/event-creation.copy';
import {
  eventMediaService,
  type EventMediaState,
} from '@/features/events/services/event-media.service';
import type { MediaImage, MediaImageSource } from '@/shared/types/media.types';
import {
  getMediaUrl,
  getOptimizedMediaUrl,
} from '@/shared/lib/media';
import { ApiClientError } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/hooks/useToast';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type UploadStatus = 'uploading' | 'error';

interface PendingCover {
  file: File;
  previewUrl: string;
  status: UploadStatus;
  message?: string;
}

interface PendingGalleryImage {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  message?: string;
}

interface GalleryDisplayItem {
  id: string;
  src: string;
  persisted?: MediaImage;
  pending?: PendingGalleryImage;
}

interface EventMediaManagerProps {
  eventId: string;
  coverImage?: MediaImageSource;
  gallery: MediaImage[];
  onMediaStateChange: (state: EventMediaState) => void;
  onCoverPreviewChange: (url?: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}

function validateFile(file: File): string | undefined {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return copy.identity.uploadInvalidType;
  }
  if (file.size > MAX_FILE_SIZE) {
    return copy.identity.uploadTooLarge;
  }
  return undefined;
}

function getUploadError(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 503) {
    const payload =
      error.payload && typeof error.payload === 'object'
        ? (error.payload as { message?: unknown })
        : undefined;
    if (payload?.message === 'MEDIA_STORAGE_NOT_CONFIGURED') {
      return copy.identity.mediaStorageUnavailable;
    }
  }
  return copy.identity.uploadFailed;
}

export function EventMediaManager({
  eventId,
  coverImage,
  gallery,
  onMediaStateChange,
  onCoverPreviewChange,
  onUploadingChange,
}: EventMediaManagerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const objectUrls = useRef(new Set<string>());
  const [pendingCover, setPendingCover] = useState<PendingCover>();
  const [coverError, setCoverError] = useState<string>();
  const [pendingGallery, setPendingGallery] = useState<PendingGalleryImage[]>([]);
  const [galleryError, setGalleryError] = useState<string>();
  const [deletingGalleryId, setDeletingGalleryId] = useState<string>();

  const createPreviewUrl = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    return url;
  };
  const revokePreviewUrl = (url: string) => {
    if (!objectUrls.current.has(url)) return;
    URL.revokeObjectURL(url);
    objectUrls.current.delete(url);
  };

  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current.clear();
    },
    [],
  );

  const syncMediaState = (state: EventMediaState) => {
    onMediaStateChange(state);
    queryClient.setQueryData(
      ['events', eventId],
      (current: Record<string, unknown> | undefined) =>
        current
          ? { ...current, ...state }
          : current,
    );
    void queryClient.invalidateQueries({ queryKey: ['my-events'] });
    void queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const coverUpload = useMutation({
    mutationFn: (file: File) => eventMediaService.uploadCover(eventId, file),
  });
  const coverDelete = useMutation({
    mutationFn: () => eventMediaService.deleteCover(eventId),
  });
  const galleryUpload = useMutation({
    mutationFn: (files: File[]) =>
      eventMediaService.uploadGallery(eventId, files),
  });
  const galleryDelete = useMutation({
    mutationFn: (publicId: string) =>
      eventMediaService.deleteGalleryImage(eventId, publicId),
  });

  const isUploading =
    coverUpload.isPending ||
    galleryUpload.isPending ||
    pendingCover?.status === 'uploading' ||
    pendingGallery.some((image) => image.status === 'uploading');
  const isMutating =
    isUploading || coverDelete.isPending || galleryDelete.isPending;

  useEffect(() => {
    onUploadingChange(isUploading);
  }, [isUploading, onUploadingChange]);

  const persistedCoverUrl = coverImage
    ? getOptimizedMediaUrl(coverImage, 'cover')
    : undefined;
  const displayedCoverUrl = pendingCover?.previewUrl ?? persistedCoverUrl;
  const gallerySlotsUsed = gallery.length + pendingGallery.length;
  const canAddGallery = gallerySlotsUsed < MAX_GALLERY_IMAGES;

  const startCoverUpload = async (file?: File) => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setCoverError(validationError);
      return;
    }

    if (pendingCover) revokePreviewUrl(pendingCover.previewUrl);
    const previewUrl = createPreviewUrl(file);
    setCoverError(undefined);
    setPendingCover({ file, previewUrl, status: 'uploading' });
    onCoverPreviewChange(previewUrl);

    try {
      const state = await coverUpload.mutateAsync(file);
      syncMediaState(state);
      revokePreviewUrl(previewUrl);
      setPendingCover(undefined);
      onCoverPreviewChange(getMediaUrl(state.coverImage));
      toast({ title: copy.identity.uploadSuccess, variant: 'success' });
    } catch (error) {
      const message = getUploadError(error);
      setPendingCover({ file, previewUrl, status: 'error', message });
      setCoverError(message);
      toast({
        title: copy.identity.uploadFailed,
        description: message,
        variant: 'destructive',
      });
    }
  };

  const clearOrDeleteCover = async () => {
    if (pendingCover) {
      revokePreviewUrl(pendingCover.previewUrl);
      setPendingCover(undefined);
      setCoverError(undefined);
      onCoverPreviewChange(persistedCoverUrl);
      return;
    }
    if (!coverImage) return;

    try {
      const state = await coverDelete.mutateAsync();
      syncMediaState(state);
      onCoverPreviewChange(undefined);
    } catch (error) {
      setCoverError(getUploadError(error));
    }
  };

  const retryCover = () => {
    if (pendingCover) void startCoverUpload(pendingCover.file);
  };

  const startGalleryUpload = async (selectedFiles: File[]) => {
    if (!selectedFiles.length) return;
    const capacity = MAX_GALLERY_IMAGES - gallery.length - pendingGallery.length;
    if (capacity <= 0 || selectedFiles.length > capacity) {
      setGalleryError(copy.identity.galleryLimit);
      return;
    }

    const invalid = selectedFiles.find((file) => validateFile(file));
    if (invalid) {
      setGalleryError(validateFile(invalid));
      return;
    }

    const additions = selectedFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      file,
      previewUrl: createPreviewUrl(file),
      status: 'uploading' as const,
    }));
    setGalleryError(undefined);
    setPendingGallery((current) => [...current, ...additions]);

    try {
      const state = await galleryUpload.mutateAsync(selectedFiles);
      syncMediaState(state);
      additions.forEach((image) => revokePreviewUrl(image.previewUrl));
      setPendingGallery((current) =>
        current.filter(
          (image) => !additions.some((addition) => addition.id === image.id),
        ),
      );
      toast({ title: copy.identity.galleryUploadSuccess, variant: 'success' });
    } catch (error) {
      const message = getUploadError(error);
      setPendingGallery((current) =>
        current.map((image) =>
          additions.some((addition) => addition.id === image.id)
            ? { ...image, status: 'error', message }
            : image,
        ),
      );
      setGalleryError(message);
      toast({
        title: copy.identity.galleryUploadFailed,
        description: message,
        variant: 'destructive',
      });
    }
  };

  const retryGalleryImage = async (pending: PendingGalleryImage) => {
    setPendingGallery((current) =>
      current.map((image) =>
        image.id === pending.id
          ? { ...image, status: 'uploading', message: undefined }
          : image,
      ),
    );
    try {
      const state = await galleryUpload.mutateAsync([pending.file]);
      syncMediaState(state);
      revokePreviewUrl(pending.previewUrl);
      setPendingGallery((current) =>
        current.filter((image) => image.id !== pending.id),
      );
      setGalleryError(undefined);
    } catch (error) {
      const message = getUploadError(error);
      setPendingGallery((current) =>
        current.map((image) =>
          image.id === pending.id
            ? { ...image, status: 'error', message }
            : image,
        ),
      );
      setGalleryError(message);
    }
  };

  const removePendingGalleryImage = (pending: PendingGalleryImage) => {
    revokePreviewUrl(pending.previewUrl);
    setPendingGallery((current) =>
      current.filter((image) => image.id !== pending.id),
    );
  };

  const removeGalleryImage = async (publicId: string) => {
    setDeletingGalleryId(publicId);
    try {
      const state = await galleryDelete.mutateAsync(publicId);
      syncMediaState(state);
    } catch (error) {
      setGalleryError(getUploadError(error));
    } finally {
      setDeletingGalleryId(undefined);
    }
  };

  const galleryItems = useMemo<GalleryDisplayItem[]>(
    () => [
      ...gallery.map((image) => ({
        id: image.publicId,
        src: getOptimizedMediaUrl(image, 'thumbnail'),
        persisted: image,
      })),
      ...pendingGallery.map((image) => ({
        id: image.id,
        src: image.previewUrl,
        pending: image,
      })),
    ],
    [gallery, pendingGallery],
  );

  return (
    <div className="space-y-12">
      <section aria-labelledby="event-cover-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="event-cover-heading" className="font-serif text-3xl text-event-petrol">
              {copy.identity.cover}
            </h2>
            <p className="mt-2 text-sm leading-6 text-event-muted">
              {copy.identity.coverHint}
            </p>
          </div>
          {pendingCover?.status === 'uploading' && (
            <span className="inline-flex items-center gap-2 rounded-full bg-event-petrol px-3 py-1.5 text-xs font-semibold text-white">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              {copy.identity.uploading}
            </span>
          )}
          {!pendingCover && coverImage && (
            <span className="inline-flex items-center gap-2 rounded-full bg-event-teal/10 px-3 py-1.5 text-xs font-semibold text-event-petrol">
              <Check className="h-3.5 w-3.5 text-event-teal" aria-hidden="true" />
              {copy.identity.uploadSuccess}
            </span>
          )}
        </div>

        <label
          className={cn(
            'group relative mt-5 flex aspect-[16/7] cursor-pointer items-center justify-center overflow-hidden rounded-[28px] border bg-event-surface shadow-event-soft transition',
            displayedCoverUrl
              ? 'border-event-gold/80'
              : 'border-dashed border-event-outline-subtle hover:border-event-gold',
            isMutating && 'pointer-events-none opacity-80',
          )}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void startCoverUpload(event.dataTransfer.files[0]);
          }}
        >
          <input
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            disabled={isMutating}
            onChange={(event) => {
              void startCoverUpload(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
            className="sr-only"
          />
          {displayedCoverUrl ? (
            <>
              <Image
                src={displayedCoverUrl}
                alt={copy.coverAlt}
                fill
                unoptimized={displayedCoverUrl.startsWith('blob:')}
                className="object-cover transition duration-500 group-hover:scale-[1.015]"
                sizes="(max-width: 1200px) 100vw, 1000px"
                priority
              />
              <span className="absolute inset-0 bg-gradient-to-t from-event-petrol/55 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/94 px-4 text-sm font-semibold text-event-petrol shadow-event-soft backdrop-blur">
                <Upload className="h-4 w-4" aria-hidden="true" />
                {copy.identity.replace}
              </span>
            </>
          ) : (
            <span className="px-6 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-event-teal shadow-event-soft">
                <ImagePlus className="h-7 w-7" aria-hidden="true" />
              </span>
              <span className="mt-5 block font-semibold text-event-ink">
                {copy.identity.upload}
              </span>
              <span className="mt-1.5 block text-sm text-event-muted">
                {copy.identity.drop}
              </span>
            </span>
          )}
        </label>

        <div className="mt-3 flex min-h-11 flex-wrap items-center gap-2">
          {displayedCoverUrl && (
            <button
              type="button"
              onClick={() => void clearOrDeleteCover()}
              disabled={isMutating}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-destructive focus-visible:outline-2 focus-visible:outline-event-gold disabled:opacity-50"
            >
              {pendingCover ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              {copy.identity.remove}
            </button>
          )}
          {pendingCover?.status === 'error' && (
            <button
              type="button"
              onClick={retryCover}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-event-gold/12 px-3 text-sm font-semibold text-event-petrol focus-visible:outline-2 focus-visible:outline-event-gold"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {copy.identity.retry}
            </button>
          )}
          {coverError && (
            <p role="alert" className="text-sm text-destructive">
              {coverError}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="event-gallery-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 id="event-gallery-heading" className="font-serif text-3xl text-event-petrol">
              {copy.identity.gallery}
            </h2>
            <p className="mt-2 text-sm leading-6 text-event-muted">
              {copy.identity.galleryHint}
            </p>
          </div>
          <span className="rounded-full bg-event-surface px-3 py-1.5 text-xs font-semibold text-event-muted">
            {formatEventCreationCopy(copy.identity.galleryCount, {
              count: gallerySlotsUsed,
            })}
          </span>
        </div>

        <div
          className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void startGalleryUpload(Array.from(event.dataTransfer.files));
          }}
        >
          {galleryItems.map((item, index) => (
            <article
              key={item.id}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-3xl bg-event-surface shadow-event-soft',
                index === 0 && galleryItems.length >= 3 && 'sm:col-span-2 sm:row-span-2',
              )}
            >
              <Image
                src={item.src}
                alt={`${copy.identity.gallery} ${index + 1}`}
                fill
                unoptimized={item.src.startsWith('blob:')}
                className="object-cover transition duration-500 group-hover:scale-[1.025]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-event-petrol/55 via-transparent to-transparent opacity-70" />

              {item.pending?.status === 'uploading' && (
                <span className="absolute inset-0 flex items-center justify-center bg-event-petrol/45 text-white backdrop-blur-[2px]">
                  <span className="inline-flex items-center gap-2 rounded-full bg-event-petrol/85 px-3 py-2 text-xs font-semibold">
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {copy.identity.uploading}
                  </span>
                </span>
              )}

              {item.pending?.status === 'error' ? (
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => void retryGalleryImage(item.pending!)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-event-petrol"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    {copy.identity.retry}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePendingGalleryImage(item.pending!)}
                    aria-label={copy.identity.deleteImage}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : item.persisted ? (
                <button
                  type="button"
                  onClick={() => void removeGalleryImage(item.persisted!.publicId)}
                  disabled={deletingGalleryId === item.persisted.publicId}
                  aria-label={copy.identity.deleteImage}
                  className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/94 text-destructive opacity-100 shadow-event-soft transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-event-gold disabled:opacity-60 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                >
                  {deletingGalleryId === item.persisted.publicId ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              ) : null}
            </article>
          ))}

          {canAddGallery && (
            <label
              className={cn(
                'flex aspect-square cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-event-outline-subtle bg-event-surface/70 px-4 text-center transition hover:border-event-gold hover:bg-event-gold/5 focus-within:outline-2 focus-within:outline-event-gold',
                galleryItems.length === 0 &&
                  'col-span-2 min-h-60 aspect-auto sm:col-span-3 lg:col-span-4',
                isMutating && 'pointer-events-none opacity-60',
              )}
            >
              <input
                type="file"
                multiple
                accept={ALLOWED_TYPES.join(',')}
                disabled={isMutating}
                onChange={(event) => {
                  void startGalleryUpload(Array.from(event.target.files ?? []));
                  event.currentTarget.value = '';
                }}
                className="sr-only"
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-event-teal shadow-event-soft">
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="mt-3 text-sm font-semibold text-event-ink">
                {copy.identity.galleryUpload}
              </span>
              <span className="mt-1 text-xs leading-5 text-event-muted">
                {copy.identity.galleryDrop}
              </span>
              {galleryItems.length === 0 && (
                <>
                  <span className="mt-5 font-serif text-xl text-event-petrol">
                    {copy.identity.galleryEmpty}
                  </span>
                  <span className="mt-1 max-w-sm text-xs leading-5 text-event-muted">
                    {copy.identity.galleryEmptyHint}
                  </span>
                </>
              )}
            </label>
          )}
        </div>

        {galleryError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {galleryError}
          </p>
        )}
      </section>
    </div>
  );
}
