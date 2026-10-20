"""Cut the enhanced voice into lines, place them on the video timeline,
generate an original ambient score, duck it under the voice, write the mix
and a timeline.json the Remotion project reads for subtitles."""
import json, subprocess, numpy as np, soundfile as sf
from sfx import ambience

SR = 48000
TOTAL = 97.0
VIDEO = "../video"

# (source start, source end, video start, subtitle text, gold words)
LINES = [
    (3.55, 15.90, 1.0, "Dalawang libong taon na ang nakalipas, inukit ng mga ninuno ng Ifugao ang mga bundok na ito gamit lamang ang kanilang mga kamay.", ["Ifugao", "kamay."]),
    (16.25, 24.95, 15.0, "Dito nagsisimula ang lahat, sa isang maliit na punla na itinanim sa malamig na putik ng palayan.", ["punla", "palayan."]),
    (25.55, 35.95, 25.5, "Sa loob ng apat na buwan, binabantayan ito ng araw, ng ulan, at ng magsasakang hindi kailanman tumitigil.", ["araw,", "ulan,", "magsasakang"]),
    (37.00, 46.15, 45.5, "Mula sa kabundukan, maglalakbay ang butil na ito ng daan-daang kilometro bago ito makarating sa lungsod.", ["butil", "lungsod."]),
    (47.35, 59.60, 56.5, "Dadaan ito sa kamay ng mga tsuper, mangangalakal, at tindero, mga taong hindi natin kilala ngunit umaasa rin dito.", ["umaasa"]),
    (61.00, 72.15, 70.5, "At sa wakas, darating ito sa hapag ng isang pamilyang Pilipino, mainit, simple, at sapat.", ["Pilipino,", "sapat."]),
    (72.20, 81.70, 83.0, "Kaya sa susunod na may matirang kanin sa iyong plato, alalahanin mo ang mahabang paglalakbay ng isang butil.", ["isang", "butil."]),
]
# whisper split some words in two; merge them back onto the script word
MERGES = {2: [("kailan", "man")], 4: [("mga", "ngalakal,")]}

def words_for_line(i, W):
    s, e = LINES[i][0], LINES[i][1]
    # whisper words arrive in order; take this line's share by count
    first = sum(len(LINES[j][3].split(" ")) + len(MERGES.get(j, [])) for j in range(i))
    ws = W[first:first + len(LINES[i][3].split(" ")) + len(MERGES.get(i, []))]
    for a, b in MERGES.get(i, []):
        for j in range(len(ws) - 1):
            if ws[j]["w"] == a and ws[j + 1]["w"] == b:
                ws[j] = {"w": a + b, "s": ws[j]["s"], "e": ws[j + 1]["e"]}
                del ws[j + 1]
                break
    script = LINES[i][3].split(" ")
    assert len(script) == len(ws), (i, len(script), len(ws), [w["w"] for w in ws])
    off = LINES[i][2] - s
    gold = set(LINES[i][4])
    return [{"w": t, "s": round(max(w["s"], s) + off, 3), "e": round(min(w["e"], e) + off, 3), "gold": t in gold}
            for t, w in zip(script, ws)]

def voice_track():
    v, sr = sf.read("enhanced.wav")
    assert sr == SR
    if v.ndim > 1:
        v = v.mean(axis=1)
    out = np.zeros(int(TOTAL * SR))
    fade = int(0.03 * SR)
    for s, e, at, *_ in LINES:
        clip = v[int(s * SR):int(e * SR)].copy()
        ramp = np.linspace(0, 1, fade)
        clip[:fade] *= ramp
        clip[-fade:] *= ramp[::-1]
        p = int(at * SR)
        out[p:p + len(clip)] += clip
    return out

def music():
    """Slow pad chords + sparse pentatonic plucks + soft wind. Original."""
    rng = np.random.default_rng(7)
    n = int(TOTAL * SR)
    t = np.arange(n) / SR
    L = np.zeros(n); R = np.zeros(n)
    # D major-ish progression, 8 s per chord
    chords = [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    dur = 8.0
    k = 0
    while k * dur < TOTAL:
        c = chords[k % 4]
        a, b = int(k * dur * SR), min(n, int((k * dur + dur + 3) * SR))
        tt = t[a:b] - k * dur
        env = np.clip(tt / 2.5, 0, 1) * np.clip((dur + 3 - tt) / 3.0, 0, 1)
        for m in c:
            f = hz(m)
            for det, pan in ((-0.12, 0.8), (0.12, 0.2)):
                ph = 2 * np.pi * f * (1 + det / 100) * tt
                tone = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
                L[a:b] += tone * env * pan * 0.035
                R[a:b] += tone * env * (1 - pan) * 0.035
        k += 1
    # plucks: D major pentatonic, high register
    pent = [74, 76, 78, 81, 83, 86]
    for start in np.arange(4.0, TOTAL - 4, 2.7):
        if rng.random() < 0.35:
            continue
        m = pent[rng.integers(len(pent))]
        a = int((start + rng.random() * 0.6) * SR)
        b = min(n, a + int(3.5 * SR))
        tt = (np.arange(b - a)) / SR
        env = np.exp(-tt * 1.6) * np.clip(tt / 0.01, 0, 1)
        tone = np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(4 * np.pi * hz(m) * tt) * np.exp(-tt * 4)
        pan = rng.random()
        L[a:b] += tone * env * 0.05 * pan
        R[a:b] += tone * env * 0.05 * (1 - pan)
    # wind: lowpassed noise with slow swells
    noise = rng.standard_normal(n)
    kern = np.ones(400) / 400
    wind = np.convolve(noise, kern, mode="same")
    wind *= (0.5 + 0.5 * np.sin(2 * np.pi * t / 13)) * 0.25
    L += wind; R += np.roll(wind, 2000)
    # simple echo for space
    for d, g in ((0.31, 0.35), (0.53, 0.22)):
        s = int(d * SR)
        L[s:] += R[:-s] * g; R[s:] += L[:-s] * g
    # fade in/out
    fi = np.clip(t / 3, 0, 1); fo = np.clip((TOTAL - t) / 5, 0, 1)
    L *= fi * fo; R *= fi * fo
    return np.stack([L, R], axis=1)

def main():
    W = json.load(open("words.json"))
    timeline = [{"start": LINES[i][2], "words": words_for_line(i, W)} for i in range(len(LINES))]
    json.dump(timeline, open(f"{VIDEO}/src/timeline.json", "w"), ensure_ascii=False, indent=1)
    sf.write("voice_placed.wav", voice_track(), SR)
    sf.write("music.wav", music() / 1.2, SR)
    v, _ = sf.read("enhanced.wav")
    sf.write("ambience.wav", ambience(TOTAL, v.mean(axis=1) if v.ndim > 1 else v), SR)
    # music louder than before and only gently ducked under the voice;
    # ambience sits under everything
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "music.wav", "-i", "voice_placed.wav", "-i", "ambience.wav",
        "-filter_complex",
        "[1:a]aformat=channel_layouts=stereo,asplit=3[v][sc][sc2];"
        "[0:a]volume=2.1[m];[m][sc]sidechaincompress=threshold=0.08:ratio=1.4:attack=120:release=900[md];"
        "[2:a]volume=1.5[a0];[a0][sc2]sidechaincompress=threshold=0.05:ratio=2:attack=120:release=900[ad];"
        "[md][ad][v]amix=inputs=3:weights='1.0 1.0 1':normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11",
        "-ar", "48000", f"{VIDEO}/public/mix.wav"], check=True)
    print("ok")

main()
