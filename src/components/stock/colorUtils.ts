// Éclaircit une couleur hex en la mélangeant avec du blanc — pour que la piste non remplie d'une
// jauge reste "du même ramp" que son remplissage (bleu-sur-bleu), au lieu d'un gris neutre plat.
export function lighten(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Palette stable pour distinguer les qualités de phosphate dans les graphiques (répartition par
// qualité) — volontairement distincte des couleurs de statut (vert/ambre/rouge = ok/élevé/critique)
// utilisées ailleurs pour l'occupation, afin de ne pas mélanger les deux sémantiques de couleur.
const QUALITY_PALETTE = [
  "#0d6b4d", "#1d6fa5", "#c2872f", "#6b4fa0", "#2f9e8e", "#a5330f", "#4f7c3f", "#8a5fb0", "#3f6b8a", "#a5460f"
];

/** Couleur déterministe par code de qualité (même code → toujours la même couleur, sans liste à
 * maintenir manuellement à chaque nouvelle qualité observée dans les données). */
export function colorForQualite(qualite: string): string {
  if (!qualite) return "#9aa79c";
  let hash = 0;
  for (let i = 0; i < qualite.length; i++) hash = (hash * 31 + qualite.charCodeAt(i)) >>> 0;
  return QUALITY_PALETTE[hash % QUALITY_PALETTE.length];
}
