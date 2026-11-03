import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Easing, Img, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const AMARILLO = '#F59E0B';
const S = 52; // tamaño de una unidad isométrica en px
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
const BLOQ = 5; // cantidad de manzanas por lado
const KIOSCO = {x: 2 * 4 + 0.7, y: 2 * 4 + 2.2, w: 1.0, d: 1.0, h: 0.7};
const edificios: Edif[] = [];
for (let bi = 0; bi < BLOQ; bi++) for (let bj = 0; bj < BLOQ; bj++) {
  for (let li = 0; li < 2; li++) for (let lj = 0; lj < 2; lj++) {
    const x = bi * 4 + 0.7 + li * 1.4, y = bj * 4 + 0.7 + lj * 1.4;
    if (bi === 2 && bj === 2 && li === 0 && lj === 1) continue; // lugar del kiosco
    const h = R() < 0.06 ? 1.0 + R() * 0.5 : 0.4 + R() * 0.4; // pueblo: casas bajas, muy pocas de dos pisos
    edificios.push({x, y, w: 1.2, d: 1.2, h, ventanas: Array.from({length: 12}, () => R() < 0.35)});
  }
}
edificios.push({...KIOSCO, ventanas: [], kiosco: true});
edificios.sort((a, b) => a.x + a.w / 2 + a.y + a.d / 2 - (b.x + b.w / 2 + b.y + b.d / 2));

const faroles: [number, number][] = [];
for (let i = 0; i <= BLOQ; i++) for (let j = 0; j < BLOQ; j++) { faroles.push([i * 4 + 0.2, j * 4 + 2]); faroles.push([j * 4 + 2, i * 4 + 0.2]); }

const PUERTA: [number, number] = [KIOSCO.x + 0.5, KIOSCO.y + KIOSCO.d + 0.35];
const personas = Array.from({length: 16}, (_, i) => {
  const r = rng(100 + i);
  const calleX = Math.floor(r() * (BLOQ + 1)) * 4;
  const y0 = r() * BLOQ * 4;
  return {inicio: [calleX, y0] as [number, number], retraso: Math.floor(r() * 40), fase: r() * 6};
});

const Caja: React.FC<{e: Edif; brillo: number}> = ({e, brillo}) => {
  const {x, y, w, d, h} = e;
  const top = [iso(x, y, h), iso(x + w, y, h), iso(x + w, y + d, h), iso(x, y + d, h)];
  const caraX = [iso(x + w, y, 0), iso(x + w, y + d, 0), iso(x + w, y + d, h), iso(x + w, y, h)];
  const caraY = [iso(x, y + d, 0), iso(x + w, y + d, 0), iso(x + w, y + d, h), iso(x, y + d, h)];
  const ventanas: React.ReactNode[] = [];
  if (!e.kiosco) {
    let k = 0;
    const filas = Math.max(1, Math.floor((h - 0.2) / 0.35));
    for (let f = 0; f < filas; f++) for (let c = 0; c < 3; c++) {
      const z = 0.2 + f * 0.35, u = 0.2 + c * 0.35;
      const on = e.ventanas[k++ % 12];
      const color = on ? '#F7C873' : '#2A3142';
      ventanas.push(<polygon key={`y${f}${c}`} points={pts([iso(x + u, y + d, z), iso(x + u + 0.14, y + d, z), iso(x + u + 0.14, y + d, z + 0.14), iso(x + u, y + d, z + 0.14)])} fill={color} opacity={on ? 0.9 : 1} />);
      ventanas.push(<polygon key={`x${f}${c}`} points={pts([iso(x + w, y + u, z), iso(x + w, y + u + 0.14, z), iso(x + w, y + u + 0.14, z + 0.14), iso(x + w, y + u, z + 0.14)])} fill={color} opacity={on ? 0.75 : 1} />);
    }
  }
  if (e.kiosco) {
    const mezcla = (a: string, b: string) => (brillo > 0.5 ? b : a);
    return (
      <g>
        <polygon points={pts(caraX)} fill="#1B2130" />
        <polygon points={pts(caraY)} fill="#222A3B" />
        <polygon points={pts(top)} fill="#2B3446" />
        <g opacity={brillo}>
          <polygon points={pts(caraX)} fill="#B45309" />
          <polygon points={pts(caraY)} fill={AMARILLO} />
          <polygon points={pts(top)} fill="#FBBF24" />
          {/* toldo */}
          <polygon points={pts([iso(x, y + d, h * 0.75), iso(x + w, y + d, h * 0.75), iso(x + w, y + d + 0.25, h * 0.6), iso(x, y + d + 0.25, h * 0.6)])} fill="#1F2937" />
        </g>
        {mezcla('', '')}
      </g>
    );
  }
  return (
    <g>
      <polygon points={pts(caraX)} fill="#171C27" />
      <polygon points={pts(caraY)} fill="#1D2331" />
      <polygon points={pts(top)} fill="#2A3140" />
      {ventanas}
    </g>
  );
};

const useFuentes = () => {
  const [handle] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    const f1 = new FontFace('BarlowC', `url(${staticFile('bc800.woff2')})`, {weight: '800'});
    const f2 = new FontFace('BarlowS', `url(${staticFile('b600.woff2')})`, {weight: '600'});
    Promise.all([f1.load(), f2.load()]).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(handle); });
  }, [handle]);
};

export const Ciudad: React.FC = () => {
  useFuentes();
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const brillo = interpolate(frame, [80, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kp = iso(KIOSCO.x + 0.5, KIOSCO.y + 0.5, 0.35);
  const centro = iso(BLOQ * 2, BLOQ * 2, 0);
  const t = interpolate(frame, [0, 240], [0, 1], {easing: Easing.inOut(Easing.cubic)});
  const zoom = 0.85 + t * 0.55;
  const cx = centro[0] + (kp[0] - centro[0]) * t, cy = centro[1] + (kp[1] - centro[1]) * t;

  const texto = (desde: number, hasta: number) => {
    const entra = spring({frame: frame - desde, fps, config: {damping: 18}});
    const sale = interpolate(frame, [hasta - 10, hasta], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return {opacity: Math.min(entra, sale), transform: `translateY(${(1 - entra) * 40}px)`};
  };
  const etiqueta = spring({frame: frame - 110, fps, config: {damping: 14}});
  const logo = spring({frame: frame - 200, fps, config: {damping: 12}});

  return (
    <AbsoluteFill style={{backgroundColor: '#0B0F17'}}>
      <svg width={width} height={height}>
        <defs>
          <radialGradient id="farol"><stop offset="0%" stopColor="#FFE7B0" stopOpacity="0.9" /><stop offset="100%" stopColor="#FFE7B0" stopOpacity="0" /></radialGradient>
          <radialGradient id="halo"><stop offset="0%" stopColor={AMARILLO} stopOpacity="0.75" /><stop offset="100%" stopColor={AMARILLO} stopOpacity="0" /></radialGradient>
          <radialGradient id="vineta" cx="50%" cy="50%" r="70%"><stop offset="55%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity="0.75" /></radialGradient>
        </defs>
        <g transform={`translate(${width / 2},${height / 2}) scale(${zoom}) translate(${-cx},${-cy})`}>
          {/* suelo y calles */}
          <polygon points={pts([iso(-1, -1), iso(BLOQ * 4 + 1, -1), iso(BLOQ * 4 + 1, BLOQ * 4 + 1), iso(-1, BLOQ * 4 + 1)])} fill="#141A24" />
          {Array.from({length: BLOQ}, (_, i) => Array.from({length: BLOQ}, (_, j) => (
            <polygon key={`m${i}${j}`} points={pts([iso(i * 4 + 0.5, j * 4 + 0.5), iso(i * 4 + 3.5, j * 4 + 0.5), iso(i * 4 + 3.5, j * 4 + 3.5), iso(i * 4 + 0.5, j * 4 + 3.5)])} fill="#1A2030" />
          )))}
          {/* halo del kiosco en el piso */}
          <ellipse cx={iso(KIOSCO.x + 0.5, KIOSCO.y + 0.9)[0]} cy={iso(KIOSCO.x + 0.5, KIOSCO.y + 0.9)[1]} rx={S * 3.2} ry={S * 1.7} fill="url(#halo)" opacity={brillo} />
          {faroles.map(([x, y], i) => { const p = iso(x, y, 0.9); return <circle key={i} cx={p[0]} cy={p[1]} r={S * 0.55} fill="url(#farol)" opacity={0.55} />; })}
          {edificios.map((e, i) => <Caja key={i} e={e} brillo={brillo} />)}
          {personas.map((p, i) => {
            const avance = interpolate(frame, [105 + p.retraso, 175 + p.retraso], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
            const deambula: [number, number] = [p.inicio[0], p.inicio[1] + Math.sin(frame / 25 + p.fase) * 0.6];
            // camino en "L": primero por la calle en x, después en y
            const mitad: [number, number] = [deambula[0], PUERTA[1]];
            const pos: [number, number] = avance < 0.5
              ? [deambula[0], deambula[1] + (mitad[1] - deambula[1]) * (avance * 2)]
              : [mitad[0] + (PUERTA[0] - mitad[0]) * ((avance - 0.5) * 2), PUERTA[1]];
            const pie = iso(pos[0], pos[1], 0), cab = iso(pos[0], pos[1], 0.42);
            return (
              <g key={i}>
                <line x1={pie[0]} y1={pie[1]} x2={cab[0]} y2={cab[1] + 6} stroke="#E5E7EB" strokeWidth={5} strokeLinecap="round" />
                <circle cx={cab[0]} cy={cab[1]} r={5} fill="#F9FAFB" />
              </g>
            );
          })}
          {/* etiqueta sobre el kiosco */}
          <g opacity={etiqueta} transform={`translate(${kp[0]},${kp[1] - S * 2.2 - (1 - etiqueta) * 20})`}>
            <line x1={0} y1={34} x2={0} y2={S * 1.6} stroke={AMARILLO} strokeWidth={2} />
            <circle cx={0} cy={S * 1.6} r={5} fill={AMARILLO} />
            <rect x={-110} y={-6} width={220} height={44} rx={22} fill="#111827" stroke="#374151" />
            <circle cx={-84} cy={16} r={6} fill={AMARILLO} />
            <text x={10} y={24} textAnchor="middle" fill="#F9FAFB" fontFamily="BarlowS" fontSize={22}>Tu kiosco</text>
          </g>
        </g>
        <rect width={width} height={height} fill="url(#vineta)" />
      </svg>

      {/* textos */}
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 110, fontFamily: 'BarlowC', color: '#F9FAFB'}}>
        <div style={{fontSize: 96, letterSpacing: 1, textShadow: '0 4px 24px rgba(0,0,0,0.6)', ...texto(8, 85)}}>Todos los días, <span style={{opacity: interpolate(frame, [35, 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>lo mismo.</span></div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 120, fontFamily: 'BarlowC'}}>
        <div style={{fontSize: 110, letterSpacing: 2, textTransform: 'uppercase', textShadow: '0 4px 24px rgba(0,0,0,0.6)', ...texto(125, 245)}}>
          <span style={{color: '#F9FAFB'}}>Hasta que llegó </span><span style={{color: AMARILLO}}>Pointer</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Img src={staticFile('isotipo.png')} style={{width: 150, height: 150, opacity: logo, transform: `translateY(-260px) scale(${0.6 + logo * 0.4})`, filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.6))'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
