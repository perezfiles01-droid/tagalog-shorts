# Kwentong Kayumanggi: Video Production Playbook

**Read this whole file before doing anything.** It is the complete, exact recipe for how every video on this channel is made, and how Claude talks to the user at each step. A new session must reproduce the same style, flow, settings and message formats **exactly**. Don't improvise a new process, don't skip steps, and don't change any approved setting unless the user asks.

Last updated after video #10 (2026-10-21).

---

## 0. First thing in a new session: setup check (mandatory)

**Before writing any script, run this check. If any item fails, STOP and tell the user exactly what's missing and how to fix it, using the messages below. Never "approximate" the style from memory or rebuild the kit from scratch to work around a missing setup.** The style, music and subtitles only match when the real code from the repo is copied.

### 0.1 The repo: `perezfiles01-droid/tagalog-shorts` (the only correct one)
- **Correct repo:** `perezfiles01-droid/tagalog-shorts`. It holds this playbook, every video project (`videos/…`) and all the reusable code.
- **Wrong repo:** `perezfiles01-droid/PodC` (or `podc`) is the user's **Android TTS app**, unrelated to the videos. Never put video work in it, and never treat it as the source of the style. A session that starts in PodC must still attach `tagalog-shorts`.
- **How to attach:** call `add_repo` (owner `perezfiles01-droid`, repo `tagalog-shorts`, access `push`), then clone it: `git clone https://github.com/perezfiles01-droid/tagalog-shorts /home/user/tagalog-shorts`. Confirm `HANDOFF.md` and `videos/tae/` exist.
- **If `add_repo` or the clone fails, say exactly this and wait:**
  > I can't reach your **tagalog-shorts** repo, which holds the code that keeps every video in the same style. Please do one of these, then tell me "done":
  > 1. Start this session on the **perezfiles01-droid/tagalog-shorts** repo (not PodC, which is your Android app), or
  > 2. Give the Claude GitHub App access to tagalog-shorts: https://github.com/apps/claude/installations/select_target (and reconnect GitHub at https://claude.ai/connect-github if needed).
  >
  > Without it, I'd have to rebuild the style from memory, and the video wouldn't match your previous ones.

### 0.2 The latest project to copy from
- It must exist: `videos/tae/video/src/{kit.tsx,props.tsx,batch.tsx,Video.tsx,Thumbnail.tsx,scenesB.tsx}`, `videos/tae/voice/{build_audio.py,sfx.py}`, `videos/tae/video/public/newsreader-italic.woff2`.
- If it's missing or the repo looks different, say: *"The repo doesn't have the latest project (`videos/tae`) I need to copy the style from. Did a newer video get saved somewhere else, or should I use `<newest videos/… folder found>` instead?"* Wait for the answer.

### 0.3 Tools in the environment
Check each one quickly. If any fails and can't be installed, tell the user what's missing in one line, and stop until it's resolved:
- `ffmpeg -version`, `node -v` (22 or newer), `npx remotion --version` (after `npm install` inside a copied `video/` folder).
- The browser at `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`. If the path differs, find it with `ls /opt/pw-browsers` and update `remotion.config.ts`. Tell the user only if no browser exists.
- Python: `pip install faster-whisper soundfile scipy numpy` (plain PyPI; the PyTorch index is blocked).
- A message for a blocked tool: *"This environment is missing <tool>, and I can't install it (<reason>). Please <fix, e.g. allow network access to X / use the cloud environment from last time>, then tell me 'done'."*

### 0.4 What the user should paste or say to start
If the user opens a session without context, tell them: *"For the same style and process, start a new session on the **tagalog-shorts** repo and say: 'Read HANDOFF.md and follow it exactly. Next video: <funny question>.'"*

### 0.5 Once the check passes
1. Tell the user in one line: *"Setup check passed: tagalog-shorts repo connected, latest project `videos/tae` found, tools ready."*
2. Read §1 (style), §2 (flow), §3 (message formats), §5 (settings) and §11 (rules).
3. Start the new video by copying the latest project (§6 step 2).

---

## 1. What we make (style rules, all approved)

Vertical **9:16, 1080×1920, 30fps** animated mini-documentaries, **about 95–106 s long (always under 2 min)**, narrated in **Tagalog/Filipino** by **the user's own recorded voice**, in a **low-poly 3D "toy" style** built with Remotion + three.js. Facebook Page: **Kwentong Kayumanggi**.

| Element | Rule |
|---|---|
| **Opening rule** | **The script's very first words are a funny question asked straight to the viewer.** No set-up clause before it (not "Kung…", not "Isang gabi…"). The title is also a funny question. Examples: *"Mabaho ba ang utot mo? Nakaamoy ka na ba ng mabangong utot? Siyempre hindi…"*, *"Nakakain ba ang tae? …"*. |
| Story shape | Funny question, then a gag answer ("hindi, kahit kailan!"), then real, researched facts in an easy way, then a light but meaningful or useful ending, plus one last punchline. |
| Tone | **Funny yet meaningful, PG.** Cartoon gags only, nothing gross or explicit, no real private people (e.g. never recreate a viral couple). Health or safety topics must clearly state the safe answer. |
| Look | Low-poly, flat-shaded 3D. Muted natural colors. Toy-like people (`Person`): round heads, dot eyes, pink blush, capsule bodies, white shoes. Cute cartoon props (poop is a stylized brown swirl, a fart is a little green puff). |
| Atmosphere | Fog and depth haze, gradient skies, warm lights. Day, dusk or night as the story needs. |
| Camera | Slow, continuous cinematic moves (push-ins, dollies, orbits, pull-backs, rises). Scenes crossfade (0.35 s each side). Inside a scene, a quick switch between sets is fine when it's covered by motion. |
| Text on screen | **No title cards, no watermark.** Allowed: subtitles, and small story overlays that *are* the gag or the fact (a big red ✕, "99% walang amoy", "75% tubig", "BUFFET!", "100+ uri ng mikrobyo", "×15" counter, a word splitting into its parts). |
| Subtitles | Newsreader Italic 500, white, 70px, max 2 rows of about 26 characters, bottom padding 470px. Each word brightens as it's spoken. **Key words turn gold `#e8b54a`.** Soft heavy text shadow. |
| Wording vs animation | **Less wording, more animation.** 7 narrated sentences, plus **one silent scene** (music and sound effects only) in the middle. |
| Narration style | Full, flowing documentary sentences (Discovery-channel tone), never short fragments. |
| Ending | A pull-back or reveal, then fade to black. |

---

## 2. The exact flow (always in this order)

| Step | What the user does | What Claude does |
|---|---|---|
| 1 | Gives the topic as a funny question | **Research it first** (WebSearch; cite sources for anything trending or uncertain). If the topic has a risk (sexual, health, real people), explain the concern and propose a safe PG angle **before** writing. Then send the **script** (§3.1). |
| 2 | Edits lines ("change line 5", "this is unclear") | Offer **2–4 alternatives** per line (§3.2), recommend one with ⭐, and update only what they asked. |
| 3 | Asks for "the clean lines" | Send the **clean recording lines** with reading tips (§3.3). |
| 4 | Uploads the `.m4a` recording | Enhance it, transcribe it, check every line, and **send the enhanced MP3** back (§3.4). Then build everything (§6) **without waiting**. |
| 5 | (waits) | Render the **low-quality preview** and send it (§3.5). |
| 6 | Gives feedback, or says "render" | Fix and re-preview. Audio-only fixes are a remux, not a re-render. On "render", start the **1080p final** and immediately send **3 caption options** (§3.6). |
| 7 | Picks a caption ("A") | Confirm it in a code block, ready to copy (§3.7). |
| 8 | Asks "is it done yet?" | Check the log and give an honest status: frames done/total, %, realistic time left (§3.8). |
| 9 | (render finishes) | Send the **MP4**, then **3 thumbnail options**, then the **upload package** (§3.9). |
| 10 | (nothing; they choose and upload the thumbnail themselves) | Done. **Update this handoff** (§10), commit and push, and send `HANDOFF.md` as a file if they ask. **Never ask which thumbnail they picked.** |

**The user uploads manually** to the Facebook Page as a Reel. There's no TikTok and no auto-posting (see §7).

---

## 3. Message formats (copy these exactly)

All replies are in **English**, with the Tagalog content in its own lines. Every Tagalog line gets an English translation in parentheses and italics.

### 3.1 Script
```
Here's the script for **"<Title as a funny question>"**. It's about 95 seconds in 8 scenes, with no titles on screen and full-sentence narration as before.

---

**1 · 0:00–0:12** *<animation description in English, one or two sentences>*
> <Tagalog narration, line 1 = the funny question>

*(<English translation>)*

**2 · 0:12–0:22** *<animation>*
> <narration>

*(<translation>)*

… scenes 3–8; exactly one scene is:
**4 · 0:35–0:44** *(Silent, music only.) <animation>*

---

**Summary:** 7 narrated lines (about N words), one silent "<name>" scene, <what the ending does>. Gold-highlighted words would include *<5–9 key words>*.

**About the facts:** <bullets with the key facts and how they're worded safely>

**Kept PG:** <how the gag stays clean>

Edit anything you want. When it's final, I'll give you the clean lines to record.
```

### 3.2 Line alternatives
```
Here are some alternatives for line N:

**Option A** ⭐
> <Tagalog>

*(<English>)* <one sentence on why>

**Option B: <short label>**
> <Tagalog>

*(<English>)*

… (2–4 options)

**My pick is A.** <one line why>. Which one do you want? I'll update line N in the recording list.
```

### 3.3 Clean lines to record
```
Here are the lines to read, with a 2–3 second pause between each:

1. <line 1>

2. <line 2>

… 7.

There's no line between 3 and 4 to read; that gap is the silent <name> scene.

**Reading tips:**
- **Line 1:** <playful / curious delivery, where to pause>
- **Line N:** <specific tip for the punchline or key word, e.g. stress *es-mi-RING-hoy*>
- As usual: a quiet room, the phone a hand-span away, 5 seconds of silence first, and the original voice-recorder file (.m4a).

Upload it here when it's ready.
```

### 3.4 After the recording arrives
- If the user's spoken words differ slightly from the script (e.g. *"ang mga tae"*, *"nitong"* for *"nilang"*), **keep what they said** and match the subtitles to it. Say so in one sentence.
- If a filler like "Hmm" is at the start, cut it and say so.
- If only text arrives, ask for the audio file again.
- Message: *"All 7 lines are there <note any differences>. Here's your enhanced voice; building the scenes now."* Then send `voice/voice_enhanced.mp3`.

### 3.5 Preview
Send `video/out/<name>-preview.mp4` with the caption *"<Title> preview: N s, low quality (540×960, 15fps)"*. Then:
```
The **preview is ready** (N seconds, low quality).

**Please check:**
1. <timing of the key gag, e.g. Does the red ✕ land right on "hindi"?>
2. <a sound-effect question>
3. <an overlay or label question>
4. <a tone question, e.g. Is it cute rather than gross?>

Tell me what to change, or say **"render"** for the final 1080p.
```

### 3.6 On "render": start the final, then send caption options
```
**The final 1080p render is running** (N frames) and I confirmed it's started. Expect about **20 minutes**; the first estimate is always inflated.

**While it renders, here are the caption options:**

**A** ⭐
> <short Tagalog phrase + 1–2 emoji>

*(<English>)*

**B**
> <phrase + emoji>

*(<English>)*

**C**
> <phrase + emoji>

*(<English>)*

**Hashtags after it:**
> #KwentongKayumanggi <topic tags…> #Pilipinas #3DAnimation #Reels

**Title:** `<Funny Question Title>`

Which caption do you want? When the render finishes, I'll send the MP4 and 3 thumbnail options.
```
Caption = **one short phrase + emoji, a blank line, then about 10 hashtags.** Always include `#KwentongKayumanggi`, `#Pilipinas`, `#3DAnimation`, `#Reels`, plus topic tags (e.g. `#AlamMoBa`, `#PinoyScience`, `#PinoyHumor`, `#KulturangPilipino`).

### 3.7 Caption confirmed
```
Caption A is locked in:

\`\`\`
<phrase>

<hashtags>
\`\`\`

**Title:** `<title>`

The render is still going. I'll send the MP4 and thumbnail options when it's done.
```

### 3.8 "Is it done yet?"
Read `final.log` / `preview.log` (`tail -c 200 … | tr '\r' '\n' | grep Rendered | tail -1`) and reply: *"Not yet. It's at **X of Y frames (Z%)**, with about N–M minutes left. I'll send it as soon as it's done."* Remotion's own estimate runs optimistic, so add a margin.

### 3.9 Render finished
1. Send the MP4 as a file card (`display: attach`) with the caption *"<Title>, final 1080p (1080×1920, 30fps, N s). Download and keep it."*
2. Render 3 thumbnails (`ThumbA/B/C`, §5.6), view them on a contact sheet, send all 3 in one card, then:
```
The final 1080p video is ready (attached above: 1080×1920, 30fps, N seconds, M MB). Please download it.

**Thumbnail options**, all with the title **"<title start> *<gold word>*"** and the line *"<sub line>"*:
- **A:** <description>. ⭐ I'd go with this one.
- **B:** <description>.
- **C:** <description>.

**Upload package:**
- **Video:** `<file>.mp4` (attached above)
- **Caption:**
\`\`\`
<phrase>

<hashtags>
\`\`\`
- **Title:** `<title>`
- **To post:** in the Facebook app, switch to your Kwentong Kayumanggi Page, then tap ＋ Create → Reel, pick the video, tap Edit cover to upload the thumbnail, paste the caption, and tap Share.

Pick whichever thumbnail you like when you upload. What's the next funny question?
```

---

## 4. Timeline rules

- 8 scenes. Narration line *i* goes in the scene that illustrates it. **The silent scene is always scene 4**, between lines 3 and 4.
- Place each line **0.4–0.6 s after its scene starts**. The scene ends about 0.3 s after its line ends. The silent scene is 8–9 s. The last scene keeps 1.5–2 s after the last word for the fade.
- **TOTAL is the last scene end, rounded up** (videos 2–5 were 98–106 s). Must stay under 120 s.
- **Put the key visual beat on the exact spoken word** (the ✕ on "hindi", the glowing feet on "paa", "ESMI" turning gold on "esmi"). Local time = `line video start + (word time in recording − line source start) − scene start`.

---

## 5. Exact technical settings

### 5.1 Project layout (as in `videos/tae`)
```
videos/<slug>/
  voice/raw.m4a  enhanced.wav  e16.wav  voice_enhanced.mp3  words.json
  voice/build_audio.py   LINES / MERGES / TOTAL / music() / ambience() -> ../video/public/mix.wav + ../video/src/timeline.json
  voice/sfx.py           shared sound helpers (birds, murmur, clink, thump, horn, …)
  video/package.json     remotion 4.0.537, @remotion/three 4.0.537, @react-three/fiber 9.8.2, three 0.180.0, react 19.2.0
  video/remotion.config.ts   ANGLE GL + local headless shell
  video/public/          mix.wav, newsreader-italic.woff2
  video/src/kit.tsx      Cam, Sky, Person, walk, mat, Tree, Cloud, TerraceHill, Mountain, Stalk …
  video/src/props.tsx    Barangay, House, Dish, StringLights, Kitchen, FeastTable, Tupper …
  video/src/scenesB.tsx  Jeepney, Islands (Philippine map), proj …
  video/src/scenes.tsx   S1–S8 for this video (+ O-overlays as DOM components)
  video/src/batch.tsx    AutoBatch (render speed-up, picture identical)
  video/src/Video.tsx    SCENES list {C, O?, start, dur}, TOTAL, crossfades, subtitles, vignette, audio
  video/src/Thumbnail.tsx    scene still + title for ThumbA/B/C
  video/src/Root.tsx     compositions: <Name> (30fps), Preview (15fps), ThumbA/B/C
```
`.gitignore` excludes `node_modules/ out/ stills/ thumbs/ bench/ *.wav *.m4a *.mp3 *.mp4 *.log __pycache__/`.

### 5.2 Voice enhancement (exact)
```bash
ffmpeg -y -i raw.m4a -af "pan=mono|c0=0.5*c0+0.5*c1,highpass=f=85,lowpass=f=14000,afftdn=nr=16:nf=-44:tn=1,agate=threshold=0.012:ratio=3:range=0.12:attack=4:release=180,equalizer=f=170:t=q:w=1:g=2.5,equalizer=f=420:t=q:w=1.2:g=-2.5,equalizer=f=3600:t=q:w=1.4:g=2.5,deesser=i=0.35,acompressor=threshold=-22dB:ratio=3:attack=6:release=140:makeup=4,loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000" -c:a pcm_s16le enhanced.wav
ffmpeg -y -i enhanced.wav -ac 1 -ar 16000 e16.wav
ffmpeg -y -i enhanced.wav -b:a 192k voice_enhanced.mp3
```

### 5.3 Transcription (exact)
```python
from faster_whisper import WhisperModel
import json, soundfile as sf
a,_ = sf.read('e16.wav', dtype='float32')            # pass an array, not a path
m = WhisperModel('medium', device='cpu', compute_type='int8')
segs,_ = m.transcribe(a, language='tl', word_timestamps=True, initial_prompt='<line 1 + key terms>')
W = [dict(w=x.word.strip(), s=round(x.start,2), e=round(x.end,2)) for s in segs for x in s.words]
json.dump(W, open('words.json','w'), ensure_ascii=False)
```
Then print every word with its start time, find each line's source start and end (use gaps; check RMS every 0.1 s around boundaries if needed), and fill in `LINES`:
`(source_start, source_end, video_start, "subtitle text exactly as spoken, script spelling", ["gold", "words,"])`.
Gold words must match the subtitle tokens including punctuation. Use `MERGES` when whisper splits one word into two (e.g. `("tatlong","kapat")`, `("pinag","-aaralan")`). The script asserts that the token counts match.

### 5.4 Music and mix (approved v3 balance; never change)
- **Music:** original, procedural `music()` in `build_audio.py`: a playful I–V–vi–IV with a pizzicato bass and a marimba-like melody at 104 bpm. During the silent scene it switches to the minor "sneaky" theme (`detective = <scene 4 start> <= t < <scene 4 end>`). The final mix multiplies music by 1.6, landing around −25 LUFS.
- **Sound effects:** `ambience(voice)` places procedural effects on the exact beats (see the helper list in §8). Crowds and chatter are always `murmur()` made from the narrator's own voice: unintelligible and copyright-free.
- **Mix (ffmpeg):** music volume 2.1 → sidechaincompress (threshold 0.08, ratio 1.4, attack 120, release 900); ambience volume 1.5 → sidechaincompress (threshold 0.05, ratio 2); amix 1:1:1; `loudnorm=I=-14:TP=-1.5:LRA=11`. Check: mix at about −14 LUFS, music about −25, ambience −27 to −32.
- History: v1 (heavy ducking) was "can't hear the music", v2 was still too separated, **v3 (music close to the voice) is approved.**

### 5.5 Render commands (exact)
Background commands drop a leading `cd`, so **always use `env -C`**:
```bash
env -C /home/user/tagalog-shorts/videos/<slug>/video sh -c 'npx remotion render src/index.ts Preview out/<slug>-preview.mp4 --scale=0.5 --concurrency=4 --codec=h264 --crf=26 --audio-bitrate=128k > preview.log 2>&1; ls out'
env -C /home/user/tagalog-shorts/videos/<slug>/video sh -c 'npx remotion render src/index.ts <Name> out/<slug>-1080p.mp4 --concurrency=4 --codec=h264 --crf=18 --audio-bitrate=192k > final.log 2>&1; ls -la out'
```
Run them with `run_in_background`, then **confirm a `Rendered N/` line appears in the log** before telling the user it's running. Stills: `npx remotion still src/index.ts <Name> stills/sNN.png --frame=$((NN*30))`. Tile 6–8 stills into a contact sheet with ffmpeg `xstack`, view it, fix framing, and re-check.

### 5.6 Thumbnails (exact)
Add to `Root.tsx`: `ThumbA/B/C`, each `{scene, t}` for a strong still. Props: `title` (white start of the question), `gold` (the key word with "?", in gold), `sub` (a short line, e.g. *"Ang sagot ng siyensya"*). Size 1080×1920, Newsreader Italic 600 at 120px, sub line 56px, a dark top/bottom gradient. Recommend the funniest, clearest one with ⭐.

### 5.7 Times to expect (no GPU here)
Preview (15fps, half size) takes 8–11 min. Final 1080p30 takes about 18–20 min (0.35 s/frame). Don't promise faster. Under 10 min needs the user's GPU PC or Remotion Lambda.

### 5.8 Design specifics (keep identical)
- **Code you copy as-is, never rewrite:** `Video.tsx` (subtitles, crossfades, vignette, fade from and to black, font loading), `kit.tsx`, `props.tsx`, `batch.tsx`, `Thumbnail.tsx`. Only `SCENES`, `TOTAL` and the export name change.
- **Frame:** a radial vignette (transparent to 0.38 black at the edges) plus a bottom gradient for subtitle legibility. Fade in from black over the first 0.8 s, and out to black over the last 2 s.
- **Characters:** `Person` toy figures. Use the same seeds for recurring roles in a video (e.g. Lolo 1001, Nanay `#c9784a` long hair, kid `scale 0.72` in `#d9b44a`). Kids are `scale={0.72}`; mouths open (`mouth`) when talking, laughing or gasping. Gestures are pose angles in radians (raise arm `armR: -2.3`, hold something `armL/armR: -1.15, elbow: -0.35`, sit `sit: true`).
- **Lighting palettes:** day = sky `#8fc0e3`→`#f1eee2`, `hemisphereLight` about 1.25, warm directional `#fff1da` about 2.1. Indoor = dark background `#221d1a`/`#2a2420`, warm `pointLight #ffcf8f` intensity 8–18. Night = `#141a33` background, blue hemisphere about 0.8–0.9, moon sphere `#fff6d8`. Dusk = `Barangay dusk={1}`.
- **Camera:** fov 40–46 for people, 55–60 inside tunnels, 30–36 for dramatic close-ups. Every scene has slow motion through `mix(a, b, smooth(t, t0, t1))`; never a static camera. Montages stop at each vignette (hold, quick move, hold).
- **Framing for 9:16:** keep the subject in the middle 60% of the width. Faces and gags go above y ≈ 1350 px (the subtitles sit around 1380–1500 px). Overlays (big numbers, ✕, labels) go near the top, around 300–330 px padding.
- **Overlay text style:** Newsreader Italic 700, 130–200px for numbers, a 56–64px sub line, white or gold `#e8b54a` (sulfur or stinky things `#d6e34a`, water `#8fd0ff`, germs `#9bd86a`), a strong shadow, and a scale-in pop over 0.3–0.6 s. Card overlays are off-white rounded cards with a red `#d33a2c` "?" stamp.
- **Gags:** each scene has one clear visual joke (freeze then blame the dog, Nanay's tsinelas, sunglasses flies, eyes popping over a newspaper, the elevator head-turn). Silent scene 4 is always a playful mini-sequence (cats on a roof, the gas balloon drumroll, a slow-motion fly documentary).

### 5.9 Musical scoring specifics (keep identical)
`music()` in the latest `build_audio.py` is copied unchanged; only the silent-scene window is set:
- **Tempo** 104 bpm (`beat = 60/104`). **Progression** C – G – Am – F (`[[48,52,55],[43,47,50],[45,48,52],[41,45,48]]`), 8 beats per chord.
- **Bass:** pizzicato on beats 1 and 3 (`tone(root−12, 0.5 s, decay 5)`, gain 0.16). **Off-beats:** chord plucks an octave up (gain 0.035).
- **Melody:** a marimba-like line from `[72,74,76,79,76,74,72,67]`, about 70% of beats (gain 0.05, random pan).
- **Silent scene:** switches to the minor progression (Am – F – E – Am) with creeping low notes every 4 beats, and no melody or off-beats.
- **Pad:** a soft C-major pad (0.012) under scenes 1–3, swelling in the last scene (`np.clip((t − last scene start)/5, 0, 1)`).
- **Fades:** in over 1.5 s, out over the last 4 s. Written at ×1.6, giving about −25 LUFS before the mix.
- **Sound-effect rule:** at least one effect per gag, timed to the frame of the visual (a stamp thump, a pop per appearing item, a whoosh per camera dive, `pfft` for toots, a `ding` for elevators and reveals, `meow`/`bark` for animals, a `murmur` crowd for groups, birds by day, crickets at night). Keep each effect's gain between 0.04 and 0.45, so none beats the voice.

---

## 6. Build procedure for a new video (do every step)

1. Research and write the script (§3.1). Wait for edits, then send clean lines (§3.3).
2. When the `.m4a` arrives, set `P=/home/user/tagalog-shorts/videos/<slug>` and copy the latest project:
   ```bash
   L=/home/user/tagalog-shorts/videos/tae   # latest project
   mkdir -p $P/voice $P/video/src $P/video/public
   cp $L/video/{package.json,package-lock.json,tsconfig.json,remotion.config.ts} $P/video/
   cp $L/video/src/{kit.tsx,props.tsx,batch.tsx,index.ts,Video.tsx,Thumbnail.tsx,scenesB.tsx} $P/video/src/
   cp $L/video/public/newsreader-italic.woff2 $P/video/public/
   cp $L/voice/{sfx.py,build_audio.py} $P/voice/
   cp "<uploaded m4a>" $P/voice/raw.m4a
   env -C $P/video npm install --no-audit --no-fund
   ```
3. Enhance (§5.2), transcribe (§5.3), and send the enhanced MP3 (§3.4).
4. Plan the timeline (§4). Write `video/src/scenes.tsx` with `S1…S8` (each gets `t` = scene-local seconds; all motion is a pure function of `t`) and any overlays `O#`. Reuse the props in §8 and add new ones in the same style.
5. Edit `Video.tsx`: the `SCENES` list, `TOTAL`, the export name. Edit `Root.tsx`: `<Name>` + `Preview`. Write `timeline.json` as `[]` until the audio is built.
6. Edit `build_audio.py`: the docstring, `TOTAL`, `LINES`, `MERGES`, the silent-scene window in `music()`, and a new `ambience()` with effects on the exact beats. Run it and check the LUFS (§5.4).
7. `npx tsc -p .`, then stills of every scene on contact sheets. Fix framing: everyone in frame for the vertical crop, nothing important under the subtitles, `far={2000}` on wide shots. Re-check.
8. Commit and push (§9), render the preview (§5.5), send it (§3.5).
9. Iterate. On "render", run the final and send captions (§3.6). When it's done, send the MP4, thumbnails and upload package (§3.9).
10. Update this file's §10 table, commit, push.

---

## 7. Channel and publishing

- **Facebook Page: Kwentong Kayumanggi** (category: Creator, Page ID `1442014212320460`), connected through Composio, but **posting is manual by the user** (the network blocks Facebook's upload host, and the Reels API is limited to 90 s). Don't try auto-posting. If the user asks for it, ask before using any public file host.
- Bio: *Mga kuwento ng kasaysayan, kultura at buhay ng mga Pilipino.*
- **No TikTok for now** (the account `@kwentongkayumanggi` exists).
- **Don't use** the YouTube "Papel Tales" channel connected through Composio. It's a different channel.
- Branding (in `videos/isang-butil/video/src/Brand.tsx` and `branding/`): a storyteller mascot (cream barong-style shirt), the `ChannelCover` lineup, the `TikTokProfile` crop.

---

## 8. Reusable parts

**Props by project** (copy the component into the new `scenes.tsx` or `props.tsx` when needed):
- `tae`: `Fly` (wings, sunglasses, glowing feet, dance), `Swarm`, `Mound` (cartoon poop), `Drop`, `Germ`, `Backyard`, `Tag` (big-number overlay), the red ✕ stamp overlay.
- `utot`: `Puff` (green toot cloud), `Dog`, `LivingRoom`, `Family`, `Tunnel` (intestine), `Bacterium`, `Bubble` (incl. angry stinky face), `Food`, `Nose`, the elevator set, the `×N` counter overlay.
- `esmiringhoy`: `Cat`, `Heart`, `PhoneLights` over the archipelago, `NightSea`, the word-split overlay, `Card` with a red "?" stamp, the radio booth.
- `tupperware-ni-nanay`: `Tupper`, `Lid`, `Dish`, `House`, `Barangay` (day/dusk/night, `extraRows`, `lights`), `StringLights`, `Kitchen`, `Cabinet`, `FeastTable`, `Actor`/`CAST`.
- `jeep`: `Jeep` (open-interior jeepney: benches, riders by seat index, stretchable cabin `len`, PhD driver with mortarboard and glasses, diploma on the mirror, glowing roof sign), `fullRiders(gap)`, `Mouse`, `Street` (two rows of houses along z), `Rocket`, `Einstein`, space-time `Tunnel`, the red ✕ `Cross` overlay.
- `isang-butil`: `TerraceHill`, `Field` (instanced rice), `Rain`, `Jeepney`, `Stall`, `Islands`, `Town`, `Brand.tsx`.
- `kit.tsx`: `Person` (pose fields `armL armR spreadL spreadR elbow leg bend sit headTurn bob`; props `seed shirt pants hat mouth longHair hairColor scale children`), `walk(t, speed, phase)`, `Cam`, `Sky`, `mat`, `Tree`, `Cloud`, `Mountain`.

**Sound helpers** (`build_audio.py` + `sfx.py`): `pfft` (toot), `meow`, `bark`, `knock`, `clink`, `pop`, `whoosh`, `boing`, `ding`, `blip`, `thump`, `horn`, `tone`, `buzz_track` (flies), `murmur` (crowd from the narrator's voice), `chirps` (birds), crickets, rain, thunder, wind.

---

## 9. Environment and git rules

- **No GPU.** Software WebGL, so renders are slow (§5.7). `AutoBatch` is always on (SSIM 0.99995 against unbatched; about 23% faster).
- Fonts: the browser can't reach Google Fonts through the proxy. Use the local `public/newsreader-italic.woff2` via `FontFace` + `delayRender` (already in `Video.tsx` and `Thumbnail.tsx`).
- `remotion.config.ts` uses `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` and the ANGLE GL renderer.
- Camera `far` must be bigger than the `Sky` radius (900), or the sky renders black. Keep React hooks above any early `return` in a scene.
- Never run `pkill -f "remotion render"` from a command containing that text (it kills its own shell). Find the PID first.
- **Commit and push after each milestone** (scenes built, thumbnails, handoff). A stop hook blocks ending a turn with uncommitted changes. Commit as `user.name=perezfiles01-droid`, `user.email=perezfiles01@gmail.com`, push to `main`, and end messages with the session attribution lines.
- The container is temporary. Always send the MP4s to the user; the repo keeps the code only.

---

## 10. Videos made so far

| # | Title (funny question) | Folder | Caption chosen | Status |
|---|---|---|---|---|
| 1 | Isang Butil (rice journey; before the question format) | `videos/isang-butil` | Bago umabot sa plato mo, malayo na ang nilakbay ng isang butil. 🌾 | 1080p delivered |
| 2 | Ang Tupperware ni Nanay: Laging May Daan Pauwi | `videos/tupperware-ni-nanay` | Ang Tupperware ni Nanay, laging may daan pauwi. 💙 | 1080p delivered |
| 3 | Esmiringhoy: Saan Nga Ba Nagsimula? | `videos/esmiringhoy` | Esmiringhoy: alam mo na ba kung saan galing? 🐱💕 | 1080p delivered |
| 4 | Bakit Nga Ba Mabaho ang Utot? | `videos/utot` | Mabaho ba ang utot mo? Hindi ka nag-iisa. 💨😅 | 1080p delivered |
| 5 | Nakakain Ba ang Tae? Bakit Paborito Ito ng mga Langaw? | `videos/tae` | Nakakain ba ang tae? Ang sagot ng siyensya… at ni Nanay. 😂🪰 | 1080p delivered |
| 6 | Isa Ka Bang Hampaslupa? | `videos/hampaslupa` | Isa ka bang hampaslupa? Baka mali lang ang basehan natin. 🌾👊 | 1080p delivered (6 narrated lines; thumbnail: user's choice) |
| 7 | Makakaligtas Ka Ba sa Zombie Outbreak? | `videos/zombie` | Makakaligtas ka ba sa zombie outbreak? Mas nakakatakot pala ang ibang outbreak. 🧟‍♂️🧾 | 1080p delivered (thumbnail: user's choice) |
| 8 | Ano ang Mangyayari Kung Sumabog ang Buwan? | `videos/buwan` | Walang forever… pero sana ang buwan, meron. 🌕🥲 | 1080p delivered, 111 s (science timeline with time chips; thumbnail: user's choice) |
| 9 | What If May PhD sa Physics ang Jeepney Driver? | `videos/jeep` | Hindi na kailangan ng NASA, may jeepney driver tayo. 🚀🚐 | 1080p rendering, 89 s (user-written script; 80 s recording; thumbnail: user's choice) |
| 10 | Nalulungkot Ba ang Kanin? | `videos/kanin` | Kahit gaano kasarap ang ulam, kanin pa rin ang tunay na bida. 🍚💛 | 1080p rendering, 95 s (user's own script read word for word: 8 narrated lines, silent scene after line 4; thumbnail: user's choice) |

**Latest project to copy: `videos/tae`** (kit files are identical in `hampaslupa` and `zombie`; `jeep/voice/build_audio.py` has the newest sound helpers: `groan`, `chomp`, `engine`, `squeak`, `cluck`).

### Voice options already tried (don't re-try)
Kokoro TTS: accented, rejected. Meta MMS-TTS Tagalog: flat. ElevenLabs Filipino voices: need a paid plan. Edge TTS: blocked. **The user's own recording, enhanced, is the standard.**

---

## 11. Extra rules, fixes and checklists

### 11.1 If something is missing in a new session
- **The repo can't be attached or cloned:** tell the user the `tagalog-shorts` repo isn't reachable, and ask them to check that the Claude GitHub App has access to it. Don't rebuild the kit from memory unless the user agrees.
- **Tools:** `ffmpeg`, Node 22 and `/opt/pw-browsers/chromium_headless_shell-1194` were pre-installed here. The first faster-whisper run downloads the `medium` model (about 1.5 GB, a few minutes). Mention this if it's slow.
- **Paths may differ:** if `/home/user` doesn't exist, clone wherever the working directory is and adjust `P=`, but keep the same folder structure.

### 11.2 When the user asks for topic ideas
Give **5 ideas**, each in this exact shape, then recommend one:
```
### 1. "<Funny question title>" ⭐ recommended
**Funny:** <the gag setup in one or two sentences>
**Meaningful twist:** <the ending lesson>
**Why it could trend:** <relatable, taggable, comment-bait reason>
```
Then: *"**My pick is #N.** <why>. Which one do you want? I'll write the scene-by-scene script for you to edit."*

### 11.3 Research and fact rules
- Search before writing (WebSearch "standard"; "extended" for trending or slang). Use only facts found in reliable sources. For trending items, cite the sources as markdown links in the reply.
- Word numbers safely in the narration: "mahigit sampung beses", "halos tatlong-kapat", "wala pang isang porsiyento". Never give exact figures you couldn't verify.
- If the origin or answer is uncertain, say so in the script (e.g. "wala pa itong opisyal na kahulugan").
- **Sensitive topics** (sexual slang, real viral people, health risks): explain the concern first, propose a PG angle (hint, don't show), and only write after the user agrees. Example: Esmiringhoy used cats on a roof and a blushing couple, and never the real couple from the viral interview.

### 11.3a When the user sends their own script
- **Follow it word for word** when they ask ("please follow the script here"). Don't merge, reword or add facts; only send the clean lines (§3.3) with an English note on anything changed (e.g. finishing a line cut off in their message from an earlier copy).
- If it has 8 lines instead of 7, put the **silent scene after the line that sets up the twist** (in `kanin`, after line 4, the rice's rebellion), giving 9 scenes. Keep the total under 2 min.
- Example: `videos/kanin` (9 scenes, `S5` silent, `O3` "0 papuri", `O6` red ✕, `O7` "?!"). New props there: `RiceBowl` and `RiceBall` (a rice character with a `Face`: moods happy/sad/angry/calm, tear, wink, glow, bandana, bindle), `AdoboPot`, `Lechon`, `Spaghetti`, `RiceCooker`, `Hearts`, `Room` (dining room with a door that opens to day or night), `Table`, `Family`. Sound helper `creak()` (door).

### 11.4 Recording problems
- Small wording changes: keep them and match the subtitles (§3.4).
- **A spoken mistake that changes a fact** (e.g. "4 na taon" instead of "apat na buwan"): tell the user, explain why it matters, and ask them to re-record just that line. Splice the new take in at that line's source time.
- Too quiet, clipped or noisy: enhance anyway, but warn them, and send the recording tips again.
- If total speech is over about 100 s, the video can run up to about 110 s. If it would pass 120 s, ask which line to shorten.

### 11.5 Small fixes without a full re-render
- **Sound only** (volume, an effect, the music): edit `build_audio.py`, re-run it, then swap the new audio onto the existing video:
  `ffmpeg -y -i out/<slug>-preview.mp4 -i public/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest out/<slug>-preview-v2.mp4`
- **One scene changed:** check it with stills, or render just that range: `npx remotion render src/index.ts Preview out/check.mp4 --scale=0.5 --frames=<start*15>-<end*15>`. Then re-render the full preview once all fixes are in.
- **Subtitle text fix:** edit the `LINES` text in `build_audio.py` and re-run (this rewrites `timeline.json`). The token count must still match.

### 11.6 Pre-preview checklist (every item, every time)
- [ ] `npx tsc -p .` is clean.
- [ ] Mix about −14 LUFS, music about −25, ambience −27 to −32 (§5.4).
- [ ] Stills of all 8 scenes viewed on contact sheets: subjects in frame, nothing important under the subtitles, no black sky, overlays not colliding with the subtitles.
- [ ] Each overlay or gag is timed to its spoken word (§4).
- [ ] Code committed and pushed.

### 11.7 Naming and replies
- Folder `videos/<slug>` (short, lowercase, e.g. `tae`, `utot`). Files `<slug>-preview.mp4`, `<slug>-1080p.mp4`, `thumbs/ThumbA.png`. The composition name is PascalCase (`Tae`, `Utot`).
- **Thumbnails: always provide 3 options (A/B/C, one ⭐ recommended), but never ask which one the user picked or wait for it.** They choose while uploading manually (user instruction, 2026-10-21). Update §10 as soon as the MP4 is delivered, with "user's choice" in the thumbnail column.
- The user writes in English or Taglish. Reply in English. Tagalog content is always shown with an English translation in italics.
- Keep replies short and scannable (bold labels, short lists), and never claim progress you haven't checked.

### 11.7b User-written scripts
- If the user sends their own script, keep their wording. Fit it to the format: exactly 7 narrated lines (merge or split lines and say so in one line), the silent scene between lines 3 and 4, and their ending as the final punchline. If it has no real facts, offer one verified fact once; don't force it.
- A short recording (about 80 s) gives a shorter video (89 s for video #9). That's fine; don't pad the scenes.

### 11.8 Worked example: "Nakakain ba ang tae?" (video #5)
| Scene | Start | Dur | Line (video start) | What happens | Key beat |
|---|---|---|---|---|---|
| S1 | 0 | 12.5 | L1 @0.6 | backyard, poop swirl, flies arriving (some with sunglasses), curious kid | — |
| S2 | 12.5 | 12.7 | L2 @13.0 | kid leans in, Nanay runs over with a tsinelas | red ✕ on "hindi" (local 2.0) |
| S3 | 25.2 | 14 | L3 @25.6 | the mound's "menu": water drops, food bits, germs | "75% tubig" 2.6 s, "BUFFET!" 12.8 s |
| S4 | 39.2 | 8 | (silent) | slow-motion fly lands, feet sparkle, happy dance, eggs | sneaky minor music |
| S5 | 47.2 | 15.6 | L4 @47.6 | macro fly: glowing feet, saliva melts the food, sip | feet on "paa" (5.0), drip on "laway" (10.7) |
| S6 | 62.8 | 13.7 | L5 @63.2 | fly flies to the pancit with a germ trail, family gasps | lands on "dumapo" (4.9), "100+" on "isandaang" (9.1) |
| S7 | 76.5 | 12.9 | L6 @76.9 | cover food, wash hands, close the toilet lid | each action on its word |
| S8 | 89.4 | 16.6 | L7 @89.8 | family eats at sunset, kid winks, sad flies, camera rises | fade to black |
TOTAL 106 s. Final render about 20 min. The user picked caption A.
