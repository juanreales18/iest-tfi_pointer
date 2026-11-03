import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, clamp} from './marca';

const S = 52;
const iso = (x: number, y: number, z = 0): [number, number] => [(x - y) * S * 0.866, (x + y) * S * 0.5 - z * S];
const pts = (p: [number, number][]) => p.map((q) => q.join(',')).join(' ');
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Edif = {x: number; y: number; w: number; d: number; h: number; ventanas: boolean[]; kiosco?: boolean};
const R = rng(7);
const BLOQ = 5;
export const KIOSCO = {x: 2 * 4 + 0.7, y: 2 * 4 + 2.2, w: 1.0, d: 1.0, h: 0.7};
const edificios: Edif[] = [];
for (let bi = 0; bi < BLOQ; bi++) for (let bj = 0; bj < BLOQ; bj++) for (let li = 0; li < 2; li++) for (let lj = 0; lj < 2; lj++) {
  const x = bi * 4 + 0.7 + li * 1.4, y = bj * 4 + 0.7 + lj * 1.4;
  if (bi === 2 && bj === 2 && li === 0 && lj === 1) continue;
  const h = R() < 0.06 ? 1.0 + R() * 0.5 : 0.4 + R() * 0.4;
  edificios.push({x, y, w: 1.2, d: 1.2, h, ventanas: Array.from({length: 12}, () => R() < 0.35)});
}
edificios.push({...KIOSCO, ventanas: [], kiosco: true});
edificios.sort((a, b) => a.x + a.w / 2 + a.y + a.d / 2 - (b.x + b.w / 2 + b.y + b.d / 2));
const faroles: [number, number][] = [];
for (let i = 0; i <= BLOQ; i++) for (let j = 0; j < BLOQ; j++) { faroles.push([i * 4 + 0.2, j * 4 + 2]); faroles.push([j * 4 + 2, i * 4 + 0.2]); }
const PUERTA: [number, number] = [KIOSCO.x + 0.5, KIOSCO.y + KIOSCO.d + 0.35];
const personas = Array.from({length: 18}, (_, i) => {
  const r = rng(100 + i);
  return {inicio: [Math.floor(r() * (BLOQ + 1)) * 4, r() * BLOQ * 4] as [number, number], retraso: r() * 0.35, fase: r() * 6, destino: [PUERTA[0] - 1.2 + (i % 6) * 0.45, PUERTA[1] + 0.25 + Math.floor(i / 6) * 0.35] as [number, number]};
});

const Caja: React.FC<{e: Edif; brillo: number; tenue: number}> = ({e, brillo, tenue}) => {
  const {x, y, w, d, h} = e;
  const top = [iso(x, y, h), iso(x + w, y, h), iso(x + w, y + d, h), iso(x, y + d, h)];
  const cx = [iso(x + w, y, 0), iso(x + w, y + d, 0), iso(x + w, y + d, h), iso(x + w, y, h)];
  const cy = [iso(x, y + d, 0), iso(x + w, y + d, 0), iso(x + w, y + d, h), iso(x, y + d, h)];
  if (e.kiosco) {
    return (
      <g>
        <polygon points={pts(cx)} fill="#1B2130" /><polygon points={pts(cy)} fill="#222A3B" /><polygon points={pts(top)} fill="#2B3446" />
        {/* puerta con luz tenue (el kiosquero abre) */}
        <polygon points={pts([iso(x + 0.35, y + d, 0), iso(x + 0.65, y + d, 0), iso(x + 0.65, y + d, 0.45), iso(x + 0.35, y + d, 0.45)])} fill="#F7C873" opacity={tenue * 0.8} />
        <g opacity={brillo}>
          <polygon points={pts(cx)} fill="#B45309" /><polygon points={pts(cy)} fill={C.amarillo} /><polygon points={pts(top)} fill="#FBBF24" />
          <polygon points={pts([iso(x, y + d, h * 0.75), iso(x + w, y + d, h * 0.75), iso(x + w, y + d + 0.25, h * 0.6), iso(x, y + d + 0.25, h * 0.6)])} fill={C.carbon} />
        </g>
      </g>
    );
  }
  const vent: React.ReactNode[] = []; let k = 0;
  const filas = Math.max(1, Math.floor((h - 0.2) / 0.35));
  for (let f = 0; f < filas; f++) for (let c = 0; c < 3; c++) {
    const z = 0.2 + f * 0.35, u = 0.2 + c * 0.35, on = e.ventanas[k++ % 12];
    const col = on ? '#F7C873' : '#2A3142';
    vent.push(<polygon key={`y${f}${c}`} points={pts([iso(x + u, y + d, z), iso(x + u + 0.14, y + d, z), iso(x + u + 0.14, y + d, z + 0.14), iso(x + u, y + d, z + 0.14)])} fill={col} opacity={on ? 0.9 : 1} />);
    vent.push(<polygon key={`x${f}${c}`} points={pts([iso(x + w, y + u, z), iso(x + w, y + u + 0.14, z), iso(x + w, y + u + 0.14, z + 0.14), iso(x + w, y + u, z + 0.14)])} fill={col} opacity={on ? 0.75 : 1} />);
  }
  return <g><polygon points={pts(cx)} fill="#171C27" /><polygon points={pts(cy)} fill="#1D2331" /><polygon points={pts(top)} fill="#2A3140" />{vent}</g>;
};

export type PuebloProps = {
  brillo: number;        // 0 kiosco apagado, 1 encendido en amarillo
  tenue?: number;        // luz chica en la puerta
  zoom: number;
  foco: number;          // 0 centro del pueblo, 1 kiosco
  llegada: number;       // 0 la gente deambula, 1 llegó al kiosco
  kiosquero?: number;    // opacidad del kiosquero en la puerta
  etiqueta?: {texto: string; v: number; valor?: string};
};

export const Pueblo: React.FC<PuebloProps> = ({brillo, tenue = 0, zoom, foco, llegada, kiosquero = 0, etiqueta}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const kp = iso(KIOSCO.x + 0.5, KIOSCO.y + 0.5, 0.35);
  const centro = iso(BLOQ * 2, BLOQ * 2, 0);
  const cx = centro[0] + (kp[0] - centro[0]) * foco, cy = centro[1] + (kp[1] - centro[1]) * foco;
  const halo = iso(KIOSCO.x + 0.5, KIOSCO.y + 0.9);
  return (
    <svg width={width} height={height} style={{position: 'absolute'}}>
      <defs>
        <radialGradient id="farol"><stop offset="0%" stopColor="#FFE7B0" stopOpacity="0.9" /><stop offset="100%" stopColor="#FFE7B0" stopOpacity="0" /></radialGradient>
        <radialGradient id="halo"><stop offset="0%" stopColor={C.amarillo} stopOpacity="0.75" /><stop offset="100%" stopColor={C.amarillo} stopOpacity="0" /></radialGradient>
        <radialGradient id="vineta" cx="50%" cy="50%" r="70%"><stop offset="55%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity="0.75" /></radialGradient>
      </defs>
      <rect width={width} height={height} fill={C.fondo} />
      <g transform={`translate(${width / 2},${height / 2}) scale(${zoom}) translate(${-cx},${-cy})`}>
        <polygon points={pts([iso(-1, -1), iso(BLOQ * 4 + 1, -1), iso(BLOQ * 4 + 1, BLOQ * 4 + 1), iso(-1, BLOQ * 4 + 1)])} fill="#141A24" />
        {Array.from({length: BLOQ}, (_, i) => Array.from({length: BLOQ}, (_, j) => (
          <polygon key={`m${i}${j}`} points={pts([iso(i * 4 + 0.5, j * 4 + 0.5), iso(i * 4 + 3.5, j * 4 + 0.5), iso(i * 4 + 3.5, j * 4 + 3.5), iso(i * 4 + 0.5, j * 4 + 3.5)])} fill="#1A2030" />
        )))}
        <ellipse cx={halo[0]} cy={halo[1]} rx={S * 3.2} ry={S * 1.7} fill="url(#halo)" opacity={brillo} />
        {faroles.map(([x, y], i) => { const p = iso(x, y, 0.9); return <circle key={i} cx={p[0]} cy={p[1]} r={S * 0.55} fill="url(#farol)" opacity={0.55} />; })}
        {edificios.map((e, i) => <Caja key={i} e={e} brillo={brillo} tenue={tenue} />)}
        {personas.map((p, i) => {
          const a = interpolate(llegada, [p.retraso, p.retraso + 0.65], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
          const dz: [number, number] = [p.inicio[0], p.inicio[1] + Math.sin(frame / 25 + p.fase) * 0.6];
          const mitad: [number, number] = [dz[0], p.destino[1]];
          const pos: [number, number] = a < 0.5 ? [dz[0], dz[1] + (mitad[1] - dz[1]) * a * 2] : [mitad[0] + (p.destino[0] - mitad[0]) * (a - 0.5) * 2, p.destino[1]];
          const pie = iso(pos[0], pos[1], 0), cab = iso(pos[0], pos[1], 0.42);
          return <g key={i}><line x1={pie[0]} y1={pie[1]} x2={cab[0]} y2={cab[1] + 6} stroke="#E5E7EB" strokeWidth={5} strokeLinecap="round" /><circle cx={cab[0]} cy={cab[1]} r={5} fill="#F9FAFB" /></g>;
        })}
        {kiosquero > 0 && (() => {
          const pie = iso(PUERTA[0], PUERTA[1] - 0.15, 0), cab = iso(PUERTA[0], PUERTA[1] - 0.15, 0.5);
          return <g opacity={kiosquero}><line x1={pie[0]} y1={pie[1]} x2={cab[0]} y2={cab[1] + 7} stroke={C.amarillo} strokeWidth={7} strokeLinecap="round" /><circle cx={cab[0]} cy={cab[1]} r={6.5} fill="#F9FAFB" /></g>;
        })()}
        {etiqueta && (
          <g opacity={etiqueta.v} transform={`translate(${kp[0]},${kp[1] - S * 2.2 - (1 - etiqueta.v) * 20})`}>
            <line x1={0} y1={38} x2={0} y2={S * 1.6} stroke={C.amarillo} strokeWidth={2} />
            <circle cx={0} cy={S * 1.6} r={5} fill={C.amarillo} />
            <rect x={-130} y={-6} width={260} height={etiqueta.valor ? 70 : 44} rx={22} fill={C.negro} stroke="#374151" />
            <circle cx={-104} cy={16} r={6} fill={C.amarillo} />
            <text x={8} y={24} textAnchor="middle" fill="#F9FAFB" fontFamily="BarlowS" fontSize={22}>{etiqueta.texto}</text>
            {etiqueta.valor && <text x={0} y={54} textAnchor="middle" fill={C.amarillo} fontFamily="BarlowC" fontSize={28}>{etiqueta.valor}</text>}
          </g>
        )}
      </g>
      <rect width={width} height={height} fill="url(#vineta)" />
    </svg>
  );
};
