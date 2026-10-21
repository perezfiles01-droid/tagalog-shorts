import React from 'react';
import {Composition} from 'remotion';
import {Jeep, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="Jeep" component={Jeep} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Jeep} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S1', t: 19.5},
			{id: 'ThumbB', scene: 'S5', t: 7.5},
			{id: 'ThumbC', scene: 'S4', t: 8.0},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'May PhD sa Physics ang', gold: 'jeepney driver?', sub: 'Kasya pa, Boss!'}} />
		))}
	</>
);
