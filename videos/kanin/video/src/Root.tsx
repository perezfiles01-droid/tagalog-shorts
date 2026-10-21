import React from 'react';
import {Composition} from 'remotion';
import {Kanin, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="Kanin" component={Kanin} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Kanin} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S1', t: 8.0},
			{id: 'ThumbB', scene: 'S4', t: 6.0},
			{id: 'ThumbC', scene: 'S8', t: 14.0},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'Nalulungkot ba ang', gold: 'kanin?', sub: 'Ang tunay na bida ng hapag-kainan'}} />
		))}
	</>
);
