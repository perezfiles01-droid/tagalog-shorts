"""Isa ka bang hampaslupa: cut the voice into lines, place them on the timeline,
generate a playful original score + scene ambience, mix at the approved v3
balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 106.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (1.20, 11.45, 0.6, "Isa ka bang hampaslupa? Kung tuwing nalalaglag ang cellphone mo ay napapahampas ka sa lupa sa sobrang inis, baka nga ikaw na yun.", ["hampaslupa?", "cellphone"]),
    (11.95, 25.25, 11.5, "Pero kung paghampas sa lupa lang ang basehan, hampaslupa na rin pala ang magsasaka, ang batang nagba-basketbol, at si Lola na nagpapalo ng labada sa ilog.", ["magsasaka,", "Lola"]),
    (26.45, 43.95, 25.5, 'Sa diksyunaryo, ang hampaslupa ay pang-iinsulto sa taong napakahirap o walang-wala. At ayon sa isang paliwanag, galing ito sa "hampas" at "lupa," na para bang taong lugmok na sa lupa.', ["pang-iinsulto", '"hampas"', '"lupa,"']),
    (45.80, 59.90, 52.2, "Pero tingnan mo kung sino ang tunay na humahampas sa lupa araw-araw: ang magsasakang nagbubungkal sa bukid, para may kanin sa bawat hapag ng mga Pilipino.", ["magsasakang", "kanin"]),
    (60.55, 73.50, 67.1, "Kaya ang halaga ng tao ay hindi nasusukat sa laman ng bulsa. At kung may dapat mang mahiya, yun ay ang mga taong nangmamaliit sa kapwa.", ["halaga", "kapwa."]),
    (74.05, 92.75, 80.8, "Kaya sa susunod na malalaglag ang cellphone mo, huwag mo nang hampasin ang lupa, dahil ang lupang yan ang nagpapakain sa ating lahat… pero kung basag na talaga ang screen, sige, isang hampas lang.", ["nagpapakain", "basag"]),
]
# whisper split these words in two; merge them back
MERGES = {2: [("pang", "i"), ("pangi", "-insulto"), ("walang", "wala.")], 3: [("araw", "-araw.")], 4: [("ng", "mamaliit")]}

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
        detective = 43.2 <= t < 51.7  # the silent ground-orchestra scene
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
    pad *= np.clip((tt - 99.7) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 43.2, 2)
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

BEAT = 60 / 104
S4_PHASE = 0.069

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2))
    # birds through the daytime scenes (not the dictionary room or the meal table)
    chirps(out, 0.5, 24.8, 0.5, 0.03); chirps(out, 43.4, 61.4, 0.5, 0.03); chirps(out, 66.8, 99.5, 0.5, 0.03)
    # S1: phone clatters, two slaps on the ground
    place(out, clink(), 4.28 + 0.35, 0.3, 0.5)
    for s in (5.84, 7.18):
        place(out, thump(), s, 0.4, 0.5)
    # S2: hoe hits, ball bounces, palo-palo slaps, and a pop for each "hampaslupa?" card
    S2 = 11.0
    for k in range(7):
        place(out, thump() * 0.6, S2 + 0.5 + k, 0.2, 0.45)
    for k in range(6):
        place(out, thump() * 0.4, S2 + 7.0 + k * 0.5, 0.15, 0.6)
    for k in range(6):
        place(out, clink() * 0.5, S2 + 10.0 + 0.2 + k * 0.7, 0.12, 0.55)
    for c in (5.69, 7.79, 10.31):
        place(out, pop(), S2 + c, 0.12, 0.5)
    # S3: page rustle, the INSULTO stamp, the word splitting
    S3 = 25.0
    place(out, whoosh(0.5), S3 + 1.2, 0.08, 0.5)
    place(out, thump(), S3 + 3.5, 0.45, 0.5)
    place(out, whoosh(0.4), S3 + 11.85, 0.12, 0.5)
    place(out, ding(), S3 + 13.2, 0.06, 0.5)
    # S4: the ground orchestra on the beat grid, chicken clucks, one big final THUMP
    S4 = 43.2
    for k in range(13):
        at = S4 + S4_PHASE + k * BEAT
        place(out, clink() * 0.4, at, 0.1, 0.55)              # Lola's palo-palo every beat
        if k % 2 == 0: place(out, thump() * 0.7, at, 0.25, 0.3)  # farmer's hoe
        place(out, thump() * 0.35, at + BEAT / 2, 0.12, 0.75)  # kid's ball on the off-beat
        if k % 4 == 1: place(out, blip(950), at, 0.06, 0.6)    # chicken
    place(out, thump(), S4 + S4_PHASE + 13 * BEAT, 0.45, 0.5)
    place(out, thump(), S4 + S4_PHASE + 13 * BEAT + 0.03, 0.3, 0.5)
    # S5: hoe on the terraces, whoosh to the table, ding on "kanin"
    S5 = 51.7
    for k in range(10):
        place(out, thump() * 0.5, S5 + 0.3 + k, 0.12, 0.5)
    place(out, whoosh(0.6), S5 + 9.6, 0.15, 0.5)
    place(out, ding(), S5 + 10.34, 0.07, 0.5)
    # S6: scale pops in, wallet clunk, heart wins, the banana slip
    S6 = 66.6
    place(out, pop(), S6 + 1.0, 0.12, 0.5)
    place(out, thump(), S6 + 2.7, 0.3, 0.4)
    place(out, ding(), S6 + 5.0, 0.08, 0.6)
    place(out, boing(), S6 + 12.37, 0.15, 0.6)
    place(out, thump(), S6 + 12.85, 0.4, 0.6)
    gs = np.zeros(n); st = int((S6 + 12.6) * SR); gs[st:] = murmur(n - st, voice, voices=3); gs *= window(n, S6 + 12.9, S6 + 13.7, 0.2)
    out += (gs * 0.08)[:, None]
    # S7: phone clatters again, whoosh to the field, the crack, one little pat
    S7 = 80.3
    place(out, clink(), S7 + 2.21 + 0.35, 0.3, 0.5)
    place(out, whoosh(0.6), S7 + 8.4, 0.1, 0.6)
    place(out, clink() * 0.8, S7 + 14.6, 0.3, 0.5)
    place(out, blip(2600), S7 + 14.62, 0.06, 0.5)
    place(out, thump() * 0.5, S7 + 18.37, 0.2, 0.5)
    # S8: the sprout pops up, crickets at dusk, family chatter
    S8 = 99.7
    place(out, boing(), S8 + 0.45, 0.15, 0.5)
    cr = np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t))
    out += (cr * window(n, S8, TOTAL, 1.5) * 0.006)[:, None]
    fm = np.zeros(n); st = int((S8 + 1.0) * SR); fm[st:] = murmur(n - st, voice, voices=5)
    fm *= window(n, S8 + 1.2, TOTAL - 0.5, 1.0) * np.clip((TOTAL - 1 - t) / 3, 0, 1)
    out += (fm * 0.05)[:, None]
    return out * 0.6  # many hits in this one; keep the bed near -30 LUFS

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
