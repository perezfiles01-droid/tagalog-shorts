import React from 'react';
import {Composition} from 'remotion';
import {Tae, TOTAL} from './Video';
import {FPS, H, W} from './kit';

export const Root: React.FC = () => (
	<>
		<Composition id="Tae" component={Tae} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Tae} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
	</>
);
