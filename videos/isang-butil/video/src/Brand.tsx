import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {S1, S2, S3, S4} from './scenesA';
import {S5, S6, S7, S8} from './scenesB';

const SCENES: Record<string, React.FC<{t: number}>> = {S1, S2, S3, S4, S5, S6, S7, S8};

// Page branding stills: render an existing scene at a fixed moment
export const SceneStill: React.FC<{scene: string; t: number; width: number; height: number}> = ({scene, t, width, height}) => {
	const S = SCENES[scene];
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<ThreeCanvas width={width} height={height} gl={{antialias: true}} dpr={1}>
				<S t={t} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// profile picture: a toy farmer in a salakot, holding a rice bundle
import {Cam, Person, Sky, mat} from './kit';
export const Portrait: React.FC = () => (
	<AbsoluteFill>
		<ThreeCanvas width={1080} height={1080} gl={{antialias: true}} dpr={1}>
			<Cam pos={[0.45, 1.8, 2.5]} look={[0, 1.66, 0]} fov={30} />
			<Sky top="#e6a565" bottom="#f8dcaa" />
			<hemisphereLight args={['#fbe2bd', '#6a5532', 1.3]} />
			<directionalLight position={[2, 4, 3]} intensity={2.4} color="#ffd6a0" />
			<Person seed={61} hat rotationY={0.25} shirt="#5f7f8a" pose={{armR: 0.05, armL: 0.05}} />
		</ThreeCanvas>
	</AbsoluteFill>
);

// channel-wide branding (not tied to one video)
import {Mountain, TerraceHill, Tree} from './kit';
import {Jeepney} from './scenesB';

export const Mascot: React.FC<{hat?: boolean}> = ({hat = false}) => (
	<AbsoluteFill>
		<ThreeCanvas width={1080} height={1080} gl={{antialias: true}} dpr={1}>
			<Cam pos={[0.45, 1.8, 2.5]} look={[0, 1.66, 0]} fov={30} />
			<Sky top="#e6a565" bottom="#f8dcaa" />
			<hemisphereLight args={['#fbe2bd', '#6a5532', 1.3]} />
			<directionalLight position={[2, 4, 3]} intensity={2.4} color="#ffd6a0" />
			<Person seed={61} hat={hat} rotationY={0.25} shirt="#ece3cf" pose={{armR: 0.05, armL: 0.05}} />
		</ThreeCanvas>
	</AbsoluteFill>
);

const BahayKubo: React.FC<{position: number[]}> = ({position}) => (
	<group position={position as [number, number, number]}>
		{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
			<mesh key={i} position={[x * 1.1, 0.5, z * 0.9]} material={mat('#6e4a30')}>
				<cylinderGeometry args={[0.08, 0.08, 1, 5]} />
			</mesh>
		))}
		<mesh position={[0, 1.6, 0]} material={mat('#b9946a')}>
			<boxGeometry args={[2.4, 1.3, 2]} />
		</mesh>
		<mesh position={[0, 2.9, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.25, 1, 1]} material={mat('#8a6a3e')}>
			<coneGeometry args={[2.1, 1.6, 4]} />
		</mesh>
	</group>
);

export const ChannelCover: React.FC = () => {
	const people = [
		{seed: 61, hat: true, shirt: '#5f7f8a'}, // magsasaka
		{seed: 12, shirt: '#a85d5d'}, // tindera
		{seed: 23, shirt: '#ece3cf'}, // storyteller
		{seed: 34, shirt: '#4f6a8f'}, // estudyante
		{seed: 45, shirt: '#8a6f8f'}, // lola
		{seed: 56, shirt: '#c27b4f'}, // mangingisda
	];
	return (
		<AbsoluteFill>
			<ThreeCanvas width={1640} height={624} gl={{antialias: true}} dpr={1}>
				<Cam pos={[0, 2.3, 10.5]} look={[0, 1.7, 0]} fov={34} far={1500} />
				<Sky top="#e6a565" bottom="#f8d7a4" />
				<fog attach="fog" args={['#f4d2a0', 18, 120]} />
				<hemisphereLight args={['#fbe2bd', '#5a5236', 1.25]} />
				<directionalLight position={[-20, 14, 12]} intensity={2.5} color="#ffc68f" />
				<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#8fa860')}>
					<planeGeometry args={[400, 400]} />
				</mesh>
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]} material={mat('#b39a70')}>
					<planeGeometry args={[40, 4]} />
				</mesh>
				{/* left: terraces & mountains; centre: bahay kubo; right: jeepney & city */}
				<TerraceHill position={[-17, 0, -14]} radius={9} tiers={9} step={0.8} arc={Math.PI * 2} water={0.4} seed={3} />
				<Mountain position={[-30, 0, -45]} r={22} h={26} color="#8e9f97" />
				<Mountain position={[-6, 0, -60]} r={26} h={22} color="#98a59c" seed={2} />
				<BahayKubo position={[-6.5, 0, -4]} />
				{[[-9.5, -2], [-3.6, -5], [3.2, -7], [9.5, -9]].map((p, i) => (
					<Tree key={i} position={[p[0], 0, p[1]]} s={1.3} />
				))}
				<Jeepney position={[7.5, 0, -2.5]} rotationY={-1.2} />
				{Array.from({length: 9}).map((_, i) => {
					const h = 5 + ((i * 37) % 9);
					return (
						<mesh key={i} position={[13 + i * 3.1, h / 2, -16 - (i % 3) * 3]} material={mat(['#cfc3ad', '#b7b1a6', '#d8cdb8'][i % 3])}>
							<boxGeometry args={[2.6, h, 2.6]} />
						</mesh>
					);
				})}
				{/* the sea on the far right */}
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0.02, -30]} material={mat('#6f9fb8', {roughness: 0.4})}>
					<planeGeometry args={[40, 60]} />
				</mesh>
				{people.map((p, i) => (
					<Person key={i} seed={p.seed} hat={p.hat} shirt={p.shirt} position={[(i - 2.5) * 1.15, 0, 2]} rotationY={(i - 2.5) * -0.08} scale={i === 4 ? 0.92 : 1} pose={{armL: 0.05, armR: i === 2 ? -2.6 : 0.05, spreadR: i === 2 ? 0.4 : 0.12}} />
				))}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
