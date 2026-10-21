"""Nakakain ba ang tae: cut the voice into lines, place them on the timeline,
generate a playful original score + scene ambience, mix at the approved v3
balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 106.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (1.30, 12.50, 0.6, "Nakakain ba ang mga tae? Kung tuwang-tuwa ang mga langaw dito, siguro masarap ito… o baka hindi?", ["tae?"]),
    (13.90, 25.60, 13.0, "Ang sagot: hindi, kahit kailan. Pero para sa langaw, isa itong handaan, at may dahilan kung bakit.", ["hindi,"]),
    (26.60, 39.90, 25.6, "Ang tae ay halos tatlong-kapat na tubig, at may natitira pa itong sustansya mula sa pagkaing hindi natunaw, kaya para sa langaw, para itong buffet.", ["tubig,", "buffet."]),
    (41.20, 56.10, 47.6, "Alam mo ba na ang langaw ay tumitikim gamit ang kanyang mga paa? At dahil wala itong ngipin, nilalabasan muna nito ng laway ang pagkain para matunaw bago sipsipin.", ["paa?", "laway"]),
    (57.00, 70.00, 63.2, "Ang problema, pagkatapos sa tae, puwede itong dumapo sa ating pagkain, dala ang mahigit isandaang uri ng mikrobyo na maaaring magdulot ng sakit.", ["mikrobyo"]),
    (71.10, 83.30, 76.9, "Kaya laging takpan ang pagkain, maghugas ng kamay gamit ang sabon, at panatilihing malinis ang banyo, para walang handaan ang mga langaw.", ["sabon,", "malinis"]),
    (84.80, 99.40, 89.8, "Para sa langaw, ang tae ay paboritong pagkain. Pero para sa atin, ang pinakamasarap na ulam ay ang kinakain nang malinis at ligtas.", ["ligtas."]),
]
# whisper split these words in two; merge them back
MERGES = {2: [("tatlong", "kapat")]}

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
        detective = 39.2 <= t < 47.2  # nature-documentary hush for the slow-motion fly
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
    pad *= np.clip((tt - 89) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 39.2, 2)
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

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    # flies buzzing: grows in scene 1, stays through 3, quieter later
    lvl = np.clip((t - 1.2) / 8, 0, 1) * window(n, 0, 39.4, 0.6) * 0.05
    lvl += window(n, 39.2, 41.8, 0.4) * 0.03 + window(n, 63.8, 68.2, 0.5) * 0.05 + window(n, 77.8, 80.2, 0.4) * 0.03
    bz = buzz_track(n, t, lvl)
    out[:, 0] += bz * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t)); out[:, 1] += bz * (0.6 - 0.4 * np.sin(2 * np.pi * 0.3 * t))
    chirps(out, 0.5, 39, 0.5, 0.03)
    # S2: the red X stamp, Nanay's tsinelas
    place(out, thump(), 12.5 + 2.0, 0.45, 0.5)
    place(out, whoosh(0.4), 12.5 + 2.3, 0.15, 0.6)
    place(out, clink() * 0.6, 12.5 + 2.7, 0.2, 0.6)
    # S3: menu items popping out
    for i in range(18):
        place(out, pop() * 0.5, 25.2 + 1.0 + i * 0.35, 0.06, rng.random())
    place(out, ding(), 25.2 + 12.8, 0.08, 0.5)
    # S4: slow-motion landing sparkle and a little happy-dance bounce
    place(out, tone(hz(96), 1.5, 3), 39.2 + 2.5, 0.05, 0.5)
    for k in range(5):
        place(out, pop() * 0.4, 39.2 + 3.0 + k * 0.4, 0.06, 0.5)
    # S5: feet glow chime, saliva drip, the sip
    place(out, tone(hz(88), 1.2, 3), 47.2 + 4.5, 0.05, 0.5)
    place(out, blip(700), 47.2 + 11.3, 0.12, 0.6)
    sl = filt(noise(), "band", [300, 1200]) * window(n, 47.2 + 12.6, 47.2 + 14.8, 0.2) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t))
    out += (sl * 0.03)[:, None]
    # S6: the family gasps
    gs = np.zeros(n); gs[int(68 * SR):] = murmur(n - int(68 * SR), voice, voices=3); gs *= window(n, 68.4, 69.6, 0.2)
    out += (gs * 0.12)[:, None]
    # S7: cover clatter, tap water, toilet lid click
    place(out, clink(), 76.5 + 1.55, 0.2, 0.4)
    wt = filt(noise(), "band", [1500, 7000]) * window(n, 81.0, 84.4, 0.3)
    out += (wt * 0.03)[:, None]
    place(out, lid_click() if "lid_click" in globals() else clink(), 76.5 + 9.4, 0.4, 0.6)
    # S8: sunset crickets, family chatter fading as we pull away
    cr = np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t))
    out += (cr * window(n, 89.4, 106, 1.5) * 0.006)[:, None]
    fm = np.zeros(n); fm[int(89.4 * SR):] = murmur(n - int(89.4 * SR), voice, voices=5)
    fm *= window(n, 89.6, 105.5, 1.0) * np.clip((103 - t) / 10, 0, 1)
    out += (fm * 0.05)[:, None]
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
