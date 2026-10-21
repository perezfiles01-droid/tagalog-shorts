import React from 'react';
import {Composition} from 'remotion';
import {Buwan, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="Buwan" component={Buwan} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Buwan} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S1', t: 4.3},
			{id: 'ThumbB', scene: 'S3', t: 13.9},
			{id: 'ThumbC', scene: 'S6', t: 4.5},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'Paano kung sumabog ang', gold: 'buwan?', sub: 'Ang mangyayari, oras-oras'}} />
		))}
	</>
);
