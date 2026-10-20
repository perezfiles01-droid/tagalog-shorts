import React from 'react';
import {Composition} from 'remotion';
import {TupperwareNiNanay, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {BenchFlat, BenchGL} from './Bench';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="TupperwareNiNanay" component={TupperwareNiNanay} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={TupperwareNiNanay} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		<Composition id="BenchFlat" component={BenchFlat} durationInFrames={60} fps={FPS} width={W} height={H} />
		<Composition id="BenchGL" component={BenchGL} durationInFrames={60} fps={FPS} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S1', t: 12.2},
			{id: 'ThumbB', scene: 'S4', t: 6.2},
			{id: 'ThumbC', scene: 'S7', t: 10.5},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'Ang Tupperware ni', gold: 'Nanay', sub: 'Laging may daan pauwi'}} />
		))}
	</>
);
