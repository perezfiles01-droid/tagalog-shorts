import React from 'react';
import {Composition} from 'remotion';
import {Hampaslupa, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="Hampaslupa" component={Hampaslupa} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Hampaslupa} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S1', t: 5.8},
			{id: 'ThumbB', scene: 'S6', t: 12.7},
			{id: 'ThumbC', scene: 'S5', t: 8.5},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'Isa ka bang', gold: 'hampaslupa?', sub: 'Ano nga ba ang basehan?'}} />
		))}
	</>
);
