import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Easing, interpolate} from 'remotion';

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// ---------- helpers ----------
export const ease = Easing.inOut(Easing.cubic);
export const lerp = (f: number, a: number, b: number, from: number[], to: number[], e = ease) =>
	interpolate(f, from, to, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e}) * (b - a) + a;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const smooth = (t: number, a: number, b: number) => ease(ramp(t, a, b));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const mixV = (a: number[], b: number[], k: number) => a.map((v, i) => mix(v, b[i], k)) as [number, number, number];
export const rand = (seed: number) => {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
};

// ---------- palette (muted, low-poly toy look) ----------
export const C = {
	skin: ['#c8946a', '#b07d55', '#d9a77c', '#9c6b47'],
	hair: '#2b211c',
	shirts: ['#5f7f8a', '#8a6f8f', '#7d9a6b', '#c27b4f', '#d9c9a3', '#4f6a8f', '#a85d5d', '#6f8f86', '#d8d4cc'],
	pants: ['#3b4252', '#4a4f5e', '#5b5246', '#2f3a45'],
	leaf: '#6f9a4a',
	leafDark: '#4f7a38',
	gold: '#d8a93f',
	mud: '#7a6a52',
	water: '#9fb4a8',
};

// ---------- camera ----------
export const Cam: React.FC<{pos: number[]; look: number[]; fov?: number; near?: number; far?: number}> = ({pos, look, fov = 40, near = 0.1, far = 2000}) => {
	const {camera} = useThree();
	useLayoutEffect(() => {
		const c = camera as THREE.PerspectiveCamera;
		c.position.set(pos[0], pos[1], pos[2]);
		c.fov = fov;
		c.near = near;
		c.far = far;
		c.lookAt(look[0], look[1], look[2]);
		c.updateProjectionMatrix();
	});
	return null;
};

// ---------- materials ----------
const matCache = new Map<string, THREE.MeshStandardMaterial>();
export const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
	const key = color + JSON.stringify(opts);
	let m = matCache.get(key);
	if (!m) {
		m = new THREE.MeshStandardMaterial({color, roughness: 0.85, metalness: 0, flatShading: true, ...opts});
		matCache.set(key, m);
	}
	return m;
};

// ---------- sky dome with vertical gradient ----------
export const Sky: React.FC<{top: string; bottom: string; radius?: number}> = ({top, bottom, radius = 900}) => {
	const geo = useMemo(() => {
		const g = new THREE.SphereGeometry(radius, 24, 16);
		const t = new THREE.Color(top), b = new THREE.Color(bottom);
		const cols: number[] = [];
		const p = g.attributes.position;
		for (let i = 0; i < p.count; i++) {
			const k = clamp01((p.getY(i) / radius) * 1.6 + 0.15);
			const c = b.clone().lerp(t, Math.pow(k, 0.8));
			cols.push(c.r, c.g, c.b);
		}
		g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
		return g;
	}, [top, bottom, radius]);
	return (
		<mesh geometry={geo}>
			<meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
		</mesh>
	);
};

// ---------- toy person ----------
export type Pose = {
	armL?: number; // shoulder pitch, radians (negative = forward/up)
	armR?: number;
	spreadL?: number; // outward roll
	spreadR?: number;
	elbow?: number;
	leg?: number; // walking swing
	bend?: number; // torso pitch forward
	sit?: boolean;
	headTurn?: number;
	bob?: number;
};

export const Person: React.FC<{
	position?: number[];
	rotationY?: number;
	scale?: number;
	seed?: number;
	shirt?: string;
	pants?: string;
	hat?: boolean;
	pose?: Pose;
	children?: React.ReactNode; // attached to the hands (e.g. a sack)
	mouth?: boolean;
}> = ({position = [0, 0, 0], rotationY = 0, scale = 1, seed = 1, shirt, pants, hat, pose = {}, children, mouth}) => {
	const r = rand(seed * 7919);
	const skin = C.skin[Math.floor(r() * C.skin.length)];
	const sh = shirt ?? C.shirts[Math.floor(r() * C.shirts.length)];
	const pa = pants ?? C.pants[Math.floor(r() * C.pants.length)];
	const longHair = r() > 0.55;
	const {armL = 0.1, armR = 0.1, spreadL = 0.12, spreadR = 0.12, elbow = 0, leg = 0, bend = 0, sit = false, headTurn = 0, bob = 0} = pose;
	const hipY = sit ? 0.48 : 0.86;
	const skinM = mat(skin), shirtM = mat(sh), pantsM = mat(pa);
	const Leg = ({x, a}: {x: number; a: number}) => (
		<group position={[x, hipY, 0]} rotation={[sit ? -Math.PI / 2 : a, 0, 0]}>
			<mesh position={[0, -0.4, 0]} material={pantsM}>
				<cylinderGeometry args={[0.1, 0.085, 0.8, 7]} />
			</mesh>
			<mesh position={[0, -0.82, 0.06]} material={mat('#f2f0ea')}>
				<boxGeometry args={[0.17, 0.09, 0.3]} />
			</mesh>
		</group>
	);
	const Arm = ({side, a, s}: {side: number; a: number; s: number}) => (
		<group position={[side * 0.29, 0.5, 0]} rotation={[a, 0, side * s]}>
			<mesh position={[0, -0.24, 0]} material={shirtM}>
				<capsuleGeometry args={[0.065, 0.22, 3, 7]} />
			</mesh>
			<group position={[0, -0.42, 0]} rotation={[elbow, 0, 0]}>
				<mesh position={[0, -0.13, 0]} material={skinM}>
					<capsuleGeometry args={[0.055, 0.18, 3, 7]} />
				</mesh>
				<mesh position={[0, -0.3, 0]} material={skinM}>
					<sphereGeometry args={[0.075, 8, 6]} />
				</mesh>
				{side > 0 && children ? <group position={[-0.29, -0.36, 0.08]}>{children}</group> : null}
			</group>
		</group>
	);
	return (
		<group position={[position[0], position[1] + bob, position[2]]} rotation={[0, rotationY, 0]} scale={scale}>
			<mesh position={[0, 0.015 - bob, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#000000', {transparent: true, opacity: 0.18, depthWrite: false})}>
				<circleGeometry args={[0.38, 14]} />
			</mesh>
			<Leg x={-0.12} a={leg} />
			<Leg x={0.12} a={-leg} />
			{sit ? (
				<mesh position={[0, hipY - 0.02, 0.2]} material={pantsM}>
					<boxGeometry args={[0.42, 0.18, 0.45]} />
				</mesh>
			) : null}
			<group position={[0, hipY, 0]} rotation={[bend, 0, 0]}>
				<mesh position={[0, 0.32, 0]} material={shirtM}>
					<capsuleGeometry args={[0.24, 0.32, 4, 9]} />
				</mesh>
				<Arm side={-1} a={armL} s={spreadL} />
				<Arm side={1} a={armR} s={spreadR} />
				<group position={[0, 0.9, 0]} rotation={[0, headTurn, 0]}>
					<mesh material={skinM}>
						<sphereGeometry args={[0.22, 12, 9]} />
					</mesh>
					<mesh position={[0, 0.05, -0.03]} scale={[1.06, longHair ? 1.0 : 0.82, 1.04]} material={mat(C.hair)}>
						<sphereGeometry args={[0.22, 12, 9, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
					</mesh>
					{longHair ? (
						<mesh position={[0, -0.08, -0.1]} material={mat(C.hair)}>
							<boxGeometry args={[0.4, 0.3, 0.22]} />
						</mesh>
					) : null}
					{[-1, 1].map((s) => (
						<React.Fragment key={s}>
							<mesh position={[s * 0.075, 0.02, 0.2]} material={mat('#1d1a18')}>
								<sphereGeometry args={[0.028, 6, 5]} />
							</mesh>
							<mesh position={[s * 0.13, -0.05, 0.17]} material={mat('#e08a7a', {transparent: true, opacity: 0.6})}>
								<sphereGeometry args={[0.035, 6, 5]} />
							</mesh>
						</React.Fragment>
					))}
					{mouth ? (
						<mesh position={[0, -0.09, 0.2]} material={mat('#4a2a26')}>
							<sphereGeometry args={[0.03, 6, 5]} />
						</mesh>
					) : null}
					{hat ? (
						<mesh position={[0, 0.2, 0]} material={mat('#c9a96b')}>
							<coneGeometry args={[0.42, 0.22, 10]} />
						</mesh>
					) : null}
				</group>
			</group>
		</group>
	);
};

// walking pose helper
export const walk = (t: number, speed = 1, phase = 0): Pose => {
	const s = Math.sin((t * speed + phase) * Math.PI * 2);
	return {leg: s * 0.45, armL: -s * 0.4, armR: s * 0.4, bob: Math.abs(s) * 0.03};
};

// ---------- terraces: stepped partial rings on a hill ----------
export const TerraceHill: React.FC<{
	position?: number[];
	radius?: number;
	tiers?: number;
	step?: number;
	arc?: number;
	start?: number;
	gold?: number; // 0 green -> 1 gold
	water?: number; // opacity of flooded paddies
	seed?: number;
}> = ({position = [0, 0, 0], radius = 16, tiers = 12, step = 0.7, arc = Math.PI * 1.4, start = 0, gold = 0, water = 0.5, seed = 3}) => {
	const r = rand(seed);
	const greens = ['#7aa356', '#6f9a4a', '#86ad5e', '#8fb365'];
	return (
		<group position={position as [number, number, number]}>
			{Array.from({length: tiers}).map((_, i) => {
				const rad = radius * (1 - i / (tiers + 1.5));
				const g = new THREE.Color(greens[Math.floor(r() * greens.length)]).lerp(new THREE.Color(C.gold), gold);
				return (
					<group key={i} position={[0, i * step, 0]}>
						<mesh position={[0, step / 2, 0]} material={mat('#' + g.getHexString())}>
							<cylinderGeometry args={[rad, rad + step * 0.35, step, 36, 1, false, start, arc]} />
						</mesh>
						{water > 0 ? (
							<mesh position={[0, step + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#c9dcd6', {transparent: true, opacity: water, roughness: 0.25, metalness: 0.1})}>
								<ringGeometry args={[rad - (radius / (tiers + 1.5)) * 0.95, rad - 0.15, 36, 1, start - Math.PI / 2, arc]} />
							</mesh>
						) : null}
					</group>
				);
			})}
			<mesh position={[0, tiers * step + 1.2, 0]} material={mat('#5d8a45')}>
				<coneGeometry args={[radius * (1 - tiers / (tiers + 1.5)) + 0.5, 2.6, 9]} />
			</mesh>
		</group>
	);
};

export const Mountain: React.FC<{position: number[]; r: number; h: number; color?: string; seed?: number}> = ({position, r, h, color = '#6d8a6a', seed = 1}) => (
	<mesh position={[position[0], position[1] + h / 2, position[2]]} rotation={[0, seed, 0]} material={mat(color)}>
		<coneGeometry args={[r, h, 7, 2]} />
	</mesh>
);

export const Tree: React.FC<{position: number[]; s?: number; color?: string}> = ({position, s = 1, color = C.leafDark}) => (
	<group position={position as [number, number, number]} scale={s}>
		<mesh position={[0, 0.5, 0]} material={mat('#6b5040')}>
			<cylinderGeometry args={[0.12, 0.16, 1, 6]} />
		</mesh>
		<mesh position={[0, 1.6, 0]} material={mat(color)}>
			<icosahedronGeometry args={[0.9, 0]} />
		</mesh>
	</group>
);

export const Cloud: React.FC<{position: number[]; s?: number; opacity?: number; seed?: number}> = ({position, s = 1, opacity = 0.95, seed = 1}) => {
	const r = rand(seed);
	const parts = useMemo(() => Array.from({length: 6}).map(() => [(r() - 0.5) * 4, (r() - 0.5) * 0.8, (r() - 0.5) * 2, 0.9 + r() * 1.2]), [seed]);
	const m = mat('#ffffff', {transparent: true, opacity, roughness: 1});
	return (
		<group position={position as [number, number, number]} scale={s}>
			{parts.map((p, i) => (
				<mesh key={i} position={[p[0], p[1], p[2]]} scale={p[3]} material={m}>
					<icosahedronGeometry args={[1, 0]} />
				</mesh>
			))}
		</group>
	);
};

// rice stalk: thin stem + drooping head
export const Stalk: React.FC<{position: number[]; h?: number; color: string; sway?: number; head?: boolean}> = ({position, h = 1.1, color, sway = 0, head = true}) => (
	<group position={position as [number, number, number]} rotation={[sway, 0, sway * 0.5]}>
		<mesh position={[0, h / 2, 0]} material={mat(color)}>
			<cylinderGeometry args={[0.012, 0.02, h, 4]} />
		</mesh>
		{head ? (
			<mesh position={[0.05, h - 0.05, 0]} rotation={[0, 0, -0.9]} material={mat(color)}>
				<coneGeometry args={[0.04, 0.3, 5]} />
			</mesh>
		) : null}
	</group>
);
