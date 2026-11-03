import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, clamp, useFuentes} from './marca';
import {E3, E4, E8} from './Escenas';
import {N1, N2, N5, N6, N7, N9} from './Escenas2D';

type Escena = {C: React.FC; dur: number; voz?: string; texto?: string; vozDur?: number; sfx?: [string, number, number?][]};
export const ESCENAS: Escena[] = [
  {C: N1, dur: 240, voz: 'voz-01', vozDur: 6.11, texto: 'Todos los días, lo mismo: levantás la persiana, prendés la luz... y agarrás el cuaderno.', sfx: [['whoosh', 40, 0.6]]},
  {C: N2, dur: 270, voz: 'voz-02', vozDur: 7.55, texto: 'Anotás cada venta a mano. Sumás de memoria, tachás, volvés a sumar... y al cerrar, la caja nunca da.', sfx: [['whoosh', 0], ['lapiz', 40], ['lapiz', 95], ['lapiz', 150], ['lapiz', 190]]},
  {C: E3, dur: 240, voz: 'voz-03', vozDur: 6.11, texto: '¿Cuánto vendiste hoy? ¿Qué se está por acabar? ¿Cuánto te deben? Nadie lo sabe con certeza.', sfx: [['whoosh', 0], ['pop', 12], ['pop', 55], ['pop', 100]]},
  {C: E4, dur: 180, voz: 'voz-04', vozDur: 4.36, texto: 'Para eso... está Pointer. El sistema pensado para tu kiosco.', sfx: [['luz', 18], ['pop', 45], ['pop', 75]]},
  {C: N5, dur: 270, voz: 'voz-05', vozDur: 6.53, texto: 'Escaneás el producto con el lector, y Pointer lo suma solo: arma la venta y calcula el total al instante.', sfx: [['whoosh', 0], ['beep', 50], ['beep', 130], ['beep', 195], ['pop', 55], ['pop', 135], ['pop', 200]]},
  {C: N6, dur: 270, voz: 'voz-06', vozDur: 6.84, texto: 'Elegís cómo te pagan, ves el vuelto, y listo. Cada venta queda guardada una sola vez, sin duplicados.', sfx: [['whoosh', 0], ['pop', 116], ['ding', 130]]},
  {C: N7, dur: 270, voz: 'voz-07', vozDur: 6.11, texto: 'Y al cerrar el día, la caja te muestra lo que esperabas, lo que contaste... y si sobra o falta.', sfx: [['whoosh', 0], ['pop', 120], ['ding', 140, 0.6]]},
  {C: E8, dur: 270, voz: 'voz-08', vozDur: 5.96, texto: 'Ahora sabés cuánto vendiste, qué tenés que reponer y cómo está tu caja... sin abrir el cuaderno.', sfx: [['whoosh', 0], ['pop', 20]]},
  {C: N9, dur: 180, voz: 'voz-09', vozDur: 2.77, texto: 'Pointer. Cada venta, en su lugar.', sfx: [['whoosh', 0], ['ding', 8, 0.5]]},
];
export const TOTAL = ESCENAS.reduce((a, e) => a + e.dur, 0);
const INICIO_VOZ = 12;

const Subtitulo: React.FC<{texto: string; dur: number}> = ({texto, dur}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 6, dur - 6, dur], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60}}>
      <div style={{maxWidth: 1400, textAlign: 'center', background: 'rgba(17,24,39,0.82)', color: '#F9FAFB', fontFamily: 'BarlowS', fontSize: 38, padding: '12px 28px', borderRadius: 12, opacity: o}}>{texto}</div>
    </AbsoluteFill>
  );
};
const Transicion: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8, dur - 8, dur], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

export const Spot: React.FC = () => {
  useFuentes();
  let ini = 0;
  return (
    <AbsoluteFill style={{background: C.fondo}}>
      <Audio src={staticFile('sfx/musica.wav')} volume={0.35} />
      {ESCENAS.map((e, i) => {
        const desde = ini; ini += e.dur;
        const vozFrames = Math.ceil((e.vozDur ?? 0) * 30);
        return (
          <Sequence key={i} from={desde} durationInFrames={e.dur} name={`Escena ${i + 1}`}>
            <Transicion dur={e.dur}><e.C /></Transicion>
            {e.voz && <Sequence from={INICIO_VOZ}><Audio src={staticFile(`voz/${e.voz}.mp3`)} volume={1} /></Sequence>}
            {e.texto && <Sequence from={INICIO_VOZ} durationInFrames={vozFrames + 12}><Subtitulo texto={e.texto} dur={vozFrames + 12} /></Sequence>}
            {e.sfx?.map(([s, fr, vol], j) => <Sequence key={j} from={fr}><Audio src={staticFile(`sfx/${s}.wav`)} volume={(vol ?? 1) * 0.5} /></Sequence>)}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
