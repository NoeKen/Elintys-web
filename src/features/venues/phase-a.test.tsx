import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api, { ApiClientError } from '@/shared/lib/api';
import { ManagerProfileScreen, MyVenuesScreen, VenueEditorScreen } from './components/ManagerScreens';
import { buildNavSections } from '@/shared/layout/sidebar-nav';

const session = vi.hoisted(() => ({ user: { id: 'user1', roles: ['gestionnaire_salle'], email: 'manager@test.ca' }, login: vi.fn() }));
vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => session }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/shared/lib/api', async () => ({ ...(await vi.importActual('@/shared/lib/api')), default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
const venues = [
  { _id: 'v1', name: 'Atelier Nord', capacity: 30, address: { street: '1 Rue', city: 'Montréal' }, isActive: true },
  { _id: 'v2', name: 'Atelier Sud', capacity: 60, address: { street: '2 Rue', city: 'Québec' }, isActive: false },
];
function show(component: React.ReactNode) { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{component}</QueryClientProvider>); }
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.get).mockImplementation(async (url) => {
    if (url === '/venues/mine') {
      return { data: { data: venues, total: 2, page: 1, limit: 20 }, status: 200 };
    }
    if (url === '/venues/mine/outsider') {
      throw new ApiClientError(404, { code: 'VENUE_NOT_FOUND' });
    }
    return { data: { professionalName: 'Gestion Test' }, status: 200 };
  });
});
describe('Wave J Phase A', () => {
  it('expose profil et lieux indépendamment dans le registre partagé', () => {
    const paths = buildNavSections(['gestionnaire_salle']).flatMap(s => s.items.map(i => i.href));
    expect(paths).toContain('/tableau-de-bord/gestionnaire/profil');
    expect(paths).toContain('/tableau-de-bord/gestionnaire/lieux');
    expect(paths).toContain('/tableau-de-bord/gestionnaire/lieux/nouveau');
  });
  it('affiche deux lieux avec deux liens édition distincts', async () => {
    show(<MyVenuesScreen />);
    expect(await screen.findByText('Atelier Nord')).toBeInTheDocument();
    expect(screen.getByText('Atelier Sud')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Modifier Atelier Nord/ })).toHaveAttribute('href', '/tableau-de-bord/gestionnaire/lieux/v1/modifier');
  });
  it('ne transforme pas un identifiant hors propriété en formulaire création', async () => {
    show(<VenueEditorScreen venueId="outsider" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('introuvable');
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
  });
  it('onboarding sauvegarde un profil professionnel sans créer de lieu', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { professionalName: 'Gestion Test' }, status: 200 });
    vi.mocked(api.patch).mockResolvedValue({ data: { user: { _id: 'user1', email: 'manager@test.ca', fullName: 'Test', roles: ['gestionnaire_salle'] } }, status: 200 });
    show(<ManagerProfileScreen onboarding />);
    await userEvent.type(await screen.findByLabelText(/Nom professionnel/), 'Gestion Test');
    await userEvent.click(screen.getByRole('button', { name: 'Terminer mon profil' }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/venue-managers/me', expect.objectContaining({ professionalName: 'Gestion Test' })));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/auth/onboarding/gestionnaire_salle', expect.objectContaining({ professionalName: 'Gestion Test' })));
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(/Capacité/)).not.toBeInTheDocument();
  });
  it('localise les nouveaux formulaires en anglais', async () => {
    show(<VenueEditorScreen locale="en" />);
    expect(await screen.findByRole('heading', { name: 'Add a venue' })).toBeInTheDocument();
    expect(await screen.findByLabelText(/Venue name/)).toBeInTheDocument();
  });
});
