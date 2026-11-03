import {useEffect, useState} from 'react';
import {continueRender, delayRender, interpolate, spring, staticFile} from 'remotion';

export const C = {
  amarillo: '#F59E0B', ambar: '#D97706', crema: '#FEF3C7', carbon: '#1F2937', negro: '#111827',
  gris: '#6B7280', niebla: '#F9FAFB', blanco: '#FFFFFF', exito: '#10B981', fondo: '#0B0F17',
};
export const FPS = 30;
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const entra = (f: number, desde: number, damping = 16) => spring({frame: f - desde, fps: FPS, config: {damping}});
export const tramo = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
export const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR');

export const useFuentes = () => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    const fs = [
      new FontFace('BarlowC', `url(${staticFile('bc800.woff2')})`, {weight: '800'}),
      new FontFace('BarlowS', `url(${staticFile('b600.woff2')})`, {weight: '600'}),
    ];
    Promise.all(fs.map((f) => f.load())).then((ok) => { ok.forEach((f) => document.fonts.add(f)); continueRender(h); });
  }, [h]);
};
