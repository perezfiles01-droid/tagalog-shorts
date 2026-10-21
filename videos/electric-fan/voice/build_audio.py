"""What if napapagod din ang electric fan: cut the voice into lines (long inner
pauses shortened, see plan.py), place them on the timeline, generate the
playful original score + scene ambience, mix at the approved v3 balance, and
write video/public/mix.wav + video/src/timeline.json."""
import json, re, difflib, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, thump, clink, murmur, rng
from plan import plan

SCENES, PLAN, _ = plan()
TOTAL = 116.0
VIDEO = "../video"

# (subtitle text exactly as spoken, gold words)
LINES = [
    ("What if napapagod din pala ang electric fan sa kakaiikot buong araw? Imagine mo, mula umaga hanggang gabi, paikot-ikot lang siya. Wala man lang siyang break or day off!", ["electric", "fan", "day", "off!"]),
    ("Araw-araw, nakatutok siya sa'yo habang nakahiga ka lang sa kama, nagse-cellphone, kumakain, at nanonood ng TikTok. Samantalang siya, todo effort para lang hindi ka pagpawisan!", ["TikTok.", "effort"]),
    ("Minsan, nasa number three na ang speed niya, pero hindi ka pa rin satisfied. Sasabihin mo pa, \"Ang init naman! Bilisan mo pa!\" Parang empleyadong pinapagalitan kahit ginagawa naman ang trabaho niya!", ["three", "satisfied."]),
    ("Hanggang isang araw, bigla na lang siyang tumigil. Hindi dahil sira siya, kundi dahil pagod na pagod na siya sa buhay. Parang may silent quitting na nagaganap sa electric fan!", ["tumigil.", "silent", "quitting"]),
    ("Siyempre, magagalit ka agad. \"Hoy! Bakit ka huminto? Ang init-init dito!\" Tapos tatayo ka para kalabitin siya, akala mo naman may magic button para bumalik ang motivation niya.", ["magic", "button", "motivation"]),
    ("Biglang sumagot ang electric fan, \"Ikaw kaya umikot buong araw! Nakahiga ka lang diyan, ako na nga nagpapalamig sa'yo, ako pa ang inaaway! Ni thank you, hindi mo man lang ako binibigyan!\"", ["thank", "you,"]),
    ("Simula noon, nagbago ang buhay sa bahay. Ang electric fan na ang may remote control, at ikaw naman ang kailangang tumakbo para mag-adjust ng speed niya. Kapag nagreklamo ka, sasabihin lang niya, \"Ikaw naman ang gumalaw. Ako naman ang magpapahinga!\"", ["remote", "control,"]),
    ("Kaya tandaan, mga kaibigan, huwag nating abusuhin ang electric fan. Hindi natin alam, baka bukas pati aircon natin mag-file na ng resignation letter!", ["resignation", "letter!"]),
]
BOUNDS = [0, 14.2, 26.82, 42.7, 55.66, 71.0, 84.9, 102.16, 999]
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower()).replace("three", "3")

def to_video(i, x):
    """source time -> video time for line i (inner pauses removed)"""
    at, segs = PLAN[i]["at"], PLAN[i]["segs"]
    acc = 0.0
    for a, b in segs:
        if x <= b:
            return at + acc + max(0.0, x - a)
        acc += b - a
    return at + acc

def words_for_line(i, W):
    text, gold = LINES[i]
    ws = [dict(w) for w in W if BOUNDS[i] <= w["s"] < BOUNDS[i + 1]]
    for j in range(len(ws) - 1, 0, -1):  # whisper splits "paikot -ikot": glue back
        if ws[j]["w"].startswith("-"):
            ws[j - 1]["w"] += ws[j]["w"]; ws[j - 1]["e"] = ws[j]["e"]; del ws[j]
    script = text.split(" ")
    sm = difflib.SequenceMatcher(a=[norm(t) for t in script], b=[norm(w["w"]) for w in ws], autojunk=False)
    times = [None] * len(script)
    for blk in sm.get_opcodes():
        tag, a0, a1, b0, b1 = blk
        if tag == "equal" or (tag == "replace" and a1 - a0 == b1 - b0):
            for k in range(a1 - a0):
                times[a0 + k] = (ws[b0 + k]["s"], ws[b0 + k]["e"])
        elif tag == "replace":  # spread the whisper span over the script words by length
            s0, e0 = ws[b0]["s"], ws[b1 - 1]["e"]
            L = [len(t) + 1 for t in script[a0:a1]]; c = 0
            for k, l in enumerate(L):
                times[a0 + k] = (s0 + (e0 - s0) * c / sum(L), s0 + (e0 - s0) * (c + l) / sum(L)); c += l
    for k in range(len(script)):  # words whisper missed: squeeze between neighbours
        if times[k] is None:
            p = times[k - 1][1] if k else ws[0]["s"]
            q = next((times[j][0] for j in range(k + 1, len(script)) if times[j]), p + 0.3)
            times[k] = (p, max(p + 0.05, min(q, p + 0.3)))
    g = set(gold)
    return [{"w": t, "s": round(to_video(i, s), 3), "e": round(to_video(i, e), 3), "gold": t in g} for t, (s, e) in zip(script, times)]

def voice_track():
    v, sr = sf.read("enhanced.wav")
    v = v.mean(axis=1) if v.ndim > 1 else v
    out = np.zeros(int(TOTAL * SR))
    fade = int(0.025 * SR)
    for L in PLAN:
        p = int(L["at"] * SR)
        for s, e in L["segs"]:
            clip = v[int(s * SR):int(e * SR)].copy()
            r = np.linspace(0, 1, fade)
            clip[:fade] *= r; clip[-fade:] *= r[::-1]
            out[p:p + len(clip)] += clip
            p += len(clip)
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
        detective = 38.48 <= t < 44.48  # the fan winds down and stops
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
    pad *= np.clip((tt - 101.76) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 38.48, 2)
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

def click():
    n = int(0.05 * SR); tt = np.arange(n) / SR
    return filt(rng.standard_normal(n), "band", [1500, 6000]) * np.exp(-tt * 140) + np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 90) * 0.4

def creak(dur=0.7):
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    f = 180 + 60 * np.sin(np.pi * u) + 8 * np.sin(2 * np.pi * 37 * tt)
    x = sum(np.sin(k * 2 * np.pi * np.cumsum(f) / SR) / k for k in range(1, 8))
    return filt(x, "band", [300, 3000]) * np.sin(np.pi * u) ** 0.7

def sigh(dur=1.2):
    n = int(dur * SR); u = np.arange(n) / n
    x = filt(rng.standard_normal(n), "band", [250, 1800])
    return x * np.sin(np.pi * u) ** 1.5 * (1 - 0.5 * u)

def wahwah():
    """sad trombone-ish: two falling notes"""
    a = tone(hz(62), 0.5, 2, (1, 0.6, 0.4, 0.2)); b = tone(hz(59), 0.9, 1.5, (1, 0.6, 0.4, 0.2))
    out = np.zeros(int(1.5 * SR)); out[:len(a)] += a; out[int(0.5 * SR):int(0.5 * SR) + len(b)] += b
    return out

def step():
    n = int(0.08 * SR); tt = np.arange(n) / SR
    return filt(rng.standard_normal(n), "low", 500) * np.exp(-tt * 50)

def rumble(dur=1.6):
    n = int(dur * SR); u = np.arange(n) / n
    return filt(rng.standard_normal(n), "low", 160) * np.sin(np.pi * u) * 3

def fan_speed(t):
    """blade speed 0..1 over the whole video, matching the scenes"""
    s = np.where(t < 26.72, 0.6, 1.0)
    s = np.where((t >= 38.48) & (t < 42.08), 1.0 - (t - 38.48) / 3.6, s)
    s = np.where((t >= 42.08) & (t < 85.57), 0.0, s)
    lv = np.zeros_like(t)
    for c, v in zip([90.87, 93.27, 95.47, 97.57], [0.38, 0.75, 1.0, 0.56]):
        lv = np.where(t > c + 1.0, v, lv)
    s = np.where((t >= 85.57) & (t < 101.76), lv, s)
    return np.where(t >= 101.76, 0.4, s)

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    # fan hum + air: pitch and level follow the blade speed (winds down in S4)
    sp = filt(fan_speed(t), "low", 4)
    f = 70 + 60 * sp + 2 * np.sin(2 * np.pi * 0.35 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    hum = sum(np.sin(k * ph) / k ** 1.5 for k in range(1, 6)) * 0.02 + filt(noise(), "band", [200, 2500]) * 0.06 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.35 * t))
    hum *= np.clip(sp, 0, 1) ** 1.2
    out += (hum * 0.6)[:, None]
    # S1: morning birds, then night crickets; the "0 day off" pop
    chirps(out, 0.5, 6.0, 0.6, 0.025)
    cr = np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t))
    out += (cr * window(n, 6.5, 12.6, 1.0) * 0.006)[:, None]
    place(out, thump(), 11.3, 0.3, 0.5)
    # S2: crunchy chips, TikTok blips on the phone
    for k in range(6):
        place(out, filt(rng.standard_normal(int(0.06 * SR)), "band", [1500, 7000]) * env(int(0.06 * SR), 0.002, 0.03), 17.6 + k * 0.22, 0.1, 0.3)
    for k in range(5):
        place(out, blip(1200 + 300 * (k % 3)), 18.96 + k * 0.28, 0.06, 0.35)
    # S3: speed 3 click + whoosh, ding on the "3" overlay, sad wah-wah on the scolded worker
    place(out, click(), 26.72, 0.4, 0.6)
    place(out, whoosh(1.0), 26.8, 0.2, 0.5)
    place(out, ding(), 26.8, 0.06, 0.5)
    place(out, wahwah(), 34.4, 0.05, 0.5)
    # S4 (silent): wind-down, last creak, big sigh
    place(out, creak(), 42.0, 0.12, 0.6)
    place(out, sigh(), 42.9, 0.25, 0.5)
    # S5: little rain cloud with a rumble, pop for SILENT QUITTING
    place(out, rumble(), 52.0, 0.12, 0.5)
    rn = filt(noise(), "band", [2500, 9000]) * (rng.random(n) > 0.997) * 3 + filt(noise(), "band", [800, 5000]) * 0.15
    out += (rn * window(n, 52.2, 57.3, 0.6) * 0.03)[:, None]
    place(out, pop(), 54.08, 0.12, 0.5)
    # S6: footsteps to the fan, clicking every button, the red X
    for k in range(5):
        place(out, step(), 65.6 + k * 0.32, 0.3, 0.4 + 0.05 * k)
    for k in range(5):
        place(out, click(), 67.0 + k * 0.7, 0.3, 0.6)
    place(out, thump(), 68.6, 0.45, 0.5)
    # S7: the head snaps around, steam hiss while it rants
    place(out, boing(), 72.2, 0.18, 0.6)
    place(out, whoosh(0.4), 72.15, 0.15, 0.6)
    hs = filt(noise(), "band", [3000, 9000]) * window(n, 79.0, 85.3, 0.4) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.1 * t))
    out += (hs * 0.015)[:, None]
    # S8: remote beeps, running owner, button clicks, a smug ding
    for c in [90.87, 93.27, 95.47, 97.57]:
        place(out, blip(2000), c, 0.12, 0.3)
        for k in range(4):
            place(out, step(), c + 0.15 + k * 0.17, 0.25, 0.6)
            place(out, step(), c + 1.35 + k * 0.17, 0.25, 0.6)
        place(out, click(), c + 1.0, 0.3, 0.4)
    place(out, ding(), 100.4, 0.06, 0.5)
    # S9: birds again, the paper sliding out, the resignation reveal
    chirps(out, 102.0, 114.0, 0.5, 0.02)
    place(out, whoosh(0.6), 111.1, 0.12, 0.4)
    place(out, thump(), 112.36, 0.3, 0.5)
    place(out, ding(), 112.4, 0.07, 0.5)
    return out

def main():
    W = json.load(open("words.json"))
    json.dump([{"start": PLAN[i]["at"], "words": words_for_line(i, W)} for i in range(len(LINES))], open(f"{VIDEO}/src/timeline.json", "w"), ensure_ascii=False, indent=1)
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
