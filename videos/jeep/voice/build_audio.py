"""What if may PhD sa Physics ang jeepney driver: cut the voice into lines, place them on the timeline,
generate a playful original score + scene ambience, mix at the approved v3
balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 89.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (1.0, 20.6, 0.6, 'What if ang mga jeepney driver sa Pilipinas ay may PhD sa Physics? Kasi kahit puno na ang jeep, kaya pa rin nilang maghanap ng space para sa isang pasahero. Sasabihin pa nila, "Isa pa, kasya pa!" Kahit ang natitirang space ay para na lang sa isang daga.', ["PhD", "Physics?", "kasya", "pa!\"", "daga."]),
    (20.95, 30.7, 21.1, 'Tapos may sasakay pang tatlo. Ang tanong: saan sila uupo? Simple lang ang sagot ng driver: "Diskarte lang, Boss!"', ["tatlo.", "uupo?", "\"Diskarte"]),
    (31.95, 39.45, 31.7, 'Yung pasahero sa likod, halos nasa labas na, pero sasabihin pa rin ng driver, "Usog lang po nang konti!"', ["labas", "\"Usog"]),
    (39.5, 48.5, 49.0, 'Dito mo maiisip na baka hindi ordinaryong jeep ang sinasakyan mo. Baka may technology ito na kayang baguhin ang space-time continuum!', ["ordinaryong", "technology", "space-time", "continuum!"]),
    (49.95, 59.3, 58.8, 'Si Einstein nga, ilang taon nag-aral ng physics. Pero ang jeepney driver, isang tingin lang, alam na kung ilan pang pasahero kasya!', ["Einstein", "taon", "tingin", "kasya!"]),
    (61.85, 71.7, 69.0, 'Kaya ang tanong: kailangan pa ba natin ng NASA kung mayroon naman tayong mga jeepney driver na kayang labagin ang batas ng physics araw-araw?', ["NASA", "labagin", "araw-araw?"]),
    (72.45, 79.95, 79.7, 'Sa Pilipinas, walang imposible, basta may jeepney driver na nagsasabing, "Kasya pa, Boss!"', ["imposible,", "\"Kasya", "Boss!\""]),
]
# whisper split these words in two; merge them back
MERGES = {2: [("na", "sa"), ("sa", "asabihin")], 3: [("ordar", "na"), ("ordarna", "yung"), ("space", "-time")], 4: [("nag", "-aral"), ("jeep", "ni")], 5: [("jeep", "ni"), ("araw", "-araw.")]}

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
        detective = 39.5 <= t < 48.5  # the silent Great Scoot scene
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
    pad *= np.clip((tt - 79.2) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 39.5, 2)
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

def engine(n, t, level):
    """idling diesel: a low lumpy rumble"""
    f = 38 + 3 * np.sin(2 * np.pi * 0.7 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * (0.6 + 0.4 * np.sin(ph * 0.5)) + 0.3 * rng.standard_normal(n)
    return filt(x, "low", 260) * level

def squeak():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    f = 2600 + 900 * np.sin(np.pi * tt / tt[-1])
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.005, 0.08)

def cluck():
    out = np.zeros(int(0.5 * SR))
    for k in range(3):
        n = int(0.07 * SR); tt = np.arange(n) / SR
        c = filt(np.sin(2 * np.pi * 700 * tt) + 0.4 * rng.standard_normal(n), "band", [400, 2500]) * env(n, 0.002, 0.03)
        p = int(k * 0.12 * SR); out[p:p + n] += c
    return out

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    # jeep idling under the street scenes; birds; street murmur
    eng = engine(n, t, 1.0) * (window(n, 0, 39.5, 0.8) + window(n, 58.3 + 4.4, 68.5, 0.4) + window(n, 68.5, 79.2, 0.5) * 0.6 + window(n, 79.2, 88.5, 0.5))
    out += (eng * 0.05)[:, None]
    chirps(out, 0.5, 39.5, 0.4, 0.025)
    chirps(out, 79.2, 88.0, 0.4, 0.025)
    cw = np.zeros(n); cw[:] = murmur(n, voice, voices=8); cw *= window(n, 0.3, 31.2, 0.8)
    out += (cw * 0.035)[:, None]
    # S1: horn, PhD pop, the barker, the glowing gap, the mouse
    place(out, horn(), 1.0, 0.1, 0.6)
    place(out, pop(), 3.6, 0.12, 0.5)
    place(out, whoosh(0.5), 7.0, 0.1, 0.5)
    place(out, pop(), 15.1, 0.1, 0.5)
    place(out, ding() * 0.5, 16.2, 0.06, 0.6)
    place(out, squeak(), 18.95, 0.12, 0.6)
    place(out, squeak(), 19.4, 0.08, 0.6)
    # S2: footsteps, +3, the question, the thumbs-up
    for k in range(8):
        place(out, thump() * 0.3, 20.6 + 0.2 + k * 0.25, 0.08, 0.3 + 0.05 * k)
    place(out, pop(), 20.6 + 1.6, 0.12, 0.5)
    place(out, boing(), 20.6 + 4.3, 0.12, 0.5)
    place(out, whoosh(0.5), 20.6 + 8.2, 0.1, 0.5)
    place(out, ding() * 0.5, 20.6 + 8.9, 0.07, 0.5)
    # S3: the shove
    place(out, thump(), 31.2 + 5.5, 0.2, 0.7)
    place(out, boing(), 31.2 + 5.6, 0.1, 0.6)
    # S4: slow scoot (whoosh), rubber stretch, a pop per arrival, the chicken
    place(out, whoosh(1.4), 39.5 + 0.8, 0.12, 0.5)
    for k in range(4):
        place(out, boing(), 39.5 + 2.2 + k * 0.4, 0.08, 0.3 + 0.15 * k)
    for a in (4.0, 5.0, 6.0, 7.0):
        place(out, pop(), 39.5 + a, 0.14, 0.5)
    place(out, cluck(), 39.5 + 6.2, 0.18, 0.4)
    place(out, ding() * 0.5, 39.5 + 7.8, 0.06, 0.6)
    # S5: driving, the dive into the tunnel, shimmer
    place(out, horn(), 48.5 + 0.8, 0.08, 0.5)
    place(out, whoosh(1.6), 48.5 + 4.8, 0.2, 0.5)
    sh = sum(np.sin(2 * np.pi * f * t) for f in (880, 1320, 1760)) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * t)) * window(n, 48.5 + 5.4, 58.3, 0.6)
    out += (sh * 0.006)[:, None]
    hum = filt(noise(), "low", 300) * window(n, 48.5 + 5.4, 58.3, 0.6)
    out += (hum * 0.03)[:, None]
    place(out, ding() * 0.5, 48.5 + 7.9, 0.07, 0.5)
    # S6: chalk ticks, the glance, +5
    for k in range(12):
        place(out, clink() * 0.3, 58.3 + 0.4 + k * 0.33, 0.06, 0.4)
    place(out, whoosh(0.5), 58.3 + 4.4, 0.1, 0.5)
    place(out, blip(1600), 58.3 + 6.2, 0.1, 0.5)
    place(out, ding() * 0.5, 58.3 + 8.9, 0.07, 0.5)
    # S7: launch-pad rumble, NASA, the stamp
    rb = filt(noise(), "low", 120) * window(n, 68.5, 72.5, 1.0)
    out += (rb * 0.08)[:, None]
    place(out, pop(), 68.5 + 3.3, 0.12, 0.5)
    place(out, pop(), 68.5 + 7.5, 0.12, 0.5)
    place(out, thump(), 68.5 + 8.5, 0.35, 0.5)
    place(out, horn(), 68.5 + 6.3, 0.07, 0.7)
    # S8: the hop on, horn, drive away
    place(out, boing(), 79.2 + 6.6, 0.12, 0.5)
    place(out, horn(), 79.2 + 7.0, 0.1, 0.5)
    place(out, whoosh(1.2), 79.2 + 7.2, 0.08, 0.5)
    return out * 1.1

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
