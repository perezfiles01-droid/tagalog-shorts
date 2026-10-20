"""Bakit mabaho ang utot: cut the voice into lines, place them on the timeline,
generate a playful original score + scene ambience, mix at the approved v3
balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 101.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (1.10, 12.50, 0.6, "Mabaho ba ang utot mo? Nakaamoy ka na ba ng mabangong utot? Siyempre hindi, at ngayon, aalamin natin kung bakit.", ["mabangong"]),
    (12.95, 23.10, 13.0, "Ang bawat kinakain natin ay naglalakbay sa ating bituka, kung saan hinihimay ito para makuha ng katawan ang sustansya.", ["bituka,"]),
    (24.65, 39.70, 24.2, "Pero sa malaking bituka, may naghihintay na trilyon-trilyong bakterya, at ang paborito nitong gawin ay ang kainin ang mga natirang pagkain na hindi natunaw.", ["bakterya,"]),
    (40.25, 51.60, 48.0, "Ang nakakagulat, halos lahat ng laman ng utot ay mga gas na walang amoy. Wala pang isang porsiyento ang talagang mabaho.", ["walang", "amoy."]),
    (52.70, 69.75, 59.8, "Ang salarin ay mga gas na may sulfur, gaya ng hydrogen sulfide, na amoy bulok na itlog, at lalo itong dumarami kapag kumain tayo ng itlog, karne, o repolyo.", ["sulfur,", "itlog,"]),
    (70.00, 80.30, 77.4, "At 'wag kang mahiya, dahil ang karaniwang tao ay umuutot nang mahigit sampung beses sa isang araw, kahit ang pinakamagandang artista.", ["sampung"]),
    (81.80, 92.50, 88.3, "Ang utot ay tanda na gumagana nang maayos ang iyong tiyan. Pero sa loob ng elevator, sana maawa ka sa katabi mo.", ["elevator,"]),
]
# whisper split these words in two; merge them back
MERGES = {2: [("triliyon", "-triliyong")]}

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
        detective = 39.5 <= t < 47.5  # drumroll theme for the growing gas balloon
        night = False
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
    pad *= np.clip((tt - 88) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 39.5, 2)
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

def pfft(dur=0.5, f0=95):
    """cartoon toot: a fluttering low buzz with a breathy edge (kept short and silly)"""
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    f = f0 * (1 + 0.25 * np.sin(2 * np.pi * 7 * tt)) * (1 - 0.3 * u)
    buzz = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * tt))
    x = filt(buzz, "low", 900) + 0.3 * filt(rng.standard_normal(n), "band", [300, 2000])
    return x * np.sin(np.pi * u) ** 0.5 / 1.5

def ding():
    return tone(hz(88), 1.6, 2.2, (1, 0.4, 0.2)) + tone(hz(84), 1.6, 2.2, (1, 0.3, 0.1)) * 0.6

def boing():
    n = int(0.5 * SR); tt = np.arange(n) / SR
    f = 200 + 400 * tt / tt[-1] + 60 * np.sin(2 * np.pi * 14 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.2)

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    # S1 living room: the toot, a dog's confused whine
    place(out, pfft(0.55), 1.6, 0.35, 0.4)
    place(out, meow(380, 0.45) * 0.6, 6.8, 0.12, 0.2)
    # S2-S6 inside the body: wet low gurgles and bubbles
    gut = filt(noise(), "low", 220) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.35 * t)) * window(n, 14.5, 47.5, 1.0)
    out += (gut * 0.07)[:, None]
    place(out, whoosh(1.0), 13.9, 0.2, 0.5)
    tb = 15.0
    while tb < 77:
        if not (45.0 < tb < 47.6):
            place(out, pop() * 0.6, tb, 0.05, rng.random())
        tb += rng.uniform(0.25, 0.9)
    # S3 munching bacteria
    tc = 24.0
    while tc < 39.4:
        place(out, clink() * 0.25, tc, 0.04, rng.random()); tc += rng.uniform(0.1, 0.3)
    # S4 drumroll as the balloon grows, then Lolo's eyes "boing"
    td = 39.6
    while td < 44.8:
        place(out, thump() * 0.5, td, 0.25, 0.5)
        td += max(0.07, 0.5 - (td - 39.6) * 0.09)
    place(out, boing(), 45.0, 0.3, 0.5)
    # S6: the nose sniffs, recoils; foods pop in
    place(out, whoosh(0.4) * 0.5, 59.5 + 5.9, 0.12, 0.7)
    place(out, boing(), 59.5 + 6.7, 0.25, 0.7)
    for at in (8.0, 13.8, 15.2):
        place(out, pop(), 59.5 + at, 0.15, 0.5)
    # S7: three toots around the day, the counter ticking
    for at, f0 in ((0.8, 110), (4.0, 85), (8.0, 130)):
        place(out, pfft(0.45, f0), 77 + at, 0.3, 0.5)
    for k in range(15):
        place(out, clink() * 0.3, 77.5 + k * 0.63, 0.05, 0.85)
    # S8: family laughing, then the elevator: ding, toot, awkward silence, doors
    fam = np.zeros(n); fam[int(87.5 * SR):] = murmur(n - int(87.5 * SR), voice, voices=5)
    fam *= window(n, 87.8, 89.8, 0.3)
    out += (fam * 0.1)[:, None]
    place(out, ding(), 89.7, 0.12, 0.5)
    place(out, pfft(0.6, 80), 90.7, 0.32, 0.5)
    place(out, whoosh(1.6) * 0.4, 95.6, 0.15, 0.5)
    place(out, ding(), 97.8, 0.1, 0.5)
    return out

def main():
    W = json.load(open("words.json"))
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
