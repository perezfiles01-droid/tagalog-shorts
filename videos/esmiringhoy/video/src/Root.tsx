import React from 'react';
import {Composition} from 'remotion';
import {Esmiringhoy, TOTAL} from './Video';
import {FPS, H, W} from './kit';

export const Root: React.FC = () => (
	<>
		<Composition id="Esmiringhoy" component={Esmiringhoy} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={Esmiringhoy} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
	</>
);
