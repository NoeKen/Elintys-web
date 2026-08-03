import fs from 'node:fs';
import { request } from '@playwright/test';
import { API_URL, credentials, QA_METADATA, type QaMetadata } from './qa-data';

export default async function globalTeardown() {
  if (!fs.existsSync(QA_METADATA)) return;
  const metadata = JSON.parse(fs.readFileSync(QA_METADATA, 'utf8')) as QaMetadata;
  const api = await request.newContext({ baseURL: `${API_URL}/`, extraHTTPHeaders: { origin: 'https://dev.elintys.com', referer: 'https://dev.elintys.com/' } });
  const login = await api.post('auth/login', { data: credentials() });
  if (login.ok()) {
    for (const event of Object.values(metadata.events)) await api.delete(`events/${event.id}`);
  }
  await api.dispose();
}
