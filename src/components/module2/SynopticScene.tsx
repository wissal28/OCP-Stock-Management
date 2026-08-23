import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { AlertOctagon, Download, Expand, Maximize2, Minimize2, Minus, Plus, X } from "lucide-react";
import EquipmentSearch from "./EquipmentSearch";
import { useManutentionState } from "./manutentionState";
import {
  getEquipmentStatus,
  getStockMovements,
  listArrets,
  listArretsTrain,
  type CelluleMovement,
  type SiloMovement
} from "../../api";
import type { ArretNavire } from "../navire/navireData";
import type { ArretTrain } from "../train/trainData";
import { analyzeArrets, formatDuration, getCurrentOperationalDay } from "../train/trainRules";
import {
  EQUIPMENTS,
  FAMILY_META,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  findRepriseOwner,
  getCircuitById,
  getEquipmentLayout,
  getTrajetHighlight,
  type Equipment,
  type EquipmentFamily,
  type EquipmentLayout
} from "./synoptiqueManutentionData";

// Document officiel "SCHEMA DE MANUTENTION OIK/PP" — affiché tel quel en fond (voir
// SCENE_WIDTH/SCENE_HEIGHT dans synoptiqueManutentionData.ts, calé au pixel sur ce fichier). La
// couche SVG interactive ne dessine plus rien en mode "base" : elle ne fournit que les zones de
// clic, et ne redevient visible (contour coloré) qu'au survol/sélection — le rendu par défaut reste
// donc identique au document papier plutôt qu'une redite approximative de celui-ci.
const OFFICIAL_SCHEMA_SRC = "/synoptique/schema-manutention-officiel.png";
const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;

/** Point d'ancrage d'un équipement (centre du rect, centre du cercle, milieu du tracé) — utilisé
 * pour positionner les pastilles d'alerte d'arrêt en cours, indépendamment de sa forme graphique. */
function anchorPoint(layout: EquipmentLayout): { x: number; y: number } | null {
  if (layout.shape === "rect" && layout.position && layout.w && layout.h) {
    return { x: layout.position.x + layout.w / 2, y: layout.position.y + layout.h / 2 };
  }
  if (layout.shape === "circle" && layout.position) return layout.position;
  if (layout.shape === "line" && layout.path && layout.path.length > 0) return layout.path[Math.floor(layout.path.length / 2)];
  return null;
}

/** Filet de matière animé (tirets qui défilent) sur les convoyeurs actuellement "Actif" — donne une
 * lecture immédiate de ce qui tourne réellement, en plus du statut visible au clic. Purement
 * décoratif (pointerEvents désactivés), toujours sous les surcouches de sélection/survol. */
function FlowOverlay({ equipment, layout }: { equipment: Equipment; layout: EquipmentLayout }) {
  if (layout.shape !== "line" || !layout.path) return null;
  const points = layout.path.map((point) => `${point.x},${point.y}`).join(" ");
  return (
    <polyline
      points={points}
      fill="none"
      stroke={FAMILY_META[equipment.family].dot}
      strokeWidth={3}
      strokeLinecap="round"
      strokeDasharray="1 9"
      opacity={0.6}
      pointerEvents="none"
    >
      <animate attributeName="stroke-dashoffset" values="0;-20" dur="0.9s" repeatCount="indefinite" />
    </polyline>
  );
}

/** Pastille pulsante à l'emplacement d'un équipement concerné par un arrêt en cours (sans heure de
 * fin) — visible en permanence, sans avoir à cliquer équipement par équipement. */
function AlertPulse({ x, y }: { x: number; y: number }) {
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r={7} fill="none" stroke="#c1272d" strokeWidth={2}>
        <animate attributeName="r" values="7;17;7" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r={4} fill="#c1272d" stroke="white" strokeWidth={1.25} />
    </g>
  );
}

/** Mini-carte de navigation (coin bas-droit du schéma) : miniature du document officiel avec le
 * cadre du viewport actuel, cliquable pour recentrer instantanément la vue à cet endroit. */
function MiniMap({
  containerSize,
  transform,
  onJump
}: {
  containerSize: { w: number; h: number };
  transform: { scale: number; x: number; y: number };
  onJump: (sceneX: number, sceneY: number) => void;
}) {
  const miniScale = MINIMAP_WIDTH / SCENE_WIDTH;
  const viewX = (-transform.x / transform.scale) * miniScale;
  const viewY = (-transform.y / transform.scale) * miniScale;
  const viewW = (containerSize.w / transform.scale) * miniScale;
  const viewH = (containerSize.h / transform.scale) * miniScale;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onJump((event.clientX - rect.left) / miniScale, (event.clientY - rect.top) / miniScale);
  };

  return (
    <div
      className="absolute bottom-3 right-3 cursor-pointer overflow-hidden rounded-md border border-[#dfe6d7] bg-white shadow-[0_10px_28px_rgba(16,43,32,0.22)]"
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
      onClick={handleClick}
      role="button"
      aria-label="Naviguer sur le schéma"
    >
      <img src={OFFICIAL_SCHEMA_SRC} alt="" draggable={false} className="pointer-events-none block h-full w-full object-fill" />
      <div
        className="pointer-events-none absolute border-2 border-[#0d6b4d] bg-[#0d6b4d]/10"
        style={{
          left: Math.max(0, viewX),
          top: Math.max(0, viewY),
          width: Math.min(MINIMAP_WIDTH, Math.max(0, viewW)),
          height: Math.min(MINIMAP_HEIGHT, Math.max(0, viewH))
        }}
      />
    </div>
  );
}

const STATUS_DOT: Record<Equipment["status"], string> = {
  Actif: "#0d6b4d",
  "En attente": "#c1272d",
  "Non renseigné": "#a9b1aa"
};

const MIN_SCALE = 0.35;
const MAX_SCALE = 3.5;
const ACCENT = "#b7d534";
const SELECTED = "#0d6b4d";

// Boîtes jaunes (cases SA211..SB323, largeur ≈56, mesurée sur le document officiel) = code couleur
// du document papier pour les cases de silo Lot 1/2 ; les cellules étroites du Lot 3 (largeur 28) et
// les jonctions (DB210/T10) gardent la couleur de leur famille pour rester lisibles dans la bande
// resserrée du Lot 3.
function cellTheme(equipment: Equipment, layout: EquipmentLayout): { fill: string; stroke: string; text: string } {
  const meta = FAMILY_META[equipment.family];
  if (layout.shape === "rect" && layout.w && layout.w >= 50 && layout.w <= 60) return { fill: "#f6d95a", stroke: "#8a6d1f", text: "#4a3a0a" };
  if (layout.shape === "rect" && layout.w === 28) return { fill: "#eef1ee", stroke: meta.dot, text: "#314238" };
  return { fill: meta.bg, stroke: meta.dot, text: meta.text };
}

function pathLength(path: { x: number; y: number }[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  return total;
}

type Mode = "base" | "highlight" | "selected";

export default function SynopticScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [familyFilter, setFamilyFilter] = useState<EquipmentFamily | null>(null);
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const { aiguillages, toggleAiguillageBranch, selectReprise, axisSelection, lot3Selection } = useManutentionState();

  const fitToScreen = () => {
    const el = containerRef.current;
    if (!el) return;
    const scale = Math.min(el.clientWidth / SCENE_WIDTH, el.clientHeight / SCENE_HEIGHT) * 0.96;
    setTransform({ scale, x: (el.clientWidth - SCENE_WIDTH * scale) / 2, y: (el.clientHeight - SCENE_HEIGHT * scale) / 2 });
    setContainerSize({ w: el.clientWidth, h: el.clientHeight });
  };

  useEffect(() => {
    fitToScreen();
    window.addEventListener("resize", fitToScreen);
    return () => window.removeEventListener("resize", fitToScreen);
  }, []);

  // Mode plein écran natif du navigateur sur la carte entière (schéma + barre d'outils) — se
  // recale automatiquement sur la nouvelle taille disponible à l'entrée/sortie.
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      window.setTimeout(fitToScreen, 60);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else sectionRef.current?.requestFullscreen();
  };

  const jumpTo = (sceneX: number, sceneY: number) => {
    const el = containerRef.current;
    if (!el) return;
    setTransform((prev) => ({ ...prev, x: el.clientWidth / 2 - sceneX * prev.scale, y: el.clientHeight / 2 - sceneY * prev.scale }));
  };

  // Exporte le schéma (document officiel + surcouche interactive dans son état courant : sélection,
  // trajet surligné, alertes...) en PNG haute résolution, indépendamment du zoom/pan à l'écran.
  const handleExportPng = () => {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    const imageEl = clone.querySelector("image");
    if (imageEl) imageEl.setAttribute("href", new URL(OFFICIAL_SCHEMA_SRC, window.location.origin).href);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SCENE_WIDTH * 2;
      canvas.height = SCENE_HEIGHT * 2;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(svgUrl);
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `schema-manutention-oik-pp-${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
      }, "image/png");
    };
    img.src = svgUrl;
  };

  // Surcharge additive du statut statique par le statut réel (base de données) : ne modifie ni la
  // disposition, ni la géométrie, ni aucune autre donnée de l'équipement — uniquement `status`.
  const [statusOverrides, setStatusOverrides] = useState<Record<string, "Actif" | "En attente">>({});
  useEffect(() => {
    getEquipmentStatus().then(setStatusOverrides).catch(() => {});
  }, []);

  // Stock réel (Gestion de stock / Mouvements de stock) pour la journée en cours, indexé par code
  // d'équipement (mêmes codes que les cellules/silos) — affiché dans le panneau d'info au clic, en
  // plus du statut Actif/En attente déjà branché ci-dessus.
  const [stockByCode, setStockByCode] = useState<Record<string, CelluleMovement | SiloMovement>>({});
  useEffect(() => {
    getStockMovements(getCurrentOperationalDay())
      .then((movements) => {
        const byCode: Record<string, CelluleMovement | SiloMovement> = {};
        for (const c of movements.cellules) byCode[c.celluleId] = c;
        for (const s of movements.silos) byCode[s.siloId] = s;
        setStockByCode(byCode);
      })
      .catch(() => {});
  }, []);
  const liveEquipments = useMemo(
    () => EQUIPMENTS.map((equipment) => (statusOverrides[equipment.code] ? { ...equipment, status: statusOverrides[equipment.code] } : equipment)),
    [statusOverrides]
  );

  // Historique des arrêts pour l'équipement sélectionné — mêmes données que "Bilan des arrêts" et
  // "Analyse des arrêts" (fiche train/navire), filtrées ici par code d'équipement du schéma.
  const [arretsNavire, setArretsNavire] = useState<ArretNavire[]>([]);
  const [arretsTrain, setArretsTrain] = useState<ArretTrain[]>([]);
  useEffect(() => {
    listArrets().then(setArretsNavire).catch(() => {});
    listArretsTrain().then(setArretsTrain).catch(() => {});
  }, []);

  const highlightSet = useMemo(() => (selectedCode ? getTrajetHighlight(selectedCode) : new Set<string>()), [selectedCode]);
  const selected = selectedCode ? liveEquipments.find((equipment) => equipment.code === selectedCode) ?? null : null;
  const selectedOwner = selectedCode ? findRepriseOwner(selectedCode) : undefined;

  const selectedArrets = useMemo(() => {
    if (!selectedCode) return [];
    const navire = arretsNavire.filter((a) => a.portique === selectedCode || a.elementConcerne === selectedCode);
    const train = arretsTrain.filter((a) => a.axe === selectedCode || a.elementConcerne === selectedCode);
    return [...navire, ...train].sort((a, b) => `${b.dateDebut}${b.heureDebut}`.localeCompare(`${a.dateDebut}${a.heureDebut}`));
  }, [selectedCode, arretsNavire, arretsTrain]);
  const selectedArretsAnalysis = useMemo(() => analyzeArrets(selectedArrets), [selectedArrets]);

  // Équipements concernés par un arrêt actuellement en cours (sans heure de fin) — affichés en
  // pastille pulsante en permanence sur le schéma, sans avoir besoin de cliquer élément par élément.
  const activeStopCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const a of arretsNavire) {
      if (a.heureFin) continue;
      if (a.elementConcerne) codes.add(a.elementConcerne);
      if (a.portique) codes.add(a.portique);
    }
    for (const a of arretsTrain) {
      if (a.heureFin) continue;
      if (a.elementConcerne) codes.add(a.elementConcerne);
      if (a.axe) codes.add(a.axe);
    }
    return codes;
  }, [arretsNavire, arretsTrain]);

  const counts = useMemo(() => {
    let actif = 0;
    let attente = 0;
    for (const equipment of liveEquipments) {
      if (equipment.status === "Actif") actif += 1;
      else if (equipment.status === "En attente") attente += 1;
    }
    return { actif, attente, arretsEnCours: activeStopCodes.size };
  }, [liveEquipments, activeStopCodes]);

  const handleSelect = (code: string) => {
    setFamilyFilter(null);
    setSelectedCode(code);
    const owner = findRepriseOwner(code);
    if (owner) selectReprise(owner.peseuseId, owner.group, code);
  };

  const toggleFamilyFilter = (family: EquipmentFamily) => {
    setSelectedCode(null);
    setFamilyFilter((current) => (current === family ? null : family));
  };

  const zoomAt = (px: number, py: number, factor: number) => {
    setTransform((prev) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor));
      const ratio = nextScale / prev.scale;
      return { scale: nextScale, x: px - (px - prev.x) * ratio, y: py - (py - prev.y) * ratio };
    });
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(event.clientX - rect.left, event.clientY - rect.top, event.deltaY > 0 ? 1 / 1.15 : 1.15);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragState.current = { startX: event.clientX, startY: event.clientY, originX: transform.x, originY: transform.y, moved: false };
    setIsDragging(true);
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    setTransform((prev) => ({ ...prev, x: drag.originX + dx, y: drag.originY + dy }));
  };
  const handlePointerUp = () => {
    dragState.current = null;
    setIsDragging(false);
  };

  const handleBackgroundClick = (event: React.MouseEvent<SVGRectElement>) => {
    if (dragState.current?.moved) return;
    if ((event.target as SVGElement).dataset.role === "background") setSelectedCode(null);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <section ref={sectionRef} className="relative overflow-hidden rounded-lg border border-[#dfe6d7] bg-white shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe6d7] bg-white/95 px-4 py-3 backdrop-blur-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">Vue globale</p>
            <h2 className="font-display text-lg font-medium tracking-tight text-[#102b20] sm:text-xl">Schéma de manutention OIK/PP</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1.5 rounded-full bg-[#e8f4ed] px-2.5 py-1 text-[10px] font-black text-[#0d6b4d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0d6b4d]" aria-hidden="true" />
                {counts.actif} actifs
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-[#fdeaea] px-2.5 py-1 text-[10px] font-black text-[#8a2020]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c1272d]" aria-hidden="true" />
                {counts.attente} en attente
              </span>
              {counts.arretsEnCours > 0 && (
                <span className="flex animate-pulse items-center gap-1.5 rounded-full bg-[#fdeaea] px-2.5 py-1 text-[10px] font-black text-[#8a2020]">
                  <AlertOctagon size={11} aria-hidden="true" />
                  {counts.arretsEnCours} arrêt{counts.arretsEnCours > 1 ? "s" : ""} en cours
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EquipmentSearch onSelectCode={handleSelect} />
            <div className="flex items-center gap-1 rounded-md border border-[#dfe6d7] bg-white p-1">
              <button
                type="button"
                onClick={() => zoomAt((containerRef.current?.clientWidth ?? 0) / 2, (containerRef.current?.clientHeight ?? 0) / 2, 1 / 1.25)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#5e7166] transition hover:bg-[#f6f7ef] hover:text-[#0d6b4d]"
                aria-label="Zoom arrière"
              >
                <Minus size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={fitToScreen}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#5e7166] transition hover:bg-[#f6f7ef] hover:text-[#0d6b4d]"
                aria-label="Réinitialiser le zoom"
              >
                <Maximize2 size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => zoomAt((containerRef.current?.clientWidth ?? 0) / 2, (containerRef.current?.clientHeight ?? 0) / 2, 1.25)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#5e7166] transition hover:bg-[#f6f7ef] hover:text-[#0d6b4d]"
                aria-label="Zoom avant"
              >
                <Plus size={15} aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center gap-1 rounded-md border border-[#dfe6d7] bg-white p-1">
              <button
                type="button"
                onClick={handleExportPng}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#5e7166] transition hover:bg-[#f6f7ef] hover:text-[#0d6b4d]"
                aria-label="Exporter le schéma en PNG"
              >
                <Download size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#5e7166] transition hover:bg-[#f6f7ef] hover:text-[#0d6b4d]"
                aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 size={15} aria-hidden="true" /> : <Expand size={15} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`relative h-[560px] w-full touch-none overflow-hidden bg-[#fbfbf7] sm:h-[700px] ${isFullscreen ? "sm:h-[calc(100vh-140px)]" : ""} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          <div style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: "0 0", width: SCENE_WIDTH, height: SCENE_HEIGHT }}>
            <svg width={SCENE_WIDTH} height={SCENE_HEIGHT} viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`} className="select-none">
              <defs>
                {Object.entries(FAMILY_META).map(([family, meta]) => (
                  <marker key={family} id={`arrow-${family}`} markerWidth="8" markerHeight="8" refX="5.5" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L6,3 L0,6 Z" fill={meta.dot} />
                  </marker>
                ))}
                <marker id="arrow-highlight" markerWidth="8" markerHeight="8" refX="5.5" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L6,3 L0,6 Z" fill={ACCENT} />
                </marker>
                <marker id="arrow-selected" markerWidth="8" markerHeight="8" refX="5.5" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L6,3 L0,6 Z" fill={SELECTED} />
                </marker>
              </defs>

              <rect data-role="background" x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="#fbfbf7" onClick={handleBackgroundClick} />
              <image
                href={OFFICIAL_SCHEMA_SRC}
                x={0}
                y={0}
                width={SCENE_WIDTH}
                height={SCENE_HEIGHT}
                preserveAspectRatio="none"
                pointerEvents="none"
              />

              {liveEquipments
                .filter((equipment) => equipment.status === "Actif")
                .map((equipment) => {
                  const layout = getEquipmentLayout(equipment.code);
                  if (!layout) return null;
                  return <FlowOverlay key={`flow-${equipment.code}`} equipment={equipment} layout={layout} />;
                })}

              {liveEquipments.map((equipment) => {
                const layout = getEquipmentLayout(equipment.code);
                if (!layout) return null;
                const dim = selectedCode
                  ? !highlightSet.has(equipment.code)
                  : familyFilter
                    ? equipment.family !== familyFilter
                    : false;
                return <EquipmentShape key={equipment.code} equipment={equipment} layout={layout} mode="base" dim={dim} onSelect={handleSelect} />;
              })}
              {liveEquipments.filter((equipment) => highlightSet.has(equipment.code) && equipment.code !== selectedCode).map((equipment) => {
                const layout = getEquipmentLayout(equipment.code)!;
                return <EquipmentShape key={`hl-${equipment.code}`} equipment={equipment} layout={layout} mode="highlight" dim={false} onSelect={handleSelect} />;
              })}
              {!selectedCode &&
                familyFilter &&
                liveEquipments
                  .filter((equipment) => equipment.family === familyFilter)
                  .map((equipment) => {
                    const layout = getEquipmentLayout(equipment.code);
                    if (!layout) return null;
                    return <EquipmentShape key={`fam-${equipment.code}`} equipment={equipment} layout={layout} mode="highlight" dim={false} onSelect={handleSelect} />;
                  })}
              {selected && (
                <EquipmentShape
                  key={`sel-${selected.code}`}
                  equipment={selected}
                  layout={getEquipmentLayout(selected.code)!}
                  mode="selected"
                  dim={false}
                  onSelect={handleSelect}
                />
              )}

              {Array.from(activeStopCodes).map((code) => {
                const layout = getEquipmentLayout(code);
                const point = layout && anchorPoint(layout);
                if (!point) return null;
                return <AlertPulse key={`alert-${code}`} x={point.x} y={point.y} />;
              })}
            </svg>
          </div>

          <MiniMap containerSize={containerSize} transform={transform} onJump={jumpTo} />
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <section className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">Légende</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(FAMILY_META) as [EquipmentFamily, (typeof FAMILY_META)[EquipmentFamily]][]).map(([family, meta]) => (
              <button
                key={meta.label}
                type="button"
                onClick={() => toggleFamilyFilter(family)}
                className={`flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] font-bold transition ${
                  familyFilter === family ? "bg-[#f6f7ef] text-[#0d6b4d]" : "text-[#314238] hover:bg-[#f6f7ef]"
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.dot }} aria-hidden="true" />
                {meta.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-4 text-[#8a9689]">
            Molette pour zoomer, glisser pour déplacer. Cliquez un équipement pour surligner son trajet, ou une famille dans la
            légende pour filtrer.
          </p>
        </section>

        {!selected ? (
          <section className="rounded-lg border border-dashed border-[#cfe3d8] bg-[#f6f7ef] p-4 text-xs leading-5 text-[#6c7c71]">
            Sélectionnez un équipement sur le schéma, ou recherchez-le par code, pour afficher ses informations et surligner son
            trajet.
          </section>
        ) : (
          <section className="rounded-lg border border-[#dfe6d7] bg-white/90 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-xl font-medium tracking-tight text-[#102b20]">{selected.label}</p>
                <span
                  className="mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.06em]"
                  style={{ color: FAMILY_META[selected.family].text, backgroundColor: FAMILY_META[selected.family].bg, borderColor: FAMILY_META[selected.family].border }}
                >
                  {FAMILY_META[selected.family].label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCode(null)}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#829187] transition hover:bg-[#f6f7ef] hover:text-[#0d6b4d]"
                aria-label="Fermer les informations"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#314238]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_DOT[selected.status] }} aria-hidden="true" />
              {selected.status}
            </div>

            <div className="mt-4 grid gap-2 text-xs">
              <InfoRow label="Zone" value={selected.zone} />
              <InfoRow label="Type" value={selected.type} />
              <InfoRow label="Circuit associé" value={getCircuitById(selected.circuitId)?.name ?? "—"} />
              {selected.qualite && <InfoRow label="Qualité" value={selected.qualite} />}
            </div>

            {stockByCode[selected.code] && (
              <div className="mt-4 rounded-md border border-[#cfe3d8] bg-[#e8f4ed] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#0d6b4d]">
                  Stock réel — Gestion de stock
                  {"existantSource" in stockByCode[selected.code] && (stockByCode[selected.code] as CelluleMovement).existantSource === "cumul" && (
                    <span className="ml-1.5 rounded-full border border-[#f3c9a8] bg-[#fdece0] px-1.5 py-0.5 text-[9px] font-black normal-case tracking-normal text-[#a5460f]">
                      cumul calculé
                    </span>
                  )}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-[#102b20]">
                  <span>Existant : {stockByCode[selected.code].existant.toLocaleString("fr-FR")} t</span>
                  {"qualite" in stockByCode[selected.code] && (stockByCode[selected.code] as CelluleMovement).qualite && (
                    <span>Qualité : {(stockByCode[selected.code] as CelluleMovement).qualite}</span>
                  )}
                  <span className="text-[#0d6b4d]">
                    Entrant : {stockByCode[selected.code].entrant > 0 ? `+${stockByCode[selected.code].entrant.toLocaleString("fr-FR")} t` : "—"}
                  </span>
                  <span className="text-[#a5460f]">
                    Sortant : {stockByCode[selected.code].sortant > 0 ? `-${stockByCode[selected.code].sortant.toLocaleString("fr-FR")} t` : "—"}
                  </span>
                </div>
              </div>
            )}

            {selectedArrets.length > 0 && (
              <div className="mt-4 rounded-md border border-[#f3c9a8] bg-[#fdece0] p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#a5460f]">
                  <AlertOctagon size={12} aria-hidden="true" />
                  Historique des arrêts ({selectedArretsAnalysis.count})
                </p>
                <p className="mt-1.5 text-xs font-bold text-[#102b20]">
                  Immobilisation cumulée : {formatDuration(selectedArretsAnalysis.totalMinutes)}
                  {selectedArretsAnalysis.ongoing > 0 && <span className="ml-1.5 text-[#9a2f2f]">· {selectedArretsAnalysis.ongoing} en cours</span>}
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-[11px] font-semibold text-[#6c7c71]">
                  {selectedArrets.slice(0, 4).map((a) => (
                    <li key={a.id}>
                      {a.nature} · {a.dateDebut} {a.heureDebut}
                      {a.heureFin ? `–${a.heureFin}` : " (en cours)"}
                    </li>
                  ))}
                  {selectedArrets.length > 4 && <li>+ {selectedArrets.length - 4} autre(s)</li>}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#5e7166]">Trajet</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {selected.trajet.split(" → ").map((step, index) => (
                  <span key={`${step}-${index}`} className="flex items-center gap-1">
                    {index > 0 && <span className="text-[#a9b1aa]">→</span>}
                    <span className="rounded-full border border-[#cfe3d8] bg-[#e8f4ed] px-2 py-0.5 text-[10px] font-bold text-[#0d6b4d]">{step}</span>
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-[#6c7c71]">{selected.description}</p>

            {(selected.code === "SA200" || selected.code === "SB300") && (
              <div className="mt-4 rounded-md border border-[#dfe6d7] bg-[#f6f7ef] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.06em] text-[#5e7166]">Branches ouvertes</p>
                <div className="mt-1.5 flex flex-col gap-1">
                  {(["branchA", "branchB"] as const).map((branch) => (
                    <label key={branch} className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#102b20]">
                      <input
                        type="checkbox"
                        checked={aiguillages[selected.code]?.[branch] ?? false}
                        onChange={() => toggleAiguillageBranch(selected.code, branch)}
                        className="h-3.5 w-3.5 accent-[#0d6b4d]"
                      />
                      {branch === "branchA" ? "Branche A" : "Branche B"}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedOwner && (
              <div className="mt-4 rounded-md border border-[#b9ddc9] bg-[#eef8f1] p-3 text-xs font-bold text-[#237343]">
                Reprise active pour {selectedOwner.peseuseId.replace("peseuse-", "Peseuse ").toUpperCase()} (
                {selectedOwner.group === "axis" ? "axe" : "Lot 3"}) —{" "}
                {(selectedOwner.group === "axis" ? axisSelection : lot3Selection)[selectedOwner.peseuseId] === selected.code
                  ? "sélectionnée"
                  : "non sélectionnée"}
                .
              </div>
            )}
          </section>
        )}
      </aside>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-2.5 py-2">
      <p className="font-black uppercase tracking-[0.06em] text-[#5e7166]">{label}</p>
      <p className="mt-1 font-bold text-[#102b20]">{value}</p>
    </div>
  );
}

function EquipmentShape({
  equipment,
  layout,
  mode,
  dim,
  onSelect
}: {
  equipment: Equipment;
  layout: EquipmentLayout;
  mode: Mode;
  dim: boolean;
  onSelect: (code: string) => void;
}) {
  const meta = FAMILY_META[equipment.family];
  const opacity = dim ? 0.3 : 1;
  const strokeColor = mode === "selected" ? SELECTED : mode === "highlight" ? ACCENT : meta.dot;
  const markerId = mode === "selected" ? "arrow-selected" : mode === "highlight" ? "arrow-highlight" : `arrow-${equipment.family}`;

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(equipment.code);
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(equipment.code);
    }
  };

  // Mode "base" (rien sélectionné) : le document officiel affiché en fond montre déjà cet
  // équipement au pixel près — on ne dessine donc rien de visible ici, seulement la zone de clic.
  // Un contour coloré n'apparaît que pour indiquer un survol/trajet en surbrillance ou l'élément
  // sélectionné, en surimpression du document plutôt qu'à sa place.
  const showOverlay = mode !== "base";

  if (layout.shape === "line" && layout.path) {
    const points = layout.path.map((point) => `${point.x},${point.y}`).join(" ");
    const long = pathLength(layout.path) > 30;
    const strokeWidth = mode === "selected" ? 6 : 5;
    const isValveGate = equipment.code === "SA84" || equipment.code === "SB84";
    const gateEnd = layout.path[layout.path.length - 1];
    const gateFacesRight = equipment.code === "SB84";
    return (
      <g role="button" tabIndex={0} aria-label={equipment.label} onClick={handleClick} onKeyDown={handleKeyDown} className="cursor-pointer outline-none" opacity={opacity}>
        <polyline points={points} fill="none" stroke="transparent" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        {showOverlay && (
          <>
            <polyline
              points={points}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={!isValveGate && long ? `url(#${markerId})` : undefined}
            />
            {isValveGate && (
              <path
                d={`M ${gateEnd.x - 16} ${gateEnd.y} A 16 16 0 0 ${gateFacesRight ? 1 : 0} ${gateEnd.x + 16} ${gateEnd.y}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
            <text
              x={layout.path[layout.path.length - 1].x + 6}
              y={layout.path[layout.path.length - 1].y - 6}
              style={{ fontSize: 10, fontWeight: 800, fill: strokeColor }}
            >
              {equipment.code}
            </text>
          </>
        )}
      </g>
    );
  }

  if (layout.shape === "rect" && layout.position && layout.w && layout.h) {
    const theme = cellTheme(equipment, layout);
    const isNarrow = layout.w < 40;
    const isHopperBattery = equipment.code === "T10";
    const strokeWidth = mode === "selected" ? 3.5 : 3;
    const cx = layout.position.x + layout.w / 2;
    const cy = layout.position.y + layout.h / 2;
    return (
      <g role="button" tabIndex={0} aria-label={equipment.label} onClick={handleClick} onKeyDown={handleKeyDown} className="cursor-pointer outline-none" opacity={opacity}>
        <rect x={layout.position.x} y={layout.position.y} width={layout.w} height={layout.h} fill="transparent" />
        {showOverlay && (
          <>
            <rect
              x={layout.position.x}
              y={layout.position.y}
              width={layout.w}
              height={layout.h}
              rx={3}
              fill={theme.fill}
              fillOpacity={0.55}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {isHopperBattery &&
              Array.from({ length: 6 }).map((_, i) => {
                const cellW = layout.w! / 6;
                const hx = layout.position!.x + cellW * (i + 0.5);
                const topY = layout.position!.y + 8;
                const botY = layout.position!.y + layout.h! - 8;
                return (
                  <path
                    key={i}
                    d={`M ${hx - cellW * 0.35} ${topY} L ${hx + cellW * 0.35} ${topY} L ${hx} ${botY} Z`}
                    fill="none"
                    stroke={theme.stroke}
                    strokeWidth={1.25}
                  />
                );
              })}
            {mode === "selected" && (
              <rect
                x={layout.position.x - 4}
                y={layout.position.y - 4}
                width={layout.w + 8}
                height={layout.h + 8}
                rx={5}
                fill="none"
                stroke={SELECTED}
                strokeDasharray="4 3"
                strokeWidth={1.5}
              />
            )}
            <text
              x={cx}
              y={isHopperBattery ? layout.position.y - 6 : cy}
              textAnchor="middle"
              dominantBaseline={isHopperBattery ? "auto" : "middle"}
              transform={isNarrow ? `rotate(-90 ${cx} ${cy})` : undefined}
              style={{ fontSize: isNarrow ? 9 : 11, fontWeight: 800, fill: theme.text }}
            >
              {equipment.code}
            </text>
          </>
        )}
      </g>
    );
  }

  if (layout.shape === "circle" && layout.position && layout.r) {
    const strokeWidth = mode === "selected" ? 3.5 : 3;
    const isAiguillage = equipment.type === "Aiguillage convoyeur";
    return (
      <g role="button" tabIndex={0} aria-label={equipment.label} onClick={handleClick} onKeyDown={handleKeyDown} className="cursor-pointer outline-none" opacity={opacity}>
        <circle cx={layout.position.x} cy={layout.position.y} r={Math.max(layout.r, 10) * (isAiguillage ? 1.8 : 1.6)} fill="transparent" />
        {showOverlay && (
          <>
            {isAiguillage ? (
              <path
                d={`M ${layout.position.x - layout.r * 1.6} ${layout.position.y - layout.r} L ${layout.position.x + layout.r * 1.6} ${layout.position.y - layout.r} L ${layout.position.x + layout.r * 0.5} ${layout.position.y + layout.r * 1.4} L ${layout.position.x - layout.r * 0.5} ${layout.position.y + layout.r * 1.4} Z`}
                fill={meta.bg}
                fillOpacity={0.55}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
              />
            ) : (
              <circle cx={layout.position.x} cy={layout.position.y} r={layout.r} fill={meta.dot} stroke="white" strokeWidth={1.5} />
            )}
            <circle cx={layout.position.x} cy={layout.position.y} r={layout.r + (isAiguillage ? 10 : 5)} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
            <text
              x={layout.position.x}
              y={layout.position.y - layout.r - (isAiguillage ? 10 : 8)}
              textAnchor="middle"
              style={{ fontSize: 10, fontWeight: 800, fill: "#314238" }}
            >
              {equipment.code}
            </text>
          </>
        )}
      </g>
    );
  }

  return null;
}
