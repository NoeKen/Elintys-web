// Next.js traite `server-only` comme une sentinelle de compilation. Vitest ne
// connaît pas ce module virtuel : ce shim vide permet uniquement de tester les
// fonctions serveur sans modifier leur comportement de production.
export {};
