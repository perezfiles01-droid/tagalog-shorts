import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Cam, Person, Pose, mat, mix, mixV, rand, ramp, smooth, walk} from './kit';
import {Jeepney} from './scenesB';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------- props ----------
// a cartoon "pfft": a little green cloud that puffs out and drifts up
export const Puff: React.FC<{position: number[]; k: number; s?: number}> = ({position, k, s = 1}) => {
	if (k <= 0 || k >= 1) return null;
	const parts = [[0, 0, 0, 1], [0.18, 0.08, 0.05, 0.8], [-0.16, 0.1, -0.04, 0.75], [0.05, 0.2, 0.08, 0.7], [-0.05, -0.08, 0.1, 0.6]];
	return (
		<group position={[position[0], position[1] + k * 0.5, position[2]]} scale={s * (0.3 + k * 1.1)}>
			{parts.map((p, i) => (
				<mesh key={i} position={[p[0], p[1], p[2]]} scale={p[3] * 0.18}>
					<icosahedronGeometry args={[1, 1]} />
					<meshStandardMaterial color="#b8d86a" transparent opacity={0.75 * Math.sin(Math.PI * k)} flatShading depthWrite={false} />
				</mesh>
			))}
		</group>
	);
};

const Dog: React.FC<{position: number[]; rotationY?: number; tilt?: number; tail?: number}> = ({position, rotationY = 0, tilt = 0, tail = 0}) => {
	const m = mat('#c99a5e');
	return (
		<group position={position as V} rotation={[0, rotationY, 0]}>
			<mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={m}>
				<capsuleGeometry args={[0.18, 0.4, 3, 8]} />
			</mesh>
			{[[-0.11, 0.22], [0.11, 0.22], [-0.11, -0.22], [0.11, -0.22]].map(([x, z], i) => (
				<mesh key={i} position={[x, 0.15, z]} material={m}>
					<cylinderGeometry args={[0.05, 0.05, 0.3, 5]} />
				</mesh>
			))}
			<group position={[0, 0.65, 0.36]} rotation={[0, 0, tilt]}>
				<mesh material={m}>
					<sphereGeometry args={[0.17, 10, 8]} />
				</mesh>
				<mesh position={[0, -0.05, 0.15]} material={mat('#e8c89a')}>
					<sphereGeometry args={[0.09, 8, 6]} />
				</mesh>
				<mesh position={[0, -0.02, 0.24]} material={mat('#1d1a18')}>
					<sphereGeometry args={[0.03, 6, 5]} />
				</mesh>
				{[-1, 1].map((s) => (
					<React.Fragment key={s}>
						<mesh position={[s * 0.07, 0.05, 0.14]} material={mat('#1d1a18')}>
							<sphereGeometry args={[0.022, 6, 5]} />
						</mesh>
						<mesh position={[s * 0.16, -0.02, 0]} rotation={[0, 0, s * 0.3]} material={mat('#8a5a32')}>
							<boxGeometry args={[0.05, 0.2, 0.12]} />
						</mesh>
					</React.Fragment>
				))}
			</group>
			<mesh position={[0, 0.55, -0.4]} rotation={[-0.8, Math.sin(tail * 12) * 0.5, 0]} material={m}>
				<cylinderGeometry args={[0.025, 0.035, 0.3, 5]} />
			</mesh>
		</group>
	);
};

const LivingRoom: React.FC = () => (
	<>
		<color attach="background" args={['#221d1a']} />
		<hemisphereLight args={['#ffe7c7', '#3a2e24', 1.0]} />
		<pointLight position={[0, 2.7, 0.8]} intensity={12} distance={9} decay={2} color="#ffcf8f" />
		<directionalLight position={[2, 4, 5]} intensity={1.2} color="#fff2d6" />
		<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#9a7656')}>
			<planeGeometry args={[12, 12]} />
		</mesh>
		<mesh position={[0, 1.6, -2]} material={mat('#d9c8ae')}>
			<boxGeometry args={[12, 3.2, 0.1]} />
		</mesh>
		<mesh position={[1.9, 1.9, -1.94]} material={mat('#3a4466', {emissive: '#3a4466', emissiveIntensity: 0.4})}>
			<boxGeometry args={[1.2, 0.9, 0.02]} />
		</mesh>
		{/* sofa */}
		<mesh position={[0, 0.25, -1.2]} material={mat('#6f8f86')}>
			<boxGeometry args={[2.4, 0.5, 0.9]} />
		</mesh>
		<mesh position={[0, 0.75, -1.6]} material={mat('#6f8f86')}>
			<boxGeometry args={[2.4, 0.7, 0.2]} />
		</mesh>
		{[-1.25, 1.25].map((x) => (
			<mesh key={x} position={[x, 0.45, -1.2]} material={mat('#5f7f76')}>
				<boxGeometry args={[0.2, 0.5, 0.9]} />
			</mesh>
		))}
	</>
);

const Newspaper: React.FC<{fan?: number}> = ({fan = 0}) => (
	<group rotation={[0, 0, fan]}>
		{[-1, 1].map((s) => (
			<mesh key={s} position={[s * 0.17, 0.05, 0.1]} rotation={[0, s * -0.25, 0]} material={mat('#e9e4d6')}>
				<boxGeometry args={[0.34, 0.46, 0.01]} />
			</mesh>
		))}
	</group>
);

// Lolo on the sofa, the family, and the dog everyone blames
const Family: React.FC<{t: number; puffAt: number; look: number; laugh?: number; fan?: number; eyes?: number}> = ({t, puffAt, look, laugh = 0, fan = 0, eyes = 0}) => {
	const freeze = t > puffAt + 0.3;
	const bob = (i: number) => laugh * Math.abs(Math.sin(t * 9 + i)) * 0.05;
	const lolo: Pose = fan > 0 ? {sit: true, armL: -0.9, armR: -2.0 + Math.sin(t * 12) * 0.5, elbow: -0.4, bob: bob(0)} : {sit: true, armL: -1.25, armR: -1.25, elbow: -0.9, bob: bob(0)};
	return (
		<>
			<Person seed={1001} shirt="#d8d4cc" hairColor="#c9c4bc" position={[-0.3, 0.06, -1.15]} pose={lolo} mouth={laugh > 0.5}>
				{fan > 0 ? <Newspaper fan={Math.sin(t * 12) * 0.4} /> : null}
			</Person>
			{fan <= 0 ? (
				<group position={[-0.3, 1.18, -0.62]} scale={[1, 1 + eyes * 0.15, 1]}>
					<Newspaper />
				</group>
			) : null}
			{eyes > 0 ? (
				// Lolo peeks over the paper, wide-eyed
				[-1, 1].map((s) => (
					<mesh key={s} position={[-0.3 + s * 0.075, 1.58, -0.94]} scale={1 + eyes * 0.8} material={mat('#ffffff')}>
						<sphereGeometry args={[0.035, 8, 6]} />
					</mesh>
				))
			) : null}
			<Person seed={1002} shirt="#c9503f" longHair position={[0.8, 0.06, -1.15]} rotationY={freeze ? -0.3 * (1 - look) + look * 0.9 : 0} pose={{sit: true, armL: -1.0, armR: -1.0, elbow: -0.8, headTurn: freeze ? -0.6 * (1 - look) + look * 0.7 : 0, bob: bob(1)}} mouth={laugh > 0.5} />
			<Person seed={1003} shirt="#d9b44a" scale={0.72} position={[1.05, 0, 0.35]} rotationY={-0.6 + look * 0.9} pose={{armL: freeze ? -0.3 : 0.05, armR: freeze ? -1.6 * (1 - look) : 0.05, headTurn: look * 0.4, bob: bob(2)}} mouth={laugh > 0.5} />
			<Dog position={[-0.95, 0, 0.55]} rotationY={0.5} tilt={look > 0.5 ? Math.sin(t * 2) * 0.25 : 0} tail={laugh > 0 ? t : 0} />
		</>
	);
};

// glowing tunnel of the intestines (rings along -z)
const Tunnel: React.FC<{len?: number; color?: string; r?: number}> = ({len = 60, color = '#d9707a', r = 2.2}) => {
	const rings = useMemo(() => Array.from({length: Math.floor(len / 1.2)}).map((_, i) => i * 1.2), [len]);
	return (
		<>
			<color attach="background" args={['#2a0f16']} />
			<fog attach="fog" args={['#3a1520', 4, 26]} />
			<hemisphereLight args={['#ffc0c8', '#401018', 1.1]} />
			<pointLight position={[0, 0, 2]} intensity={10} distance={16} color="#ffb0a0" />
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -len / 2]} material={mat(color, {side: 1})}>
				<cylinderGeometry args={[r, r, len, 14, 1, true]} />
			</mesh>
			{rings.map((z, i) => (
				<mesh key={i} position={[0, 0, -z]} material={mat(i % 2 ? '#c95f6c' : '#e88a92')}>
					<torusGeometry args={[r - 0.05, 0.16, 5, 14]} />
				</mesh>
			))}
		</>
	);
};

const Food: React.FC<{position: number[]; kind: 'rice' | 'egg' | 'cabbage' | 'meat' | 'broccoli'; s?: number; spin?: number}> = ({position, kind, s = 1, spin = 0}) => (
	<group position={position as V} scale={s} rotation={[spin, spin * 0.7, 0]}>
		{kind === 'rice' ? (
			<mesh scale={[0.06, 0.12, 0.06]} material={mat('#fbfaf5')}>
				<sphereGeometry args={[1, 8, 6]} />
			</mesh>
		) : kind === 'egg' ? (
			<>
				<mesh scale={[0.32, 0.08, 0.32]} material={mat('#f8f6ee')}>
					<sphereGeometry args={[1, 12, 8]} />
				</mesh>
				<mesh position={[0, 0.06, 0]} material={mat('#f2b42a')}>
					<sphereGeometry args={[0.12, 10, 8]} />
				</mesh>
			</>
		) : kind === 'cabbage' ? (
			<mesh material={mat('#9cc46a')}>
				<icosahedronGeometry args={[0.28, 1]} />
			</mesh>
		) : kind === 'meat' ? (
			<mesh rotation={[0, 0, 0.4]} material={mat('#9a4a3a')}>
				<boxGeometry args={[0.4, 0.18, 0.28]} />
			</mesh>
		) : (
			<>
				<mesh position={[0, -0.12, 0]} material={mat('#7fb05a')}>
					<cylinderGeometry args={[0.05, 0.06, 0.25, 6]} />
				</mesh>
				<mesh position={[0, 0.06, 0]} material={mat('#4f8a3a')}>
					<icosahedronGeometry args={[0.16, 1]} />
				</mesh>
			</>
		)}
	</group>
);

const Bacterium: React.FC<{position: number[]; color: string; t: number; seed: number; s?: number}> = ({position, color, t, seed, s = 1}) => {
	const chew = Math.abs(Math.sin(t * 6 + seed));
	return (
		<group position={position as V} scale={s * (1 + Math.sin(t * 3 + seed) * 0.05)} rotation={[0, Math.sin(seed) * 0.6, 0]}>
			<mesh material={mat(color)}>
				<icosahedronGeometry args={[0.22, 1]} />
			</mesh>
			{[-1, 1].map((k) => (
				<mesh key={k} position={[k * 0.08, 0.06, 0.19]} material={mat('#ffffff')}>
					<sphereGeometry args={[0.045, 6, 5]} />
				</mesh>
			))}
			{[-1, 1].map((k) => (
				<mesh key={'p' + k} position={[k * 0.08, 0.06, 0.23]} material={mat('#1d1a18')}>
					<sphereGeometry args={[0.022, 5, 4]} />
				</mesh>
			))}
			<mesh position={[0, -0.07, 0.2]} scale={[1, 0.3 + chew * 0.9, 1]} material={mat('#5a1a22')}>
				<sphereGeometry args={[0.05, 6, 5]} />
			</mesh>
		</group>
	);
};

const Bubble: React.FC<{position: number[]; r: number; stinky?: boolean; t?: number}> = ({position, r, stinky = false, t = 0}) => (
	<group position={position as V}>
		<mesh>
			<sphereGeometry args={[r, 12, 9]} />
			<meshStandardMaterial color={stinky ? '#c9d84a' : '#cfe8f2'} transparent opacity={stinky ? 0.85 : 0.35} roughness={0.2} flatShading depthWrite={false} emissive={stinky ? '#8a9a10' : '#000000'} emissiveIntensity={stinky ? 0.4 : 0} />
		</mesh>
		{stinky ? (
			<>
				{/* angry brows + eyes */}
				{[-1, 1].map((k) => (
					<React.Fragment key={k}>
						<mesh position={[k * r * 0.35, r * 0.2, r * 0.92]} material={mat('#1d1a18')}>
							<sphereGeometry args={[r * 0.1, 6, 5]} />
						</mesh>
						<mesh position={[k * r * 0.35, r * 0.42, r * 0.85]} rotation={[0, 0, k * 0.5]} material={mat('#1d1a18')}>
							<boxGeometry args={[r * 0.35, r * 0.07, r * 0.05]} />
						</mesh>
					</React.Fragment>
				))}
				{/* wavy stink lines */}
				{[-1, 0, 1].map((k) => (
					<mesh key={'s' + k} position={[k * r * 0.5, r * 1.5 + Math.sin(t * 4 + k) * 0.05, 0]} rotation={[0, 0, Math.PI / 2 + Math.sin(t * 3 + k) * 0.3]}>
						<torusGeometry args={[r * 0.3, r * 0.04, 4, 10, Math.PI * 1.4]} />
						<meshStandardMaterial color="#b8c85a" transparent opacity={0.8} flatShading depthWrite={false} />
					</mesh>
				))}
			</>
		) : null}
	</group>
);

// ================= S1: "Mabaho ba ang utot mo?" =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const puffAt = 1.6;
	const look = smooth(t, 6.0, 6.8);
	return (
		<>
			<Cam pos={[mix(0.3, 0.1, smooth(t, 0, 12)), 1.9, mix(5.0, 4.4, smooth(t, 0, 12))]} look={[0, 0.8, -0.6]} fov={50} />
			<LivingRoom />
			<Family t={t} puffAt={puffAt} look={look} />
			<Puff position={[-0.3, 0.45, -0.75]} k={ramp(t, puffAt, puffAt + 2.2)} />
		</>
	);
};

// ================= S2: dive into the tummy, food travels =================
export const S2: React.FC<{t: number}> = ({t}) => {
	const food = useMemo(() => {
		const r = rand(12);
		const kinds = ['rice', 'rice', 'egg', 'cabbage', 'rice', 'meat', 'rice', 'broccoli'] as const;
		return Array.from({length: 26}).map((_, i) => ({kind: kinds[i % kinds.length], x: (r() - 0.5) * 2.2, y: (r() - 0.5) * 2.0, z: -3 - i * 1.0, sp: r() * 6}));
	}, []);
	const inside = t > 2.2;
	if (!inside) {
		const z = smooth(t, 0, 2.2);
		return (
			<>
				<Cam pos={mixV([0.6, 1.5, 2.6], [-0.3, 0.95, -0.5], z)} look={[-0.3, 0.9, -1.1]} fov={mix(44, 30, z)} near={0.02} />
				<LivingRoom />
				<Family t={t + 12.5} puffAt={1.6} look={1} />
			</>
		);
	}
	const tt = t - 2.2;
	const camZ = -tt * 2.4;
	return (
		<>
			<Cam pos={[Math.sin(tt) * 0.2, Math.cos(tt * 0.7) * 0.15, camZ]} look={[Math.sin(tt + 0.5) * 0.3, 0, camZ - 5]} fov={60} near={0.05} />
			<Tunnel len={60} />
			{food.map((f, i) => (
				<Food key={i} position={[f.x, f.y + Math.sin(t + i) * 0.1, f.z + tt * 0.6]} kind={f.kind} spin={f.sp + t} s={1.4} />
			))}
		</>
	);
};

// ================= S3: trillions of bacteria munching =================
const BACT = ['#9b6fc8', '#6fb86a', '#e09a4a', '#5fa8c8', '#d96f8f'];
const Colony: React.FC<{t: number; n?: number; eat?: number; gas?: number}> = ({t, n = 46, eat = 1, gas = 1}) => {
	const pts = useMemo(() => {
		const r = rand(31);
		return Array.from({length: n}).map(() => {
			const a = r() * Math.PI * 2, rad = 1.3 + r() * 0.65;
			return [Math.cos(a) * rad, Math.sin(a) * rad, -2 - r() * 22, r()];
		});
	}, [n]);
	return (
		<>
			{pts.map((p, i) => (
				<React.Fragment key={i}>
					<Bacterium position={[p[0], p[1], p[2]]} color={BACT[i % BACT.length]} t={t} seed={i * 1.7} s={0.9 + p[3] * 0.6} />
					<Food position={[p[0] * 0.75, p[1] * 0.75, p[2] + 0.2]} kind={i % 3 === 0 ? 'cabbage' : 'rice'} s={Math.max(0, 1.2 - eat * (0.2 + p[3] * 0.9))} spin={i} />
					{[0, 1].map((b) => {
						const k = ((t * 0.45 + p[3] + b * 0.5) % 1);
						return gas > 0 ? <Bubble key={b} position={[p[0] * (0.9 - k * 0.5), p[1] * (0.9 - k * 0.5) + k * 0.4, p[2]]} r={0.06 + k * 0.08} /> : null;
					})}
				</React.Fragment>
			))}
		</>
	);
};
export const S3: React.FC<{t: number}> = ({t}) => {
	const z = -smooth(t, 0, 16) * 14;
	return (
		<>
			<Cam pos={[0.3, -0.2, 2 + z]} look={[-0.2, 0, -3 + z]} fov={58} near={0.05} />
			<Tunnel len={60} color="#c96a74" />
			<Colony t={t} eat={smooth(t, 2, 15)} />
		</>
	);
};

// ================= S4: the big balloon is coming (silent) =================
export const S4: React.FC<{t: number}> = ({t}) => {
	if (t > 5.4) {
		const k = smooth(t, 5.4, 6.4);
		return (
			<>
				<Cam pos={[-0.2, 1.45, mix(1.6, 0.95, k)]} look={[-0.3, 1.4, -1.0]} fov={36} near={0.02} />
				<LivingRoom />
				<Family t={t} puffAt={-10} look={0} eyes={k} />
			</>
		);
	}
	const grow = smooth(t, 0, 4.5);
	const wob = Math.sin(t * 8) * 0.06 * grow;
	return (
		<>
			<Cam pos={[0, 0, mix(1, -14, smooth(t, 0, 5.4))]} look={[0, 0, mix(-6, -22, smooth(t, 0, 5.4))]} fov={58} near={0.05} />
			<Tunnel len={60} />
			<group position={[0, 0, mix(-6, -20, smooth(t, 0, 5.4))]} scale={[1 + wob, 1 - wob, 1 + wob]}>
				<Bubble position={[0, 0, 0]} r={0.2 + grow * 1.3} stinky t={t} />
			</group>
		</>
	);
};

// ================= S5: inside the gas: mostly odorless =================
const GasCloud: React.FC<{t: number; stinkGlow?: number; stinkyOnly?: boolean}> = ({t, stinkGlow = 0, stinkyOnly = false}) => {
	const pts = useMemo(() => {
		const r = rand(51);
		return Array.from({length: 90}).map((_, i) => [(r() - 0.5) * 6, (r() - 0.5) * 7, -1 - r() * 7, 0.12 + r() * 0.2, i]);
	}, []);
	return (
		<>
			{pts.map((p, i) => {
				const stinky = i % 30 === 0;
				if (stinkyOnly && !stinky) return null;
				return <Bubble key={i} position={[p[0] + Math.sin(t * 0.6 + i) * 0.15, p[1] + Math.cos(t * 0.5 + i) * 0.15, p[2]]} r={stinky ? 0.32 + stinkGlow * 0.15 : p[3]} stinky={stinky} t={t} />;
			})}
		</>
	);
};
const GasRoom: React.FC = () => (
	<>
		<color attach="background" args={['#1a2a30']} />
		<fog attach="fog" args={['#1a2a30', 4, 16]} />
		<hemisphereLight args={['#dff4ff', '#203038', 1.2]} />
		<directionalLight position={[2, 4, 5]} intensity={1.4} color="#ffffff" />
	</>
);
export const S5: React.FC<{t: number}> = ({t}) => (
	<>
		<Cam pos={[Math.sin(t * 0.2) * 0.6, 0, mix(4, 2.5, smooth(t, 0, 12))]} look={[0, 0, -3]} fov={55} />
		<GasRoom />
		<GasCloud t={t} />
	</>
);
const Big: React.FC<{text: string; o: number; y: number; color?: string; size?: number; sub?: string}> = ({text, o, y, color = '#fff', size = 200, sub}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: y, opacity: o}}>
		<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, color, textShadow: '0 6px 30px rgba(0,0,0,0.6)', transform: `scale(${0.7 + 0.3 * o})`}}>{text}</div>
		{sub ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 64, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,0.7)', marginTop: -10}}>{sub}</div> : null}
	</AbsoluteFill>
);
export const O5: React.FC<{t: number}> = ({t}) => (
	<>
		<Big text="99%" sub="walang amoy" o={interpolate(t, [2.0, 2.6, 6.8, 7.4], [0, 1, 1, 0], clampI)} y={330} />
		<Big text="< 1%" sub="mabaho" color="#d6e34a" o={interpolate(t, [7.8, 8.4, 11.6, 12.0], [0, 1, 1, 0], clampI)} y={330} />
	</>
);

// ================= S6: the culprit: sulfur gases =================
const Nose: React.FC<{position: number[]; recoil: number}> = ({position, recoil}) => (
	<group position={[position[0], position[1], position[2] + recoil * 0.8]} rotation={[recoil * 0.4, 0, 0]}>
		<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#c8946a')}>
			<coneGeometry args={[0.32, 0.9, 7]} />
		</mesh>
		{[-1, 1].map((s) => (
			<mesh key={s} position={[s * 0.13, -0.18, 0.38]} material={mat('#7a4e34')}>
				<sphereGeometry args={[0.07, 6, 5]} />
			</mesh>
		))}
	</group>
);
export const S6: React.FC<{t: number}> = ({t}) => {
	const items: {kind: 'egg' | 'meat' | 'cabbage'; at: number; x: number}[] = [
		{kind: 'egg', at: 8.0, x: -1.0},
		{kind: 'meat', at: 13.8, x: 0.1},
		{kind: 'cabbage', at: 15.2, x: 1.0},
	];
	const recoil = smooth(t, 6.6, 7.0) * (1 - smooth(t, 9.0, 10.5));
	return (
		<>
			<Cam pos={[0, 0.2, mix(3.2, 2.6, smooth(t, 0, 16))]} look={[0, 0, -2]} fov={50} />
			<GasRoom />
			<GasCloud t={t} stinkyOnly stinkGlow={smooth(t, 8, 16)} />
			{[0, 1, 2].map((i) => (
				<Bubble key={i} position={[-0.9 + i * 0.9, 0.3 + Math.sin(t + i) * 0.1, -1.2]} r={0.42 + smooth(t, 8, 16) * 0.12} stinky t={t} />
			))}
			{items.map((it, i) => {
				const k = smooth(t, it.at, it.at + 0.8);
				return k > 0 ? <Food key={i} position={[it.x, mix(-3, -1.2, k), -0.6]} kind={it.kind} s={1.6} spin={t * 0.8} /> : null;
			})}
			{t > 5.6 && t < 11 ? <Nose position={[0.45, 0.55, 0.7]} recoil={recoil} /> : null}
		</>
	);
};
export const O6: React.FC<{t: number}> = ({t}) => <Big text="H₂S" sub="hydrogen sulfide" color="#d6e34a" size={170} o={interpolate(t, [3.6, 4.2, 7.6, 8.2], [0, 1, 1, 0], clampI)} y={300} />;

// ================= S7: everyone does it, 10+ times a day =================
export const S7: React.FC<{t: number}> = ({t}) => {
	const cx = t < 3.0 ? -7 : t < 3.9 ? mix(-7, 0, smooth(t, 3.0, 3.9)) : t < 6.6 ? 0 : mix(0, 7, smooth(t, 6.6, 7.5));
	return (
		<>
			<Cam pos={[cx + 0.3, 1.7, 3.8]} look={[cx, 1.0, -0.4]} fov={44} />
			<color attach="background" args={['#8fc0e3']} />
			<fog attach="fog" args={['#eeeadc', 18, 60]} />
			<hemisphereLight args={['#f2efe6', '#5a6248', 1.25]} />
			<directionalLight position={[20, 40, 20]} intensity={2.1} color="#fff1da" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#8faa64')}>
				<planeGeometry args={[400, 400]} />
			</mesh>
			{/* jeepney passenger */}
			<Jeepney position={[-7.6, 0, -0.8]} rotationY={Math.PI / 2} />
			<Person seed={1011} position={[-6.6, 0, 0.3]} rotationY={0.3} pose={{armL: 0.05, armR: 0.05}} />
			<Puff position={[-6.6, 0.5, 0.05]} k={ramp(t, 0.8, 2.8)} />
			{/* office worker */}
			<mesh position={[0, 0.37, -0.5]} material={mat('#e8e2d6')}>
				<boxGeometry args={[1.6, 0.74, 0.8]} />
			</mesh>
			<mesh position={[0, 1.6, -1.6]} material={mat('#c9d1d6')}>
				<boxGeometry args={[4, 3.2, 0.1]} />
			</mesh>
			<Person seed={1012} shirt="#d8d4cc" position={[0, 0, -1.1]} pose={{sit: true, armL: -1.1 + Math.sin(t * 12) * 0.08, armR: -1.1, elbow: -0.5}} />
			<Puff position={[0, 0.5, -1.3]} k={ramp(t, 4.0, 6.0)} />
			{/* kid in class */}
			<mesh position={[7, 1.6, -1.8]} material={mat('#2f4a3c')}>
				<boxGeometry args={[3, 1.3, 0.06]} />
			</mesh>
			<Person seed={1013} shirt="#4f7aa3" scale={0.72} position={[7, 0, -0.2]} pose={{armL: 0.05, armR: -2.6, spreadR: 0.3}} />
			<Puff position={[7, 0.4, -0.35]} k={ramp(t, 8.0, 10.0)} s={0.8} />
		</>
	);
};
export const O7: React.FC<{t: number}> = ({t}) => {
	const n = Math.min(15, Math.floor(interpolate(t, [0.5, 10], [1, 15.99], clampI)));
	return (
		<AbsoluteFill style={{alignItems: 'flex-end', paddingTop: 140, paddingRight: 70}}>
			<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 130, color: GOLD, textShadow: '0 5px 24px rgba(0,0,0,0.55)'}}>×{n}</div>
		</AbsoluteFill>
	);
};

// ================= S8: it's normal, but have mercy in the elevator =================
export const S8: React.FC<{t: number}> = ({t}) => {
	if (t < 1.6) {
		return (
			<>
				<Cam pos={[0.5, 1.7, 3.4]} look={[0, 0.9, -0.8]} fov={46} />
				<LivingRoom />
				<Family t={t} puffAt={-10} look={0} laugh={1} fan={1} />
			</>
		);
	}
	const tt = t - 1.6;
	const turn = smooth(tt, 2.6, 3.6);
	const doors = smooth(tt, 6.0, 8.0);
	return (
		<>
			<Cam pos={[0, 1.55, mix(2.6, 4.4, smooth(tt, 5.5, 11))]} look={[0, 1.25, -1]} fov={44} />
			<color attach="background" args={['#2a2420']} />
			<hemisphereLight args={['#fff4e0', '#3a3028', 1.1]} />
			<pointLight position={[0, 2.5, -0.6]} intensity={8} distance={6} color="#fff0d0" />
			{/* elevator car */}
			<mesh position={[0, 1.4, -1.6]} material={mat('#b9bcc0', {metalness: 0.3, roughness: 0.4})}>
				<boxGeometry args={[2.2, 2.8, 0.06]} />
			</mesh>
			{[-1.1, 1.1].map((x) => (
				<mesh key={x} position={[x, 1.4, -0.6]} material={mat('#a9acb0', {metalness: 0.3, roughness: 0.4})}>
					<boxGeometry args={[0.06, 2.8, 2.0]} />
				</mesh>
			))}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -0.6]} material={mat('#6d6c68')}>
				<planeGeometry args={[2.2, 2.0]} />
			</mesh>
			<Person seed={1021} shirt="#4f6a8f" position={[-0.6, 0, -0.8]} rotationY={turn * 0.9} pose={{armL: 0.05, armR: 0.05, headTurn: turn * 0.5}} />
			<Person seed={1022} shirt="#d8d4cc" position={[0, 0, -1.0]} pose={{armL: 0.05, armR: 0.05, headTurn: Math.sin(tt * 3) * 0.1 * (tt > 2 ? 1 : 0)}} />
			<Person seed={1023} shirt="#8a6f8f" longHair position={[0.6, 0, -0.8]} rotationY={-turn * 0.9} pose={{armL: -1.6 * turn, armR: -1.6 * turn, elbow: -1.6 * turn, headTurn: -turn * 0.5}} />
			<Puff position={[0, 0.5, -1.25]} k={ramp(tt, 1.0, 3.2)} />
			{/* doors sliding shut */}
			{[-1, 1].map((s) => (
				<mesh key={s} position={[s * mix(1.65, 0.55, doors), 1.4, 0.45]} material={mat('#c9ccd0', {metalness: 0.4, roughness: 0.35})}>
					<boxGeometry args={[1.1, 2.8, 0.05]} />
				</mesh>
			))}
			{/* wall around the doorway */}
			{[-1, 1].map((sd) => (
				<mesh key={'w' + sd} position={[sd * 2.25, 1.6, 0.43]} material={mat('#8a8d92')}>
					<boxGeometry args={[2.3, 3.6, 0.04]} />
				</mesh>
			))}
			<mesh position={[0, 3.1, 0.43]} material={mat('#8a8d92')}>
				<boxGeometry args={[2.2, 0.6, 0.04]} />
			</mesh>
		</>
	);
};
