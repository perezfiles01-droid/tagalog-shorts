import React from 'react';
import {Composition} from 'remotion';
import {Utot, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="Utot" component={Utot} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Utot} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S4', t: 4.6},
			{id: 'ThumbB', scene: 'S1', t: 3.0},
			{id: 'ThumbC', scene: 'S6', t: 12.0},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'Bakit mabaho ang', gold: 'utot?', sub: 'Ang sagot ng siyensya'}} />
		))}
	</>
);
