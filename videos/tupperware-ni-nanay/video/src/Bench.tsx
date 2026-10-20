import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';

// render-pipeline benchmarks (no scene content)
export const BenchFlat: React.FC = () => <AbsoluteFill style={{backgroundColor: `hsl(${useCurrentFrame() * 3}, 40%, 50%)`}} />;
export const BenchGL: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<ThreeCanvas width={1080} height={1920} dpr={1}>
				<color attach="background" args={[`hsl(${f * 3}, 40%, 50%)`]} />
				<mesh rotation={[f * 0.05, f * 0.03, 0]}>
					<boxGeometry args={[1, 1, 1]} />
					<meshNormalMaterial />
				</mesh>
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
