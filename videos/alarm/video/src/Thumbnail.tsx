import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {S1, S2, S3, S4, S5, S6, S7, S8, S9} from './scenes';
import {AutoBatch} from './batch';

const SCENES: Record<string, React.FC<{t: number}>> = {S1, S2, S3, S4, S5, S6, S7, S8, S9};
const thumbFont = 'NewsreaderItalic';

// video thumbnail: a scene still + title in the subtitle typeface
export const Thumbnail: React.FC<{scene: string; t: number; title: string; gold: string; sub: string}> = ({scene, t, title, gold, sub}) => {
	const S = SCENES[scene];
	const [h] = React.useState(() => delayRender('font'));
	React.useEffect(() => {
		new FontFace(thumbFont, `url(${staticFile('newsreader-italic.woff2')})`, {style: 'italic', weight: '200 800'}).load().then((f) => {
			document.fonts.add(f);
			continueRender(h);
		});
	}, [h]);
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<ThreeCanvas width={1080} height={1920} gl={{antialias: true}} dpr={1}>
				<S t={t} />
				<AutoBatch />
			</ThreeCanvas>
			<AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.35) 100%)'}} />
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 220, fontFamily: thumbFont, fontStyle: 'italic', color: '#fff', textAlign: 'center', textShadow: '0 4px 24px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.7)'}}>
				<div style={{fontSize: 120, fontWeight: 600, lineHeight: 1.05, width: 1000}}>
					{title} <span style={{color: '#e8b54a'}}>{gold}</span>
				</div>
				<div style={{fontSize: 56, fontWeight: 500, marginTop: 30, width: 1020, lineHeight: 1.2}}>{sub}</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
