import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventMediaService } from './event-media.service';

describe('eventMediaService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('laisse le navigateur générer le Content-Type multipart et inclut le fichier', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ coverImage: null, gallery: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['content'], 'cover.jpg', { type: 'image/jpeg' });

    await eventMediaService.uploadCover('event-1', file);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
    expect((init.body as FormData).get('file')).toBe(file);
  });
});
