import React from 'react';
import {Composition} from 'remotion';
import {Esmiringhoy, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="Esmiringhoy" component={Esmiringhoy} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Esmiringhoy} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S4', t: 4.9},
			{id: 'ThumbB', scene: 'S6', t: 6.5},
			{id: 'ThumbC', scene: 'S1', t: 9.5},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'Saan galing ang', gold: 'esmiringhoy?', sub: 'Ang kuwento ng isang salitang viral'}} />
		))}
	</>
);
