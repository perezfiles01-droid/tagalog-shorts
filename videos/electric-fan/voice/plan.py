"""Timeline planner: cut each line out of the recording, shrink long inner pauses,
and lay the lines out on scenes (silent scene 4 between lines 3 and 4)."""
import json
W = json.load(open("words.json"))
BOUNDS = [0, 14.2, 26.82, 42.7, 55.66, 71.0, 84.9, 102.16, 999]
MAXGAP, KEEP = 0.6, 0.5
SILENT = 6.0
START_FIX = {2: 26.3}  # whisper put "Minsan" late; RMS onset is 26.35
LEAD, TAILPAD, LASTTAIL = 0.5, 0.3, 1.8

def segments(i):
    ws = [w for w in W if BOUNDS[i] <= w["s"] < BOUNDS[i + 1]]
    segs, a = [], START_FIX.get(i, ws[0]["s"] - 0.15)
    for p, q in zip(ws, ws[1:]):
        if q["s"] - p["e"] > MAXGAP:
            mid = (p["e"] + q["s"]) / 2
            segs.append((a, min(p["e"] + KEEP / 2, mid)))
            a = max(q["s"] - KEEP / 2, mid)
    segs.append((a, ws[-1]["e"] + 0.3))
    return [(round(x, 2), round(y, 2)) for x, y in segs]

def plan():
    st, scenes, lines = 0.0, [], []
    for i in range(8):
        if i == 3:
            scenes.append(dict(start=round(st, 2), dur=SILENT)); st += SILENT
        segs = segments(i)
        d = sum(b - a for a, b in segs)
        at = st + LEAD
        dur = LEAD + d + TAILPAD + (LASTTAIL if i == 7 else 0)
        scenes.append(dict(start=round(st, 2), dur=round(dur, 2)))
        lines.append(dict(at=round(at, 2), segs=segs))
        st += dur
    return scenes, lines, st

if __name__ == "__main__":
    s, l, T = plan()
    for x in s: print(x)
    for x in l: print(x)
    print("TOTAL", T)
