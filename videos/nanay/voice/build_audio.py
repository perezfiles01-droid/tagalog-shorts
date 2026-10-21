"""May sixth sense ba talaga ang mga nanay: cut the voice into lines, place them on the timeline,
generate a playful original score + scene ambience, mix at the approved v3
balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 104.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (1.84, 13.7, 0.6, "What if may sixth sense talaga ang mga nanay? Kahit nasa trabaho sila o nasa palengke, alam nila kung ano ang ginagawa mo sa bahay. Parang may CCTV sa utak mo!", ["sixth", "sense", "CCTV"]),
    (15.26, 28.75, 13.3, "Halimbawa, nakahiga ka lang, nagse-cellphone, at walang balak gumalaw buong araw. Biglang magme-message ang nanay mo: \"Wala ka bang ginagawa diyan?\" Hindi, parang nahuli ka agad!", ["nahuli"]),
    (30.62, 40.0, 27.6, "Syempre, sasagot ka ng, \"Nag-aaral po ako, Ma!\" Kahit nasa screen mo ay TikTok, at ang pinag-aaralan mo ay kung paano sumayaw ng bagong trend.", ["TikTok,", "sumayaw"]),
    (41.4, 53.4, 46.3, "Akala mo ligtas ka na, pero after five seconds, may panibagong message: \"Eh, bakit hindi ka pa naghuhugas ng plato?\" WAIT LANG! Paano niya nalaman? Nasa kabilang siyudad siya!", ["plato?\"", "siyudad"]),
    (54.54, 66.8, 59.1, "Dahil sa takot, tatayo ka agad at maghuhugas ng plato. Pati kaldero, kawali, at mga kutsara, lilinisin mo na. Baka kasi may susunod na message na naman!", ["takot,", "kaldero,", "kawali,"]),
    (68.0, 83.8, 72.1, "Pagkatapos mong maglinis, hihiga ka ulit para magpahinga. Pero biglang tatawag ang nanay mo: \"Tapos ka na ba? Pati sahig, walisan mo!\" Dito mo mararamdaman na hindi ka anak… empleyado ka pala na walang sweldo!", ["empleyado", "sweldo!"]),
    (85.02, 97.7, 88.7, "Kaya ang tanong: May sixth sense ba talaga ang mga nanay, o may secret group chat sila kasama ang mga kapitbahay? Kasi kahit hindi ka nakikita, alam nila lahat ng kalokohan mo!", ["group", "chat", "kalokohan"]),
]
# whisper split these words in two; merge them back
MERGES = {1: [("nagse", "-cellphone,"), ("mong", "malaw"), ("magmi", "-message")], 2: [("nag", "-aaral"), ("na", "sa"), ("pinag", "-aaralan")]}

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
        detective = 37.3 <= t < 45.8  # the silent countdown scene
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
    pad *= np.clip((tt - 88.2) / 5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 37.3, 2)
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

def ring():
    """phone ring: two-tone trill bursts"""
    n = int(1.0 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.where((tt * 20) % 1 < 0.5, 1300, 1650) * tt) * ((tt % 0.5) < 0.35)
    return x * env(n, 0.005, 0.05)

def ping():
    return blip(1500) + np.pad(blip(2000), (int(0.09 * SR), 0))[:len(blip(1500))] * 0.8

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    # S1 + S8: the palengke: birds and a soft market crowd
    for a, b in ((0, 13.1), (87.9, 102.0)):
        chirps(out, a, b, 0.5, 0.025)
        cw = np.zeros(n); st = int(a * SR); en = int(b * SR); cw[st:en] = murmur(en - st, voice, voices=8); cw *= window(n, a, b, 0.8)
        out += (cw * 0.05)[:, None]
    place(out, whoosh(0.6), 6.4, 0.12, 0.5)
    place(out, ding() * 0.6, 11.0, 0.06, 0.5)
    for k in range(4):
        place(out, blip(1800), 11.4 + k * 0.4, 0.04, 0.6)
    # S2: the first message
    place(out, ping(), 22.4, 0.2, 0.6)
    place(out, boing(), 22.9, 0.14, 0.5)
    # S3: typing, sending, then the dance
    for k in range(10):
        place(out, pop() * 0.5, 27.6 + k * 0.17, 0.05, 0.4 + 0.02 * k)
    place(out, whoosh(0.4), 29.3, 0.1, 0.7)
    # S4: the countdown ticks, then the red alert
    for k in range(5):
        place(out, blip(900 + 150 * k), 37.3 + 2.0 + k * 0.95, 0.12 + 0.03 * k, 0.5)
    place(out, thump(), 44.3, 0.35, 0.5)
    place(out, horn(), 44.3, 0.1, 0.5)
    # S5: second message, WAIT LANG, the whoosh across town
    place(out, ping(), 50.1, 0.2, 0.6)
    place(out, thump(), 53.9, 0.3, 0.5)
    place(out, boing(), 54.0, 0.15, 0.5)
    place(out, whoosh(1.0), 55.9, 0.14, 0.5)
    # S6: water running, a clink for every clean piece, the phone glance
    wt = filt(noise(), "band", [900, 6000]) * window(n, 61.6, 70.9, 0.3)
    out += (wt * 0.025)[:, None]
    for k in range(20):
        place(out, clink() * 0.6, 58.6 + 3.0 + k / 2.2, 0.07, rng.random())
    place(out, ping(), 70.2, 0.1, 0.4)
    # S7: flop on the sofa, the ringing call, sweeping, the ID card
    place(out, thump(), 74.0, 0.25, 0.5)
    place(out, ring(), 76.9, 0.12, 0.5)
    place(out, ring(), 77.9, 0.1, 0.5)
    sw = filt(noise(), "band", [2000, 7000]) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.95 * t)) * window(n, 80.2, 87.0, 0.4)
    out += (sw * 0.03)[:, None]
    place(out, ding() * 0.6, 85.8, 0.07, 0.5)
    # S8: group chat pops, the peeking neighbor, the wink
    for a in (5.8, 6.6, 7.4):
        place(out, ping(), 88.2 + a, 0.12, 0.5)
    place(out, boing(), 88.2 + 7.3, 0.1, 0.3)
    place(out, ding() * 0.6, 88.2 + 12.0, 0.06, 0.5)
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
