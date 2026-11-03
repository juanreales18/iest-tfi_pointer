import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, clamp, entra, pesos, tramo} from './marca';
import {Pueblo} from './Pueblo';

// ---------- piezas comunes ----------
const sombra = '0 4px 24px rgba(0,0,0,0.6)';
export const Titulo: React.FC<{desde: number; hasta?: number; arriba?: boolean; tam?: number; caja?: boolean; children: React.ReactNode}> = ({desde, hasta = 9999, arriba = true, tam = 92, caja = false, children}) => {
  const f = useCurrentFrame();
  const v = entra(f, desde, 18);
  const sale = interpolate(f, [hasta - 10, hasta], [1, 0], clamp);
  return (
    <AbsoluteFill style={{justifyContent: arriba ? 'flex-start' : 'flex-end', alignItems: 'center', paddingTop: arriba ? 96 : 0, paddingBottom: arriba ? 0 : 190}}>
      <div style={{fontFamily: 'BarlowC', fontSize: tam, color: C.niebla, letterSpacing: 1, textShadow: sombra, textAlign: 'center', opacity: Math.min(v, sale), transform: `translateY(${(1 - v) * 40}px)`, ...(caja ? {background: 'rgba(17,24,39,0.85)', padding: '10px 40px', borderRadius: 18} : {})}}>{children}</div>
    </AbsoluteFill>
  );
};
const A: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{color: C.amarillo}}>{children}</span>;
const Tarjeta: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
  <div style={{background: C.negro, border: '1px solid #374151', borderRadius: 20, boxShadow: '0 30px 80px rgba(0,0,0,0.55)', color: C.niebla, fontFamily: 'BarlowS', ...style}}>{children}</div>
);
const Fondo: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, #1A2233 0%, ${C.fondo} 70%)`}}>
    <svg width="100%" height="100%" style={{opacity: 0.18}}>
      {Array.from({length: 40}, (_, i) => <line key={i} x1={i * 60 - 600} y1={0} x2={i * 60} y2={1080} stroke="#334155" strokeWidth={1} />)}
    </svg>
  </AbsoluteFill>
);

// ---------- escenas ----------
export const E1: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Pueblo brillo={0} tenue={tramo(f, 70, 95)} zoom={0.8 + tramo(f, 0, 210) * 0.15} foco={tramo(f, 0, 210) * 0.4} llegada={0} kiosquero={tramo(f, 60, 80)} />
      <Titulo desde={10}>Todos los días, <span style={{opacity: tramo(f, 55, 70)}}>lo mismo.</span></Titulo>
    </AbsoluteFill>
  );
};

const lineas = [
  {t: 'Alfajor', p: '$ 900', d: 20},
  {t: 'Gaseosa', p: '$ 2.300', d: 45},
  {t: 'Chicles', p: '$ 500', d: 70},
  {t: 'Fiado (Don Julio)', p: '$ 1.200', d: 95},
];
export const E2: React.FC = () => {
  const f = useCurrentFrame();
  const v = entra(f, 0, 20);
  const tachar = tramo(f, 150, 175);
  return (
    <AbsoluteFill>
      <Fondo />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{transform: `perspective(1400px) rotateX(28deg) rotateZ(-8deg) scale(${0.9 + v * 0.1})`, opacity: v}}>
          <div style={{width: 760, height: 560, background: C.crema, borderRadius: 14, boxShadow: '0 40px 90px rgba(0,0,0,0.6)', position: 'relative', overflow: 'hidden',
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 63px, #CBD5E1 63px 65px)', backgroundPositionY: 40}}>
            <div style={{position: 'absolute', left: 80, top: 0, bottom: 0, width: 3, background: '#FCA5A5'}} />
            {lineas.map((l, i) => {
              const a = tramo(f, l.d, l.d + 18);
              return (
                <div key={i} style={{position: 'absolute', left: 110, top: 52 + i * 65, width: 560, display: 'flex', justifyContent: 'space-between', fontFamily: 'BarlowS', fontSize: 40, color: C.carbon, transform: `rotate(${(i % 2 ? -1 : 1) * 0.8}deg)`, clipPath: `inset(0 ${100 - a * 100}% 0 0)`}}>
                  <span>{l.t}</span><span>{l.p}</span>
                </div>
              );
            })}
            <div style={{position: 'absolute', left: 110, top: 52 + 4 * 65, width: 560, display: 'flex', justifyContent: 'space-between', fontFamily: 'BarlowC', fontSize: 44, color: C.carbon, opacity: tramo(f, 120, 135)}}>
              <span>TOTAL</span><span style={{position: 'relative'}}>$ 4.?00
                <span style={{position: 'absolute', left: -10, right: -10, top: '50%', height: 5, background: '#B91C1C', transform: `scaleX(${tachar}) rotate(-6deg)`, transformOrigin: 'left'}} />
              </span>
            </div>
            <div style={{position: 'absolute', right: 70, top: 52 + 5 * 65, fontFamily: 'BarlowC', fontSize: 44, color: '#B91C1C', opacity: tramo(f, 175, 190), transform: 'rotate(-4deg)'}}>¿$ 4.800?</div>
          </div>
        </div>
      </AbsoluteFill>
      <Titulo desde={20}>Anotás. <span style={{opacity: tramo(f, 55, 65)}}>Sumás.</span> <span style={{opacity: tramo(f, 150, 160)}}><A>Tachás.</A></span></Titulo>
    </AbsoluteFill>
  );
};

const preguntas = [
  {t: '¿Cuánto vendiste?', d: 12, x: -420, y: -40},
  {t: '¿Qué se está acabando?', d: 55, x: 380, y: 60},
  {t: '¿Y la plata de hoy?', d: 100, x: 0, y: 230, fuerte: true},
];
export const E3: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Pueblo brillo={0} zoom={0.95 + tramo(f, 0, 210) * 0.1} foco={0.4 + tramo(f, 0, 210) * 0.3} llegada={0} kiosquero={1} />
      <AbsoluteFill style={{background: 'rgba(11,15,23,0.35)'}} />
      {preguntas.map((p, i) => {
        const v = entra(f, p.d, 13);
        return (
          <AbsoluteFill key={i} style={{justifyContent: 'center', alignItems: 'center'}}>
            <Tarjeta style={{padding: '22px 40px', fontFamily: 'BarlowC', fontSize: p.fuerte ? 72 : 54, color: p.fuerte ? C.amarillo : C.niebla, opacity: v,
              transform: `translate(${p.x}px, ${p.y - 30 + (1 - v) * 40 - tramo(f, p.d, 210) * 30}px) scale(${0.85 + v * 0.15})`}}>{p.t}</Tarjeta>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

export const E4: React.FC = () => {
  const f = useCurrentFrame();
  const logo = entra(f, 75, 12);
  return (
    <AbsoluteFill>
      <Pueblo brillo={tramo(f, 18, 32)} zoom={1.05 + tramo(f, 0, 150) * 0.3} foco={0.7 + tramo(f, 0, 150) * 0.3} llegada={tramo(f, 30, 150)} kiosquero={1}
        etiqueta={{texto: 'Tu kiosco', v: entra(f, 45, 14)}} />
      <Titulo desde={28}>Para eso está <A>POINTER</A></Titulo>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200}}>
        <Img src={staticFile('isotipo.png')} style={{width: 120, height: 120, opacity: logo, transform: `scale(${0.6 + logo * 0.4})`, filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.6))'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Producto: React.FC<{x: number; v: number}> = ({x, v}) => (
  <div style={{position: 'absolute', left: x, top: 330, width: 300, height: 380, opacity: v, transform: `translateY(${(1 - v) * 60}px) rotate(-6deg)`,
    background: 'linear-gradient(160deg, #334155, #1E293B)', borderRadius: 18, boxShadow: '0 30px 70px rgba(0,0,0,0.6)', border: '1px solid #475569'}}>
    <div style={{position: 'absolute', left: 40, right: 40, top: 40, height: 120, borderRadius: 12, background: '#475569'}} />
    <div style={{position: 'absolute', left: 50, right: 50, bottom: 50, height: 110, background: '#F9FAFB', borderRadius: 6, display: 'flex', alignItems: 'stretch', padding: '12px 14px', gap: 4}}>
      {[3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 4, 1].map((w, i) => <div key={i} style={{width: w * 3, background: C.carbon}} />)}
    </div>
  </div>
);
const items = [{t: 'Alfajor triple', p: 900, d: 62}, {t: 'Gaseosa 500 ml', p: 2300, d: 132}];
export const E5: React.FC = () => {
  const f = useCurrentFrame();
  const barrido1 = tramo(f, 38, 58), barrido2 = tramo(f, 108, 128);
  const laser = (b: number) => (b > 0 && b < 1 ? 1 : 0);
  const totalAnim = interpolate(f, [62, 80, 132, 150], [0, 900, 900, 3200], {...clamp, easing: Easing.out(Easing.cubic)});
  const tarjeta = entra(f, 55, 18);
  return (
    <AbsoluteFill>
      <Fondo />
      <Producto x={220} v={entra(f, 5, 16) * (f < 100 ? 1 : 1 - tramo(f, 92, 100))} />
      <Producto x={220} v={f >= 100 ? entra(f, 100, 16) : 0} />
      {/* lector */}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <g transform="translate(610,300) rotate(-18)">
          <rect x={0} y={0} width={220} height={110} rx={30} fill="#111827" stroke="#374151" strokeWidth={3} />
          <rect x={150} y={80} width={60} height={170} rx={22} fill="#111827" stroke="#374151" strokeWidth={3} />
          <rect x={-6} y={30} width={14} height={50} rx={6} fill={C.amarillo} />
        </g>
        {[barrido1, barrido2].map((b, i) => laser(b) ? (
          <g key={i} opacity={0.9}>
            <line x1={600} y1={360} x2={360} y2={560 + (b - 0.5) * 140} stroke="#F87171" strokeWidth={3} />
            <line x1={330} y1={560 + (b - 0.5) * 140} x2={520} y2={590 + (b - 0.5) * 140} stroke="#EF4444" strokeWidth={6} style={{filter: 'drop-shadow(0 0 10px #EF4444)'}} />
          </g>
        ) : null)}
      </svg>
      {/* venta */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'flex-end', paddingRight: 230}}>
        <Tarjeta style={{width: 620, padding: 36, opacity: tarjeta, transform: `translateX(${(1 - tarjeta) * 120}px)`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24}}>
            <Img src={staticFile('isotipo.png')} style={{width: 44, height: 44}} />
            <div style={{fontFamily: 'BarlowC', fontSize: 34, letterSpacing: 1}}>NUEVA VENTA</div>
          </div>
          {items.map((it, i) => {
            const v = entra(f, it.d, 16);
            return <div key={i} style={{display: 'flex', justifyContent: 'space-between', fontSize: 34, padding: '16px 0', borderBottom: '1px solid #273244', opacity: v, transform: `translateY(${(1 - v) * 16}px)`}}><span>{it.t}</span><span>{pesos(it.p)}</span></div>;
          })}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 26, fontFamily: 'BarlowC'}}>
            <span style={{fontSize: 38, color: '#9CA3AF'}}>TOTAL</span><span style={{fontSize: 72, color: C.amarillo}}>{pesos(totalAnim)}</span>
          </div>
        </Tarjeta>
      </AbsoluteFill>
      <Titulo desde={8}>Escaneá. <span style={{opacity: tramo(f, 120, 130)}}><A>Cobrá.</A></span></Titulo>
    </AbsoluteFill>
  );
};

export const E6: React.FC = () => {
  const f = useCurrentFrame();
  const v = entra(f, 0, 18);
  const recibido = Math.round(interpolate(f, [30, 60], [0, 5000], clamp) / 1000) * 1000;
  const vuelto = entra(f, 70, 14);
  const press = f > 100 && f < 108 ? 0.95 : 1;
  const toast = entra(f, 112, 14);
  const unaVez = entra(f, 150, 14);
  return (
    <AbsoluteFill>
      <Fondo />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Tarjeta style={{width: 900, padding: 44, opacity: v, transform: `translateY(${(1 - v) * 50}px)`}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: 'BarlowC'}}>
            <span style={{fontSize: 40, color: '#9CA3AF'}}>TOTAL</span><span style={{fontSize: 84, color: C.amarillo}}>{pesos(3200)}</span>
          </div>
          <div style={{display: 'flex', gap: 18, margin: '26px 0'}}>
            {['Efectivo', 'Transferencia', 'Tarjeta'].map((m, i) => (
              <div key={m} style={{flex: 1, textAlign: 'center', padding: '18px 0', borderRadius: 12, fontSize: 30, background: i === 0 ? C.amarillo : '#1F2937', color: i === 0 ? C.carbon : '#D1D5DB', fontWeight: 600}}>{m}</div>
            ))}
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 38, padding: '14px 0'}}><span style={{color: '#9CA3AF'}}>Recibido</span><span>{pesos(recibido)}</span></div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 38, padding: '14px 0', opacity: vuelto}}><span style={{color: '#9CA3AF'}}>Vuelto</span><span style={{fontFamily: 'BarlowC', fontSize: 56, color: C.niebla}}>{pesos(1800)}</span></div>
          <div style={{marginTop: 22, padding: '22px 0', textAlign: 'center', borderRadius: 14, background: C.amarillo, color: C.carbon, fontFamily: 'BarlowC', fontSize: 44, letterSpacing: 1, transform: `scale(${press})`}}>COBRAR</div>
        </Tarjeta>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 70}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, background: C.exito, color: '#fff', padding: '18px 34px', borderRadius: 999, fontFamily: 'BarlowS', fontSize: 36, opacity: toast, transform: `translateY(${(1 - toast) * -40}px)`, boxShadow: '0 20px 50px rgba(16,185,129,0.35)'}}>
          <span style={{fontSize: 40}}>✓</span> Venta registrada
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-end', padding: '0 120px 190px 0'}}>
        <Tarjeta style={{padding: '16px 28px', fontSize: 30, opacity: unaVez, transform: `scale(${0.8 + unaVez * 0.2})`}}><A>●</A> Guardada una sola vez</Tarjeta>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const E7: React.FC = () => {
  const f = useCurrentFrame();
  const v = entra(f, 0, 18);
  const contado = interpolate(f, [45, 80], [0, 48500], {...clamp, easing: Easing.out(Easing.cubic)});
  const dif = entra(f, 90, 14);
  const chip = entra(f, 105, 12);
  const fila = (t: string, val: React.ReactNode, o = 1) => <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 40, padding: '20px 0', borderBottom: '1px solid #273244', opacity: o}}><span style={{color: '#9CA3AF'}}>{t}</span>{val}</div>;
  return (
    <AbsoluteFill>
      <Fondo />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Tarjeta style={{width: 860, padding: 48, opacity: v, transform: `translateY(${(1 - v) * 50}px)`}}>
          <div style={{fontFamily: 'BarlowC', fontSize: 46, letterSpacing: 1, marginBottom: 14}}>CIERRE DE CAJA</div>
          {fila('Esperado en efectivo', <span style={{fontFamily: 'BarlowC', fontSize: 52}}>{pesos(48500)}</span>, tramo(f, 15, 30))}
          {fila('Contado', <span style={{fontFamily: 'BarlowC', fontSize: 52}}>{pesos(contado)}</span>, tramo(f, 40, 50))}
          {fila('Diferencia', <span style={{fontFamily: 'BarlowC', fontSize: 64, color: C.amarillo}}>{pesos(0)}</span>, dif)}
          <div style={{display: 'flex', gap: 16, marginTop: 30}}>
            {['Sobra', 'Falta', 'Sin diferencia'].map((c, i) => (
              <div key={c} style={{flex: i === 2 ? 1.6 : 1, textAlign: 'center', padding: '16px 0', borderRadius: 999, fontSize: 30, opacity: i === 2 ? chip : 0.35 * chip,
                background: i === 2 ? C.exito : '#1F2937', color: i === 2 ? '#fff' : '#9CA3AF', transform: i === 2 ? `scale(${0.85 + chip * 0.15})` : 'none'}}>{c}</div>
            ))}
          </div>
        </Tarjeta>
      </AbsoluteFill>
      <Titulo desde={8}>La caja, <A>al día.</A></Titulo>
    </AbsoluteFill>
  );
};

export const E8: React.FC = () => {
  const f = useCurrentFrame();
  const cuaderno = 1 - tramo(f, 120, 150);
  return (
    <AbsoluteFill>
      <Pueblo brillo={1} zoom={1.35 - tramo(f, 0, 240) * 0.35} foco={1 - tramo(f, 0, 240) * 0.35} llegada={1} kiosquero={1}
        etiqueta={{texto: 'Ventas de hoy', v: entra(f, 20, 14), valor: pesos(interpolate(f, [25, 70], [0, 48500], {...clamp, easing: Easing.out(Easing.cubic)}))}} />
      <Titulo desde={15}>Ahora sabés <A>cuánto vendiste.</A></Titulo>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 0 200px 150px'}}>
        <div style={{width: 120, height: 150, background: C.crema, borderRadius: 10, opacity: cuaderno * entra(f, 60, 14), transform: `translateY(${(1 - cuaderno) * 120}px) rotate(${-8 + (1 - cuaderno) * 25}deg) scale(${0.6 + cuaderno * 0.4})`,
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 18px, #CBD5E1 18px 20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const E9: React.FC = () => {
  const f = useCurrentFrame();
  const v = entra(f, 6, 14);
  const t2 = entra(f, 30, 16), t3 = entra(f, 55, 16);
  return (
    <AbsoluteFill style={{background: C.niebla, justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <Img src={staticFile('logo-horizontal.png')} style={{width: 860, opacity: v, transform: `scale(${0.85 + v * 0.15})`}} />
      <div style={{fontFamily: 'BarlowC', fontSize: 64, color: C.carbon, marginTop: 10, opacity: t2, transform: `translateY(${(1 - t2) * 20}px)`}}>Cada venta, en su lugar.</div>
      <div style={{fontFamily: 'BarlowS', fontSize: 30, color: C.gris, marginTop: 26, opacity: t3}}>Hecho en Tinogasta · pointer-demo.netlify.app</div>
      <div style={{position: 'absolute', bottom: 40, fontFamily: 'BarlowS', fontSize: 22, color: '#9CA3AF', opacity: t3}}>Animación hecha con código (Remotion) · Voz generada con IA (elevenlabs.io) · Música y sonidos generados por código</div>
    </AbsoluteFill>
  );
};
