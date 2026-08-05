#!/usr/bin/env node
/**
 * Mesure des Core Web Vitals sur un build de production local.
 *
 * Usage :
 *   node scripts/measure-web-vitals.mjs [--base URL] [--runs N] [--out fichier.json]
 *
 * Chaque route est mesurée une fois « à froid » (contexte neuf, cache vide,
 * premier rendu serveur de la route) puis N fois « à chaud ». La médiane des
 * runs chauds est retenue : elle représente l'expérience d'un visiteur qui
 * n'est pas le tout premier à toucher le serveur.
 *
 * Prérequis : `bash scripts/start-perf-server.sh` (build de production isolé).
 */
import fs from 'node:fs';
import { chromium } from '@playwright/test';

const ROUTES = [
  '/',
  '/connexion',
  '/inscription',
  '/evenements',
  '/prestataires',
  '/lieux',
  '/tarification',
];

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const BASE = arg('base', 'http://localhost:3200');
const RUNS = Number(arg('runs', '3'));
const OUT = arg('out', null);
const THROTTLE = process.argv.includes('--throttle');
const VIEWPORT = arg('viewport', 'desktop') === 'mobile'
  ? { width: 390, height: 844 }
  : { width: 1440, height: 900 };

/**
 * Bridage « mobile moyen de gamme » aligné sur le profil Lighthouse :
 * 4× de ralentissement CPU et un lien 4G lent. Sans lui, une mesure sur
 * localhost mesure surtout la machine de développement.
 */
const RESEAU_4G_LENT = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
};

/** Collecte les métriques d'un chargement complet. */
async function measure(context, url) {
  const page = await context.newPage();
  if (THROTTLE) {
    const session = await context.newCDPSession(page);
    await session.send('Network.enable');
    await session.send('Network.emulateNetworkConditions', RESEAU_4G_LENT);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  const consoleErrors = [];
  const failed = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    const text = request.failure()?.errorText ?? '';
    // `ERR_ABORTED` sur les préchargements RSC est un comportement normal de Next.
    if (request.url().includes('_rsc=') && text === 'net::ERR_ABORTED') return;
    failed.push(`${request.method()} ${request.url()} ${text}`);
  });

  // Les observateurs doivent exister avant la navigation pour capter le LCP.
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__vitals.lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__vitals.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  const response = await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  // Laisse le LCP se stabiliser après le chargement des polices et images.
  await page.waitForTimeout(2500);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource');
    const somme = (filtre) =>
      resources.filter(filtre).reduce((total, item) => total + (item.transferSize || 0), 0);
    return {
      ttfb: Math.round(nav.responseStart),
      fcp: Math.round(paint.find((item) => item.name === 'first-contentful-paint')?.startTime ?? 0),
      lcp: Math.round(window.__vitals.lcp),
      cls: Number(window.__vitals.cls.toFixed(4)),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
      load: Math.round(nav.loadEventEnd),
      requetes: resources.length,
      octetsTotal: Math.round(somme(() => true) + (nav.transferSize || 0)),
      octetsJs: Math.round(somme((item) => item.name.includes('.js'))),
      octetsCss: Math.round(somme((item) => item.name.includes('.css'))),
      octetsImages: Math.round(somme((item) => item.initiatorType === 'img')),
    };
  });

  await page.close();
  return { statut: response?.status() ?? 0, ...metrics, consoleErrors, failed };
}

const mediane = (valeurs) => {
  const triees = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(triees.length / 2);
  return triees.length % 2 ? triees[milieu] : Math.round((triees[milieu - 1] + triees[milieu]) / 2);
};

const navigateur = await chromium.launch();
const resultats = [];

for (const route of ROUTES) {
  const url = `${BASE}${route}`;

  // Run à froid : contexte neuf, aucun cache navigateur, route jamais servie.
  const contexteFroid = await navigateur.newContext({ viewport: VIEWPORT });
  const froid = await measure(contexteFroid, url);
  await contexteFroid.close();

  // Runs à chaud : contexte neuf à chaque fois pour éviter le cache disque,
  // mais serveur déjà sollicité sur cette route.
  const chauds = [];
  for (let index = 0; index < RUNS; index += 1) {
    const contexte = await navigateur.newContext({ viewport: VIEWPORT });
    chauds.push(await measure(contexte, url));
    await contexte.close();
  }

  const agrege = {};
  for (const cle of ['ttfb', 'fcp', 'lcp', 'domContentLoaded', 'load', 'requetes', 'octetsTotal', 'octetsJs', 'octetsCss', 'octetsImages']) {
    agrege[cle] = mediane(chauds.map((run) => run[cle]));
  }
  agrege.cls = Number(mediane(chauds.map((run) => run.cls * 10_000)) / 10_000);

  resultats.push({
    route,
    statut: froid.statut,
    froid: { ttfb: froid.ttfb, fcp: froid.fcp, lcp: froid.lcp, cls: froid.cls },
    chaud: agrege,
    runs: chauds.map((run) => ({ ttfb: run.ttfb, fcp: run.fcp, lcp: run.lcp, cls: run.cls })),
    consoleErrors: [...new Set(chauds.flatMap((run) => run.consoleErrors))],
    failed: [...new Set(chauds.flatMap((run) => run.failed))],
  });

  const { ttfb, fcp, lcp, cls, octetsJs, requetes } = agrege;
  console.log(
    `${route.padEnd(16)} froid LCP ${String(froid.lcp).padStart(5)} ms | ` +
      `chaud TTFB ${String(ttfb).padStart(4)} FCP ${String(fcp).padStart(4)} ` +
      `LCP ${String(lcp).padStart(4)} CLS ${cls} | JS ${Math.round(octetsJs / 1024)} Ko | ${requetes} req`,
  );
}

await navigateur.close();

if (OUT) {
  fs.writeFileSync(OUT, `${JSON.stringify({ base: BASE, runs: RUNS, viewport: VIEWPORT, throttle: THROTTLE, date: new Date().toISOString(), resultats }, null, 2)}\n`);
  console.log(`\nRapport écrit : ${OUT}`);
}
