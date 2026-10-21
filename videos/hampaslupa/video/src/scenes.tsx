import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Cam, Person, Pose, Sky, Stalk, TerraceHill, Tree, mat, mix, mixV, rand, ramp, smooth} from './kit';
import {Barangay, Dish} from './props';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const RED = '#d33a2c';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// recurring cast
const GUY = {seed: 2001, shirt: '#4f6a8f'};
const FARMER = {seed: 2002, shirt: '#d9c9a3', hat: true};
const KID = {seed: 2004, shirt: '#d9b44a', scale: 0.72};
const LOLA = {seed: 1001, shirt: '#8a6f8f', longHair: true, hairColor: '#cfcac2'};
const SNOB = {seed: 2003, shirt: '#a85d5d'};

// arm angle for a repeated strike: down (a hit) at t = phase + k * period
const swing = (t: number, period: number, phase = 0) => {
	const u = ((((t - phase) / period) % 1) + 1) % 1;
	return -0.6 - 1.8 * Math.pow(Math.sin(Math.PI * u), 0.8);
};
// seconds since the most recent hit (for dust puffs)
const since = (t: number, period: number, phase = 0) => ((((t - phase) / period) % 1) + 1) % 1 * period;

// ---------- props ----------
const Phone: React.FC<{position: number[]; rotation?: number[]; cracked?: number; s?: number}> = ({position, rotation = [0, 0, 0], cracked = 0, s = 1}) => (
	<group position={position as V} rotation={rotation as V} scale={s}>
		<mesh material={mat('#24262c', {roughness: 0.4})}>
			<boxGeometry args={[0.09, 0.17, 0.014]} />
		</mesh>
		<mesh position={[0, 0, 0.0075]} material={mat('#5d7fa8', {emissive: '#3a5f8a', emissiveIntensity: 0.6, roughness: 0.3})}>
			<boxGeometry args={[0.078, 0.152, 0.002]} />
		</mesh>
		{cracked > 0
			? [0.3, 1.1, 1.9, 2.6, 3.5, 4.4, 5.3].map((a, i) => (
					<mesh key={i} position={[0.01 + Math.cos(a) * 0.022 * cracked, 0.02 + Math.sin(a) * 0.022 * cracked, 0.0095]} rotation={[0, 0, a]} material={mat('#ffffff', {emissive: '#ffffff', emissiveIntensity: 0.8})}>
						<boxGeometry args={[0.05 * cracked, 0.0025, 0.001]} />
					</mesh>
				))
			: null}
	</group>
);

// a puff of dust, k = seconds since the hit
const Dust: React.FC<{position: number[]; k: number; s?: number}> = ({position, k, s = 1}) => {
	if (k < 0 || k > 0.6) return null;
	const u = k / 0.6;
	return (
		<group position={position as V} scale={s}>
			{[0, 1, 2, 3, 4, 5].map((i) => (
				<mesh key={i} position={[Math.cos(i * 1.05) * 0.25 * u, 0.05 + u * 0.12, Math.sin(i * 1.05) * 0.25 * u]} scale={0.05 + u * 0.08}>
					<icosahedronGeometry args={[1, 0]} />
					<meshStandardMaterial color="#cdb894" transparent opacity={0.7 * (1 - u)} flatShading depthWrite={false} />
				</mesh>
			))}
		</group>
	);
};

const Hoe: React.FC = () => (
	<group position={[0.29, 0.1, 0]}>
		<mesh position={[0, -0.45, 0]} material={mat('#8a6a48')}>
			<cylinderGeometry args={[0.02, 0.02, 1.2, 5]} />
		</mesh>
		<mesh position={[0, -1.02, 0.1]} material={mat('#8d949a', {metalness: 0.5, roughness: 0.4})}>
			<boxGeometry args={[0.2, 0.05, 0.22]} />
		</mesh>
	</group>
);
const Paddle: React.FC = () => (
	<group position={[0.29, 0.05, 0]}>
		<mesh position={[0, -0.12, 0]} material={mat('#9a7448')}>
			<cylinderGeometry args={[0.02, 0.02, 0.25, 5]} />
		</mesh>
		<mesh position={[0, -0.4, 0]} material={mat('#b58b58')}>
			<boxGeometry args={[0.12, 0.34, 0.03]} />
		</mesh>
	</group>
);

const Chicken: React.FC<{position: number[]; t: number; rotationY?: number}> = ({position, t, rotationY = 0}) => {
	const bob = Math.max(0, Math.sin(t * Math.PI * 2 * (104 / 60)));
	return (
		<group position={position as V} rotation={[0, rotationY, 0]} scale={0.6}>
			<mesh position={[0, 0.35, 0]} scale={[1, 0.85, 1.2]} material={mat('#f2ece0')}>
				<icosahedronGeometry args={[0.25, 1]} />
			</mesh>
			<mesh position={[0, 0.42, -0.28]} rotation={[0.6, 0, 0]} material={mat('#e8e0d0')}>
				<coneGeometry args={[0.12, 0.25, 5]} />
			</mesh>
			<group position={[0, 0.62, 0.18 + bob * 0.08]} rotation={[bob * 0.4, 0, 0]}>
				<mesh material={mat('#f2ece0')}>
					<icosahedronGeometry args={[0.12, 1]} />
				</mesh>
				<mesh position={[0, 0.13, 0]} material={mat('#c8352a')}>
					<boxGeometry args={[0.03, 0.08, 0.12]} />
				</mesh>
				<mesh position={[0, -0.01, 0.13]} rotation={[Math.PI / 2, 0, 0]} material={mat('#e8b54a')}>
					<coneGeometry args={[0.035, 0.08, 4]} />
				</mesh>
				{[-1, 1].map((k) => (
					<mesh key={k} position={[k * 0.06, 0.03, 0.09]} material={mat('#1d1a18')}>
						<sphereGeometry args={[0.018, 5, 4]} />
					</mesh>
				))}
			</group>
			{[-1, 1].map((k) => (
				<mesh key={'l' + k} position={[k * 0.08, 0.08, 0]} material={mat('#e8b54a')}>
					<cylinderGeometry args={[0.015, 0.015, 0.18, 4]} />
				</mesh>
			))}
		</group>
	);
};

const Heart: React.FC<{position: number[]; s?: number}> = ({position, s = 1}) => (
	<group position={position as V} scale={s}>
		{[-1, 1].map((k) => (
			<mesh key={k} position={[k * 0.09, 0.05, 0]} material={mat('#e0524a', {emissive: '#b8302a', emissiveIntensity: 0.3})}>
				<sphereGeometry args={[0.12, 10, 8]} />
			</mesh>
		))}
		<mesh position={[0, -0.08, 0]} rotation={[0, 0, Math.PI / 4]} material={mat('#e0524a', {emissive: '#b8302a', emissiveIntensity: 0.3})}>
			<boxGeometry args={[0.2, 0.2, 0.2]} />
		</mesh>
	</group>
);
const Wallet: React.FC<{position: number[]; s?: number}> = ({position, s = 1}) => (
	<group position={position as V} scale={s}>
		<mesh material={mat('#6b4a32')}>
			<boxGeometry args={[0.36, 0.08, 0.26]} />
		</mesh>
		{[0, 1, 2].map((i) => (
			<mesh key={i} position={[-0.05 + i * 0.05, 0.07 + i * 0.01, 0]} rotation={[0, 0, 0.15 - i * 0.15]} material={mat('#8fc48a')}>
				<boxGeometry args={[0.3, 0.012, 0.16]} />
			</mesh>
		))}
	</group>
);

// a small field of rice stalks
const Paddy: React.FC<{position: number[]; w: number; d: number; n: number; t: number; seed?: number; color?: string}> = ({position, w, d, n, t, seed = 5, color = '#8fb365'}) => {
	const pts = useMemo(() => {
		const g = rand(seed);
		return Array.from({length: n}).map(() => [(g() - 0.5) * w, (g() - 0.5) * d, 0.7 + g() * 0.4, g() * 6]);
	}, [n, w, d, seed]);
	return (
		<group position={position as V}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={mat('#7a6a52')}>
				<planeGeometry args={[w + 0.4, d + 0.4]} />
			</mesh>
			{pts.map((p, i) => (
				<Stalk key={i} position={[p[0], 0, p[1]]} h={p[2]} color={color} sway={Math.sin(t * 1.3 + p[3]) * 0.08} />
			))}
		</group>
	);
};

const DayWorld: React.FC = () => (
	<>
		<Sky top="#8fc0e3" bottom="#f1eee2" />
		<fog attach="fog" args={['#eeeadc', 18, 90]} />
		<hemisphereLight args={['#f2efe6', '#5a6248', 1.25]} />
		<directionalLight position={[20, 30, 20]} intensity={2.1} color="#fff1da" />
		<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#8faa64')}>
			<planeGeometry args={[400, 400]} />
		</mesh>
	</>
);

// the guy and his phone; drop = time the phone falls; slaps = hit times
const guyPose = (t: number, drop: number, slaps: number[], crouchAt: number, raiseOnly = false): {pose: Pose; mouth: boolean} => {
	if (t < drop) return {pose: {armL: -1.15, armR: -1.15, elbow: -0.35, headTurn: 0}, mouth: false};
	if (t < crouchAt) return {pose: {armL: -1.0, armR: -1.0, elbow: -0.6, bend: 0.25 * smooth(t, drop, drop + 0.3)}, mouth: true};
	let a = -2.6;
	for (const s of slaps) {
		if (t > s - 0.35 && t < s + 0.5) a = t < s ? mix(-2.6, -0.5, smooth(t, s - 0.35, s)) : mix(-0.5, -2.6, smooth(t, s + 0.1, s + 0.5));
	}
	if (raiseOnly) a = mix(-0.6, -2.6, smooth(t, crouchAt, crouchAt + 0.6));
	return {pose: {sit: true, bend: 0.7, armR: a, armL: -0.4, elbow: -0.2}, mouth: true};
};

// ================= S1: the phone drops, he slaps the ground =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const DROP = 4.28, SLAPS = [5.84, 7.18];
	const {pose, mouth} = guyPose(t, DROP, SLAPS, 5.3);
	const fall = smooth(t, DROP, DROP + 0.35);
	const phoneP: V = t < DROP ? [0, 1.12, 0.42] : [mix(0, 0.15, fall), mix(1.12, 0.012, ramp(t, DROP, DROP + 0.35) ** 2), mix(0.42, 0.75, fall)];
	const push = smooth(t, 0, 11);
	return (
		<>
			<Cam pos={[mix(1.2, 0.6, push), mix(1.7, 1.5, push), mix(5.2, 3.9, push)]} look={[0.2, mix(1.0, 0.45, push), 0]} fov={42} />
			<Barangay t={t} houses={[-10, -5, 0, 5, 10]} />
			<Person {...GUY} position={[0, 0, 0]} rotationY={1.1 * smooth(t, 5.0, 5.4)} pose={pose} mouth={mouth} />
			<Phone position={phoneP} rotation={t < DROP ? [-0.5, 0, 0] : [mix(-0.5, -Math.PI / 2, fall), fall * 2, 0]} />
			{SLAPS.map((s, i) => <Dust key={i} position={[0.7, 0, 0.35]} k={t - s} />)}
		</>
	);
};

// ================= S2: montage, everyone who "hits the ground" =================
const SET = [0, 8, 16];
export const S2: React.FC<{t: number}> = ({t}) => {
	const cx = t < 6.7 ? 0 : t < 7.3 ? mix(0, 8, smooth(t, 6.7, 7.3)) : t < 9.8 ? 8 : mix(8, 16, smooth(t, 9.8, 10.4));
	const ball = Math.abs(Math.sin(((t - 0.0) * Math.PI) / 0.5));
	return (
		<>
			<Cam pos={[cx + 0.6, 1.5, 4.0]} look={[cx, 0.85, 0]} fov={44} />
			<DayWorld />
			{[-3, 4, 12, 20].map((x, i) => <Tree key={i} position={[x, 0, -5]} s={1.4} />)}
			{/* 1. farmer and hoe */}
			<Paddy position={[SET[0], 0, -1.6]} w={4} d={1.6} n={60} t={t} />
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[SET[0], 0.015, 0.2]} material={mat('#8a7458')}>
				<planeGeometry args={[3, 1.6]} />
			</mesh>
			<Person {...FARMER} position={[SET[0], 0, 0]} pose={{armL: swing(t, 1.0, 0.5), armR: swing(t, 1.0, 0.5), elbow: -0.2, bend: 0.35}}>
				<Hoe />
			</Person>
			<Dust position={[SET[0], 0, 0.95]} k={since(t, 1.0, 0.5)} s={0.8} />
			{/* 2. kid and basketball */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[SET[1], 0.015, 0]} material={mat('#9a9c9e')}>
				<planeGeometry args={[4, 3]} />
			</mesh>
			<mesh position={[SET[1] + 1.4, 1.5, -1.2]} material={mat('#6a6e72')}>
				<cylinderGeometry args={[0.05, 0.05, 3, 6]} />
			</mesh>
			<mesh position={[SET[1] + 1.4, 2.9, -1.05]} material={mat('#f2f0ea')}>
				<boxGeometry args={[0.9, 0.6, 0.04]} />
			</mesh>
			<mesh position={[SET[1] + 1.4, 2.65, -0.8]} rotation={[Math.PI / 2, 0, 0]} material={mat('#d9622a')}>
				<torusGeometry args={[0.18, 0.015, 5, 14]} />
			</mesh>
			<Person {...KID} position={[SET[1], 0, 0]} pose={{armR: -0.5 - 0.35 * ball, elbow: -0.3, armL: 0.1, bob: 0.02 * ball}} mouth />
			<mesh position={[SET[1] + 0.2, 0.1 + ball * 0.42, 0.42]} material={mat('#d9622a')}>
				<icosahedronGeometry args={[0.1, 1]} />
			</mesh>
			{/* 3. Lola beating laundry by the river */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[SET[2], 0.02, -1.6]} material={mat('#8fb8c8', {roughness: 0.3})}>
				<planeGeometry args={[8, 2]} />
			</mesh>
			<mesh position={[SET[2] + 0.1, 0.12, 0.5]} scale={[1.4, 0.5, 1]} material={mat('#9a958c')}>
				<icosahedronGeometry args={[0.3, 0]} />
			</mesh>
			<mesh position={[SET[2] + 0.1, 0.27, 0.5]} rotation={[0, 0.3, 0]} material={mat('#e8e4f0')}>
				<boxGeometry args={[0.5, 0.05, 0.35]} />
			</mesh>
			<Person {...LOLA} position={[SET[2] - 0.35, 0, 0]} rotationY={0.5} pose={{sit: true, bend: 0.5, armR: swing(t, 0.7, 0.2) * 0.8, armL: -0.6}} mouth>
				<Paddle />
			</Person>
		</>
	);
};
// a card with a red "?" stamp, popping in
const QCard: React.FC<{o: number; text: string}> = ({o, text}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: 320, opacity: Math.min(1, o * 2)}}>
		<div style={{position: 'relative', background: '#f6f1e6', borderRadius: 34, padding: '26px 60px', boxShadow: '0 14px 40px rgba(0,0,0,0.35)', transform: `scale(${0.6 + 0.4 * o}) rotate(-3deg)`}}>
			<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 110, color: '#2b211c'}}>{text}</div>
			<div style={{position: 'absolute', right: -50, top: -60, width: 130, height: 130, borderRadius: 65, border: `8px solid ${RED}`, color: RED, fontFamily: 'sans-serif', fontWeight: 900, fontSize: 96, lineHeight: '114px', textAlign: 'center', transform: `rotate(12deg) scale(${1.6 - 0.6 * o})`, background: 'rgba(246,241,230,0.9)'}}>?</div>
		</div>
	</AbsoluteFill>
);
export const O2: React.FC<{t: number}> = ({t}) => (
	<>
		{[[5.69, 6.7], [7.79, 9.8], [10.31, 14.0]].map(([a, b], i) => (
			<QCard key={i} text="hampaslupa" o={interpolate(t, [a, a + 0.35, b - 0.2, b], [0, 1, 1, 0], clampI)} />
		))}
	</>
);

// ================= S3: the dictionary =================
export const S3: React.FC<{t: number}> = ({t}) => {
	const push = smooth(t, 0, 18);
	const slump = smooth(t, 16.0, 16.8);
	return (
		<>
			<Cam pos={[mix(0.9, 0.3, push), mix(1.9, 1.45, push), mix(3.0, 1.9, push)]} look={[0, 0.85, -0.2]} fov={44} />
			<color attach="background" args={['#2a2420']} />
			<fog attach="fog" args={['#2a2420', 4, 14]} />
			<hemisphereLight args={['#f2e2c8', '#3a2e24', 0.6]} />
			<pointLight position={[0.6, 2.6, 1.4]} intensity={14} color="#ffcf8f" />
			<mesh position={[0, -0.1, -2.5]} material={mat('#3a3028')}>
				<boxGeometry args={[12, 6, 0.1]} />
			</mesh>
			{/* shelves of books */}
			{Array.from({length: 22}).map((_, i) => (
				<mesh key={i} position={[-2.2 + i * 0.2, 1.6 + (i % 3) * 0.02, -2.3]} material={mat(['#8a3f34', '#4f6a8f', '#6f8f5a', '#c9a96b'][i % 4])}>
					<boxGeometry args={[0.16, 0.5 + (i % 4) * 0.06, 0.3]} />
				</mesh>
			))}
			<mesh position={[0, 0.35, -0.2]} material={mat('#6a4a32')}>
				<boxGeometry args={[2.2, 0.7, 1.3]} />
			</mesh>
			{/* the open dictionary */}
			{[-1, 1].map((k) => (
				<group key={k} position={[k * 0.36, 0.74, -0.2]} rotation={[0, 0, -k * 0.08]}>
					<mesh material={mat('#f4efe2')}>
						<boxGeometry args={[0.7, 0.06, 0.9]} />
					</mesh>
					{Array.from({length: 8}).map((_, j) => (
						<mesh key={j} position={[0, 0.032, -0.33 + j * 0.09]} material={mat('#8a8070')}>
							<boxGeometry args={[0.5, 0.002, 0.02]} />
						</mesh>
					))}
				</group>
			))}
			{/* a tiny person on the page, slumping on "lugmok" */}
			<Person seed={2005} shirt="#7d9a6b" scale={0.18} position={[0.36, 0.79 - slump * 0.02, -0.15]} pose={{bend: 1.0 * slump, armL: 0.3 * slump, armR: 0.3 * slump, headTurn: 0}} mouth={slump > 0.5} />
		</>
	);
};
export const O3: React.FC<{t: number}> = ({t}) => {
	const card = interpolate(t, [1.2, 1.7, 17.2, 17.8], [0, 1, 1, 0], clampI);
	const stamp = interpolate(t, [3.4, 3.7], [0, 1], clampI) * interpolate(t, [10.8, 11.3], [1, 0], clampI);
	const split = smooth(t, 11.85, 12.5);
	const lupaGold = t >= 13.2;
	return (
		<AbsoluteFill style={{alignItems: 'center', paddingTop: 300, opacity: card}}>
			<div style={{position: 'relative', background: '#f6f1e6', borderRadius: 34, padding: '30px 50px', boxShadow: '0 14px 40px rgba(0,0,0,0.4)', transform: `scale(${0.7 + 0.3 * card})`}}>
				<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 118, color: '#2b211c', whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline'}}>
					<span>hampas</span>
					<span style={{width: split * 90, textAlign: 'center', opacity: split, color: '#8a7a68', overflow: 'hidden'}}>+</span>
					<span style={{color: lupaGold ? '#b8862a' : '#2b211c'}}>lupa</span>
				</div>
				<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 50, color: '#6a5a48', textAlign: 'center', opacity: 1 - split}}>pangngalan</div>
				<div style={{position: 'absolute', left: '50%', top: '58%', opacity: stamp, transform: `translate(-50%, -50%) rotate(-12deg) scale(${2 - stamp})`, border: `8px solid ${RED}`, borderRadius: 16, padding: '4px 28px', color: RED, fontFamily: 'sans-serif', fontWeight: 900, fontSize: 92, letterSpacing: 6, background: 'rgba(246,241,230,0.85)'}}>INSULTO</div>
			</div>
		</AbsoluteFill>
	);
};

// ================= S4: the ground orchestra (silent) =================
export const BEAT = 60 / 104;
export const S4_PHASE = 0.069; // aligns local hits with the music's beat grid
export const S4_END = S4_PHASE + 13 * BEAT;
export const S4: React.FC<{t: number}> = ({t}) => {
	const tt = Math.min(t, S4_END);
	const orbit = smooth(t, 0, 8.5);
	const done = t >= S4_END;
	return (
		<>
			<Cam pos={[mix(-1.8, 1.6, orbit), mix(1.8, 1.5, orbit), mix(6.6, 5.8, orbit)]} look={[0, 0.8, 0]} fov={44} />
			<DayWorld />
			{[-5, -2, 3, 6].map((x, i) => <Tree key={i} position={[x, 0, -5 - (i % 2)]} s={1.3} />)}
			<Paddy position={[0, 0, -2.4]} w={7} d={1.4} n={80} t={t} />
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0.3]} material={mat('#8a7458')}>
				<planeGeometry args={[6, 2]} />
			</mesh>
			<Person {...FARMER} position={[-1.5, 0, 0]} rotationY={0.25} pose={{armL: swing(tt, 2 * BEAT, S4_PHASE), armR: swing(tt, 2 * BEAT, S4_PHASE), elbow: -0.2, bend: 0.35}} mouth={done}>
				<Hoe />
			</Person>
			<Dust position={[-1.3, 0, 0.95]} k={since(tt, 2 * BEAT, S4_PHASE)} s={0.8} />
			<mesh position={[0.1, 0.12, 0.5]} scale={[1.4, 0.5, 1]} material={mat('#9a958c')}>
				<icosahedronGeometry args={[0.3, 0]} />
			</mesh>
			<mesh position={[0.1, 0.27, 0.5]} rotation={[0, 0.3, 0]} material={mat('#e8e4f0')}>
				<boxGeometry args={[0.5, 0.05, 0.35]} />
			</mesh>
			<Person {...LOLA} position={[-0.3, 0, 0]} rotationY={0.5} pose={{sit: true, bend: 0.5, armR: swing(tt, BEAT, S4_PHASE) * 0.8, armL: -0.6}} mouth={done}>
				<Paddle />
			</Person>
			<Person {...KID} position={[1.5, 0, 0]} rotationY={-0.25} pose={{armR: -0.5 - 0.35 * Math.abs(Math.sin((tt - S4_PHASE) * Math.PI / BEAT)), elbow: -0.3, armL: done ? -2.4 : 0.1}} mouth />
			<mesh position={[1.62, 0.1 + Math.abs(Math.sin((tt - S4_PHASE) * Math.PI / BEAT)) * 0.42, 0.4]} material={mat('#d9622a')}>
				<icosahedronGeometry args={[0.1, 1]} />
			</mesh>
			<Chicken position={[0.5, 0, 1.3]} t={tt} rotationY={-0.3} />
			{done ? <Dust position={[0, 0, 0.8]} k={t - S4_END} s={3} /> : null}
		</>
	);
};

// ================= S5: the farmer at sunrise, then rice on the table =================
const TH = 0.35; // farmer's angle on the terraces
export const S5: React.FC<{t: number}> = ({t}) => {
	const table = t > 9.9;
	if (table) {
		const k = smooth(t, 9.9, 14.9);
		return (
			<>
				<Cam pos={[mix(0.9, 0.5, k), mix(1.0, 0.85, k), mix(1.4, 1.0, k)]} look={[0, 0.8, -0.2]} fov={40} />
				<color attach="background" args={['#2a2420']} />
				<hemisphereLight args={['#f2e2c8', '#3a2e24', 0.8]} />
				<pointLight position={[0.4, 2.2, 1.0]} intensity={10} color="#ffcf8f" />
				<mesh position={[0, 0.35, -0.3]} material={mat('#8a5f3e')}>
					<boxGeometry args={[2.0, 0.7, 1.2]} />
				</mesh>
				<Dish position={[0, 0.7, -0.2]} kind={3} s={1.6} />
				<Dish position={[-0.55, 0.7, -0.45]} kind={1} />
				<Dish position={[0.55, 0.7, -0.45]} kind={2} />
				{[0, 1, 2, 3].map((i) => {
					const u = ((t * 0.35 + i / 4) % 1);
					return (
						<mesh key={i} position={[(i - 1.5) * 0.06 + Math.sin(t * 2 + i) * 0.02, 0.85 + u * 0.5, -0.2]} scale={[0.02 + u * 0.025, 0.05, 0.02 + u * 0.025]}>
							<sphereGeometry args={[1, 6, 5]} />
							<meshBasicMaterial color="#ffffff" transparent opacity={0.3 * Math.sin(Math.PI * u)} depthWrite={false} />
						</mesh>
					);
				})}
			</>
		);
	}
	const rise = smooth(t, 0, 9.6);
	const r = 11.9, y = 2.8;
	const fp: V = [Math.sin(TH) * r, y, Math.cos(TH) * r];
	const camR = mix(30, 15.2, rise);
	const camA = TH + mix(-0.35, 0.05, rise);
	return (
		<>
			<Cam pos={[Math.sin(camA) * camR, mix(1.5, 4.0, rise), Math.cos(camA) * camR]} look={[fp[0], mix(5, 3.5, rise), fp[2]]} fov={42} far={2000} />
			<Sky top="#8fb6d9" bottom="#f6c38a" />
			<fog attach="fog" args={['#f2c89a', 25, 110]} />
			<hemisphereLight args={['#f7e6cf', '#5a6248', 1.1]} />
			<directionalLight position={[40, 12, 30]} intensity={2.2} color="#ffd2a0" />
			<mesh position={[120, 20, -300]} material={mat('#fff1c8', {emissive: '#ffd890', emissiveIntensity: 1})}>
				<sphereGeometry args={[18, 16, 12]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#7a9a58')}>
				<planeGeometry args={[600, 600]} />
			</mesh>
			<TerraceHill radius={16} tiers={12} step={0.7} gold={0.15} water={0.5} />
			<TerraceHill position={[-30, 0, -20]} radius={14} tiers={10} step={0.8} seed={7} />
			<Person {...FARMER} position={fp} rotationY={TH} pose={{armL: swing(t, 1.0, 0.3), armR: swing(t, 1.0, 0.3), elbow: -0.2, bend: 0.35}}>
				<Hoe />
			</Person>
			<Dust position={[fp[0] + Math.sin(TH) * 0.95, y, fp[2] + Math.cos(TH) * 0.95]} k={since(t, 1.0, 0.3)} s={0.8} />
		</>
	);
};

// ================= S6: the scale, the snob, the banana =================
export const S6: React.FC<{t: number}> = ({t}) => {
	const appear = smooth(t, 0.9, 1.5);
	const wallet = ramp(t, 2.3, 2.7);
	const heart = ramp(t, 4.6, 5.0);
	const tilt = 0.3 * smooth(t, 2.6, 3.0) - 0.6 * smooth(t, 4.95, 5.6);
	const point = smooth(t, 10.1, 10.5) * (1 - smooth(t, 12.2, 12.4));
	const fall = smooth(t, 12.37, 12.8);
	const push = smooth(t, 0, 13.7);
	const beamY = 2.0;
	const panY = (side: number) => beamY - 0.65 + side * Math.sin(tilt) * 0.9;
	return (
		<>
			<Cam pos={[mix(0.5, 0.2, push), mix(1.7, 1.5, push), mix(7.4, 6.4, push)]} look={[0, 1.15, 0]} fov={44} />
			<Barangay t={t} houses={[-10, -5, 5, 10]} />
			{/* the balance scale */}
			<group position={[0, 0, -0.8]} scale={appear}>
				<mesh position={[0, 0.05, 0]} material={mat('#8a6a3a')}>
					<cylinderGeometry args={[0.4, 0.5, 0.1, 10]} />
				</mesh>
				<mesh position={[0, beamY / 2, 0]} material={mat('#c9a14a', {metalness: 0.4, roughness: 0.4})}>
					<cylinderGeometry args={[0.05, 0.06, beamY, 8]} />
				</mesh>
				<mesh position={[0, beamY, 0]} rotation={[0, 0, tilt]} material={mat('#c9a14a', {metalness: 0.4, roughness: 0.4})}>
					<boxGeometry args={[1.9, 0.06, 0.08]} />
				</mesh>
				{[-1, 1].map((side) => (
					<group key={side} position={[side * 0.9 * Math.cos(tilt), panY(side), 0]}>
						<mesh position={[0, 0.33, 0]} material={mat('#9a7a3a')}>
							<cylinderGeometry args={[0.008, 0.008, 0.65, 4]} />
						</mesh>
						<mesh material={mat('#c9a14a', {metalness: 0.4, roughness: 0.4})}>
							<cylinderGeometry args={[0.35, 0.25, 0.06, 14]} />
						</mesh>
					</group>
				))}
				{wallet > 0 ? <Wallet position={[-0.9 * Math.cos(tilt), mix(3.4, panY(-1) + 0.08, wallet ** 2), 0]} s={0.9} /> : null}
				{heart > 0 ? <Heart position={[0.9 * Math.cos(tilt), mix(3.4, panY(1) + 0.18, heart ** 2), 0]} s={1.2} /> : null}
			</group>
			{/* farmer on the left, the snob on the right */}
			<Person {...FARMER} position={[-1.05, 0, 0.6]} rotationY={0.4} pose={{armL: 0.1, armR: 0.1, headTurn: point > 0.5 ? 0.6 : 0}} />
			<group position={[1.05 + fall * 0.2, 0, 0.6]} rotation={[0, -0.4, 0]}>
				<group rotation={[-fall * 1.35, 0, 0]}>
					<Person {...SNOB} pose={{armR: -1.5 * point + fall * -2.4, armL: -0.4 + fall * -2.2, spreadR: 0.5 * point, leg: fall * 0.6, headTurn: -0.2 * point}} mouth={point > 0.5 || fall > 0} />
					<mesh position={[0, 1.78, 0.21]} material={mat('#101014', {roughness: 0.2})}>
						<boxGeometry args={[0.36, 0.07, 0.03]} />
					</mesh>
				</group>
			</group>
			<mesh position={[1.1, 0.04, 0.95]} rotation={[0, 0.5, Math.PI / 2]} material={mat('#f2d14a')}>
				<capsuleGeometry args={[0.04, 0.2, 3, 6]} />
			</mesh>
		</>
	);
};

// ================= S7: "huwag mo nang hampasin…" then the cracked screen =================
export const S7: React.FC<{t: number}> = ({t}) => {
	const DROP = 2.21;
	const crouch = t > 3.4 && t < 11.4;
	const pick = smooth(t, 11.4, 12.4);
	const lookField = smooth(t, 8.4, 9.4) * (1 - smooth(t, 10.8, 11.6));
	const close = smooth(t, 13.6, 14.4) * (1 - smooth(t, 16.4, 17.0));
	const crouch2 = t > 17.0;
	let pose: Pose, mouth = true;
	if (t < DROP) pose = {armL: -1.15, armR: -1.15, elbow: -0.35};
	else if (!crouch && t < 3.4) pose = {armL: -1.0, armR: -1.0, elbow: -0.6, bend: 0.25};
	else if (crouch) pose = {sit: true, bend: 0.7, armR: mix(-0.6, -2.6, smooth(t, 4.6, 5.6)), armL: -0.4, elbow: -0.2, headTurn: lookField * 0.9};
	else if (!crouch2) pose = {armL: -1.15, armR: -1.15, elbow: -0.35, bend: 0.1 * close};
	else {
		const s = 18.37;
		const a = t < s ? mix(-1.2, -0.5, smooth(t, s - 0.4, s)) : -0.5;
		pose = {sit: true, bend: 0.7, armR: a, armL: -0.4, elbow: -0.2};
	}
	const fall = smooth(t, DROP, DROP + 0.35);
	const held = t < DROP || (t > 12.0 && !crouch2);
	const phoneP: V = held ? [0, 1.12, 0.42] : t < 11.4 ? [mix(0, 0.15, fall), mix(1.12, 0.012, ramp(t, DROP, DROP + 0.35) ** 2), mix(0.42, 0.75, fall)] : crouch2 ? [0.3, 0.012, 0.85] : [mix(0.15, 0, pick), mix(0.012, 1.12, pick), mix(0.75, 0.42, pick)];
	const phoneR: V = held ? [close * 0.5 - 0.5, 0, 0] : t < 11.4 ? [mix(-0.5, -Math.PI / 2, fall), fall * 2, 0] : crouch2 ? [-Math.PI / 2, 0.4, 0] : [mix(-Math.PI / 2, -0.5, pick), 0, 0];
	const camX = mix(0.5, 4.5, lookField);
	return (
		<>
			<Cam pos={[mix(camX, 0.05, close), mix(1.5, 1.16, close), mix(3.9, 0.95, close)]} look={[mix(mix(0.2, 5, lookField), 0, close), mix(0.5, 1.12, close), mix(0, 0.42, close)]} fov={mix(42, 34, close)} near={0.02} />
			<Barangay t={t} houses={[-10, -5, 0, 10]} />
			<Paddy position={[5.5, 0, 0.6]} w={4} d={3} n={90} t={t} seed={9} />
			<Person {...GUY} position={[0, 0, 0]} rotationY={crouch || crouch2 ? 1.1 : 0} pose={pose} mouth={mouth} />
			<Phone position={phoneP} rotation={phoneR} cracked={t > 14.6 ? smooth(t, 14.6, 14.75) : 0} />
			<Dust position={[0.7, 0, 0.35]} k={t - 18.37} s={0.6} />
		</>
	);
};

// ================= S8: a rice sprout, everyone eats together =================
export const S8: React.FC<{t: number}> = ({t}) => {
	const sprout = smooth(t, 0.4, 0.9);
	const pull = smooth(t, 1.2, 6.3);
	return (
		<>
			<Cam pos={[mix(0.6, 2.5, pull), mix(1.0, 9, pull), mix(2.2, 12, pull)]} look={[mix(0.2, 1.8, pull), mix(0.5, 0.6, pull), mix(0.5, -0.5, pull)]} fov={44} far={2000} />
			<Barangay t={t} dusk={1} houses={[-10, -5, 0, 10]} />
			<Person {...GUY} position={[0, 0, 0]} rotationY={1.1} pose={{sit: true, bend: 0.5, armR: -0.6, armL: -0.4, headTurn: 0}} mouth={sprout > 0.5} />
			<group position={[0.7, 0, 0.35]} scale={sprout}>
				<Stalk position={[0, 0, 0]} h={0.35} color="#86ad5e" head={false} />
				{[-1, 1].map((k) => (
					<mesh key={k} position={[k * 0.06, 0.3, 0]} rotation={[0, 0, -k * 0.9]} material={mat('#86ad5e')}>
						<boxGeometry args={[0.14, 0.02, 0.04]} />
					</mesh>
				))}
			</group>
			{/* the shared meal */}
			<mesh position={[3, 0.37, -0.4]} material={mat('#8a5f3e')}>
				<boxGeometry args={[2.2, 0.74, 1.1]} />
			</mesh>
			{[-0.6, 0, 0.6].map((x, i) => (
				<Dish key={i} position={[3 + x, 0.75, -0.4]} kind={[3, 1, 0][i]} />
			))}
			<Person {...FARMER} position={[2.4, 0, -1.2]} pose={{armL: -0.9, armR: -0.9 - Math.max(0, Math.sin(t * 3)) * 0.6, elbow: -0.5}} mouth />
			<Person {...LOLA} position={[3.6, 0, -1.2]} pose={{armL: -0.9, armR: -0.9 - Math.max(0, Math.sin(t * 3 + 1)) * 0.6, elbow: -0.5}} mouth />
			<Person {...KID} position={[4.4, 0, -0.3]} rotationY={-1.4} pose={{armL: -0.6, armR: -1.2, elbow: -0.4}} mouth />
			<group position={[1.6, 0, -0.3]} rotation={[0, 1.4, 0]}>
				<Person {...SNOB} pose={{armL: -0.9, armR: -0.9, elbow: -0.5}} mouth />
				<mesh position={[0, 1.78, 0.21]} material={mat('#101014', {roughness: 0.2})}>
					<boxGeometry args={[0.36, 0.07, 0.03]} />
				</mesh>
			</group>
		</>
	);
};
