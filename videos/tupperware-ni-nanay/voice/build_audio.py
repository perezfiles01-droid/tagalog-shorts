"""Tupperware ni Nanay: cut the voice into lines, place them on the timeline,
generate a playful original score + scene ambience, mix at the approved v3
balance, and write video/public/mix.wav + video/src/timeline.json."""
import json, subprocess, numpy as np, soundfile as sf
import sfx
from sfx import SR, filt, window, place, env, chirps, clink, horn, thump, murmur, rng

TOTAL = 100.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (0.15, 14.35, 0.6, "Sa bawat tahanang Pilipino, may isang batas na hindi nakasulat pero alam ng lahat: kapag ipinahiram ni Nanay ang kanyang Tupperware, kailangan itong bumalik.", ["Nanay", "bumalik."]),
    (15.30, 23.65, 16.0, "Pero ang Tupperware ay may sariling buhay, at minsan, mas mahaba pa ang nilalakbay nito kaysa sa atin.", ["buhay,"]),
    (24.75, 35.30, 25.5, "Mula sa kapitbahay, napunta sa opisina, sumakay ng jeep, at nakarating pa sa isang handaan na hindi naman kilala ni Nanay.", ["jeep,", "handaan"]),
    (36.15, 46.15, 46.4, "At tulad ng isang detektib, sinimulan ni Nanay ang paghahanap, dala ang tanging ebidensya: ang takip na naiwan sa kanyang kusina.", ["detektib,", "takip"]),
    (47.20, 56.10, 58.3, "Ngunit isang gabi, may kumatok sa pinto. Bumalik ang Tupperware, at may kasama pa itong mga bisita.", ["kumatok", "bisita."]),
    (57.60, 69.80, 70.0, "Bawat pamilyang humiram nito ay naglagay ng sarili nilang luto bilang pasasalamat, kaya ang dating adobo, naging handaan para sa lahat.", ["pasasalamat,", "lahat."]),
    (70.20, 83.40, 84.2, "Hindi lang lalagyan ang ipinapahiram ni Nanay. Ipinapahiram niya ang pagmamahal, at kahit saan pa ito makarating, alam nito ang daan pauwi.", ["pagmamahal,", "pauwi."]),
]
# whisper split these words in two; merge them back
MERGES = {0: [("naka", "-sulat")], 6: [("pa", "uwe.")]}

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
        detective = 37.0 <= t < 46.0
        night = t >= 57.5
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
    pad *= np.clip((tt - 69) / 6, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1) + 0.3 * window(n, 0, 37, 2)
    out += pad[:, None]
    fi = np.clip(tt / 1.5, 0, 1) * np.clip((TOTAL - tt) / 4, 0, 1)
    return out * fi[:, None]

def lid_click():
    n = int(0.12 * SR)
    x = filt(rng.standard_normal(n), "band", [1500, 6000]) * env(n, 0.001, 0.012)
    return x + 0.6 * np.sin(2 * np.pi * 900 * np.arange(n) / SR) * env(n, 0.001, 0.01)

def knock():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 140 * tt) + 0.5 * filt(rng.standard_normal(n), "band", [300, 1500])) * env(n, 0.001, 0.04)

def bark():
    n = int(0.22 * SR); tt = np.arange(n) / SR
    f = 500 - 250 * tt / tt[-1]
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + filt(rng.standard_normal(n), "band", [400, 2000]) * 0.6
    return filt(x, "low", 2500) * np.sin(np.pi * tt / tt[-1])

def ambience(voice):
    n = int(TOTAL * SR); t = np.arange(n) / SR
    out = np.zeros((n, 2)); noise = lambda: rng.standard_normal(n)
    # S1 kitchen morning: sizzle, birds outside, the lid click
    sizzle = filt(noise(), "high", 3000) * window(n, 0.3, 6.0, 0.5)
    out += (sizzle * 0.012)[:, None]
    chirps(out, 1, 15, 0.6, 0.04)
    place(out, lid_click(), 5.45, 0.5, 0.5)
    # S2 street: birds, a dog, Tita's lid click
    chirps(out, 15.5, 25, 0.8, 0.05)
    place(out, bark(), 17.2, 0.12, 0.2); place(out, bark(), 17.55, 0.1, 0.2)
    place(out, lid_click(), 15.5 + 7.8, 0.45, 0.5)
    # S3 montage: office murmur, jeepney, party
    off = np.zeros(n); off[int(25 * SR):] = murmur(n - int(25 * SR), voice, voices=4); off *= window(n, 25, 28.4, 0.4)
    out += (off * 0.05)[:, None]
    tc = 25.3
    while tc < 28.0:
        place(out, clink() * 0.3, tc, 0.05, 0.4); tc += 0.18  # keyboard taps
    eng = filt(np.sign(np.sin(2 * np.pi * 42 * t)) * 0.5 + filt(noise(), "low", 250) * 2, "low", 400) * window(n, 28.3, 33.0, 0.5)
    out += (eng * 0.05)[:, None]
    place(out, horn(), 29.6, 0.06, 0.55); place(out, horn(), 30.1, 0.06, 0.55)
    pm = np.zeros(n); pm[int(32 * SR):] = murmur(n - int(32 * SR), voice); pm *= window(n, 32.3, 37.2, 0.5)
    out += (pm * 0.09)[:, None]
    # S4 detective: rain, thunder on each lightning flash
    rain = filt(noise(), "band", [800, 9000]) * window(n, 37, 46.2, 0.5)
    out[:, 0] += rain * 0.035; out[:, 1] += np.roll(rain, 1500) * 0.035
    for tt0 in (38.0, 42.5):
        tn = int(2.5 * SR)
        place(out, filt(rng.standard_normal(tn), "low", 130) * env(tn, 0.05, 0.8), tt0, 0.6, 0.5)
    # S5 dusk: crickets, knocks at each door, a dog
    cr = np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t))
    out += (cr * window(n, 46, 100, 1.0) * 0.006)[:, None]
    for at in (47.2, 50.4, 53.6):
        for k in range(3):
            place(out, knock(), at + k * 0.18, 0.35, 0.45)
    place(out, bark(), 51.8, 0.08, 0.8)
    # S6: the knock at night, then the parade's chatter coming closer
    for k in range(3):
        place(out, knock(), 60.65 + k * 0.2, 0.45, 0.6)
    par = np.zeros(n); par[int(61 * SR):] = murmur(n - int(61 * SR), voice, voices=8)
    par *= window(n, 61.5, 70.0, 1.0) * np.clip((t - 61) / 7, 0, 1)
    out += (par * 0.09)[:, None]
    # S7 feast: full barangay chatter + plates
    fe = np.zeros(n); fe[int(69 * SR):] = murmur(n - int(69 * SR), voice, voices=16)
    fe *= window(n, 69.6, 86.0, 1.2)
    out[:, 0] += fe * 0.1; out[:, 1] += np.roll(fe, 2400) * 0.1
    tc = 72.0
    while tc < 83:
        place(out, clink(), tc, 0.04, rng.random()); tc += rng.uniform(0.4, 1.2)
    # S8: the lid clicks shut, the party fades under the night
    place(out, lid_click(), 83.5 + 1.4, 0.55, 0.5)
    fe2 = np.zeros(n); fe2[int(85 * SR):] = murmur(n - int(85 * SR), voice, voices=10)
    fe2 *= window(n, 85.0, 99.5, 1.0) * np.clip((97 - t) / 10, 0, 1)
    out += (fe2 * 0.06)[:, None]
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
