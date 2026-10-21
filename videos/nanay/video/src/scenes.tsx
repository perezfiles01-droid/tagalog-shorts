import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Cam, Person, Sky, Tree, mat, mix, rand, smooth, walk} from './kit';
import {Barangay, Dish, House} from './props';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// recurring cast
const NANAY = {seed: 1102, shirt: '#c9784a', longHair: true};
const ANAK = {seed: 1201, shirt: '#5b8fc9', pants: '#3b4252', longHair: false};

// ---------- props ----------
const Phone: React.FC<{position?: number[]; rotation?: number[]; glow?: number; red?: number}> = ({position = [0, 0, 0], rotation = [0, 0, 0], glow = 0.6, red = 0}) => (
	<group position={position as V} rotation={rotation as V}>
		<mesh material={mat('#1d1d22', {roughness: 0.3})}>
			<boxGeometry args={[0.08, 0.15, 0.012]} />
		</mesh>
		<mesh position={[0, 0, 0.007]} material={mat(red > 0.5 ? '#ff5a4a' : '#bfe0ff', {emissive: red > 0.5 ? '#ff2a1a' : '#8fc8ff', emissiveIntensity: glow + red * 2})}>
			<boxGeometry args={[0.07, 0.135, 0.002]} />
		</mesh>
	</group>
);

// floating CCTV camera with a blinking red light
const CCTV: React.FC<{position: number[]; s: number; t: number}> = ({position, s, t}) =>
	s <= 0 ? null : (
		<group position={position as V} scale={s} rotation={[0.25, Math.sin(t * 1.5) * 0.5, 0]}>
			<mesh material={mat('#f2f2f0')}>
				<boxGeometry args={[0.34, 0.16, 0.16]} />
			</mesh>
			<mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={mat('#2a2a30', {roughness: 0.2})}>
				<cylinderGeometry args={[0.06, 0.06, 0.06, 12]} />
			</mesh>
			<mesh position={[0.12, 0.05, 0.085]} material={mat('#ff3a2a', {emissive: '#ff2010', emissiveIntensity: Math.sin(t * 8) > 0 ? 2.5 : 0.2})}>
				<sphereGeometry args={[0.02, 8, 6]} />
			</mesh>
		</group>
	);

const Fish: React.FC<{position: number[]; r?: number; c?: string}> = ({position, r = 0, c = '#8fa8b8'}) => (
	<group position={position as V} rotation={[0, r, 0]}>
		<mesh scale={[0.2, 0.06, 0.07]} material={mat(c, {metalness: 0.3, roughness: 0.4})}>
			<sphereGeometry args={[1, 10, 6]} />
		</mesh>
		<mesh position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.3]} material={mat(c)}>
			<coneGeometry args={[0.06, 0.1, 4]} />
		</mesh>
	</group>
);

// the palengke fish stall, Nanay's "office"
const Palengke: React.FC<{t: number}> = ({t}) => (
	<>
		<Sky top="#8fc0e3" bottom="#f1eee2" />
		<fog attach="fog" args={['#eeeadc', 12, 60]} />
		<hemisphereLight args={['#f2efe6', '#5a6248', 1.25]} />
		<directionalLight position={[20, 30, 20]} intensity={2.1} color="#fff1da" />
		<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#b9ad98')}>
			<planeGeometry args={[200, 200]} />
		</mesh>
		{[0, 1].map((k) => (
			<group key={k} position={[k * 3.4 - 0.3, 0, -0.8 - k * 1.2]}>
				<mesh position={[0, 0.42, 0]} material={mat('#8a6f52')}>
					<boxGeometry args={[2.2, 0.84, 0.9]} />
				</mesh>
				<mesh position={[0, 0.86, 0]} material={mat('#e8e6e0')}>
					<boxGeometry args={[2.25, 0.04, 0.95]} />
				</mesh>
				{Array.from({length: 7}).map((_, i) => (
					<Fish key={i} position={[-0.8 + i * 0.26, 0.92, -0.15 + (i % 2) * 0.25]} r={0.3 * (i % 3)} c={i % 3 === 1 ? '#b88a7a' : '#8fa8b8'} />
				))}
				{[-1, 1].map((s) => (
					<mesh key={s} position={[s * 1.05, 1.3, -0.4]} material={mat('#6a5a48')}>
						<cylinderGeometry args={[0.03, 0.03, 2.6, 5]} />
					</mesh>
				))}
				<mesh position={[0, 2.55, 0]} rotation={[0.25, 0, 0]} material={mat(k ? '#4f8a6a' : '#c9503f')}>
					<boxGeometry args={[2.5, 0.05, 1.4]} />
				</mesh>
			</group>
		))}
		<House position={[-6, 0, -9]} color="#e2d6bf" roof="#a85d4a" />
		<House position={[7, 0, -11]} color="#cfd8c4" roof="#7a7f86" />
		<Tree position={[-3.5, 0, -5]} s={1.2} />
		<Person seed={1301} shirt="#6a8f5a" position={[3.6, 0, -2.6]} rotationY={-0.3} pose={{armR: -0.9 + Math.sin(t * 2) * 0.2, elbow: -0.4}} mouth={Math.sin(t * 4) > 0} />
	</>
);

// a room: floor, back and side wall, window, warm light
const Room: React.FC<{wall?: string; floor?: string; night?: number}> = ({wall = '#e9dcc2', floor = '#a9825e'}) => (
	<>
		<color attach="background" args={['#2a2420']} />
		<hemisphereLight args={['#ffe7c7', '#3a2e24', 1.05]} />
		<pointLight position={[0.3, 2.7, 0.4]} intensity={12} distance={10} decay={2} color="#ffcf8f" />
		<directionalLight position={[-2, 5, 4]} intensity={1.3} color="#fff2d6" />
		<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat(floor)}>
			<planeGeometry args={[14, 14]} />
		</mesh>
		<mesh position={[0, 1.6, -2.2]} material={mat(wall)}>
			<boxGeometry args={[14, 3.2, 0.1]} />
		</mesh>
		<mesh position={[-3.0, 1.6, 0]} material={mat(wall)}>
			<boxGeometry args={[0.1, 3.2, 14]} />
		</mesh>
		<mesh position={[1.6, 1.8, -2.14]} material={mat('#fff1d0', {emissive: '#fff1d0', emissiveIntensity: 0.7})}>
			<boxGeometry args={[1.2, 0.9, 0.02]} />
		</mesh>
	</>
);

const Bed: React.FC = () => (
	<group position={[0, 0, -0.8]}>
		<mesh position={[0, 0.2, 0]} material={mat('#8a5f3e')}>
			<boxGeometry args={[1.3, 0.4, 2.2]} />
		</mesh>
		<mesh position={[0, 0.48, 0]} material={mat('#e8e4f0')}>
			<boxGeometry args={[1.22, 0.16, 2.1]} />
		</mesh>
		<mesh position={[0, 0.62, -0.85]} material={mat('#f6f2ea')}>
			<boxGeometry args={[0.7, 0.12, 0.35]} />
		</mesh>
		<mesh position={[0, 0.7, -1.12]} material={mat('#7a5232')}>
			<boxGeometry args={[1.3, 1.4, 0.08]} />
		</mesh>
		<mesh position={[0.1, 0.57, 0.5]} material={mat('#9ab8d8')}>
			<boxGeometry args={[1.1, 0.04, 0.9]} />
		</mesh>
	</group>
);

// chips wrappers and a soda can around the bed
const Snacks: React.FC = () => {
	const items = useMemo(() => {
		const g = rand(77);
		return Array.from({length: 7}).map((_, i) => ({x: -0.9 + g() * 1.8, z: -0.2 + g() * 1.2, r: g() * 6, c: ['#e04a3a', '#f0c040', '#3a8ad0'][i % 3]}));
	}, []);
	return (
		<>
			{items.map((it, i) => (
				<mesh key={i} position={[it.x, i < 3 ? 0.58 : 0.02, it.z]} rotation={[0, it.r, 0.2]} material={mat(it.c)}>
					<boxGeometry args={[0.14, 0.02, 0.1]} />
				</mesh>
			))}
			<mesh position={[0.85, 0.07, 0.3]} material={mat('#c93a3a', {metalness: 0.5, roughness: 0.3})}>
				<cylinderGeometry args={[0.04, 0.04, 0.13, 10]} />
			</mesh>
		</>
	);
};

// the kid lying on the bed, phone up
const Lying: React.FC<{t: number; up: number}> = ({t, up}) => (
	<group position={[0, 0.56 + up * 0.02, mix(0.3, -0.1, up)]} rotation={[mix(-Math.PI / 2, -0.15, up), 0, 0]}>
		<Person {...ANAK} pose={{armL: -1.3, armR: -1.3, elbow: -1.3, headTurn: Math.sin(t * 0.7) * 0.1 * (1 - up), sit: up > 0.5}} mouth={up > 0.3}>
			<Phone position={[0, 0.02, 0.08]} rotation={[-0.4, 0, 0]} />
		</Person>
	</group>
);

const Sweat: React.FC<{t: number; at: number; pos: number[]}> = ({t, at, pos}) => {
	const k = (t - at) / 0.9;
	if (k < 0 || k > 3) return null;
	return (
		<>
			{[-1, 1].map((s) => {
				const u = k % 1;
				return (
					<mesh key={s} position={[pos[0] + s * (0.15 + u * 0.12), pos[1] + 0.05 - u * u * 0.3, pos[2]]} scale={[0.03, 0.045, 0.03]} material={mat('#8fd0ff', {emissive: '#5ab0ff', emissiveIntensity: 0.5})}>
						<sphereGeometry args={[1, 8, 6]} />
					</mesh>
				);
			})}
		</>
	);
};

// ---------- overlays ----------
// a chat bubble from Nanay, popping in near the top
const Bubble: React.FC<{t: number; at: number; until: number; from?: string; text: string; me?: boolean; y?: number}> = ({t, at, until, from = 'Nanay', text, me = false, y = 300}) => {
	const o = interpolate(t, [at, at + 0.15, until - 0.3, until], [0, 1, 1, 0], clampI);
	if (o <= 0) return null;
	const k = interpolate(t, [at, at + 0.35], [0, 1], clampI);
	return (
		<AbsoluteFill style={{alignItems: me ? 'flex-end' : 'flex-start', paddingTop: y, paddingLeft: 90, paddingRight: 90, opacity: o}}>
			<div style={{transform: `scale(${0.6 + 0.4 * k + Math.sin(k * Math.PI) * 0.08})`, transformOrigin: me ? 'right top' : 'left top', maxWidth: 760}}>
				{me ? null : <div style={{fontFamily: 'sans-serif', fontWeight: 700, fontSize: 34, color: '#fff', marginLeft: 24, marginBottom: 8, textShadow: '0 2px 8px rgba(0,0,0,0.7)'}}>{from}</div>}
				<div style={{background: me ? '#3a8ad0' : '#fbfaf5', color: me ? '#fff' : '#1d1a18', fontFamily: 'sans-serif', fontWeight: 600, fontSize: 54, lineHeight: 1.2, padding: '28px 40px', borderRadius: 44, borderTopLeftRadius: me ? 44 : 10, borderTopRightRadius: me ? 10 : 44, boxShadow: '0 12px 40px rgba(0,0,0,0.45)'}}>{text}</div>
			</div>
		</AbsoluteFill>
	);
};

const Tag: React.FC<{text: string; sub?: string; o: number; y: number; color?: string; size?: number}> = ({text, sub, o, y, color = '#fff', size = 170}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: y, opacity: o}}>
		<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, color, textShadow: '0 6px 30px rgba(0,0,0,0.6)', transform: `scale(${0.7 + 0.3 * o})`}}>{text}</div>
		{sub ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 64, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,0.7)', marginTop: -6}}>{sub}</div> : null}
	</AbsoluteFill>
);

// ================= S1: Nanay at the palengke senses something =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const sense = smooth(t, 6.5, 7.2);
	const cam = smooth(t, 0, 12.8);
	return (
		<>
			<Cam pos={[mix(1.6, 0.6, cam), mix(1.5, 1.6, cam), mix(4.4, 3.3, cam)]} look={[0, mix(1.15, 1.55, smooth(t, 9.5, 11.5)), -0.6]} fov={42} />
			<Palengke t={t} />
			<Person {...NANAY} position={[0, 0, 0.1]} rotationY={mix(Math.PI * 0.85, 0.15, smooth(t, 6.2, 7.0))} pose={{armR: -1.1 * (1 - sense), elbow: -0.4, headTurn: sense * Math.sin(t * 2.5) * 0.25, bend: 0.15 * (1 - sense)}}>
				{t < 6.6 ? <Fish position={[0, -0.05, 0.1]} r={Math.PI / 2} /> : null}
			</Person>
			<CCTV position={[0, 2.45 + Math.sin(t * 2) * 0.03, 0.1]} s={smooth(t, 10.8, 11.3)} t={t} />
		</>
	);
};

// ================= S2: the kid in bed, then the first message =================
export const S2: React.FC<{t: number}> = ({t}) => {
	const up = smooth(t, 10.0, 10.4);
	return (
		<>
			<Cam pos={[mix(1.8, 1.4, smooth(t, 0, 14)), mix(2.0, 1.7, smooth(t, 0, 14)), mix(2.3, 1.9, smooth(t, 0, 14))]} look={[0, 0.6, -0.6]} fov={44} />
			<Room />
			<Bed />
			<Snacks />
			<Lying t={t} up={up} />
			<Sweat t={t} at={12.6} pos={[0, 1.15, -0.1]} />
		</>
	);
};
export const O2: React.FC<{t: number}> = ({t}) => <Bubble t={t} at={9.6} until={14.6} text="Wala ka bang ginagawa diyan?" />;

// ================= S3: "Nag-aaral po ako, Ma!" ... the dance trend =================
export const S3: React.FC<{t: number}> = ({t}) => {
	const stand = smooth(t, 5.3, 5.9);
	const d = t > 5.9 ? t - 5.9 : 0;
	return (
		<>
			<Cam pos={[mix(1.4, 0.6, smooth(t, 0, 10)), mix(1.6, 1.9, stand), mix(2.8, 3.8, smooth(t, 0, 10))]} look={[0, mix(1.25, 1.45, stand), -0.4]} fov={44} />
			<Room />
			<Bed />
			<Snacks />
			{stand <= 0 ? (
				<group position={[0, 0.56, -0.1]} rotation={[-0.15, 0, 0]}>
					<Person {...ANAK} pose={{sit: true, armL: -1.25, armR: -1.25 + Math.sin(t * 22) * 0.06, elbow: -1.3}} mouth={t > 2.0 && t < 3.5}>
						<Phone position={[0, 0.02, 0.08]} rotation={[-0.4, 0, 0]} />
					</Person>
				</group>
			) : (
				<Person {...ANAK} position={[0, 0.56, -0.5]} rotationY={Math.sin(d * 3) * 0.5} pose={{armL: -2.3 + Math.sin(d * 7) * 0.6, armR: -0.5 + Math.sin(d * 7 + 2) * 0.9, spreadL: 0.4, spreadR: 0.4 + Math.sin(d * 7) * 0.3, bob: Math.abs(Math.sin(d * 7)) * 0.06, headTurn: Math.sin(d * 3.5) * 0.3}} mouth>
					<Phone position={[0, 0.02, 0.06]} />
				</Person>
			)}
		</>
	);
};
export const O3: React.FC<{t: number}> = ({t}) => <Bubble t={t} at={2.2} until={5.4} me text="Nag-aaral po ako, Ma!" />;

// ================= S4 (silent): the victory dance and the countdown =================
export const S4: React.FC<{t: number}> = ({t}) => {
	const red = t > 7.0 ? 1 : 0;
	const freeze = t > 7.0;
	const d = freeze ? 7.0 : t;
	return (
		<>
			<Cam pos={[mix(-0.6, 0.5, smooth(t, 0, 8.5)), 1.9, mix(4.0, 3.4, smooth(t, 0, 8.5))]} look={[0, 1.45, -0.5]} fov={42} />
			<Room />
			<Bed />
			<Snacks />
			<Person {...ANAK} position={[0, 0.56, -0.5]} rotationY={freeze ? 0 : Math.sin(d * 4) * 0.6} pose={freeze ? {armL: -2.3, armR: -2.3, spreadL: 0.5, spreadR: 0.5} : {armL: -2.6 + Math.sin(d * 8) * 0.4, armR: -2.6 + Math.sin(d * 8 + 3) * 0.4, spreadL: 0.6, spreadR: 0.6, bob: Math.abs(Math.sin(d * 8)) * 0.08, headTurn: Math.sin(d * 4) * 0.4}} mouth>
				<Phone position={[0, 0.02, 0.06]} red={red} glow={0.6 + (red ? Math.abs(Math.sin(t * 12)) : 0)} />
			</Person>
			{red ? <pointLight position={[0, 1.6, 0.2]} intensity={6} distance={3} color="#ff3a2a" /> : null}
		</>
	);
};
export const O4: React.FC<{t: number}> = ({t}) => {
	const n = Math.floor((t - 2.0) / 0.95);
	const show = t >= 2.0 && n < 5;
	const k = show ? ((t - 2.0) % 0.95) / 0.95 : 0;
	const flash = interpolate(t, [7.0, 7.1, 7.6, 8.5], [0, 0.35, 0.15, 0], clampI);
	return (
		<>
			{show ? <Tag text={String(5 - n)} color={n === 4 ? '#ff5a4a' : '#fff'} size={240} o={interpolate(k, [0, 0.15, 0.8, 1], [0, 1, 1, 0])} y={290} /> : null}
			<AbsoluteFill style={{backgroundColor: '#ff2a1a', opacity: flash}} />
		</>
	);
};

// ================= S5: the second message, WAIT LANG, she's in another city =================
export const S5: React.FC<{t: number}> = ({t}) => {
	const wait = smooth(t, 8.1, 8.4);
	if (t >= 10.3) {
		// aerial: from the house across town to the palengke
		const k = smooth(t, 10.3, 12.6);
		return (
			<>
				<Cam pos={[mix(-10, 10, k), 16, 14]} look={[mix(-10, 10, k), 0, -2]} fov={44} far={2000} />
				<Barangay t={t} houses={[-20, -15, -10, -5, 0, 5, 10]} extraRows />
				<group position={[16, 0, 2]}>
					<mesh position={[0, 1.2, 0]} rotation={[0.2, 0, 0]} material={mat('#c9503f')}>
						<boxGeometry args={[3, 0.1, 2]} />
					</mesh>
					<Person {...NANAY} position={[0, 0, 0.6]} scale={1.6} pose={{armR: -1.1, elbow: -0.4}}>
						<Phone position={[0, 0.02, 0.06]} />
					</Person>
				</group>
			</>
		);
	}
	return (
		<>
			<Cam pos={[0.4, 1.6, mix(3.8, 3.2, smooth(t, 0, 8))]} look={[0, 1.35, 0.3]} fov={40} />
			<Room />
			<Bed />
			<Person {...ANAK} position={[0, 0, 0.4]} pose={wait > 0 ? {armL: -2.6 * wait, armR: -1.2, spreadL: 0.6 * wait, elbow: -0.5, bend: -0.1 * wait} : {armL: -1.1, armR: -1.1, elbow: -0.6}} mouth={t > 4.5}>
				<Phone position={[0, 0.02, 0.06]} />
			</Person>
			{/* eyes popping */}
			{wait > 0
				? [-1, 1].map((s) => (
						<mesh key={s} position={[s * 0.08, 1.7, 0.4 + 0.2 + wait * 0.1]} scale={0.035 + wait * 0.03} material={mat('#ffffff')}>
							<sphereGeometry args={[1, 10, 8]} />
						</mesh>
					))
				: null}
			<Sweat t={t} at={8.4} pos={[0, 1.9, 0.5]} />
		</>
	);
};
export const O5: React.FC<{t: number}> = ({t}) => (
	<>
		<Bubble t={t} at={4.3} until={8.0} text="Eh, bakit hindi ka pa naghuhugas ng plato?" />
		<Tag text="WAIT LANG!" color={GOLD} size={150} o={interpolate(t, [8.1, 8.35, 9.9, 10.2], [0, 1, 1, 0], clampI)} y={320} />
	</>
);

// ================= S6: the panic cleaning montage =================
export const S6: React.FC<{t: number}> = ({t}) => {
	const n = Math.max(0, Math.min(20, Math.floor((t - 3.0) * 2.2)));
	const scrub = t > 3.0 && t < 12.3;
	return (
		<>
			<Cam pos={[mix(1.4, 0.8, smooth(t, 0, 13)), 1.7, mix(2.2, 1.8, smooth(t, 0, 13))]} look={[-0.2, 1.0, -1.8]} fov={44} />
			<color attach="background" args={['#221d1a']} />
			<hemisphereLight args={['#ffe7c7', '#3a2e24', 1.0]} />
			<pointLight position={[0.2, 2.6, -0.6]} intensity={10} distance={9} decay={2} color="#ffcf8f" />
			<directionalLight position={[-1, 4, 3]} intensity={1.4} color="#fff2d6" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#9a7656')}>
				<planeGeometry args={[12, 12]} />
			</mesh>
			<mesh position={[0, 1.6, -3]} material={mat('#e7d9bd')}>
				<boxGeometry args={[12, 3.2, 0.1]} />
			</mesh>
			<mesh position={[-0.2, 0.45, -2.4]} material={mat('#7a6a5a')}>
				<boxGeometry args={[3.2, 0.9, 0.9]} />
			</mesh>
			<mesh position={[-0.2, 0.92, -2.4]} material={mat('#c9bba4')}>
				<boxGeometry args={[3.25, 0.05, 0.95]} />
			</mesh>
			{/* sink + faucet */}
			<mesh position={[-0.6, 0.93, -2.4]} material={mat('#aab0b6', {metalness: 0.5, roughness: 0.3})}>
				<boxGeometry args={[0.7, 0.03, 0.5]} />
			</mesh>
			<mesh position={[-0.6, 1.15, -2.7]} material={mat('#9aa0a6', {metalness: 0.6, roughness: 0.3})}>
				<cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
			</mesh>
			<Person {...ANAK} position={[-0.6, 0, -1.75]} rotationY={Math.PI + (t > 11.6 && t < 12.6 ? -1.6 : 0)} pose={{armL: -1.2 + (scrub ? Math.sin(t * 16) * 0.2 : 0), armR: -1.2 - (scrub ? Math.sin(t * 16) * 0.2 : 0), elbow: -0.6, headTurn: t > 11.6 && t < 12.6 ? 0.6 : 0}} />
			{/* the stack of clean dishes, pots, pans and spoons */}
			{Array.from({length: n}).map((_, i) => {
				const kind = i < 8 ? 0 : i < 11 ? 1 : i < 14 ? 2 : 3;
				const x = kind === 0 ? 0.35 : kind === 1 ? 0.75 : kind === 2 ? 1.05 : 0.15 + (i - 14) * 0.08;
				const y = kind === 0 ? 0.97 + i * 0.03 : kind === 1 ? 1.0 + (i - 8) * 0.12 : kind === 2 ? 0.97 + (i - 11) * 0.04 : 0.96;
				const pop = smooth(t, 3.0 + i / 2.2, 3.0 + i / 2.2 + 0.25);
				return kind === 0 ? (
					<mesh key={i} position={[x, y, -2.35]} scale={pop} material={mat('#fbfaf5', {emissive: '#ffffff', emissiveIntensity: 0.15})}>
						<cylinderGeometry args={[0.16, 0.12, 0.025, 14]} />
					</mesh>
				) : kind === 1 ? (
					<mesh key={i} position={[x, y, -2.35]} scale={pop} material={mat('#5a5a60', {metalness: 0.5, roughness: 0.4})}>
						<cylinderGeometry args={[0.14, 0.12, 0.11, 12]} />
					</mesh>
				) : kind === 2 ? (
					<mesh key={i} position={[x, y, -2.35]} scale={pop} material={mat('#2e2e32', {metalness: 0.4, roughness: 0.4})}>
						<cylinderGeometry args={[0.15, 0.1, 0.035, 12]} />
					</mesh>
				) : (
					<mesh key={i} position={[x, y, -2.1]} rotation={[0, 0, Math.PI / 2]} scale={pop} material={mat('#c8ccd2', {metalness: 0.7, roughness: 0.25})}>
						<cylinderGeometry args={[0.008, 0.008, 0.18, 5]} />
					</mesh>
				);
			})}
			{/* sparkles */}
			{scrub
				? [0, 1, 2, 3].map((i) => {
						const u = (t * 1.3 + i * 0.25) % 1;
						return (
							<mesh key={i} position={[0.2 + i * 0.25, 1.1 + u * 0.5, -2.2]} scale={Math.sin(u * Math.PI) * 0.04} material={mat('#fff6b0', {emissive: '#ffe060', emissiveIntensity: 1.5})}>
								<octahedronGeometry args={[1, 0]} />
							</mesh>
						);
					})
				: null}
			<Phone position={[0.7, 0.96, -2.0]} rotation={[-Math.PI / 2, 0, 0.3]} glow={t > 11.6 ? 1.6 : 0.4} />
		</>
	);
};
export const O6: React.FC<{t: number}> = ({t}) => {
	const n = Math.max(0, Math.min(20, Math.floor((t - 3.0) * 2.2)));
	return <Tag text={`×${n}`} color={GOLD} size={150} o={interpolate(t, [3.2, 3.6, 12.0, 12.6], [0, 1, 1, 0], clampI)} y={300} />;
};

// ================= S7: rest? no. the call, the walis, the employee ID =================
export const S7: React.FC<{t: number}> = ({t}) => {
	const flop = smooth(t, 2.2, 2.8);
	const up = smooth(t, 6.3, 6.9);
	const sweep = t > 8.6;
	const walkIn = smooth(t, 0, 2.2);
	return (
		<>
			<Cam pos={[mix(1.9, 1.2, smooth(t, 0, 16.6)), 1.6, mix(3.2, 2.7, smooth(t, 0, 16.6))]} look={[0, 0.8, -0.8]} fov={44} />
			<Room wall="#dfe6d8" floor="#b08a62" />
			{/* sofa */}
			<group position={[0, 0, -1.5]}>
				<mesh position={[0, 0.25, 0]} material={mat('#8a5a7a')}>
					<boxGeometry args={[2.0, 0.5, 0.8]} />
				</mesh>
				<mesh position={[0, 0.7, -0.32]} material={mat('#7a4e6c')}>
					<boxGeometry args={[2.0, 0.6, 0.18]} />
				</mesh>
				{[-1, 1].map((s) => (
					<mesh key={s} position={[s * 1.0, 0.45, 0]} material={mat('#7a4e6c')}>
						<boxGeometry args={[0.18, 0.5, 0.8]} />
					</mesh>
				))}
			</group>
			{up <= 0 ? (
				<Person {...ANAK} position={[mix(1.6, 0, walkIn), flop > 0.5 ? 0.06 : 0, mix(0.2, -1.4, walkIn)]} rotationY={walkIn < 1 ? mix(-2.4, 0, flop) : 0} pose={flop > 0.5 ? {sit: true, armL: 0.6, armR: 0.6, spreadL: 0.6, spreadR: 0.6} : {...walk(t, 1.0), bend: 0.2}} mouth={t > 5.4}>
					{t > 5.4 ? <Phone position={[0, 0.02, 0.06]} glow={1.4} /> : null}
				</Person>
			) : (
				<Person {...ANAK} position={[mix(0, 0.4, up) + (sweep ? Math.sin(t * 1.2) * 0.25 : 0), 0, -0.9]} rotationY={-0.3} pose={{armL: -0.9 + (sweep ? Math.sin(t * 6) * 0.25 : 0), armR: -0.7 + (sweep ? Math.sin(t * 6) * 0.25 : 0), elbow: -0.3, bend: 0.25}} mouth={t > 13.9}>
					{sweep ? (
						<group rotation={[0.6, 0, 0]}>
							<mesh position={[0, -0.35, 0.1]} material={mat('#b8946a')}>
								<cylinderGeometry args={[0.015, 0.015, 0.9, 5]} />
							</mesh>
							<mesh position={[0, -0.85, 0.1]} material={mat('#d9c27a')}>
								<coneGeometry args={[0.12, 0.3, 8]} />
							</mesh>
						</group>
					) : null}
				</Person>
			)}
		</>
	);
};
export const O7: React.FC<{t: number}> = ({t}) => {
	const call = interpolate(t, [5.3, 5.5, 8.4, 8.8], [0, 1, 1, 0], clampI);
	const id = interpolate(t, [14.2, 14.6, 16.4, 16.8], [0, 1, 1, 0], clampI);
	const ring = Math.sin(t * 30) * 4 * (t < 6.5 ? 1 : 0);
	return (
		<>
			{call > 0 ? (
				<AbsoluteFill style={{alignItems: 'center', paddingTop: 300, opacity: call}}>
					<div style={{background: '#fbfaf5', borderRadius: 44, padding: '30px 54px', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', transform: `rotate(${ring}deg) scale(${0.7 + 0.3 * call})`, fontFamily: 'sans-serif', textAlign: 'center'}}>
						<div style={{fontSize: 40, color: '#6a6460', fontWeight: 600}}>Tumatawag...</div>
						<div style={{fontSize: 76, color: '#1d1a18', fontWeight: 800}}>Nanay</div>
					</div>
				</AbsoluteFill>
			) : null}
			{id > 0 ? (
				<AbsoluteFill style={{alignItems: 'center', paddingTop: 280, opacity: id}}>
					<div style={{background: '#fbfaf5', borderRadius: 30, width: 560, padding: '26px 30px', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', transform: `rotate(-4deg) scale(${0.6 + 0.4 * id})`, textAlign: 'center', borderTop: '22px solid #d33a2c'}}>
						<div style={{fontFamily: 'sans-serif', fontSize: 34, letterSpacing: 4, color: '#6a6460', fontWeight: 700}}>EMPLOYEE ID</div>
						<div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 92, fontWeight: 700, color: '#1d1a18'}}>Anak</div>
						<div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, fontWeight: 600, color: '#d33a2c'}}>Sweldo: ₱0.00</div>
					</div>
				</AbsoluteFill>
			) : null}
		</>
	);
};

// ================= S8: the reveal: the neighbors' group chat =================
export const S8: React.FC<{t: number}> = ({t}) => {
	const pull = smooth(t, 9.0, 15.6);
	const wink = t > 12.0 && t < 12.6;
	const peek = smooth(t, 7.2, 7.8);
	return (
		<>
			<Cam pos={[mix(0.4, 3, pull), mix(1.4, 22, pull * pull), mix(3.4, 22, pull)]} look={[mix(0.2, 0, pull), mix(1.1, 0, pull), mix(-0.4, -4, pull)]} fov={44} far={2000} />
			<Palengke t={t} />
			{/* Nanay and the titas, all on their phones */}
			<Person {...NANAY} position={[0, 0, 0.3]} rotationY={0.1} pose={{armL: -1.1, armR: wink ? -2.2 : -1.1, elbow: -0.6}} mouth={t > 3 && t < 5}>
				<Phone position={[0, 0.02, 0.06]} glow={1.2} />
			</Person>
			{[[-0.9, 0.0, 0.5, 1401, '#8a6f9f'], [0.9, 0.1, -0.5, 1402, '#6f8f86'], [-0.4, -0.7, 0.2, 1403, '#d98a8a']].map(([x, z, r, sd, c], i) => (
				<Person key={i} seed={sd as number} shirt={c as string} longHair position={[x as number, 0, z as number]} rotationY={r as number} pose={{armL: -1.1, armR: -1.1 + Math.max(0, Math.sin(t * 3 + i)) * 0.3, elbow: -0.6, headTurn: Math.sin(t * 1.5 + i) * 0.2}} mouth={Math.sin(t * 5 + i * 2) > 0.3}>
					<Phone position={[0, 0.02, 0.06]} glow={1.2} />
				</Person>
			))}
			{wink ? (
				<mesh position={[0.06, 1.4, 0.48]} material={mat('#1d1a18')}>
					<boxGeometry args={[0.08, 0.014, 0.01]} />
				</mesh>
			) : null}
			{/* the neighbor peeking from the window, binoculars up */}
			<Person seed={1404} shirt="#c9a23a" position={[-6 + 1.2, mix(-0.6, 0.4, peek), -9 + 1.9]} pose={{armL: -1.5, armR: -1.5, elbow: -1.4}} />
		</>
	);
};
export const O8: React.FC<{t: number}> = ({t}) => {
	const o = interpolate(t, [5.3, 5.6, 9.4, 9.9], [0, 1, 1, 0], clampI);
	if (o <= 0) return null;
	const msgs = [
		['Aling Bebang', 'Nakahiga pa rin si bunso mo', 5.8],
		['Tita Marites', 'Di pa naghuhugas ng plato!', 6.6],
		['Ka Lorna', 'Nagsasayaw sa kama', 7.4],
	] as const;
	return (
		<AbsoluteFill style={{alignItems: 'center', paddingTop: 230, opacity: o}}>
			<div style={{width: 860, background: 'rgba(251,250,245,0.97)', borderRadius: 40, overflow: 'hidden', boxShadow: '0 14px 50px rgba(0,0,0,0.5)', transform: `scale(${0.8 + 0.2 * o})`, fontFamily: 'sans-serif'}}>
				<div style={{background: '#3a8a5a', color: '#fff', fontWeight: 800, fontSize: 44, padding: '22px 34px'}}>Mga Marites ng Purok 3</div>
				<div style={{padding: '18px 28px 26px'}}>
					{msgs.map(([who, text, at], i) => {
						const k = interpolate(t, [at, at + 0.25], [0, 1], clampI);
						return (
							<div key={i} style={{opacity: k, transform: `translateY(${(1 - k) * 20}px)`, marginBottom: 14}}>
								<div style={{fontSize: 28, fontWeight: 700, color: '#6a6460'}}>{who}</div>
								<div style={{display: 'inline-block', background: '#e8e4dc', borderRadius: 26, padding: '12px 24px', fontSize: 40, fontWeight: 600, color: '#1d1a18'}}>{text}</div>
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
