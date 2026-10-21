import React from 'react';
import {Composition} from 'remotion';
import {ElectricFan, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="ElectricFan" component={ElectricFan} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={ElectricFan} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		{[
			{id: 'ThumbA', scene: 'S1', t: 10.0},
			{id: 'ThumbB', scene: 'S2', t: 2.6},
			{id: 'ThumbC', scene: 'S5', t: 6.0},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'What if napapagod din ang', gold: 'electric fan?', sub: 'Kapag nag-silent quitting ang bentilador'}} />
		))}
	</>
);
