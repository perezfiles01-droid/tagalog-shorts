import React from 'react';
import {Composition} from 'remotion';
import {Alarm, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="Alarm" component={Alarm} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Alarm} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S7', t: 12.0},
			{id: 'ThumbB', scene: 'S2', t: 4.0},
			{id: 'ThumbC', scene: 'S5', t: 6.5},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'What if nag-AWOL ang', gold: 'alarm clock?', sub: 'Huwag mo na siyang i-snooze'}} />
		))}
	</>
);
