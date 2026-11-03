import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, clamp, entra, pesos, tramo} from './marca';
import {Titulo} from './Escenas';

// ---------- personaje y escenografía 2D (todo inventado, sin personas ni marcas reales) ----------
type Brazo = 'quieto' | 'escribe' | 'escanea' | 'cuenta' | 'saluda';
export const Vendedor: React.FC<{x: number; y: number; esc?: number; brazo: Brazo; f: number}> = ({x, y, esc = 1, brazo, f}) => {
  const mov = Math.sin(f / 4);
  const angDer = brazo === 'escribe' ? 55 + mov * 6 : brazo === 'escanea' ? -35 : brazo === 'cuenta' ? 40 + Math.abs(mov) * 10 : brazo === 'saluda' ? -150 + mov * 12 : 10;
  const angIzq = brazo === 'cuenta' ? -40 - Math.abs(mov) * 10 : brazo === 'escribe' ? -50 : -10;
  const respira = Math.sin(f / 20) * 2;
  return (
    <g transform={`translate(${x},${y + respira}) scale(${esc})`}>
      {/* cuerpo */}
      <path d="M-95,40 Q-100,-60 -40,-80 L40,-80 Q100,-60 95,40 Z" fill="#374151" />
      {/* delantal amarillo */}
      <path d="M-55,-60 L55,-60 L65,40 L-65,40 Z" fill={C.amarillo} />
      <rect x={-30} y={-20} width={60} height={30} rx={6} fill="#D97706" />
      {/* brazos */}
      <g transform={`translate(70,-60) rotate(${angDer})`}><rect x={-14} y={0} width={28} height={95} rx={14} fill="#374151" /><circle cx={0} cy={100} r={16} fill="#D9A066" /></g>
      <g transform={`translate(-70,-60) rotate(${angIzq})`}><rect x={-14} y={0} width={28} height={95} rx={14} fill="#374151" /><circle cx={0} cy={100} r={16} fill="#D9A066" /></g>
      {/* cabeza */}
      <rect x={-16} y={-100} width={32} height={26} fill="#C68B55" />
      <ellipse cx={0} cy={-145} rx={52} ry={58} fill="#D9A066" />
      <path d="M-52,-150 Q-50,-210 0,-208 Q50,-210 52,-150 Q40,-180 0,-182 Q-40,-180 -52,-150 Z" fill="#9CA3AF" />
      <circle cx={-18} cy={-148} r={5} fill={C.carbon} /><circle cx={18} cy={-148} r={5} fill={C.carbon} />
      <path d="M-24,-122 Q0,-110 24,-122 Q0,-128 -24,-122 Z" fill="#6B7280" />
      <path d="M-14,-110 Q0,-102 14,-110" stroke={C.carbon} strokeWidth={3} fill="none" opacity={brazo === 'saluda' || brazo === 'cuenta' ? 1 : 0} />
    </g>
  );
};
const Cliente: React.FC<{x: number; y: number; v: number; esc?: number}> = ({x, y, v, esc = 1.25}) => (
  <g transform={`translate(${x},${y}) scale(${esc})`} opacity={v}>
    <path d="M-80,60 Q-85,-50 -30,-70 L30,-70 Q85,-50 80,60 Z" fill="#475569" />
    <ellipse cx={0} cy={-125} rx={44} ry={50} fill="#B98257" />
    <path d="M-46,-130 Q-40,-185 0,-182 Q44,-185 46,-128 Q30,-150 -10,-150 Q-36,-148 -46,-130 Z" fill="#1F2937" />
  </g>
);
const Estantes: React.FC<{noche?: boolean}> = ({noche}) => {
  const colores = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#FB923C', '#F472B6', '#2DD4BF'];
  return (
    <g opacity={noche ? 0.55 : 1}>
      {[0, 1, 2].map((fila) => (
        <g key={fila} transform={`translate(980,${170 + fila * 150})`}>
          <rect x={0} y={110} width={820} height={14} fill="#7C4A2D" />
          {Array.from({length: 11}, (_, i) => <rect key={i} x={20 + i * 72} y={110 - (60 + ((i * 37 + fila * 13) % 40))} width={56} height={60 + ((i * 37 + fila * 13) % 40)} rx={6} fill={colores[(i + fila * 3) % 8]} opacity={0.85} />)}
        </g>
      ))}
    </g>
  );
};
const Ventana: React.FC<{noche?: boolean}> = ({noche}) => (
  <g transform="translate(140,140)">
    <rect x={0} y={0} width={620} height={400} rx={10} fill={noche ? '#0F172A' : '#FDBA74'} />
    <rect x={0} y={0} width={620} height={400} rx={10} fill={noche ? 'url(#cieloNoche)' : 'url(#cieloDia)'} />
    {/* cerros de Tinogasta (silueta genérica) */}
    <path d="M0,300 L90,180 L170,250 L280,120 L380,230 L470,160 L620,280 L620,400 L0,400 Z" fill={noche ? '#1E293B' : '#9A3412'} />
    <path d="M0,340 L120,260 L240,320 L360,250 L500,330 L620,290 L620,400 L0,400 Z" fill={noche ? '#111827' : '#7C2D12'} />
    {noche && <circle cx={500} cy={80} r={30} fill="#F8FAFC" opacity={0.9} />}
    <rect x={0} y={0} width={620} height={400} rx={10} fill="none" stroke="#5B3A22" strokeWidth={18} />
    <line x1={310} y1={0} x2={310} y2={400} stroke="#5B3A22" strokeWidth={12} />
  </g>
);
const Interior: React.FC<{noche?: boolean; children?: React.ReactNode}> = ({noche, children}) => (
  <svg width={1920} height={1080} style={{position: 'absolute'}}>
    <defs>
      <linearGradient id="cieloDia" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60A5FA" /><stop offset="100%" stopColor="#FDE68A" /></linearGradient>
      <linearGradient id="cieloNoche" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#020617" /><stop offset="100%" stopColor="#1E293B" /></linearGradient>
      <radialGradient id="lampara"><stop offset="0%" stopColor="#FDE68A" stopOpacity="0.45" /><stop offset="100%" stopColor="#FDE68A" stopOpacity="0" /></radialGradient>
    </defs>
    <rect width={1920} height={1080} fill={noche ? '#3B2F2A' : '#E9D3AE'} />
    <Ventana noche={noche} />
    <Estantes noche={noche} />
    {noche && <circle cx={960} cy={300} r={700} fill="url(#lampara)" />}
    {children}
  </svg>
);
const Mostrador: React.FC = () => (
  <g>
    <rect x={0} y={760} width={1920} height={40} fill="#A16207" />
    <rect x={0} y={800} width={1920} height={280} fill="#78350F" />
    <rect x={0} y={860} width={1920} height={16} fill={C.amarillo} opacity={0.9} />
  </g>
);
// notebook en perspectiva con una pantalla del sistema
export const Notebook: React.FC<{x: number; y: number; ancho: number; rot?: number; children: React.ReactNode}> = ({x, y, ancho, rot = -14, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: ancho, perspective: 1600}}>
    <div style={{transform: `rotateY(${rot}deg) rotateX(6deg)`, transformStyle: 'preserve-3d'}}>
      <div style={{background: '#0F172A', borderRadius: 18, padding: 16, border: '3px solid #334155', boxShadow: '0 40px 80px rgba(0,0,0,0.5)'}}>
        <div style={{background: C.negro, borderRadius: 8, overflow: 'hidden', aspectRatio: '16/10', position: 'relative'}}>{children}</div>
      </div>
      <div style={{height: 22, background: 'linear-gradient(#94A3B8,#64748B)', borderRadius: '0 0 18px 18px', margin: '0 -30px', transform: 'rotateX(60deg)', transformOrigin: 'top'}} />
    </div>
  </div>
);
const Pantalla: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', inset: 0, padding: 26, fontFamily: 'BarlowS', color: C.niebla}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14}}>
      <Img src={staticFile('isotipo.png')} style={{width: 34, height: 34}} /><span style={{fontFamily: 'BarlowC', fontSize: 26}}>POINTER</span>
    </div>
    {children}
  </div>
);
const Fila: React.FC<{a: string; b: string; v?: number; grande?: boolean; color?: string}> = ({a, b, v = 1, grande, color}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: grande ? 30 : 24, padding: '8px 0', borderBottom: '1px solid #273244', opacity: v}}>
    <span style={{color: '#9CA3AF'}}>{a}</span><span style={{fontFamily: grande ? 'BarlowC' : 'BarlowS', fontSize: grande ? 46 : 24, color: color ?? C.niebla}}>{b}</span>
  </div>
);

// ---------- escenas nuevas ----------
// 1 · Exterior al amanecer (2D): levanta la persiana
export const N1: React.FC = () => {
  const f = useCurrentFrame();
  const persiana = interpolate(f, [40, 110], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const sol = tramo(f, 0, 210);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080}>
        <defs><linearGradient id="amanecer" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1E3A8A" /><stop offset={`${55 - sol * 15}%`} stopColor="#F97316" /><stop offset="100%" stopColor="#FDE68A" /></linearGradient></defs>
        <rect width={1920} height={1080} fill="url(#amanecer)" />
        <circle cx={1500} cy={560 - sol * 120} r={70} fill="#FDE68A" opacity={0.9} />
        <path d="M0,560 L220,360 L420,480 L640,300 L900,470 L1150,330 L1420,470 L1700,350 L1920,460 L1920,1080 L0,1080 Z" fill="#7C2D12" />
        <path d="M0,640 L300,520 L600,610 L900,520 L1250,620 L1600,540 L1920,620 L1920,1080 L0,1080 Z" fill="#5A1F0D" />
        <rect y={860} width={1920} height={220} fill="#A8A29E" />
        {/* casa de adobe con el kiosco */}
        <rect x={520} y={420} width={880} height={440} fill="#C08457" />
        <rect x={500} y={400} width={920} height={34} fill="#9A5B34" />
        <rect x={760} y={520} width={400} height={300} fill="#1F2937" />
        <g clipPath="url(#hueco)"><rect x={760} y={520 - persiana * 290} width={400} height={300} fill="#9CA3AF" />
          {Array.from({length: 12}, (_, i) => <line key={i} x1={760} x2={1160} y1={540 + i * 24 - persiana * 290} y2={540 + i * 24 - persiana * 290} stroke="#6B7280" strokeWidth={4} />)}</g>
        <defs><clipPath id="hueco"><rect x={760} y={520} width={400} height={300} /></clipPath></defs>
        {/* interior que aparece */}
        <g opacity={persiana}>{[0, 1].map((r) => Array.from({length: 6}, (_, i) => <rect key={`${r}${i}`} x={780 + i * 62} y={600 + r * 90} width={46} height={50 + (i % 3) * 10} rx={6} fill={['#F87171', '#60A5FA', '#FBBF24', '#34D399', '#A78BFA', '#FB923C'][(i + r) % 6]} />))}</g>
        <rect x={700} y={450} width={520} height={50} rx={10} fill={C.amarillo} />
        <text x={960} y={487} textAnchor="middle" fontFamily="BarlowC" fontSize={38} fill={C.carbon}>KIOSCO</text>
        <rect x={1220} y={560} width={120} height={300} fill="#5B3A22" />
        {/* farol */}
        <rect x={380} y={480} width={10} height={380} fill="#374151" /><circle cx={385} cy={480} r={18} fill="#FDE68A" opacity={1 - sol * 0.7} />
        <Vendedor x={1330} y={950} esc={0.9} brazo={persiana < 1 ? 'escanea' : 'saluda'} f={f} />
      </svg>
      <Titulo desde={12}>Todos los días, <span style={{opacity: tramo(f, 60, 72)}}>lo mismo.</span></Titulo>
    </AbsoluteFill>
  );
};

// 2 · Mostrador (2D): vende y anota en el cuaderno
const ventas = [{t: 'Alfajor', p: '$ 900', d: 40}, {t: 'Gaseosa', p: '$ 2.300', d: 95}, {t: 'Chicles', p: '$ 500', d: 150}, {t: 'Fiado Don Julio', p: '$ 1.200', d: 190}];
export const N2: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Interior>
        <Cliente x={330} y={720} v={entra(f, 10, 18)} />
        <Vendedor x={980} y={700} esc={1.25} brazo="escribe" f={f} />
        <Mostrador />
      </Interior>
      {/* cuaderno sobre el mostrador */}
      <div style={{position: 'absolute', left: 1180, top: 640, width: 560, height: 330, perspective: 1200}}>
        <div style={{width: '100%', height: '100%', background: C.crema, borderRadius: 10, transform: 'rotateX(45deg) rotateZ(-6deg)', boxShadow: '0 30px 60px rgba(0,0,0,0.45)', padding: '26px 34px',
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 44px, #CBD5E1 44px 46px)'}}>
          {ventas.map((v, i) => (
            <div key={i} style={{display: 'flex', justifyContent: 'space-between', fontFamily: 'BarlowS', fontSize: 30, color: C.carbon, height: 46, clipPath: `inset(0 ${100 - tramo(f, v.d, v.d + 18) * 100}% 0 0)`}}><span>{v.t}</span><span>{v.p}</span></div>
          ))}
          <div style={{fontFamily: 'BarlowC', fontSize: 34, color: '#B91C1C', textAlign: 'right', opacity: tramo(f, 230, 245)}}>TOTAL: ¿$ 4.800?</div>
        </div>
      </div>
      <Titulo desde={20} caja>Anotás. <span style={{opacity: tramo(f, 90, 100)}}>Sumás.</span> <span style={{opacity: tramo(f, 200, 210)}}><span style={{color: C.amarillo}}>Tachás.</span></span></Titulo>
    </AbsoluteFill>
  );
};

// 5 · Mostrador (2D + notebook 3D): escanea y el sistema suma
const items = [{t: 'Alfajor triple', p: 900, d: 55}, {t: 'Gaseosa 500 ml', p: 2300, d: 135}, {t: 'Galletitas', p: 1400, d: 200}];
export const N5: React.FC = () => {
  const f = useCurrentFrame();
  const total = items.reduce((a, it) => a + it.p * tramo(f, it.d, it.d + 15), 0);
  const laser = [45, 125, 190].some((d) => f > d && f < d + 14);
  return (
    <AbsoluteFill>
      <Interior>
        <Vendedor x={560} y={700} esc={1.25} brazo="escanea" f={f} />
        {/* lector en la mano */}
        <g transform="translate(690,680) rotate(-20)"><rect x={0} y={0} width={120} height={60} rx={18} fill="#111827" /><rect x={80} y={45} width={34} height={90} rx={12} fill="#111827" /></g>
        {laser && <line x1={700} y1={715} x2={505} y2={725} stroke="#EF4444" strokeWidth={6} style={{filter: 'drop-shadow(0 0 8px #EF4444)'}} />}
        <Mostrador />
        <rect x={430} y={690} width={150} height={70} rx={8} fill="#60A5FA" />
        <g>{[3, 1, 2, 1, 3, 2, 1, 2].map((w, i) => <rect key={i} x={460 + i * 11} y={705} width={w * 2.5} height={40} fill={C.carbon} />)}</g>
      </Interior>
      <Notebook x={980} y={300} ancho={780}>
        <Pantalla>
          {items.map((it, i) => <Fila key={i} a={it.t} b={pesos(it.p)} v={tramo(f, it.d, it.d + 12)} />)}
          <Fila a="TOTAL" b={pesos(total)} grande color={C.amarillo} />
        </Pantalla>
      </Notebook>
      <Titulo desde={8} caja>Escaneá. <span style={{opacity: tramo(f, 200, 210)}}><span style={{color: C.amarillo}}>Cobrá.</span></span></Titulo>
    </AbsoluteFill>
  );
};

// 6 · Cobro (3D): notebook grande en perspectiva, la clienta paga
export const N6: React.FC = () => {
  const f = useCurrentFrame();
  const rot = interpolate(f, [0, 270], [-22, -8], clamp);
  const recibido = Math.round(interpolate(f, [40, 75], [0, 5000], clamp) / 1000) * 1000;
  const toast = entra(f, 130, 14);
  return (
    <AbsoluteFill>
      <Interior>
        <Cliente x={260} y={720} v={1} />
        <g transform="translate(340,680) rotate(-10)" opacity={1 - tramo(f, 90, 110)}><rect x={0} y={0} width={150} height={70} rx={6} fill="#86EFAC" stroke="#15803D" strokeWidth={3} /><circle cx={75} cy={35} r={18} fill="none" stroke="#15803D" strokeWidth={3} /></g>
        <Mostrador />
      </Interior>
      <Notebook x={620} y={160} ancho={1080} rot={rot}>
        <Pantalla>
          <Fila a="TOTAL" b={pesos(4600)} grande color={C.amarillo} />
          <div style={{display: 'flex', gap: 12, margin: '14px 0'}}>
            {['Efectivo', 'Transferencia', 'Tarjeta'].map((m, i) => <div key={m} style={{flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10, fontSize: 22, background: i === 0 ? C.amarillo : '#1F2937', color: i === 0 ? C.carbon : '#D1D5DB'}}>{m}</div>)}
          </div>
          <Fila a="Recibido" b={pesos(recibido)} />
          <Fila a="Vuelto" b={pesos(400)} v={tramo(f, 85, 95)} />
          <div style={{marginTop: 14, padding: '12px 0', textAlign: 'center', borderRadius: 10, background: C.amarillo, color: C.carbon, fontFamily: 'BarlowC', fontSize: 30, transform: `scale(${f > 115 && f < 123 ? 0.95 : 1})`}}>COBRAR</div>
        </Pantalla>
      </Notebook>
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 70}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, background: C.exito, color: '#fff', padding: '16px 32px', borderRadius: 999, fontFamily: 'BarlowS', fontSize: 34, opacity: toast, transform: `translateY(${(1 - toast) * -40}px)`}}>✓ Venta registrada</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 7 · Cierre de noche (2D): cuenta la plata y el sistema compara
export const N7: React.FC = () => {
  const f = useCurrentFrame();
  const contado = interpolate(f, [60, 110], [0, 48500], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <Interior noche>
        <Vendedor x={520} y={700} esc={1.25} brazo="cuenta" f={f} />
        <Mostrador />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={380 + i * 40} y={735 - i * 8} width={130} height={60} rx={5} fill="#86EFAC" stroke="#15803D" strokeWidth={3} transform={`rotate(${-8 + i * 5} ${440 + i * 40} ${765})`} />)}
      </Interior>
      <Notebook x={900} y={250} ancho={860} rot={-12}>
        <Pantalla>
          <div style={{fontFamily: 'BarlowC', fontSize: 30, marginBottom: 6}}>CIERRE DE CAJA</div>
          <Fila a="Esperado en efectivo" b={pesos(48500)} v={tramo(f, 20, 35)} />
          <Fila a="Contado" b={pesos(contado)} v={tramo(f, 50, 60)} />
          <Fila a="Diferencia" b={pesos(0)} grande color={C.amarillo} v={tramo(f, 120, 132)} />
          <div style={{marginTop: 14, textAlign: 'center', padding: '10px 0', borderRadius: 999, background: C.exito, color: '#fff', fontSize: 24, opacity: entra(f, 140, 12)}}>Sin diferencia</div>
        </Pantalla>
      </Notebook>
      <Titulo desde={8} caja>La caja, <span style={{color: C.amarillo}}>al día.</span></Titulo>
    </AbsoluteFill>
  );
};

// 9 · Cierre (sin "Hecho en Tinogasta" ni enlace)
export const N9: React.FC = () => {
  const f = useCurrentFrame();
  const v = entra(f, 6, 14), t2 = entra(f, 30, 16), t3 = entra(f, 55, 16);
  return (
    <AbsoluteFill style={{background: C.niebla, justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <Img src={staticFile('logo-horizontal.png')} style={{width: 860, opacity: v, transform: `scale(${0.85 + v * 0.15})`}} />
      <div style={{fontFamily: 'BarlowC', fontSize: 64, color: C.carbon, marginTop: 10, opacity: t2, transform: `translateY(${(1 - t2) * 20}px)`}}>Cada venta, en su lugar.</div>
      <div style={{position: 'absolute', bottom: 40, fontFamily: 'BarlowS', fontSize: 22, color: '#9CA3AF', opacity: t3}}>Animación hecha con código (Remotion) · Voz generada con IA (elevenlabs.io) · Música y sonidos generados por código</div>
    </AbsoluteFill>
  );
};
