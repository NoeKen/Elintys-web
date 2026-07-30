import api from '@/shared/lib/api';
import type { MediaImage, MediaImageSource } from '@/shared/types/media.types';

export interface EventMediaState {
  coverImage: MediaImageSource | null;
  gallery: MediaImage[];
}

export const eventMediaService = {
  async uploadCover(eventId: string, file: File): Promise<EventMediaState> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<EventMediaState>(
      `/events/${eventId}/cover`,
      formData,
    );
    return response.data;
  },

  async deleteCover(eventId: string): Promise<EventMediaState> {
    const response = await api.delete<EventMediaState>(
      `/events/${eventId}/cover`,
    );
    return response.data;
  },

  async uploadGallery(
    eventId: string,
    files: File[],
  ): Promise<EventMediaState> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await api.post<EventMediaState>(
      `/events/${eventId}/gallery`,
      formData,
    );
    return response.data;
  },

  async deleteGalleryImage(
    eventId: string,
    publicId: string,
  ): Promise<EventMediaState> {
    const response = await api.delete<EventMediaState>(
      `/events/${eventId}/gallery`,
      { data: { publicId } },
    );
    return response.data;
  },
};
