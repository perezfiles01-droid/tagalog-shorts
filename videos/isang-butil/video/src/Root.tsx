import React from 'react';
import {Composition} from 'remotion';
import {IsangButil, TOTAL} from './Video';
import {FPS, H, W} from './kit';

export const Root: React.FC = () => (
	<>
		<Composition id="IsangButil" component={IsangButil} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={IsangButil} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
	</>
);
