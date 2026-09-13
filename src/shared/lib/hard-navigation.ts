/**
 * Force une nouvelle restauration de session après une révocation sensible.
 * Une navigation App Router conserverait l'AuthProvider courant assez longtemps
 * pour laisser les guards concurrencer la destination voulue.
 */
export function replaceDocument(path: string): void {
  window.location.replace(path);
}
