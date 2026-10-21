import React from 'react';
import {Composition} from 'remotion';
import {Nanay, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="Nanay" component={Nanay} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Nanay} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S5', t: 8.8},
			{id: 'ThumbB', scene: 'S8', t: 7.6},
			{id: 'ThumbC', scene: 'S1', t: 11.8},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'May sixth sense ba ang mga', gold: 'nanay?', sub: 'Alam nila lahat ng kalokohan mo'}} />
		))}
	</>
);
