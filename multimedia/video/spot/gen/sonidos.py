# Música y efectos del spot generados por código (sin samples de terceros).
import numpy as np, wave, sys
SR = 44100
out = sys.argv[1]
def save(name, x, vol=1.0):
    x = np.clip(x * vol, -1, 1)
    st = np.stack([x, x], 1) if x.ndim == 1 else x
    with wave.open(f'{out}/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())
def t(d): return np.arange(int(SR * d)) / SR
def lp(x, a):  # filtro pasa bajos de un polo
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y
rng = np.random.default_rng(3)
# --- efectos ---
tt = t(0.09); beep = np.sin(2*np.pi*2900*tt) * np.minimum(1, tt/0.004) * np.minimum(1, (0.09-tt)/0.01)
save('beep', beep, 0.35)
tt = t(1.2); ding = sum(a*np.sin(2*np.pi*f*tt)*np.exp(-tt*k) for f, a, k in [(1568,1,3),(2352,.5,4),(3136,.35,5),(4704,.15,7)])
save('ding', ding / 2, 0.5)
tt = t(0.7); n = rng.standard_normal(len(tt)); env = np.sin(np.pi*tt/0.7)**2
wh = lp(n, 0.05) * 0 + n
# barrido: mezcla de dos pasa bajos con distinta frecuencia según el tiempo
a1 = lp(n, 0.02); a2 = lp(n, 0.25); mix = tt/0.7
save('whoosh', (a1*(1-mix) + a2*mix) * env * 3, 0.35)
tt = t(0.09); pop = np.sin(2*np.pi*(600*np.exp(-tt*25))*tt*3) * np.exp(-tt*30)
save('pop', pop, 0.4)
tt = t(1.4); n = rng.standard_normal(len(tt)); tr = (np.sin(2*np.pi*7*tt) > 0.2).astype(float)
save('lapiz', (n - lp(n, 0.3)) * lp(tr, 0.01) * 0.6, 0.35)
tt = t(1.0); luz = sum(np.sin(2*np.pi*f*tt) for f in [523.25, 659.25, 783.99, 1046.5]) * (1-np.exp(-tt*6)) * np.exp(-tt*2.5) / 4
save('luz', luz, 0.5)
# --- música: pad tranquilo que se ilumina cuando aparece Pointer ---
D = 75.0; T = t(D); mus = np.zeros(len(T))
def nota(f, ini, dur, amp, tipo='pad'):
    i0 = int(ini*SR); n = int(dur*SR); tt = np.arange(n)/SR
    if tipo == 'pad':
        env = np.minimum(1, tt/1.2) * np.minimum(1, (dur-tt)/1.2)
        s = (np.sin(2*np.pi*f*tt) + 0.5*np.sin(2*np.pi*f*1.003*tt) + 0.25*np.sin(2*np.pi*2*f*tt)) / 1.75
    else:
        env = np.exp(-tt*4.5) * np.minimum(1, tt/0.005)
        s = np.sin(2*np.pi*f*tt) + 0.3*np.sin(2*np.pi*2*f*tt)
    seg = s*env*amp; end = min(len(mus), i0+n); mus[i0:end] += seg[:end-i0]
A = {'Am':[220,261.63,329.63], 'F':[174.61,220,261.63], 'C':[261.63,329.63,392], 'G':[196,246.94,293.66], 'Dm':[146.83,174.61,220]}
# parte 1 (0-21 s): menor y vacía
for i, ch in enumerate(['Am','F','Dm','Am','F','Am']):
    for f in A[ch]: nota(f, i*4.2, 4.8, 0.10)
    nota(A[ch][0]/2, i*4.2, 4.8, 0.10)
# parte 2 (21-66 s): mayor, con arpegio
prog = ['C','G','Am','F']; beat = 60/96
k = 0; ini = 25.0
while ini < D - 3:
    ch = prog[k % 4]
    for f in A[ch]: nota(f, ini, 4*beat*2+0.6, 0.09)
    nota(A[ch][0]/2, ini, 4*beat*2+0.6, 0.11)
    for j in range(8):
        if ini + j*beat < D - 3:
            nota(A[ch][[0,1,2,1][j % 4]]*2, ini + j*beat, 0.9, 0.06, 'pluck')
    ini += 8*beat; k += 1
fade = np.ones(len(T)); fade[-int(3*SR):] = np.linspace(1, 0, int(3*SR))
mus = lp(mus, 0.35) * fade
save('musica', mus / np.max(np.abs(mus)) * 0.9, 0.35)
print('ok')
