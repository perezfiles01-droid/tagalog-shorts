"""Procedural ambience per scene (all original, no samples except the
narrator's own voice, scrambled into unintelligible crowd murmur)."""
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample

SR = 48000
rng = np.random.default_rng(42)

def filt(x, kind, f):
    return sosfilt(butter(2, f, btype=kind, fs=SR, output="sos"), x)

def window(n, a, b, fade=0.6):
    t = np.arange(n) / SR
    return np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)

def place(out, clip, at, gain=1.0, pan=0.5):
    p = int(at * SR)
    if p >= len(out):
        return
    clip = clip[: len(out) - p]
    out[p:p + len(clip), 0] += clip * gain * (1 - pan) * 2 ** 0.5
    out[p:p + len(clip), 1] += clip * gain * pan * 2 ** 0.5

def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR
    return np.clip(t / a, 0, 1) * np.exp(-t / d)

def bird():
    n = int(rng.uniform(0.08, 0.18) * SR)
    t = np.arange(n) / SR
    f0, f1 = rng.uniform(2800, 4200), rng.uniform(3500, 6000)
    f = f0 + (f1 - f0) * (t / t[-1]) + 300 * np.sin(2 * np.pi * 30 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1])

def chirps(out, a, b, rate, gain):
    t = a
    while t < b:
        for k in range(rng.integers(1, 4)):
            place(out, bird(), t + k * 0.14, gain, rng.random())
        t += rng.exponential(1 / rate)

def splash():
    n = int(0.35 * SR)
    x = filt(rng.standard_normal(n), "band", [400, 3000]) * env(n, 0.003, 0.07)
    return x + 0.4 * np.sin(2 * np.pi * 180 * np.arange(n) / SR) * env(n, 0.002, 0.05)

def thump():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 25)) * t) * env(n, 0.002, 0.12)
    rattle = filt(rng.standard_normal(n), "high", 2500) * env(n, 0.01, 0.35) * 0.35
    return body + rattle

def clink():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = rng.uniform(2200, 3400)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.7 * t)) * env(n, 0.001, 0.12)

def horn():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    x = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (392, 494)) * 0.5
    return filt(x, "low", 2500) * np.clip(t / 0.02, 0, 1) * np.clip((t[-1] - t) / 0.05, 0, 1)

def murmur(total, voice, voices=14):
    """Crowd babble from the narrator's voice: random chunks, pitch-shifted,
    half reversed, overlapped and muffled so no words are intelligible."""
    out = np.zeros(total)
    for _ in range(voices):
        pos = 0
        while pos < total:
            s = rng.integers(0, len(voice) - 3 * SR)
            chunk = voice[s:s + int(rng.uniform(1.5, 3) * SR)]
            if rng.random() < 0.5:
                chunk = chunk[::-1]
            chunk = resample(chunk, int(len(chunk) * rng.uniform(0.82, 1.2)))
            chunk *= np.hanning(len(chunk)) ** 0.3
            e = min(total, pos + len(chunk))
            out[pos:e] += chunk[: e - pos] * rng.uniform(0.5, 1)
            pos = e + int(rng.uniform(0, 0.6) * SR)
    out = filt(filt(out, "low", 1800), "high", 200)
    return out / (np.abs(out).max() + 1e-9)

def ambience(total_s, voice):
    n = int(total_s * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    noise = lambda: rng.standard_normal(n)

    # S1 terraces at dawn: birds over the wind already in the score
    chirps(out, 1.5, 14.5, 0.9, 0.06)
    # S2 paddy: water bed + a splash for every seedling
    water = filt(noise(), "band", [300, 1400]) * (0.5 + 0.5 * np.sin(2 * np.pi * t * 0.7)) * window(n, 14.2, 25.3)
    out[:, 0] += water * 0.035; out[:, 1] += np.roll(water, 900) * 0.035
    for i in range(3):
        ts = 14.5 + 0.4 + i * 0.25
        while ts < 21.0:
            place(out, splash(), ts, 0.08, 0.2 + i * 0.3)
            ts += 1 / 0.85
    chirps(out, 15, 25, 0.6, 0.05)
    # S3: insects, then rain with a far thunder, then birds again
    cr = np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t))
    out += (cr * window(n, 25, 30.3) * 0.012)[:, None]
    rain = filt(noise(), "band", [800, 9000]) * window(n, 30.2, 33.3, 0.5)
    out[:, 0] += rain * 0.05; out[:, 1] += np.roll(rain, 1500) * 0.05
    tn = int(2.5 * SR)
    thunder = filt(rng.standard_normal(tn), "low", 120) * env(tn, 0.3, 0.9)
    place(out, thunder, 30.7, 0.5, 0.5)
    chirps(out, 33.5, 37, 1.0, 0.05)
    # S4 harvest: rustle + a thump at every slam
    rustle = filt(noise(), "band", [2000, 7000]) * (np.sin(2 * np.pi * t * 0.8) ** 8) * window(n, 37, 45)
    out += (rustle * 0.03)[:, None]
    for k in range(3):
        place(out, thump(), 37 + 1.328 + 2.4 * k, 0.35, 0.5)
    # S5 jeepney: engine rumble + horn
    eng = (np.sign(np.sin(2 * np.pi * 42 * t + 0.6 * np.sin(2 * np.pi * 3 * t))) * 0.5 + filt(noise(), "low", 250) * 2)
    eng = filt(eng, "low", 400) * window(n, 45, 56.3, 0.8)
    out += (eng * 0.05)[:, None]
    place(out, horn(), 47.6, 0.06, 0.55)
    place(out, horn(), 48.15, 0.06, 0.55)
    place(out, horn(), 53.4, 0.05, 0.45)
    # S6 market: crowd murmur from the narrator's voice
    seg = n - int(55.6 * SR)
    m = murmur(seg, voice)
    mm = np.zeros(n); mm[int(55.6 * SR):] = m
    mm *= window(n, 55.6, 70.4, 0.8)
    out[:, 0] += mm * 0.11; out[:, 1] += np.roll(mm, 2400) * 0.11
    # S7 kitchen: steam hiss, a quiet family murmur, spoons on plates
    hiss = filt(noise(), "high", 4000) * (0.6 + 0.4 * np.sin(2 * np.pi * t * 0.5)) * window(n, 70, 77.5)
    out += (hiss * 0.012)[:, None]
    fam = np.zeros(n); fam[int(76.5 * SR):] = murmur(n - int(76.5 * SR), voice, voices=3)
    fam *= window(n, 76.8, 82.7, 0.8)
    out += (fam * 0.05)[:, None]
    tc = 77.3
    while tc < 82:
        place(out, clink(), tc, 0.045, rng.random())
        tc += rng.uniform(0.5, 1.4)
    # S8 rising wind as the camera climbs
    wind = filt(noise(), "band", [150, 900]) * window(n, 82.5, 96.8, 2.0) * np.clip((t - 82.5) / 10, 0, 1)
    out[:, 0] += wind * 0.08; out[:, 1] += np.roll(wind, 3000) * 0.08
    return out
