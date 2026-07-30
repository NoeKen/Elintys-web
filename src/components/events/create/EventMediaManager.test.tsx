import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastContext';
import type { EventMediaState } from '@/features/events/services/event-media.service';
import type { MediaImage } from '@/shared/types/media.types';
import { EventMediaManager } from './EventMediaManager';

const mocks = vi.hoisted(() => ({
  uploadCover: vi.fn(),
  deleteCover: vi.fn(),
  uploadGallery: vi.fn(),
  deleteGalleryImage: vi.fn(),
}));

vi.mock('@/features/events/services/event-media.service', () => ({
  eventMediaService: mocks,
}));

const cover: MediaImage = {
  url: 'https://res.cloudinary.com/demo/image/upload/elintys/events/event-1/cover/image.jpg',
  publicId: 'elintys/events/event-1/cover/image',
  width: 1920,
  height: 1080,
};
const mediaState: EventMediaState = { coverImage: cover, gallery: [] };

function renderManager(
  overrides: Partial<React.ComponentProps<typeof EventMediaManager>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const props: React.ComponentProps<typeof EventMediaManager> = {
    eventId: 'event-1',
    gallery: [],
    onMediaStateChange: vi.fn(),
    onCoverPreviewChange: vi.fn(),
    onUploadingChange: vi.fn(),
    ...overrides,
  };
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <EventMediaManager {...props} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { ...rendered, props };
}

function coverInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]:not([multiple])')!;
}

function galleryInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"][multiple]')!;
}

describe('EventMediaManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:elintys-preview'),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  it('affiche immédiatement un aperçu puis synchronise la couverture persistée', async () => {
    let resolveUpload!: (state: EventMediaState) => void;
    mocks.uploadCover.mockReturnValue(
      new Promise<EventMediaState>((resolve) => {
        resolveUpload = resolve;
      }),
    );
    const { container, props } = renderManager();
    const file = new File(['jpeg'], 'cover.jpg', { type: 'image/jpeg' });

    fireEvent.change(coverInput(container), { target: { files: [file] } });

    expect(await screen.findByAltText(/Aperçu de la couverture/)).toHaveAttribute(
      'src',
      'blob:elintys-preview',
    );
    expect(props.onCoverPreviewChange).toHaveBeenCalledWith(
      'blob:elintys-preview',
    );
    expect(props.onUploadingChange).toHaveBeenCalledWith(true);

    resolveUpload(mediaState);
    await waitFor(() =>
      expect(props.onMediaStateChange).toHaveBeenCalledWith(mediaState),
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:elintys-preview');
  });

  it('conserve l’aperçu en erreur et permet de réessayer', async () => {
    mocks.uploadCover
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(mediaState);
    const { container, props } = renderManager();
    const file = new File(['jpeg'], 'cover.jpg', { type: 'image/jpeg' });

    fireEvent.change(coverInput(container), { target: { files: [file] } });
    const retry = await screen.findByRole('button', { name: 'Réessayer' });
    expect(screen.getByAltText(/Aperçu de la couverture/)).toBeInTheDocument();

    await userEvent.click(retry);
    await waitFor(() =>
      expect(props.onMediaStateChange).toHaveBeenCalledWith(mediaState),
    );
    expect(mocks.uploadCover).toHaveBeenCalledTimes(2);
  });

  it('supprime une couverture persistée via le backend', async () => {
    mocks.deleteCover.mockResolvedValue({ coverImage: null, gallery: [] });
    const { props } = renderManager({ coverImage: cover });

    await userEvent.click(
      screen.getByRole('button', { name: 'Supprimer' }),
    );

    await waitFor(() => expect(mocks.deleteCover).toHaveBeenCalledWith('event-1'));
    expect(props.onMediaStateChange).toHaveBeenCalledWith({
      coverImage: null,
      gallery: [],
    });
  });

  it('téléverse une sélection multiple dans la galerie', async () => {
    const first = { ...cover, publicId: 'elintys/events/event-1/gallery/1' };
    const second = { ...cover, publicId: 'elintys/events/event-1/gallery/2' };
    const state = { coverImage: null, gallery: [first, second] };
    mocks.uploadGallery.mockResolvedValue(state);
    const { container, props } = renderManager();
    const files = [
      new File(['jpeg-1'], 'one.jpg', { type: 'image/jpeg' }),
      new File(['jpeg-2'], 'two.jpg', { type: 'image/jpeg' }),
    ];

    fireEvent.change(galleryInput(container), { target: { files } });

    await waitFor(() =>
      expect(mocks.uploadGallery).toHaveBeenCalledWith('event-1', files),
    );
    expect(props.onMediaStateChange).toHaveBeenCalledWith(state);
  });

  it('restaure une couverture Cloudinary persistée au rechargement', () => {
    renderManager({ coverImage: cover });

    const image = screen.getByAltText(/Aperçu de la couverture/);
    expect(image.getAttribute('src')).toContain('res.cloudinary.com');
    expect(screen.getByText('Image enregistrée')).toBeInTheDocument();
  });

  it('bloque les ajouts lorsque la galerie contient déjà dix images', () => {
    const gallery = Array.from({ length: 10 }, (_, index) => ({
      ...cover,
      publicId: `elintys/events/event-1/gallery/${index}`,
    }));
    const { container } = renderManager({ gallery });

    expect(galleryInput(container)).toBeNull();
    expect(screen.getByText('10/10 images')).toBeInTheDocument();
  });
});
