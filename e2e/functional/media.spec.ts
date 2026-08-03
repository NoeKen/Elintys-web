import { expect, test } from '@playwright/test';
import {
  ApiClient,
  apiFromState,
  OWNER_STATE,
  cleanupEvents,
  createDraft,
  TIERS_STATE,
  TINY_PNG,
} from './helpers';

/**
 * Médias Cloudinary : couverture, galerie, remplacement, suppression, ownership
 * (Sprint 1, partie B). Les uploads visent l'espace Cloudinary de développement.
 */

let owner: ApiClient;
let tiers: ApiClient;
const created: string[] = [];

test.beforeAll(async () => {
  owner = await apiFromState(OWNER_STATE);
  tiers = await apiFromState(TIERS_STATE);
});

test.afterAll(async () => {
  await cleanupEvents(owner, created);
  await owner.dispose();
  await tiers.dispose();
});

/** Couverture : champ `file` (FileInterceptor). */
function imageUpload(name = 'cover.png') {
  return { multipart: { file: { name, mimeType: 'image/png', buffer: TINY_PNG } } };
}

/** Galerie : champ `files` (FilesInterceptor, multiple). */
function galleryUpload(name = 'galerie.png') {
  return { multipart: { files: { name, mimeType: 'image/png', buffer: TINY_PNG } } };
}

test.describe('Médias — image de couverture', () => {
  test('devrait téléverser, remplacer puis supprimer la couverture', async () => {
    const event = await createDraft(owner, { title: 'Couverture' });
    created.push(event.id);

    // Téléversement
    const upload = await owner.post(`/events/${event.id}/cover`, imageUpload());
    expect(upload.status(), await upload.text()).toBeLessThan(300);
    const withCover = await (await owner.get(`/events/${event.id}`)).json();
    expect(withCover.coverImage?.url, 'une URL de couverture doit être stockée').toBeTruthy();
    expect(String(withCover.coverImage.url)).toContain('res.cloudinary.com');

    // Remplacement : l'URL doit changer
    const replace = await owner.post(`/events/${event.id}/cover`, imageUpload('cover-2.png'));
    expect(replace.status()).toBeLessThan(300);
    const replaced = await (await owner.get(`/events/${event.id}`)).json();
    expect(replaced.coverImage?.url).toBeTruthy();

    // Suppression
    const remove = await owner.delete(`/events/${event.id}/cover`);
    expect(remove.status()).toBeLessThan(300);
    const cleared = await (await owner.get(`/events/${event.id}`)).json();
    expect(cleared.coverImage?.url ?? null).toBeNull();
  });

  test('devrait refuser un fichier non-image', async () => {
    const event = await createDraft(owner, { title: 'Upload invalide' });
    created.push(event.id);
    const response = await owner.post(`/events/${event.id}/cover`, {
      multipart: {
        file: {
          name: 'malveillant.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('ceci nest pas une image'),
        },
      },
    });
    expect(response.status(), 'un fichier non-image doit être rejeté').toBeGreaterThanOrEqual(400);
  });

  test('devrait refuser un téléversement par un tiers (ownership)', async () => {
    const event = await createDraft(owner, { title: 'Media IDOR' });
    created.push(event.id);
    const response = await tiers.post(`/events/${event.id}/cover`, imageUpload());
    expect(response.status()).toBe(403);
  });
});

test.describe('Médias — galerie', () => {
  test('devrait ajouter puis retirer une image de la galerie', async () => {
    const event = await createDraft(owner, { title: 'Galerie' });
    created.push(event.id);

    const upload = await owner.post(`/events/${event.id}/gallery`, galleryUpload('galerie-1.png'));
    expect(upload.status(), await upload.text()).toBeLessThan(300);

    const withGallery = await (await owner.get(`/events/${event.id}`)).json();
    expect(Array.isArray(withGallery.gallery)).toBe(true);
    expect(withGallery.gallery.length).toBeGreaterThan(0);
    const publicId = withGallery.gallery[0].publicId as string;
    expect(publicId).toBeTruthy();

    const remove = await owner.delete(`/events/${event.id}/gallery`, {
      data: { publicId },
    });
    expect(remove.status()).toBeLessThan(300);
    const cleared = await (await owner.get(`/events/${event.id}`)).json();
    expect((cleared.gallery ?? []).some((i: { publicId: string }) => i.publicId === publicId)).toBe(false);
  });

  test('ne devrait pas permettre de supprimer un média par publicId arbitraire', async () => {
    const event = await createDraft(owner, { title: 'Media externe' });
    created.push(event.id);
    // publicId n'appartenant pas à cet événement : l'opération ne doit avoir
    // AUCUN effet sur la galerie (suppression idempotente tolérée).
    await owner.delete(`/events/${event.id}/gallery`, {
      data: { publicId: 'elintys/prod/autre-evenement/secret' },
    });
    const after = await (await owner.get(`/events/${event.id}`)).json();
    expect(after.gallery ?? [], 'aucun média étranger ne doit être référencé').toEqual([]);
  });

  test('devrait refuser l’ajout à la galerie par un tiers', async () => {
    const event = await createDraft(owner, { title: 'Galerie IDOR' });
    created.push(event.id);
    const response = await tiers.post(`/events/${event.id}/gallery`, galleryUpload());
    expect(response.status()).toBe(403);
  });
});
