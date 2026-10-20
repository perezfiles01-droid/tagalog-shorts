import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {SceneStill} from './Brand';

// video thumbnail: scene still + title in the subtitle typeface
const thumbFont = 'NewsreaderItalic';

export const Thumbnail: React.FC<{scene: string; t: number; title: string; gold: string; sub: string}> = ({scene, t, title, gold, sub}) => {
	const [h] = React.useState(() => delayRender('font'));
	React.useEffect(() => {
		new FontFace(thumbFont, `url(${staticFile('newsreader-italic.woff2')})`, {style: 'italic', weight: '200 800'}).load().then((f) => {
			document.fonts.add(f);
			continueRender(h);
		});
	}, [h]);
	return (
		<AbsoluteFill>
			<SceneStill scene={scene} t={t} width={1080} height={1920} />
			<AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.35) 100%)'}} />
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 240, fontFamily: thumbFont, fontStyle: 'italic', color: '#fff', textAlign: 'center', textShadow: '0 4px 24px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.7)'}}>
				<div style={{fontSize: 175, fontWeight: 600, lineHeight: 1}}>
					{title} <span style={{color: '#e8b54a'}}>{gold}</span>
				</div>
				<div style={{fontSize: 56, fontWeight: 500, marginTop: 30, width: 1020, lineHeight: 1.2}}>{sub}</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
