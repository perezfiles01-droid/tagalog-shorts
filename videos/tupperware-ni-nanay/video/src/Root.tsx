import React from 'react';
import {Composition} from 'remotion';
import {TupperwareNiNanay, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {BenchFlat, BenchGL} from './Bench';

export const Root: React.FC = () => (
	<>
		<Composition id="TupperwareNiNanay" component={TupperwareNiNanay} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={TupperwareNiNanay} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		<Composition id="BenchFlat" component={BenchFlat} durationInFrames={60} fps={FPS} width={W} height={H} />
		<Composition id="BenchGL" component={BenchGL} durationInFrames={60} fps={FPS} width={W} height={H} />
	</>
);
