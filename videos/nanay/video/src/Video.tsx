import React from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {getInputProps} from 'remotion';
import {AutoBatch} from './batch';

// --props='{"batch":false}' renders without batching (for A/B checks)
const IP = getInputProps() as {batch?: boolean; noAudio?: boolean; noSubs?: boolean; noScene?: boolean};
const BATCH = IP.batch !== false;
import {H, W} from './kit';
import {O2, O3, O4, O5, O6, O7, O8, S1, S2, S3, S4, S5, S6, S7, S8} from './scenes';
import timeline from './timeline.json';

const fontFamily = 'NewsreaderItalic';
const fontReady = delayRender('font');
new FontFace(fontFamily, `url(${staticFile('newsreader-italic.woff2')})`, {style: 'italic', weight: '200 800'})
	.load()
	.then((f) => {
		document.fonts.add(f);
		continueRender(fontReady);
	});

export const TOTAL = 104;
const LEAD = 0.35; // crossfade half-width (s)
type Scene = {C: React.FC<{t: number}>; O?: React.FC<{t: number}>; start: number; dur: number};
const SCENES: Scene[] = [
	{C: S1, start: 0, dur: 12.8},
	{C: S2, O: O2, start: 12.8, dur: 14.3},
	{C: S3, O: O3, start: 27.1, dur: 10.2},
	{C: S4, O: O4, start: 37.3, dur: 8.5},
	{C: S5, O: O5, start: 45.8, dur: 12.8},
	{C: S6, O: O6, start: 58.6, dur: 13.0},
	{C: S7, O: O7, start: 71.6, dur: 16.6},
	{C: S8, O: O8, start: 88.2, dur: 15.8},
];

const SceneLayer: React.FC<{C: React.FC<{t: number}>; O?: React.FC<{t: number}>; dur: number; first: boolean; last: boolean}> = ({C, O, dur, first, last}) => {
	const f = useCurrentFrame();
	const FPS = useVideoConfig().fps;
	const t = f / FPS - (first ? 0 : LEAD);
	const fadeIn = first ? 1 : interpolate(t, [-LEAD, LEAD], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const fadeOut = last ? 1 : interpolate(t, [dur - LEAD, dur + LEAD], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{opacity: Math.min(fadeIn, fadeOut)}}>
			<ThreeCanvas width={W} height={H} gl={{antialias: true}} dpr={1}>
				{IP.noScene ? null : <C t={t} />}
				<AutoBatch enabled={BATCH} />
			</ThreeCanvas>
			{O ? <O t={t} /> : null}
		</AbsoluteFill>
	);
};

type Word = {w: string; s: number; e: number; gold: boolean};

// split a line into pages of at most two rows
const pages = (words: Word[]) => {
	const maxRow = 26;
	const rows: Word[][] = [];
	let cur: Word[] = [];
	let len = 0;
	words.forEach((w) => {
		if (len + w.w.length > maxRow && cur.length) {
			rows.push(cur);
			cur = [];
			len = 0;
		}
		cur.push(w);
		len += w.w.length + 1;
	});
	if (cur.length) rows.push(cur);
	const out: Word[][][] = [];
	for (let i = 0; i < rows.length; i += 2) out.push(rows.slice(i, i + 2));
	return out;
};

const Subtitles: React.FC = () => {
	const t = useCurrentFrame() / useVideoConfig().fps;
	const GOLD = '#e8b54a';
	for (const line of timeline as {start: number; words: Word[]}[]) {
		const ps = pages(line.words);
		for (let i = 0; i < ps.length; i++) {
			const flat = ps[i].flat();
			const a = flat[0].s - 0.25;
			const nextStart = i + 1 < ps.length ? ps[i + 1][0][0].s - 0.25 : flat[flat.length - 1].e + 0.9;
			if (t < a || t >= nextStart) continue;
			const op = interpolate(t, [a, a + 0.25, nextStart - 0.25, nextStart], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
			return (
				<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 470}}>
					<div style={{opacity: op, width: 900, textAlign: 'center', fontFamily, fontStyle: 'italic', fontWeight: 500, fontSize: 70, lineHeight: 1.18, color: '#fff', textShadow: '0 3px 16px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.35)'}}>
						{ps[i].map((row, r) => (
							<div key={r}>
								{row.map((w, j) => {
									const spoken = t >= w.s - 0.05;
									const k = interpolate(t, [w.s - 0.05, w.s + 0.15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
									return (
										<span key={j} style={{color: w.gold && spoken ? GOLD : '#fff', opacity: 0.62 + 0.38 * k, display: 'inline-block', transform: `translateY(${(1 - k) * 6}px)`, marginRight: 16}}>
											{w.w}
										</span>
									);
								})}
							</div>
						))}
					</div>
				</AbsoluteFill>
			);
		}
	}
	return null;
};

export const Nanay: React.FC = () => {
	const f = useCurrentFrame();
	const FPS = useVideoConfig().fps;
	const t = f / FPS;
	const black = interpolate(t, [0, 0.8, TOTAL - 2.2, TOTAL - 0.3], [1, 0, 0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			{SCENES.map((s, i) => {
				const first = i === 0, last = i === SCENES.length - 1;
				const from = Math.round((s.start - (first ? 0 : LEAD)) * FPS);
				const len = Math.round((s.dur + (first ? 0 : LEAD) + (last ? 0 : LEAD)) * FPS);
				return (
					<Sequence key={i} from={from} durationInFrames={len} layout="none">
						<SceneLayer C={s.C} O={s.O} dur={s.dur} first={first} last={last} />
					</Sequence>
				);
			})}
			{/* vignette */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
			<AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 80%, rgba(0,0,0,0.1) 100%)'}} />
			{IP.noSubs ? null : <Subtitles />}
			<AbsoluteFill style={{backgroundColor: '#000', opacity: black}} />
			{IP.noAudio ? null : <Audio src={staticFile('mix.wav')} />}
		</AbsoluteFill>
	);
};
