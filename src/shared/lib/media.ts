import type {
  MediaImage,
  MediaImageSource,
} from '@/shared/types/media.types';

export function getMediaUrl(
  media?: MediaImageSource | null,
): string | undefined {
  if (!media) return undefined;
  return typeof media === 'string' ? media : media.url;
}

export function isPersistedMediaImage(
  media?: MediaImageSource | null,
): media is MediaImage {
  return Boolean(
    media &&
      typeof media === 'object' &&
      media.url &&
      media.publicId &&
      media.width > 0 &&
      media.height > 0,
  );
}

type MediaVariant = 'cover' | 'card' | 'thumbnail';

const TRANSFORMATIONS: Record<MediaVariant, string> = {
  cover: 'f_auto,q_auto,c_fill,g_auto,w_1920,h_1080',
  card: 'f_auto,q_auto,c_fill,g_auto,w_800,h_520',
  thumbnail: 'f_auto,q_auto,c_fill,g_auto,w_360,h_240',
};

export function getOptimizedMediaUrl(
  media: MediaImageSource,
  variant: MediaVariant,
): string {
  const source = getMediaUrl(media);
  if (!source) return '';

  try {
    const url = new URL(source);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'res.cloudinary.com' ||
      !url.pathname.includes('/image/upload/')
    ) {
      return source;
    }
    url.pathname = url.pathname.replace(
      '/image/upload/',
      `/image/upload/${TRANSFORMATIONS[variant]}/`,
    );
    return url.toString();
  } catch {
    return source;
  }
}
