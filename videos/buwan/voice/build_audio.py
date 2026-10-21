"""Ano ang mangyayari kung sumabog ang buwan: cut the voice into lines, place them on the timeline,
generate a playful original score + scene ambience, mix at the approved v3
balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 111.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (1.10, 13.65, 0.5, 'Ano nga ba ang mangyayari kung biglang sumabog ang buwan? Una sa lahat, siguradong trending agad ito sa Facebook, at may magpo-post pa ng "sana all, buo pa."', ["buwan?", "Facebook,"]),
    (14.75, 27.00, 13.75, "Sa unang oras, hindi pa ito katapusan ng mundo, dahil ayon sa mga siyentipiko, ang mga piraso ng buwan ay iikot pa rin sa Earth at unti-unting kakalat sa langit.", ["oras,", "iikot"]),
    (28.25, 42.20, 26.70, "Sa unang gabi, magkakaroon ng napakagandang ulan ng bulalakaw, kaya buong barangay ay nasa labas at nagwi-wish, pero ang iba, nagwi-wish na sana walang tumama sa bubong nila.", ["gabi,", "bulalakaw,"]),
    (43.50, 57.10, 49.35, "Sa unang araw, halos hindi na gumagalaw ang dagat sa tabing-baybayin, dahil ang buwan pala ang pangunahing humihila sa tubig, kaya malilito ang mga mangingisda kung kailan papalaot.", ["araw,", "humihila"]),
    (57.95, 73.20, 63.65, "Sa loob ng ilang taon, magiging singsing ang mga piraso sa paligid ng Earth, parang sa Saturn, kaya sa gabi, mas madilim ang paligid, at ang mga magjowa sa baywalk, wala nang buwang titingalain.", ["taon,", "singsing", "Saturn,"]),
    (74.40, 88.50, 79.60, "At pagkalipas ng libu-libong taon, puwedeng gumewang ang Earth na parang lasing na tito sa fiesta, kaya hindi na natin masasabi kung kailan ang tag-init at kailan ang tag-ulan.", ["libu-libong", "tito"]),
    (89.75, 104.35, 94.40, 'Kaya sa susunod na makita mo ang buwan, sulyapan mo naman siya kahit sandali, dahil siya ang tahimik na bantay ng ating mga gabi… at ang tanging dahilan kung bakit may "full moon" pa sa mga love song natin.', ["buwan,", "bantay", "love song"]),
]
# whisper split these words in two; merge them back
MERGES = {1: [("unti", "-unti"), ("unti-unti", "ang")], 3: [("tabing", "-baybayin.")], 4: [("sing", "-sing"), ("mag", "-joa")], 5: [("libo", "-libong"), ("tag", "-init"), ("tag", "-ulan.")]}

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
        detective = 40.95 <= t < 48.95  # the silent morning-after scene
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
    pad *= np.clip((tt - 94.0) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 40.95, 2)
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

def crow(dur=1.3):
    """cartoon rooster: a rising-falling harmonic sweep"""
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    f = 520 + 380 * np.sin(np.pi * np.clip(u * 1.4, 0, 1)) - 200 * np.clip(u - 0.7, 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k for k in range(1, 6))
    return filt(x, "band", [400, 4000]) * np.sin(np.pi * u) ** 0.5

def boom():
    n = int(2.5 * SR); tt = np.arange(n) / SR
    return filt(rng.standard_normal(n), "low", 220) * np.exp(-tt * 1.8) * 2.5

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    cr = np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t))
    night = window(n, 0, 13.35, 0.8) + window(n, 26.3, 40.95, 0.8) + window(n, 70.85, 79.2, 0.6) + window(n, 94.0, TOTAL, 1.0)
    out += (cr * night * 0.006)[:, None]
    # S1: the BOOM, then every phone pings, the post pops up
    place(out, boom(), 3.7, 0.4, 0.5)
    place(out, whoosh(1.2), 3.75, 0.15, 0.5)
    for k in range(6):
        place(out, blip(1300 + 150 * k), 8.5 + k * 0.09, 0.05, 0.2 + 0.12 * k)
    place(out, pop(), 11.1, 0.12, 0.5)
    gs = np.zeros(n); st = int(3.9 * SR); gs[st:] = murmur(n - st, voice, voices=6); gs *= window(n, 4.0, 8.4, 0.4)
    out += (gs * 0.06)[:, None]
    # S2 / S6 / S7 space: a soft low hum
    sp = filt(noise(), "low", 180) * (window(n, 13.35, 26.3, 1.0) + window(n, 63.25, 70.85, 0.6) + window(n, 79.2, 85.6, 0.6) + window(n, 88.1, 94.0, 0.6))
    out += (sp * 0.05)[:, None]
    place(out, whoosh(1.0), 13.4, 0.1, 0.5)
    # S3: meteors whooshing past, the crowd, the clank on the kaldero
    for k in range(14):
        place(out, whoosh(0.5), 26.6 + k * 0.95, 0.04, rng.random())
    cw = np.zeros(n); st = int(26.3 * SR); cw[st:] = murmur(n - st, voice, voices=8); cw *= window(n, 26.6, 33.8, 0.8)
    out += (cw * 0.04)[:, None]
    place(out, clink(), 40.1, 0.35, 0.65)
    place(out, ding() * 0.5, 40.12, 0.05, 0.65)
    # S4: morning birds, pebbles, the stall, the rooster
    chirps(out, 40.95, 63.2, 0.5, 0.03); chirps(out, 85.6, 88.1, 0.5, 0.02)
    for k in range(3):
        place(out, pop() * 0.6, 41.55 + k * 0.5, 0.08, 0.3 + 0.2 * k)
    place(out, whoosh(0.4), 43.35, 0.08, 0.5); place(out, pop(), 43.95, 0.12, 0.5)
    place(out, whoosh(0.4), 46.05, 0.08, 0.5)
    place(out, crow(), 47.15, 0.2, 0.55)
    # S5: a very calm sea, a puzzled boing
    sea = filt(noise(), "band", [200, 1500]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.12 * t)) * window(n, 48.95, 63.25, 1.0)
    out += (sea * 0.025)[:, None]
    place(out, boing(), 59.3, 0.12, 0.6)
    # S6: the ring chime, Saturn pop, the baywalk busker, a sad little "wah"
    place(out, ding(), 66.05, 0.07, 0.5); place(out, pop(), 69.5, 0.12, 0.6)
    for k in range(int((76.6 - 71.0) / 0.4)):
        m = [64, 67, 71, 67, 62, 66, 69, 66][k % 8]
        place(out, tone(hz(m), 0.6, 4, (1, 0.4, 0.2)), 71.0 + k * 0.4, 0.035, 0.75)
    wah = tone(hz(60), 1.0, 1.5) ; place(out, wah, 76.9, 0.04, 0.5); place(out, tone(hz(55), 1.2, 1.2), 77.4, 0.04, 0.5)
    # S7: the wobble, the fiesta, a hiccup, the seasons flickering
    place(out, whoosh(1.2), 83.0, 0.1, 0.3); place(out, whoosh(1.2), 84.2, 0.1, 0.7)
    fm = np.zeros(n); st = int(85.6 * SR); fm[st:] = murmur(n - st, voice, voices=8); fm *= window(n, 85.6, 88.1, 0.3)
    out += (fm * 0.06)[:, None]
    place(out, boing(), 86.6, 0.1, 0.5)
    place(out, ding() * 0.6, 91.0, 0.05, 0.4); place(out, ding() * 0.6, 93.0, 0.05, 0.6)
    # S8: a soft chime as he lowers the phone and just looks
    place(out, tone(hz(84), 2.0, 1.5), 97.0, 0.05, 0.5)
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
