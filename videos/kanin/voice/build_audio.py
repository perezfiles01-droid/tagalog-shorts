"""Nalulungkot ba ang kanin: cut the voice into lines, place them on the timeline,
generate a playful original score + scene ambience, mix at the approved v3
balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 95.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (1.20, 9.70, 0.5, "What if may feelings pala ang kanin? Araw-araw siyang nasa hapag-kainan, pero hindi siya ang bida. Laging ulam ang pinupuri!", ["kanin?", "bida.", "ulam"]),
    (10.75, 19.00, 9.9, 'Kapag may adobong manok, sasabihin ng pamilya, "Wow, ang sarap!" Pero ang kanin? Tahimik lang sa gilid.', ["adobong", "kanin?"]),
    (20.40, 30.95, 19.05, 'Kahit ubusin mo siya hanggang huling butil, walang nagsasabi ng, "Wow, ang sarap ng kanin!" Grabe, invisible na nga, underappreciated pa!', ["butil,", "invisible", "underappreciated"]),
    (32.15, 40.60, 30.5, 'Isang araw, nagdesisyon ang kanin na mag-rebelde. Sabi niya, "Tingnan natin kung masarap pa ang adobo n\'yo nang wala ako!"', ["mag-rebelde."]),
    (42.00, 50.50, 48.35, "Kinabukasan, naghanda ang pamilya ng lechon, lumpia, spaghetti. Pero walang kanin sa mesa!", ["walang", "kanin"]),
    (52.20, 61.85, 57.75, 'Biglang nag-panic ang lahat! Si Papa, napatanong, "Anong klaseng handaan \'to? Nasaan ang kanin?!" Pati si Mama, hindi na alam ang gagawin!', ["nag-panic", 'kanin?!"']),
    (63.35, 77.00, 68.3, 'Sa wakas, na-realize ng lahat na hindi kumpleto ang handaan kung walang kanin. Kaya mula noon, bago purihin ang ulam, sinasabi muna nila, "Salamat, kanin. Ikaw ang tunay na bida!"', ["kumpleto", '"Salamat,', "kanin.", "tunay", 'bida!"']),
    (79.05, 88.80, 82.85, "Kaya tandaan, huwag maliitin ang kanin. Dahil kahit gaano kasarap ang ulam, kapag walang kanin, parang may kulang sa buhay mo!", ["maliitin", "kulang"]),
]
# whisper split these words in two; merge them back
MERGES = {0: [("Araw", "-araw"), ("hapag", "-kainan,")], 3: [("nag", "-decision"), ("mag", "-rebelde,")], 5: [("nag", "-panik")], 6: [("mo", "na")]}

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
        detective = 39.35 <= t < 47.85  # sneaky theme while the rice runs away
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
    pad *= np.clip((tt - 82.35) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 30.0, 2)
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

def creak(dur=0.8):
    """wooden door creak: a slow, gritty pitch slide"""
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    f = 210 - 90 * u + 15 * np.sin(2 * np.pi * 9 * tt)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + 0.5 * (rng.random(n) > 0.6))
    return filt(x, "band", [300, 2400]) * np.sin(np.pi * u) ** 0.7 * 0.6

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    # S1-S3: quiet dinner, spoons on plates now and then
    for k in range(12):
        place(out, clink() * 0.5, 1.2 + k * 1.45 + rng.random() * 0.4, 0.05, rng.random())
    place(out, tone(hz(76), 1.4, 2.5) + tone(hz(71), 1.4, 2.5) * 0.7, 6.2, 0.05, 0.6)  # the tear
    # S2: "Wow!" hearts for the adobo, the rice sighs
    for i in range(10):
        place(out, pop() * 0.6, 9.4 + 3.85 + i * 0.16, 0.07, rng.random())
    wv = np.zeros(n); wv[int(13.0 * SR):] = murmur(n - int(13.0 * SR), voice, voices=3); wv *= window(n, 13.1, 14.4, 0.2)
    out += (wv * 0.08)[:, None]
    place(out, whoosh(0.9), 9.4 + 7.7, 0.04, 0.6)
    # S3: spoon after spoon, more hearts, the rice turns invisible, "0" pops in
    for d in [0.3, 0.75, 1.2, 1.65, 2.1]:
        place(out, clink(), 18.55 + d + 0.05, 0.14, 0.6)
    for i in range(10):
        place(out, pop() * 0.6, 18.55 + 4.1 + i * 0.16, 0.06, rng.random())
    place(out, tone(hz(84), 1.6, 1.5, (1, 0.2, 0.5)) + tone(hz(91), 1.6, 1.5) * 0.5, 18.55 + 8.1, 0.05, 0.5)
    place(out, thump(), 18.55 + 9.6, 0.3, 0.5)
    # S4: steam of anger, the jump out of the bowl
    hs = filt(noise(), "band", [2500, 8000]) * window(n, 32.9, 34.4, 0.3)
    out += (hs * 0.03)[:, None]
    place(out, boing(), 33.4, 0.2, 0.55)
    place(out, thump(), 33.95, 0.15, 0.55)
    # S5 (silent): lid, hops, bandana and bindle, tiptoes, the door, night outside
    place(out, clink(), 39.65, 0.15, 0.5)
    place(out, boing(), 40.65, 0.12, 0.5)
    place(out, pop(), 41.35, 0.08, 0.5); place(out, pop(), 41.75, 0.08, 0.6)
    place(out, boing(), 42.25, 0.12, 0.6)
    for k in range(14):
        place(out, blip(1900 + 200 * (k % 2)), 43.65 + k * 0.23, 0.035, 0.5 + 0.1 * (k % 2))
    place(out, creak(0.9), 44.55, 0.25, 0.7)
    cr = np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t))
    out += (cr * window(n, 44.9, 47.9, 0.6) * 0.006)[:, None]
    # S6: dishes pop onto the table, the happy crowd, then the red X
    for a in [2.38, 3.64, 5.4]:
        place(out, pop(), 47.85 + a - 0.1, 0.12, 0.5); place(out, ding(), 47.85 + a, 0.04, 0.5)
    hp = np.zeros(n); hp[int(47.85 * SR):] = murmur(n - int(47.85 * SR), voice, voices=5); hp *= window(n, 48.0, 55.4, 0.6)
    out += (hp * 0.05)[:, None]
    place(out, thump(), 47.85 + 7.6, 0.45, 0.5)
    # S7: panic in the crowd, the "?!", Mama spins
    pn = np.zeros(n); pn[int(57.25 * SR):] = murmur(n - int(57.25 * SR), voice, voices=8); pn *= window(n, 57.4, 67.6, 0.4)
    out += (pn * 0.09)[:, None]
    place(out, thump(), 57.25 + 6.35, 0.3, 0.5)
    place(out, whoosh(1.2), 57.25 + 8.1, 0.1, 0.4)
    place(out, whoosh(1.2), 57.25 + 9.3, 0.1, 0.6)
    # S8: the door creaks, the rice peeks in; whip to the table; "Salamat" and the golden glow
    place(out, creak(0.7), 67.8 + 0.3, 0.2, 0.7)
    place(out, whoosh(0.8), 67.8 + 5.4, 0.15, 0.5)
    place(out, ding(), 67.8 + 11.1, 0.06, 0.5)
    place(out, tone(hz(96), 1.8, 2) + tone(hz(100), 1.8, 2) * 0.6, 67.8 + 13.1, 0.06, 0.5)
    # S9: sunset crickets and family chatter fading as we rise; the rice winks
    out += (cr * window(n, 82.35, 95, 1.5) * 0.006)[:, None]
    fm = np.zeros(n); fm[int(82.35 * SR):] = murmur(n - int(82.35 * SR), voice, voices=5)
    fm *= window(n, 82.5, 94.5, 1.0) * np.clip((92 - t) / 9, 0, 1)
    out += (fm * 0.05)[:, None]
    place(out, blip(1600), 82.35 + 8.85, 0.08, 0.5)
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
