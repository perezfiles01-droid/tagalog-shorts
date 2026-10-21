"""Makakaligtas ka ba sa zombie outbreak: cut the voice into lines, place them on the timeline,
generate a playful original score + scene ambience, mix at the approved v3
balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 98.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (1.55, 13.35, 0.6, "Makakaligtas ka ba kung magkakaroon ng zombie outbreak? Kung ang plano mo ay magtago sa ilalim ng kama habang nagse-cellphone, baka ikaw ang unang maging meryenda.", ["zombie", "meryenda."]),
    (14.85, 26.65, 13.2, "Ayon sa isang pag-aaral sa Cornell University, mabilis malalamon ng zombie ang mga siyudad, pero ang mga nasa liblib na lugar ay maaaring makaligtas nang ilang buwan.", ["Cornell", "liblib"]),
    (27.60, 36.50, 25.8, "Pero teka, may outbreak din naman ngayon, hindi nga lang zombie, kundi mga korap na politiko.", ["korap"]),
    (37.05, 47.40, 44.0, "Kung utak ng tao ang kinakain ng zombie, ang mga ganid na politiko naman ay kinakain ang kinabukasan ng mga ordinaryong Pilipino.", ["utak", "kinabukasan"]),
    (48.20, 65.50, 55.15, "Noong 2025, tinantya ng Kagawaran ng Pananalapi na bilyon-bilyong piso kada taon ang nawala sa mga proyektong kontra-baha, kaya pagdating ng ulan, tayo ang nalulunod habang sila ang nabubusog.", ["bilyon-bilyong", "nalulunod", "nabubusog."]),
    (66.90, 78.45, 73.25, "Pero ibang lunas dito: hindi tayo dapat magtago at lumayo, kundi magbantay, magsumbong, at bumoto nang dilat ang mata.", ["magbantay,", "magsumbong,", "bumoto"]),
    (79.35, 88.80, 85.6, "Dahil ang zombie ay takot sa apoy, pero ang korap na politiko, takot sa taong-bayang gising… at sa resibo.", ["resibo."]),
]
# whisper split these words in two; merge them back
MERGES = {1: [("pag", "-aara")], 2: [("ngayon", "na")], 4: [("billion", "-billion"), ("kontra", "-baha")], 6: [("taong", "bayang")]}

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
        detective = 35.0 <= t < 43.5  # the silent zombie-buffet scene
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
    pad *= np.clip((tt - 85.1) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 35.0, 2)
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

def buzz_track(n, t, level):
    """fly buzz: a wobbling ~210 Hz sawtooth-ish drone, amplitude from a level curve"""
    f = 210 + 25 * np.sin(2 * np.pi * 5.3 * t) + 10 * np.sin(2 * np.pi * 13 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k for k in range(1, 6))
    return filt(x, "band", [150, 2500]) * level

def groan(dur=1.4, f0=95):
    """cartoon zombie groan: a low wobbling hum, more silly than scary"""
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    f = f0 * (1 + 0.12 * np.sin(2 * np.pi * 4 * tt)) * (1.1 - 0.25 * u)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k for k in range(1, 6))
    return filt(x, "band", [80, 1200]) * np.sin(np.pi * u) ** 0.7

def chomp():
    n = int(0.12 * SR)
    return filt(rng.standard_normal(n), "band", [600, 3500]) * env(n, 0.002, 0.04)

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    # S1: night crickets, groans outside, the hand under the bed
    cr = np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t))
    out += (cr * window(n, 0, 12.7, 1.0) * 0.006)[:, None]
    for at, f in ((1.0, 90), (2.6, 110), (3.8, 80)):
        place(out, groan(1.4, f), at, 0.2, rng.random())
    place(out, whoosh(0.5), 4.8, 0.12, 0.5)
    place(out, groan(1.6, 85), 9.8, 0.18, 0.7)
    place(out, boing(), 11.37, 0.15, 0.5)
    # S2: the map: whoosh in, infection spreading, lights in remote places
    place(out, whoosh(0.8), 12.7, 0.1, 0.5)
    place(out, pop(), 12.7 + 2.0, 0.1, 0.5)
    sp = filt(noise(), "low", 500) * window(n, 12.7 + 4.0, 12.7 + 7.0, 0.5)
    out += (sp * 0.04)[:, None]
    for k in range(4):
        place(out, blip(1200 + k * 200), 12.7 + 8.45 + k * 0.12, 0.06, 0.3 + 0.15 * k)
    # S3: TV static on the switch, then the town hall
    place(out, filt(rng.standard_normal(int(0.4 * SR)), "band", [2000, 8000]) * 0.5, 25.3 + 4.8, 0.12, 0.5)
    place(out, whoosh(0.6), 25.3 + 6.7, 0.12, 0.5)
    chirps(out, 25.3 + 6.9, 54.4, 0.5, 0.025)
    place(out, groan(1.3, 100), 25.3 + 7.9, 0.15, 0.6)
    # S4: the buffet: chomps on each item, a burp, the wall crumbling
    for a, b in ((0.8, 2.8), (3.0, 4.8), (5.0, 6.6)):
        for k in range(int((b - a) / 0.22)):
            place(out, chomp(), 35.0 + a + k * 0.22, 0.12, rng.random())
        place(out, pop(), 35.0 + a, 0.1, 0.5)
    for k in range(6):
        place(out, thump() * 0.6, 35.0 + 6.9 + k * 0.15, 0.2, 0.3 + 0.08 * k)
    # S5: chomps on school, rice, jeepney, and a horn as the jeepney goes
    for a in (5.3, 6.83, 7.61):
        for k in range(3):
            place(out, chomp(), 43.5 + a + k * 0.15, 0.14, 0.5)
    place(out, horn(), 43.5 + 7.65, 0.08, 0.6)
    place(out, pfft(0.4, 70), 43.5 + 9.6, 0.1, 0.5)  # a little burp
    # S6: rain, thunder, coins jingling away, water rising
    rn = filt(noise(), "band", [800, 7000]) * window(n, 54.65, 72.75, 1.0)
    out += (rn * 0.03)[:, None]
    th = filt(noise(), "low", 150) * window(n, 54.65 + 10.3, 54.65 + 11.8, 0.4)
    out += (th * 0.2)[:, None]
    for k in range(8):
        place(out, clink() * 0.5, 54.65 + 5.9 + k * 0.3, 0.08, rng.random())
    place(out, pfft(0.5, 80), 54.65 + 17.06, 0.12, 0.6)
    # S7: birds, crowd stepping out, each civic action
    chirps(out, 72.75, 85.1, 0.5, 0.03)
    cw = np.zeros(n); st = int(77.5 * SR); cw[st:] = murmur(n - st, voice, voices=8); cw *= window(n, 77.8, 85.0, 0.8)
    out += (cw * 0.05)[:, None]
    for a in (7.03, 8.55, 10.19):
        place(out, ding() * 0.5, 72.75 + a, 0.05, 0.5)
    place(out, groan(1.2, 120), 72.75 + 11.0, 0.12, 0.8)
    # S8: fire crackle, the lunge, the crowd standing, the receipt, the run
    fc = filt(noise(), "band", [1500, 6000]) * (rng.random(n) > 0.9993) * window(n, 85.1, 89.6, 0.4)
    out += (np.convolve(fc, np.ones(60) / 60, "same") * 2.0)[:, None]
    place(out, groan(0.9, 140), 85.1 + 2.4, 0.15, 0.3)
    place(out, whoosh(0.4), 85.1 + 4.3, 0.12, 0.6)
    cw2 = np.zeros(n); st = int(91.8 * SR); cw2[st:] = murmur(n - st, voice, voices=8); cw2 *= window(n, 92.0, 96.5, 0.6)
    out += (cw2 * 0.06)[:, None]
    for k in range(4):
        place(out, chomp(), 85.1 + 9.3 + k * 0.12, 0.15, 0.6)
    place(out, boing(), 85.1 + 9.6, 0.15, 0.7)
    place(out, whoosh(0.8), 85.1 + 9.8, 0.12, 0.9)
    return out * 0.8

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
