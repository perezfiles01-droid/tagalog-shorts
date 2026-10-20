# Video Production Handoff: Low-Poly Tagalog Documentary Shorts

**First project:** "Isang Butil" (One Grain), delivered 2026-10-20
**Read this before starting any new video.** It records the approved style, the workflow, the tools that work in this environment, and the dead ends to skip.

---

## 1. What we make

Vertical **9:16 (1080×1920, 30fps)** animated mini-documentaries, **1–2 minutes long**, narrated in **Tagalog/Filipino**, in a **low-poly 3D "toy" style**. The style is inspired by reference shorts the user shared (Tuklasin-style channels). **Copy the style only; never their topics, text, branding or watermark.**

### Style rules (approved)
| Element | Rule |
|---|---|
| Look | Low-poly, flat-shaded 3D. Muted, natural colors. Toy-like people: round heads, dot eyes, pink blush, capsule bodies, white shoes, salakot hats for farmers. |
| Atmosphere | Fog and depth haze, gradient skies, soft warm light. Dawn/golden-hour moods where it fits. |
| Camera | Slow, continuous cinematic moves: descents, dollies, orbits, pull-backs. No cuts inside a scene; 0.7 s crossfades between scenes. |
| On-screen titles | **None.** The user explicitly removed title cards and labels. |
| Watermark | **None.** |
| Subtitles | **Yes.** Italic serif (Newsreader Italic, weight 500), white, about 70px, max 2 rows, lower third (bottom padding 470px). Words brighten as they're spoken. **Key words turn gold `#e8b54a`.** Heavy soft text shadow. |
| Words vs animation | **Less wording, more animation.** About 7 narrated sentences per 95 s, plus at least one silent "breathing" scene. |
| Narration style | Full, flowing documentary sentences (Discovery-channel tone), calm, not short fragments. |
| Ending | Pull back or reveal, then fade to black. |

---

## 2. The approved workflow (follow in this order)

1. **Topic and script.** Claude proposes an original topic and a scene-by-scene script as a table (time / animation / narration). Claude provides sample text; **the user edits it.** Target about 95 s: 7–8 scenes of 8–14 s.
2. **User records the narration** on their phone. Give them the clean numbered lines to read, plus recording tips: quiet soft room, 20–30 cm from the phone, original voice-recorder file (not a Messenger voice note), 5 s of silence at the start, 2–3 s pauses between lines.
3. **Check the upload.** If only text arrives, ask again for the audio file. Compare what they say against the script and flag differences (in "Isang Butil" the transcript showed "4 na taon", but the audio actually said "apat na buwan").
4. **Enhance the voice** with the ffmpeg chain in §4 and send it back as an MP3.
5. **Transcribe for word timings** using faster-whisper `medium`, `language='tl'`, `word_timestamps=True`. Map the script words onto the whisper words by order, merging whisper's split words (e.g. `kailan`+`man`).
6. **Place each line on the timeline** (cut by source time, place at its scene's start time), **generate original music and ambience**, and mix (§4).
7. **Build the scenes** in Remotion with `@remotion/three` (§3). Check with **still frames** first (`npx remotion still ... --frame=N`), tiled into a contact sheet, then fix framing.
8. **Low-quality preview first:** `Preview` composition (15fps) with `--scale=0.5`, about 10 min. Send it and collect feedback.
9. **Audio-only changes** do not need a re-render: rebuild `mix.wav`, then remux onto the existing preview with `ffmpeg -c:v copy`.
10. **Final render** of `IsangButil`-style composition at 30fps, CRF 18, about 30–35 min. Send the MP4.
11. Tell the user to **download the final MP4**, because the cloud container is temporary.

---

## 3. Technical stack (verified working here)

**Project layout** (`isang-butil/`):
```
voice/
  raw.m4a            user's original recording
  enhanced.wav       cleaned voice
  words.json         whisper word timings
  build_audio.py     cuts lines, places them, makes music, mixes -> video/public/mix.wav + video/src/timeline.json
  sfx.py             procedural ambience per scene (birds, water, rain, thumps, engine, horn, crowd murmur, clinks, wind)
video/
  package.json       remotion 4.0.537, @remotion/three 4.0.537, @react-three/fiber 9.8.2, three 0.180.0, react 19.2.0
  remotion.config.ts angle GL + local headless shell
  public/mix.wav, public/newsreader-italic.woff2
  src/kit.tsx        reusable 3D kit: Cam, Sky, Person (poses), walk(), TerraceHill, Mountain, Tree, Cloud, Stalk, mat()
  src/scenesA.tsx    S1-S4 (terraces, planting, field, harvest) + instanced Field, Rain, Burst
  src/scenesB.tsx    S5-S8 (jeepney road, market, kitchen, archipelago pull-back) + Jeepney, Stall, Family, Islands, Town
  src/Video.tsx      scene timeline, crossfades, subtitles, vignette, audio
  src/Root.tsx       compositions: IsangButil (30fps), Preview (15fps)
```

**Reusable parts in `kit.tsx`** (reuse these instead of rebuilding):
- `Person`: a toy figure. Pose fields: `armL`, `armR`, `spreadL`, `spreadR`, `elbow`, `leg`, `bend`, `sit`, `headTurn`, `bob`. Also `hat`, `mouth`, `scale`, `seed` (random skin, shirt and hair), and `children` (attached to the right hand). It includes a blob shadow.
- `walk(t, speed, phase)`: returns a walking pose.
- `TerraceHill`, `Mountain`, `Tree`, `Cloud`, `Stalk`, `Sky` (gradient dome), `Cam` (set position and look-at each frame).
- `mat(color, opts)`: cached flat-shaded material.
- For anything repeated hundreds of times (fields, rain, trees, houses, particles), use **InstancedMesh**.
- Scene components receive `t` (seconds, scene-local). All motion is a pure function of `t`; no state or physics.

**Commands**
```bash
cd video
npm install
npx tsc -p .                                    # type check
npx remotion still src/index.ts IsangButil stills/sNN.png --frame=$((NN*30))
npx remotion render src/index.ts Preview out/preview.mp4 --scale=0.5 --concurrency=4 --crf=26
npx remotion render src/index.ts IsangButil out/final.mp4 --concurrency=4 --codec=h264 --crf=18 --audio-bitrate=192k
```

---

## 4. Audio recipe (approved levels)

**Voice enhancement** (phone m4a in, 48 kHz WAV out):
```
pan=mono|c0=0.5*c0+0.5*c1,highpass=f=85,lowpass=f=14000,afftdn=nr=16:nf=-44:tn=1,
agate=threshold=0.012:ratio=3:range=0.12:attack=4:release=180,
equalizer=f=170:t=q:w=1:g=2.5,equalizer=f=420:t=q:w=1.2:g=-2.5,equalizer=f=3600:t=q:w=1.4:g=2.5,
deesser=i=0.35,acompressor=threshold=-22dB:ratio=3:attack=6:release=140:makeup=4,
loudnorm=I=-16:TP=-1.5:LRA=7
```

**Music:** original and procedural (numpy): slow pad chords (D–Bm–G–A, 8 s each), sparse pentatonic plucks, soft wind, echo. No copyrighted tracks.

**Ambience:** per scene, procedural (see `sfx.py`). **Crowd and family "background voices"** are made from the narrator's own recording: random chunks, pitch-shifted, half reversed, layered about 14 deep and low-passed so no words are intelligible. The user liked this idea.

**Final mix (the user's approved balance, v3):** the music sits **close to the voice level**, so it "doesn't highlight the voice", with only light ducking.
```
music volume=2.1 -> sidechaincompress threshold=0.08 ratio=1.4 attack=120 release=900 (keyed by voice)
ambience volume=1.5 -> sidechaincompress threshold=0.05 ratio=2
amix weights 1:1:1, then loudnorm I=-14 LUFS TP=-1.5 (social-media loudness)
```
History: v1 (heavy ducking, ratio 6) was "can't hear the music". v2 (ratio 2.5) was better but still too separated. **v3 is approved.**

---

## 5. Voice: what was tried

| Option | Result |
|---|---|
| Kokoro TTS (`em_alex`, `am_michael`) with a Tagalog respelling-to-IPA layer (CAPS = stress, `'` = glottal stop, `ng`→ŋ, `r`→ɾ) | Worked technically, but **"still sounds with accent"**. Kokoro has no Filipino voice. Rejected. |
| Meta MMS-TTS Tagalog (`facebook/mms-tts-tgl`) | Native accent, free, runs here, but flat. Offered and not chosen. |
| ElevenLabs Filipino library voices (e.g. "Ranz – Calm Documentary") | **Blocked:** the user's account is on the free tier, and library voices need Creator or $5 of credits. About 800 characters left this month as of 2026-10-20. |
| Microsoft Edge TTS `fil-PH-AngeloNeural` | Blocked by the network (speech.platform.bing.com). |
| **User's own recording, enhanced** | **Chosen.** Use this by default. |

---

## 6. Environment gotchas (save time)

- **No GPU.** WebGL runs in software (SwiftShader/ANGLE). A full render is about 0.6–0.7 s per frame: about **30–35 min for 97 s at 30fps**. `--scale=0.5` barely helps because the cost is geometry, not pixels; **halving the fps** (Preview composition) is what makes previews fast.
- **The browser doesn't trust the proxy's certificate**, so Google Fonts requests fail inside the render. **Download font files with curl into `public/`** and load them via `FontFace` + `delayRender`. Don't use `@remotion/google-fonts`.
- Use the local browser: `Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell')` and `Config.setChromiumOpenGlRenderer('angle')`.
- `pip install torch` from the PyTorch index is blocked, but plain `pip install torch` (PyPI) works.
- faster-whisper: pass a **numpy array** (16 kHz mono via soundfile), not a file path. The file decoder fails with the installed `av` version.
- Don't use `pkill -f "remotion render"` inside a command that itself contains that string; it kills its own shell. Find the PID first.
- **The container is temporary.** Everything in the scratchpad disappears when the session ends. Send the final MP4 to the user and keep this handoff and the project source somewhere permanent.

---

## 7. Starting the next video: checklist

- [ ] Read this file.
- [ ] Propose an **original** topic and an about-95 s scene table in Tagalog (full documentary sentences, about 7 lines, at least one silent scene).
- [ ] Wait for the user's edits.
- [ ] Give them clean numbered lines to read and the recording tips.
- [ ] Enhance the voice, send it back, transcribe, and build the timeline.
- [ ] Reuse `kit.tsx` and build the new scenes. Check still frames on a contact sheet.
- [ ] Generate music and ambience. Mix at v3 levels.
- [ ] Send the low-quality preview, then iterate (audio-only changes are just a remux).
- [ ] Final render, then send the MP4 and remind the user to download it.
