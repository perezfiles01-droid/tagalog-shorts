"""Esmiringhoy: cut the voice into lines, place them on the timeline,
generate a playful original score + scene ambience, mix at the approved v3
balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 98.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (1.35, 10.55, 0.8, 'Isang gabi, biglang napuno ang buong Pilipinas ng iisang tanong: ano nga ba ang ibig sabihin ng "esmiringhoy"?', ['"esmiringhoy"?']),
    (11.85, 20.60, 12.8, "Nagsimula ito sa isang programa sa radyo, at sa loob lamang ng ilang araw, alam na ito ng halos bawat Pilipino.", ["radyo,"]),
    (21.60, 28.50, 25.0, "Pero sa kabila ng pagiging viral nito, kakaunti lang ang talagang nakakaalam kung saan ito nanggaling.", ["viral"]),
    (30.15, 44.95, 43.6, 'Ayon sa isang komisyoner ng Komisyon sa Wikang Filipino, posibleng ito ay pinagsamang salitang Bisaya: ang "esmi," na tawag sa asawa, at ang "iring," na ang ibig sabihin ay pusa.', ['"esmi,"', "asawa,", '"iring,"', "pusa."]),
    (46.05, 55.20, 59.6, "Kaya kung iisipin mo kung ano ang ginagawa ng mga pusa tuwing gabi sa bubong, baka mahulaan mo na kung tungkol saan ang salitang ito.", ["pusa", "bubong,"]),
    (56.35, 68.70, 70.6, "May iba pang hula sa social media, pero sa ngayon, wala pa itong opisyal na kahulugan sa diksiyunaryo, at patuloy pa ring pinag-aaralan ang tunay nitong pinagmulan.", ["diksiyunaryo,"]),
    (69.65, 80.20, 84.8, "Ganyan isinisilang ang mga salita sa ating wika: mula sa kalye, sa biro, at sa malikhaing dila ng bawat Pilipino.", ["wika:", "Pilipino."]),
]
# whisper split these words in two; merge them back
MERGES = {0: [("na", "puno")], 2: [("nang", "galing.")], 5: [("pinag", "-aaralan")]}

def words_for_line(i, W):
    s, e, at, text, gold = LINES[i]
    first = sum(len(LINES[j][3].split(" ")) + len(MERGES.get(j, [])) for j in range(i))
    ws = W[first:first + len(text.split(" ")) + len(MERGES.get(i, []))]
    for a, b in MERGES.get(i, []):
        for j in range(len(ws) - 1):
            if ws[j]["w"] == a and ws[j + 1]["w"] == b:
                ws[j] = {"w": a + b, "s": ws[j]["s"], "e": ws[j + 1]["e"]}
                del ws[j + 1]
                break
    script = text.split(" ")
    assert len(script) == len(ws), (i, len(script), len(ws), [w["w"] for w in ws])
    off = at - s
    return [{"w": t, "s": round(max(w["s"], s) + off, 3), "e": round(min(w["e"], e) + off, 3), "gold": t in set(gold)} for t, w in zip(script, ws)]

def voice_track():
    v, sr = sf.read("enhanced.wav")
    v = v.mean(axis=1) if v.ndim > 1 else v
    out = np.zeros(int(TOTAL * SR))
    fade = int(0.03 * SR)
    for s, e, at, *_ in LINES:
        clip = v[int(s * SR):int(e * SR)].copy()
        r = np.linspace(0, 1, fade)
        clip[:fade] *= r; clip[-fade:] *= r[::-1]
        p = int(at * SR)
        out[p:p + len(clip)] += clip
    return out

hz = lambda m: 440 * 2 ** ((m - 69) / 12)

def tone(f, dur, decay=1.2, harm=(1, 0.3, 0.1)):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * (k + 1) * tt) for k, a in enumerate(harm))
    return x * np.exp(-tt * decay) * np.clip(tt / 0.005, 0, 1)

def music():
    """Playful: I-V-vi-IV in C with a bouncy pizzicato bass and marimba-ish
    melody; a minor 'detective' section for the silent scene; warm ending."""
    n = int(TOTAL * SR)
    out = np.zeros((n, 2))
    beat = 60 / 104
    prog = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]]
    minor = [[45, 48, 52], [41, 45, 48], [40, 44, 47], [45, 48, 52]]
    t = 0.0; b = 0
    mel = [72, 74, 76, 79, 76, 74, 72, 67]
    while t < TOTAL - 1:
        detective = 34.0 <= t < 43.0  # sneaky theme for the rooftop cats
        night = t >= 43.0
        chord = (minor if detective else prog)[(b // 8) % 4]
        # bass on beats 1 and 3, pluck chord on the off-beats
        if b % 2 == 0:
            place(out, tone(hz(chord[0] - 12), 0.5, 5, (1, 0.5, 0.2)), t, 0.16, 0.5)
        elif not detective:
            for k, m in enumerate(chord):
                place(out, tone(hz(m + 12), 0.4, 7), t + k * 0.01, 0.035, 0.3 + 0.2 * k)
        # melody: every beat in the day scenes, sparser at night
        if not detective and (b % (2 if night else 1) == 0) and rng.random() < 0.7:
            m = mel[(b + (b // 8)) % len(mel)] - (0 if not night else 5)
            place(out, tone(hz(m), 0.6, 4, (1, 0.15, 0.4)), t, 0.05, rng.random())
        if detective and b % 4 == 0:  # creeping low notes
            place(out, tone(hz(chord[0] - 12), 1.6, 1.2, (1, 0.6, 0.3)), t, 0.2, 0.5)
            place(out, tone(hz(chord[0] - 11), 1.2, 1.5, (1, 0.4, 0.2)), t + beat * 2, 0.12, 0.5)
        t += beat; b += 1
    # pad underneath, warmer at the end
    tt = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * hz(m) * tt) for m in (60, 64, 67)) * 0.012
    pad *= np.clip((tt - 84) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 34, 2)
    out += pad[:, None]
    fi = np.clip(tt / 1.5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1)
    return out * fi[:, None]

def blip(f=1400):
    n = int(0.18 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 1.5 * tt)) * env(n, 0.002, 0.05)

def meow(f0=520, dur=0.7):
    """synthetic meow: harmonic tone with a rise-fall pitch and a vowel-ish formant"""
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    f = f0 * (1 + 0.6 * np.sin(np.pi * np.clip(u * 1.2, 0, 1)) - 0.25 * u)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k for k in range(1, 7))
    x = filt(x, "band", [600, 3200]) * np.sin(np.pi * u) ** 0.6
    return x / (np.abs(x).max() + 1e-9)

def pop():
    n = int(0.1 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (900 + 1500 * tt / tt[-1]) * tt) * env(n, 0.001, 0.03)

def whoosh(dur=0.8):
    n = int(dur * SR)
    return filt(rng.standard_normal(n), "band", [400, 4000]) * np.sin(np.pi * np.arange(n) / n) ** 2

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    cr = np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t))
    # S1: night crickets + phone notification blips popping up everywhere
    out += (cr * (window(n, 0, 12.3, 1.0) + window(n, 34, 70.3, 1.0) + window(n, 84, 98, 1.5)) * 0.006)[:, None]
    for k in range(40):
        place(out, blip(rng.uniform(1100, 1900)), 1.0 + rng.random() * 9.5, 0.04, rng.random())
    # S2: radio static + the antenna's pulsing waves
    stat = filt(noise(), "band", [1500, 6000]) * window(n, 12, 17, 0.5)
    out += (stat * 0.01)[:, None]
    hum = np.sin(2 * np.pi * 110 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.5 * t)) * window(n, 15, 24, 1.0)
    out += (hum * 0.02)[:, None]
    # S3: giggles and chatter, the tricycle
    gg = np.zeros(n); gg[int(24 * SR):] = murmur(n - int(24 * SR), voice, voices=5); gg *= window(n, 24.2, 34.0, 0.5)
    out += (gg * 0.07)[:, None]
    tri = filt(np.sign(np.sin(2 * np.pi * 55 * t)) * 0.5, "low", 500) * window(n, 30.5, 34.2, 0.4)
    out += (tri * 0.05)[:, None]
    # S4: rooftop cats: steps, meow duet, hearts popping, a light switch
    place(out, meow(560, 0.8), 34 + 4.3, 0.22, 0.3)
    place(out, meow(470, 0.9), 34 + 4.9, 0.22, 0.7)
    place(out, meow(620, 0.6), 34 + 5.7, 0.2, 0.4)
    for k in range(4):
        place(out, pop(), 34 + 3.4 + k * 0.35, 0.12, 0.3 + 0.12 * k)
    place(out, clink() * 0.5, 34 + 7.3, 0.25, 0.8)
    # S5: whoosh as the word splits and its halves fly to their owners
    place(out, whoosh(), 43 + 8.2, 0.12, 0.3); place(out, whoosh(), 43 + 12.1, 0.12, 0.7)
    place(out, whoosh(1.2), 43 + 13.6, 0.15, 0.5)
    # S6: hearts popping over the couple, a knowing meow
    for k in range(5):
        place(out, pop(), 59 + 2.0 + k * 0.5, 0.1, rng.random())
    place(out, meow(500, 0.5), 59 + 4.3, 0.15, 0.8)
    # S7: cards popping in, a stamp for each "?", pages turning
    for at in (0.6, 2.6, 4.6):
        place(out, pop(), 70 + at, 0.14, 0.5)
        place(out, thump() * 0.6, 70 + at + 1.45, 0.3, 0.5)
    tp = 70.3
    while tp < 83.8:
        place(out, whoosh(0.25), tp, 0.05, 0.5); tp += 1 / 1.6
    # S8: shimmering words rising into the sky
    for k in range(10):
        place(out, tone(hz(84 + [0, 2, 4, 7, 9][k % 5]), 1.2, 3), 84.6 + k * 0.8, 0.04, rng.random())
    wind = filt(noise(), "band", [150, 900]) * window(n, 84, 98, 2.0)
    out += (wind * 0.05)[:, None]
    return out

def main():
    W = [w for w in json.load(open("words.json")) if w["w"] != "Hmm,"]
    json.dump([{"start": LINES[i][2], "words": words_for_line(i, W)} for i in range(len(LINES))], open(f"{VIDEO}/src/timeline.json", "w"), ensure_ascii=False, indent=1)
    sf.write("voice_placed.wav", voice_track(), SR)
    sf.write("music.wav", music() * 1.6, SR)  # match the Isang Butil score level (-25 LUFS)
    v, _ = sf.read("enhanced.wav")
    sf.write("ambience.wav", ambience(v.mean(axis=1) if v.ndim > 1 else v), SR)
    # approved v3 balance: music close to the voice, light ducking
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "music.wav", "-i", "voice_placed.wav", "-i", "ambience.wav",
        "-filter_complex",
        "[1:a]aformat=channel_layouts=stereo,asplit=3[v][sc][sc2];"
        "[0:a]volume=2.1[m];[m][sc]sidechaincompress=threshold=0.08:ratio=1.4:attack=120:release=900[md];"
        "[2:a]volume=1.5[a0];[a0][sc2]sidechaincompress=threshold=0.05:ratio=2:attack=120:release=900[ad];"
        "[md][ad][v]amix=inputs=3:weights='1.0 1.0 1':normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11",
        "-ar", "48000", f"{VIDEO}/public/mix.wav"], check=True)
    print("ok")

main()
