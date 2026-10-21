"""What if nag-AWOL ang alarm clock: cut the voice into lines, place them on the
timeline, generate the playful original score + bedroom ambience, mix at the
approved v3 balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 132.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
# a token "x|n" covers n whisper words; "~" shows as a space inside one token
LINES = [
    (1.00, 13.05, 0.5, "What if nagsawa na pala ang alarm clock mo na gisingin ka araw-araw? Imagine mo, araw-araw siyang bumabangon nang maaga para lang gisingin ka, pero ikaw, sarap na sarap sa tulog!", ["nagsawa"]),
    (13.90, 27.40, 13.3, "Araw-araw, alas-sais|2 pa lang ng umaga, todo~tunog na siya. Pero ano ang ginagawa mo? Snooze! Limang minuto pa raw. Tapos limang minuto ulit, hanggang umabot na ng isang oras!", ["Snooze!", "oras!"]),
    (28.15, 42.95, 27.5, "Siguro sa isip ng alarm clock, \u201cAno ba 'to? Ginagawa ko naman ang trabaho ko, pero lagi akong ini-ignore! Hindi ba niya alam na may pangarap din ako sa buhay?\u201d Parang empleyadong walang sweldo at walang day~off!", ["ini-ignore!", "pangarap", "sweldo"]),
    (43.55, 58.40, 43.0, "Hanggang isang Lunes ng umaga, nagdesisyon siyang sumuko. Alas-sais|2 na, alas-siyete,|2 alas-otso\u2026|2 Pero tahimik pa rin ang kwarto mo. Wala nang tunog, wala nang vibration. Nag-AWOL na talaga siya!", ["Lunes", "Nag-AWOL"]),
    (59.60, 78.45, 67.1, "Nagising ka na lang alas-onse|2 na ng umaga! Pagtingin mo sa oras, bigla kang napabangon. \u201cANO?! LATE NA AKO!\u201d Nagmamadali kang maligo, magbihis, at maghanap ng medyas na magkapareho. Pati almusal, hindi mo na nagawang kainin!", ["alas-onse", "LATE"]),
    (79.40, 95.10, 86.7, "Pagkatapos lahat ng stress, tinanong mo ang alarm clock mo, \u201cBakit hindi ka tumunog?! Ano bang problema mo?\u201d Bigla siyang sumagot, \u201cSorry, boss. Nag-leave ako. Deserve ko rin magpahinga! Araw-araw mo 'kong sini-snooze. Akala mo ba wala akong feelings?\u201d", ["Nag-leave", "feelings?\u201d"]),
    (96.30, 113.40, 103.1, "Simula noon, natuto ka nang bumangon agad kapag tumunog ang alarm. Hindi mo na siya sini-snooze kahit antok na antok ka pa. Kasi takot kang baka mag-AWOL ulit siya. Kung pati cellphone mo mag-resign, baka~pati trabaho mo mawala!", ["mag-AWOL", "mag-resign,"]),
    (114.05, 123.10, 120.9, "Kaya tandaan, mga kaibigan, huwag abusuhin ang alarm clock ninyo. Baka isang araw, hindi lang siya ang mag-AWOL\u2026 pati ikaw, sa trabaho na rin!", ["mag-AWOL\u2026", "trabaho"]),
]
FIRST = [0, 33, 64, 103, 137, 175, 216, 256, 281]  # whisper word index where each line starts

def words_for_line(i, W):
    s, e, at, text, gold = LINES[i]
    raw = W[FIRST[i]:FIRST[i + 1]]
    ws = []  # whisper glued "-x" fragments back onto the word before
    for w in raw:
        if w["w"].startswith("-") and ws: ws[-1] = {"w": ws[-1]["w"] + w["w"], "s": ws[-1]["s"], "e": w["e"]}
        else: ws.append(dict(w))
    toks = []
    for tok in text.split(" "):
        n = 1
        if "|" in tok: tok, n = tok.rsplit("|", 1); n = int(n)
        toks.append((tok.replace("~", " "), n))
    assert sum(n for _, n in toks) == len(ws), (i, sum(n for _, n in toks), len(ws), [w["w"] for w in ws])
    off = at - s; out = []; k = 0
    for tok, n in toks:
        a, b = ws[k], ws[k + n - 1]; k += n
        out.append({"w": tok, "s": round(max(a["s"], s) + off, 3), "e": round(min(b["e"], e) + off, 3), "gold": tok in set(gold)})
    return out

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
        detective = 58.1 <= t < 66.6  # sneaky theme for the clock's great escape
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
    pad *= np.clip((tt - 120.4) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 42.5, 2)
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

def bell(dur):
    """alarm clock bell: a fast hammer trill on two detuned metal tones"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2350 * tt) + 0.7 * np.sin(2 * np.pi * 3120 * tt) + 0.3 * np.sin(2 * np.pi * 4700 * tt)
    trill = (np.sin(2 * np.pi * 24 * tt) > 0) * np.exp(-((tt * 24) % 1) * 4)
    return x * trill * np.clip(tt / 0.01, 0, 1) * np.clip((dur - tt) / 0.05, 0, 1) / 2

def tick():
    n = int(0.03 * SR)
    return filt(rng.standard_normal(n), "band", [2000, 6000]) * env(n, 0.001, 0.008)

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    chirps(out, 0.5, 42, 0.4, 0.02); chirps(out, 103, 131, 0.5, 0.025)
    # S1/S2/S4: soft snoring from the bed
    sn = filt(noise(), "band", [120, 600]) * np.clip(np.sin(2 * np.pi * 0.3 * t), 0, 1) ** 2
    sn *= window(n, 0.3, 13.6, 0.5) + window(n, 27, 42, 0.5) + window(n, 43, 66.6, 0.5) + window(n, 66.6, 73.0, 0.3)
    out += (sn * 0.025)[:, None]
    # S2: ring, slap, snooze pops, ring again, the hour
    place(out, bell(6.6), 13.8, 0.12, 0.6); place(out, thump(), 20.4, 0.4, 0.4)
    place(out, pop(), 21.5, 0.15, 0.5); place(out, bell(0.7), 23.1, 0.12, 0.6); place(out, thump(), 23.8, 0.4, 0.4)
    place(out, pop(), 24.0, 0.15, 0.5); place(out, ding(), 25.3, 0.1, 0.5)
    # S3: overlays pop
    for k in (33.8, 36.4): place(out, pop(), k, 0.14, 0.5)
    place(out, ding(), 40.2, 0.1, 0.5)
    # S4: the clock ticking through the silence, the hours, the AWOL stamp
    for k in np.arange(42.6, 58.0, 1.0): place(out, tick(), k, 0.12, 0.6)
    for k in (43.5, 47.3, 48.7, 49.8): place(out, pop(), k, 0.12, 0.5)
    place(out, thump(), 56.26, 0.45, 0.5)
    # S5: the great escape: hop, tiny footsteps, the door, the wave
    place(out, boing(), 59.4, 0.15, 0.6)
    for k in np.arange(60.3, 64.1, 0.25): place(out, pop() * 0.5, k, 0.05, 0.4 + 0.3 * rng.random())
    place(out, whoosh(0.6), 61.1, 0.12, 0.8); place(out, ding(), 64.2, 0.07, 0.8)
    # S6: 11:00!, jump up, panic, running about, socks, the toast
    place(out, ding(), 68.1, 0.1, 0.5); place(out, boing(), 73.0, 0.15, 0.4)
    place(out, horn(), 76.18, 0.12, 0.5)
    for k in np.arange(77.6, 85.5, 0.22): place(out, thump() * 0.4, k, 0.06, 0.3 + 0.4 * rng.random())
    place(out, whoosh(0.4), 80.2, 0.12, 0.5); place(out, thump(), 83.2, 0.3, 0.5)
    # S7: "Bakit?!", the ON LEAVE stamp, feelings
    place(out, pop(), 89.4, 0.15, 0.5); place(out, thump(), 95.92, 0.45, 0.5); place(out, ding(), 101.76, 0.08, 0.5)
    # S8: one ring and straight up; thumbs-up; the phone's resignation
    place(out, bell(0.8), 103.6, 0.12, 0.6); place(out, boing(), 104.1, 0.15, 0.4)
    place(out, ding(), 105.6, 0.08, 0.5); place(out, pop(), 112.2, 0.14, 0.5); place(out, thump(), 117.1, 0.45, 0.5)
    # S9: the high-five
    place(out, clink(), 127.74, 0.3, 0.5); place(out, pop(), 127.76, 0.2, 0.5); place(out, ding(), 127.9, 0.08, 0.5)
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
