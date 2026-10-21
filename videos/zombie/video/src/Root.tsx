import React from 'react';
import {Composition} from 'remotion';
import {Zombie, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="Zombie" component={Zombie} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Zombie} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S1', t: 11.0},
			{id: 'ThumbB', scene: 'S5', t: 7.0},
			{id: 'ThumbC', scene: 'S8', t: 9.3},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'Makakaligtas ka ba sa', gold: 'zombie outbreak?', sub: 'O sa outbreak ng mga korap?'}} />
		))}
	</>
);
