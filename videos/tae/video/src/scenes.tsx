import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Cam, Person, Sky, Tree, mat, mix, mixV, rand, ramp, smooth, walk} from './kit';
import {Barangay, Dish, House} from './props';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------- props ----------
// a cute cartoon poop: stacked brown swirls with a little tip
export const Mound: React.FC<{position: number[]; s?: number; stink?: number; t?: number}> = ({position, s = 1, stink = 1, t = 0}) => (
	<group position={position as V} scale={s}>
		{[[0.0, 0.32, 0.12], [0.2, 0.25, 0.1], [0.36, 0.17, 0.08]].map(([y, r, tube], i) => (
			<mesh key={i} position={[0, 0.08 + y, 0]} rotation={[Math.PI / 2, 0, i]} material={mat('#7a4e2e')}>
				<torusGeometry args={[r, tube, 6, 14]} />
			</mesh>
		))}
		<mesh position={[0, 0.58, 0]} material={mat('#6a4226')}>
			<coneGeometry args={[0.09, 0.18, 7]} />
		</mesh>
		{stink > 0
			? [-1, 0, 1].map((k) => (
					<mesh key={k} position={[k * 0.2, 0.85 + Math.sin(t * 3 + k) * 0.05, 0]} rotation={[0, 0, Math.PI / 2 + Math.sin(t * 2.5 + k) * 0.3]}>
						<torusGeometry args={[0.1, 0.012, 4, 10, Math.PI * 1.4]} />
						<meshStandardMaterial color="#9aa65a" transparent opacity={0.7 * stink} flatShading depthWrite={false} />
					</mesh>
				))
			: null}
	</group>
);

export const Fly: React.FC<{position: number[]; rotationY?: number; t: number; s?: number; shades?: boolean; glowFeet?: number; dance?: number; flap?: boolean}> = ({position, rotationY = 0, t, s = 1, shades = false, glowFeet = 0, dance = 0, flap = true}) => {
	const w = flap ? Math.sin(t * 60) * 0.5 : 0.2;
	const legM = glowFeet > 0 ? mat('#ffd84a', {emissive: '#ffc020', emissiveIntensity: glowFeet * 1.5}) : mat('#2a2a2e');
	return (
		<group position={position as V} rotation={[0, rotationY + Math.sin(t * 10) * 0.3 * dance, Math.sin(t * 12) * 0.25 * dance]} scale={s * 0.12}>
			<mesh position={[0, 0.5, -0.25]} rotation={[Math.PI / 2, 0, 0]} material={mat('#3a3a40')}>
				<capsuleGeometry args={[0.28, 0.5, 3, 8]} />
			</mesh>
			<mesh position={[0, 0.55, 0.35]} material={mat('#2e2e34')}>
				<sphereGeometry args={[0.26, 10, 8]} />
			</mesh>
			{[-1, 1].map((k) => (
				<mesh key={k} position={[k * 0.17, 0.62, 0.45]} material={mat('#b8322a', {roughness: 0.4})}>
					<sphereGeometry args={[0.15, 10, 8]} />
				</mesh>
			))}
			{shades ? (
				<mesh position={[0, 0.64, 0.6]} material={mat('#101014', {roughness: 0.2})}>
					<boxGeometry args={[0.62, 0.1, 0.04]} />
				</mesh>
			) : null}
			{[-1, 1].map((k) => (
				<mesh key={'w' + k} position={[k * 0.35, 0.82, -0.2]} rotation={[0, 0, k * (0.3 + w)]} scale={[1, 0.08, 0.55]}>
					<sphereGeometry args={[0.45, 10, 6]} />
					<meshStandardMaterial color="#dfe8f0" transparent opacity={0.45} flatShading depthWrite={false} />
				</mesh>
			))}
			{[-0.2, 0, 0.2].flatMap((z, i) =>
				[-1, 1].map((k) => (
					<mesh key={`l${i}${k}`} position={[k * 0.3, 0.2, z]} rotation={[0, 0, k * 0.6]} material={legM}>
						<cylinderGeometry args={[0.025, 0.025, 0.5, 4]} />
					</mesh>
				)),
			)}
		</group>
	);
};

// flies circling a point
const Swarm: React.FC<{center: number[]; t: number; n: number; r?: number; shades?: boolean; land?: number}> = ({center, t, n, r = 0.6, shades = true, land = 0}) => {
	const seeds = useMemo(() => Array.from({length: 24}).map((_, i) => {
		const g = rand(i + 900);
		return [g() * 6.28, 0.7 + g() * 0.8, g() * 0.5, g()];
	}), []);
	return (
		<>
			{seeds.slice(0, n).map((sd, i) => {
				const a = sd[0] + t * sd[1] * 2.2;
				const rr = r * (0.6 + sd[3] * 0.6) * (1 - land * 0.6);
				return <Fly key={i} position={[center[0] + Math.cos(a) * rr, center[1] + 0.3 + sd[2] + Math.sin(t * 3 + i) * 0.08 - land * (0.25 + sd[2]), center[2] + Math.sin(a) * rr]} rotationY={-a} t={t + i} shades={shades && i % 3 === 0} />;
			})}
		</>
	);
};

const Backyard: React.FC<{t: number; dusk?: number}> = ({t, dusk = 0}) => (
	<>
		<Sky top={dusk ? '#5f5a8a' : '#8fc0e3'} bottom={dusk ? '#f2a76a' : '#f1eee2'} />
		<fog attach="fog" args={[dusk ? '#f2a76a' : '#eeeadc', 14, 70]} />
		<hemisphereLight args={['#f2efe6', '#5a6248', 1.25]} />
		<directionalLight position={[20, 30, 20]} intensity={2.1} color="#fff1da" />
		<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#8faa64')}>
			<planeGeometry args={[200, 200]} />
		</mesh>
		{Array.from({length: 14}).map((_, i) => (
			<mesh key={i} position={[-3.5 + i * 0.55, 0.5, -3]} material={mat('#c9a978')}>
				<boxGeometry args={[0.12, 1.0, 0.06]} />
			</mesh>
		))}
		<mesh position={[0.1, 0.8, -3]} material={mat('#b8946a')}>
			<boxGeometry args={[7.6, 0.08, 0.05]} />
		</mesh>
		<House position={[-4, 0, -7]} color="#e2d6bf" roof="#a85d4a" />
		<Tree position={[3.2, 0, -4]} s={1.3} />
	</>
);

// ================= S1: the fly party =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const n = Math.min(14, Math.floor(1 + Math.max(0, t - 1.2) * 1.6));
	return (
		<>
			<Cam pos={[mix(0.4, 0.1, smooth(t, 0, 12)), 1.2, mix(3.4, 2.7, smooth(t, 0, 12))]} look={[0, 0.5, -0.3]} fov={44} />
			<Backyard t={t} />
			<Mound position={[0, 0, -0.3]} t={t} />
			<Swarm center={[0, 0.4, -0.3]} t={t} n={n} />
			<Person seed={1101} shirt="#d9b44a" scale={0.72} position={[0.9, 0, 0.3]} rotationY={-0.9} pose={{armL: 0.05, armR: -0.4, bend: 0.25, headTurn: Math.sin(t * 0.8) * 0.3}} />
		</>
	);
};

// ================= S2: "hindi, kahit kailan!" =================
export const S2: React.FC<{t: number}> = ({t}) => {
	const pull = smooth(t, 2.0, 2.8);
	const kid: V = [mix(0.45, 1.3, pull), 0, mix(0.0, 0.5, pull)];
	return (
		<>
			<Cam pos={[0.5, 1.3, 3.4]} look={[0.4, 0.6, -0.2]} fov={46} />
			<Backyard t={t} />
			<Mound position={[0, 0, -0.3]} t={t} />
			<Swarm center={[0, 0.4, -0.3]} t={t} n={14} />
			<Person seed={1101} shirt="#d9b44a" scale={0.72} position={kid} rotationY={-0.9} pose={{armL: -0.6 * (1 - pull), armR: -1.1 * (1 - pull), bend: 0.7 * (1 - pull), bob: 0}} />
			<Person seed={1102} shirt="#c9784a" longHair position={mixV([2.6, 0, 0.6], [1.75, 0, 0.6], smooth(t, 1.2, 2.0))} rotationY={-1.6} pose={{...(t > 1.2 && t < 2.0 ? walk(t, 1.2) : {}), armR: -2.3, spreadR: 0.2, armL: -0.8 * pull}} mouth={t > 1.8}>
				<mesh position={[0, -0.05, 0.06]} rotation={[0.3, 0, 0]} material={mat('#4f7aa3')}>
					<boxGeometry args={[0.12, 0.03, 0.3]} />
				</mesh>
			</Person>
		</>
	);
};
export const O2: React.FC<{t: number}> = ({t}) => {
	const k = interpolate(t, [1.9, 2.2], [0, 1], clampI);
	const o = interpolate(t, [1.9, 2.0, 5.0, 5.6], [0, 1, 1, 0], clampI);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 330, opacity: o}}>
			<div style={{fontFamily: 'sans-serif', fontWeight: 900, fontSize: 420, color: '#d33a2c', lineHeight: 1, transform: `scale(${2.2 - k * 1.2}) rotate(-8deg)`, textShadow: '0 10px 40px rgba(0,0,0,0.4)'}}>✕</div>
		</AbsoluteFill>
	);
};

// ================= S3: the poop "menu" =================
const Drop: React.FC<{position: number[]; s?: number}> = ({position, s = 1}) => (
	<group position={position as V} scale={s}>
		<mesh material={mat('#6fb8e8', {emissive: '#3f88c8', emissiveIntensity: 0.4})}>
			<sphereGeometry args={[0.1, 10, 8]} />
		</mesh>
		<mesh position={[0, 0.11, 0]} material={mat('#6fb8e8', {emissive: '#3f88c8', emissiveIntensity: 0.4})}>
			<coneGeometry args={[0.07, 0.14, 8]} />
		</mesh>
	</group>
);
const Germ: React.FC<{position: number[]; color: string; s?: number}> = ({position, color, s = 1}) => (
	<group position={position as V} scale={s}>
		<mesh material={mat(color, {emissive: color, emissiveIntensity: 0.3})}>
			<icosahedronGeometry args={[0.07, 1]} />
		</mesh>
		{[-1, 1].map((k) => (
			<mesh key={k} position={[k * 0.025, 0.02, 0.06]} material={mat('#ffffff')}>
				<sphereGeometry args={[0.016, 5, 4]} />
			</mesh>
		))}
	</group>
);
export const S3: React.FC<{t: number}> = ({t}) => {
	const items = useMemo(() => {
		const g = rand(303);
		return Array.from({length: 18}).map((_, i) => ({kind: i % 3, a: g() * 6.28, h: 0.6 + g() * 0.9, r: 0.5 + g() * 0.5, at: 1.0 + i * 0.35}));
	}, []);
	return (
		<>
			<Cam pos={[0.2, 0.9, mix(2.0, 1.6, smooth(t, 0, 14))]} look={[0, 0.65, -0.3]} fov={46} />
			<Backyard t={t} />
			<Mound position={[0, 0, -0.3]} t={t} />
			{items.map((it, i) => {
				const k = smooth(t, it.at, it.at + 1.2);
				if (k <= 0) return null;
				const p: V = [Math.cos(it.a + t * 0.4) * it.r * k, 0.4 + it.h * k, -0.3 + Math.sin(it.a + t * 0.4) * it.r * k * 0.5];
				return it.kind === 0 ? <Drop key={i} position={p} s={0.9} /> : it.kind === 1 ? <Germ key={i} position={p} color={['#9b6fc8', '#6fb86a', '#e09a4a'][i % 3]} s={1.4} /> : (
					<mesh key={i} position={p} rotation={[t + i, i, 0]} material={mat(i % 2 ? '#e8c35a' : '#fbfaf5')}>
						<boxGeometry args={[0.06, 0.04, 0.05]} />
					</mesh>
				);
			})}
			<Swarm center={[0, 0.5, -0.3]} t={t} n={10} r={1.0} />
		</>
	);
};
const Tag: React.FC<{text: string; sub?: string; o: number; y: number; color?: string; size?: number}> = ({text, sub, o, y, color = '#fff', size = 170}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: y, opacity: o}}>
		<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, color, textShadow: '0 6px 30px rgba(0,0,0,0.6)', transform: `scale(${0.7 + 0.3 * o})`}}>{text}</div>
		{sub ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 64, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,0.7)', marginTop: -6}}>{sub}</div> : null}
	</AbsoluteFill>
);
export const O3: React.FC<{t: number}> = ({t}) => (
	<>
		<Tag text="75%" sub="tubig" color="#8fd0ff" o={interpolate(t, [2.6, 3.2, 7.0, 7.6], [0, 1, 1, 0], clampI)} y={300} />
		<Tag text="BUFFET!" color={GOLD} size={150} o={interpolate(t, [12.8, 13.3, 14.0, 14.4], [0, 1, 1, 0], clampI)} y={320} />
	</>
);

// ================= S4: nature documentary, slow motion (silent) =================
export const S4: React.FC<{t: number}> = ({t}) => {
	const land = smooth(t, 0.2, 2.4);
	const flyP: V = [mix(-0.8, 0, land), mix(1.4, 0.66, land), mix(0.3, -0.3, land)];
	const sparkle = Math.max(0, 1 - Math.abs(t - 2.5) * 2);
	const eggs = Math.floor(Math.max(0, (t - 5.2) * 3));
	return (
		<>
			<Cam pos={[mix(0.5, 0.25, smooth(t, 0, 8)), 0.85, mix(1.3, 0.95, smooth(t, 0, 8))]} look={[0, 0.65, -0.3]} fov={36} near={0.02} />
			<Backyard t={t} />
			<Mound position={[0, 0, -0.3]} t={t} stink={0.5} />
			<Fly position={flyP} rotationY={0.6} t={t * 0.25} s={1.5} dance={t > 3.0 && t < 5.0 ? 1 : 0} flap={land < 1} glowFeet={sparkle} />
			{sparkle > 0
				? [0, 1, 2, 3, 4, 5].map((i) => (
						<mesh key={i} position={[Math.cos(i) * 0.12, 0.64, -0.3 + Math.sin(i) * 0.12]} scale={sparkle} material={mat('#fff6b0', {emissive: '#ffe060', emissiveIntensity: 1.5})}>
							<octahedronGeometry args={[0.025, 0]} />
						</mesh>
					))
				: null}
			{Array.from({length: Math.min(8, eggs)}).map((_, i) => (
				<mesh key={i} position={[0.06 + (i % 4) * 0.03, 0.6 + Math.floor(i / 4) * 0.02, -0.25 + (i % 2) * 0.02]} scale={[0.012, 0.022, 0.012]} material={mat('#fbfaf2')}>
					<sphereGeometry args={[1, 6, 5]} />
				</mesh>
			))}
		</>
	);
};

// ================= S5: macro: tastes with its feet, melts food with saliva =================
export const S5: React.FC<{t: number}> = ({t}) => {
	const feet = smooth(t, 4.4, 5.0) * (1 - smooth(t, 8.5, 9.2));
	const drip = ramp(t, 10.4, 11.4);
	const melt = smooth(t, 11.2, 13.0);
	const sip = t > 12.5;
	return (
		<>
			<Cam pos={[mix(1.4, 0.9, smooth(t, 0, 15)), mix(1.0, 0.7, smooth(t, 0, 15)), mix(2.4, 1.6, smooth(t, 0, 15))]} look={[0, 0.5, 0]} fov={40} />
			<color attach="background" args={['#e9e4d6']} />
			<hemisphereLight args={['#ffffff', '#8a8070', 1.3]} />
			<directionalLight position={[2, 5, 4]} intensity={1.8} />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#d8cfbc')}>
				<planeGeometry args={[30, 30]} />
			</mesh>
			<Fly position={[0, 0, 0]} rotationY={0.5} t={t * 0.15} s={8} glowFeet={feet} flap={false} />
			{/* the food cube melting under saliva */}
			<mesh position={[0.75, 0.12 * (1 - melt * 0.8), 0.6]} scale={[1 + melt * 0.6, 1 - melt * 0.8, 1 + melt * 0.6]} material={mat(melt > 0.5 ? '#e8c87a' : '#f2e2b0')}>
				<boxGeometry args={[0.3, 0.24, 0.3]} />
			</mesh>
			{drip > 0 && drip < 1 ? (
				<mesh position={[mix(0.45, 0.72, drip), mix(0.62, 0.3, drip), mix(0.45, 0.6, drip)]} material={mat('#cfe8f2', {transparent: true, opacity: 0.8})}>
					<sphereGeometry args={[0.04, 8, 6]} />
				</mesh>
			) : null}
			{/* the sipping "straw" */}
			<mesh position={[0.55, 0.38, 0.5]} rotation={[0.5, 0, -0.9 - (sip ? Math.sin(t * 8) * 0.05 : 0)]} material={mat('#3a3a40')}>
				<cylinderGeometry args={[0.02, 0.035, 0.42, 6]} />
			</mesh>
		</>
	);
};

// ================= S6: from the poop to our pancit, carrying germs =================
export const S6: React.FC<{t: number}> = ({t}) => {
	const k = smooth(t, 1.5, 5.0);
	const flyP: V = [mix(-2.2, 1.0, k), 0.4 + Math.sin(Math.PI * k) * 1.2 + (k >= 1 ? 0.45 : 0) * 0, mix(-0.4, -0.2, k)];
	const landed = k >= 1;
	const gasp = smooth(t, 5.6, 6.2);
	return (
		<>
			<Cam pos={[mix(-0.6, 1.0, smooth(t, 0, 6)), 1.6, 3.4]} look={[mix(-0.8, 0.8, smooth(t, 0, 6)), 0.7, -0.4]} fov={44} />
			<Backyard t={t} />
			<Mound position={[-2.2, 0, -0.4]} t={t} />
			{/* the family table */}
			<mesh position={[1.0, 0.37, -0.3]} material={mat('#8a5f3e')}>
				<boxGeometry args={[1.6, 0.74, 0.9]} />
			</mesh>
			<Dish position={[1.0, 0.75, -0.25]} kind={3} s={1.3} />
			{Array.from({length: 10}).map((_, i) => (
				<mesh key={i} position={[0.9 + (i % 5) * 0.05, 0.85, -0.3 + Math.floor(i / 5) * 0.08]} rotation={[Math.PI / 2, 0, i]} material={mat(i % 4 ? '#e2c56a' : '#d97b3a')}>
					<cylinderGeometry args={[0.01, 0.01, 0.2, 4]} />
				</mesh>
			))}
			<Fly position={landed ? [1.0, 0.86, -0.25] : flyP} rotationY={landed ? 0.4 : -1.5} t={t} s={1.6} flap={!landed} />
			{/* germ trail */}
			{Array.from({length: 14}).map((_, i) => {
				const u = i / 13;
				const show = k > u;
				const p: V = [mix(-2.2, 1.0, u), 0.4 + Math.sin(Math.PI * u) * 1.2, mix(-0.4, -0.2, u)];
				return show ? <Germ key={i} position={landed && i > 10 ? [0.9 + (i - 10) * 0.07, 0.86, -0.25] : p} color={['#6fb86a', '#9b6fc8'][i % 2]} s={0.9} /> : null;
			})}
			<Person seed={1102} shirt="#c9784a" longHair position={[1.0, 0, -1.2]} pose={{armL: -2.4 * gasp, armR: -2.4 * gasp, spreadL: 0.3 * gasp, spreadR: 0.3 * gasp, elbow: -1.2 * gasp}} mouth={gasp > 0.5} />
			<Person seed={1101} shirt="#d9b44a" scale={0.72} position={[1.9, 0, -0.3]} rotationY={-1.5} pose={{armL: -1.6 * gasp, armR: -1.6 * gasp, elbow: -1.6 * gasp}} mouth={gasp > 0.5} />
		</>
	);
};
export const O6: React.FC<{t: number}> = ({t}) => <Tag text="100+" sub="uri ng mikrobyo" color="#9bd86a" o={interpolate(t, [8.8, 9.4, 12.6, 13.4], [0, 1, 1, 0], clampI)} y={300} />;

// ================= S7: cover food, wash hands, close the lid =================
export const S7: React.FC<{t: number}> = ({t}) => {
	const cx = t < 3.6 ? 0 : t < 4.4 ? mix(0, 5, smooth(t, 3.6, 4.4)) : t < 7.6 ? 5 : mix(5, 10, smooth(t, 7.6, 8.4));
	const cover = smooth(t, 0.6, 1.6);
	const lid = smooth(t, 8.6, 9.4);
	const leave = smooth(t, 1.6, 3.4);
	return (
		<>
			<Cam pos={[cx + 0.2, 1.6, 3.0]} look={[cx, 0.85, -0.3]} fov={44} />
			<color attach="background" args={['#e8dfcc']} />
			<hemisphereLight args={['#fff4e0', '#6a5a48', 1.25]} />
			<directionalLight position={[3, 6, 5]} intensity={1.6} color="#fff1da" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#b8a07a')}>
				<planeGeometry args={[60, 60]} />
			</mesh>
			<mesh position={[5, 1.6, -1.6]} material={mat('#e4d6c0')}>
				<boxGeometry args={[20, 3.2, 0.1]} />
			</mesh>
			{/* 1. food covered */}
			<mesh position={[0, 0.37, -0.3]} material={mat('#8a5f3e')}>
				<boxGeometry args={[1.6, 0.74, 0.9]} />
			</mesh>
			<Dish position={[0, 0.75, -0.25]} kind={3} s={1.3} />
			<mesh position={[mix(-0.6, 0, cover), mix(1.4, 0.76, cover), -0.25]} material={mat('#c9503f')}>
				<sphereGeometry args={[0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
			</mesh>
			<Person seed={1102} shirt="#c9784a" longHair position={[-0.7, 0, -0.9]} rotationY={0.6} pose={{armR: -1.4 * (1 - smooth(t, 1.6, 2.2)), armL: 0.05}} />
			<Fly position={[mix(0.1, 2.0, leave), 1.0 + leave * 1.2, -0.25]} rotationY={-1.5} t={t} s={1.6} />
			{/* 2. washing hands with soap bubbles */}
			<mesh position={[5, 0.45, -1.1]} material={mat('#e8e8ee')}>
				<boxGeometry args={[1.0, 0.9, 0.6]} />
			</mesh>
			<mesh position={[5, 1.25, -1.35]} material={mat('#9aa0a6', {metalness: 0.6, roughness: 0.3})}>
				<cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
			</mesh>
			<Person seed={1101} shirt="#d9b44a" scale={0.72} position={[5, 0, -0.5]} rotationY={Math.PI} pose={{armL: -1.2 + Math.sin(t * 14) * 0.15, armR: -1.2 - Math.sin(t * 14) * 0.15, elbow: -0.6}} />
			{Array.from({length: 10}).map((_, i) => {
				const k = ((t * 0.5 + i / 10) % 1);
				return (
					<mesh key={i} position={[4.85 + (i % 4) * 0.08, 0.95 + k * 0.8, -0.85 + (i % 3) * 0.05]} scale={0.04 + k * 0.05}>
						<sphereGeometry args={[1, 8, 6]} />
						<meshStandardMaterial color="#dff4ff" transparent opacity={0.6 * (1 - k)} flatShading depthWrite={false} />
					</mesh>
				);
			})}
			{/* 3. toilet lid closing */}
			<mesh position={[10, 0.25, -0.8]} material={mat('#f2f2f4')}>
				<cylinderGeometry args={[0.28, 0.22, 0.5, 14]} />
			</mesh>
			<mesh position={[10, 0.75, -1.15]} material={mat('#f2f2f4')}>
				<boxGeometry args={[0.6, 0.6, 0.2]} />
			</mesh>
			<group position={[10, 0.52, -1.05]} rotation={[-(1 - lid) * 1.5, 0, 0]}>
				<mesh position={[0, 0.02, 0.3]} material={mat('#e4e6ea')}>
					<cylinderGeometry args={[0.3, 0.3, 0.04, 14]} />
				</mesh>
			</group>
		</>
	);
};

// ================= S8: the flies go hungry, the family eats safely =================
export const S8: React.FC<{t: number}> = ({t}) => {
	const pull = smooth(t, 6.0, 15.5);
	const wink = t > 3.4 && t < 4.0;
	return (
		<>
			<Cam pos={[mix(0.6, 3, pull), mix(1.5, 26, pull * pull), mix(3.2, 22, pull)]} look={[mix(0.2, 0, pull), mix(0.8, 0, pull), mix(-0.5, -6, pull)]} fov={44} far={2000} />
			<Barangay t={t} dusk={1} houses={[-10, -5, 5, 10]} />
			<mesh position={[0, 0.37, -0.5]} material={mat('#8a5f3e')}>
				<boxGeometry args={[2.2, 0.74, 1.1]} />
			</mesh>
			{[-0.6, 0, 0.6].map((x, i) => (
				<Dish key={i} position={[x, 0.75, -0.5]} kind={[3, 1, 0][i]} />
			))}
			<mesh position={[0.95, 0.76, -0.2]} material={mat('#c9503f')}>
				<sphereGeometry args={[0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
			</mesh>
			{[[-0.5, -1.3, 0, 1102], [0.5, -1.3, 0, 1103]].map(([x, z, r, sd], i) => (
				<Person key={i} seed={sd} longHair={i === 0} shirt={i === 0 ? '#c9784a' : undefined} position={[x, 0, z]} rotationY={r} pose={{armL: -0.9, armR: -0.9 - Math.max(0, Math.sin(t * 3 + i)) * 0.6, elbow: -0.5}} mouth />
			))}
			<Person seed={1101} shirt="#d9b44a" scale={0.72} position={[0.2, 0, 0.35]} rotationY={0.3} pose={{armL: 0.05, armR: wink ? -2.2 : -0.6, spreadR: 0.3}} />
			{wink ? (
				<mesh position={[0.24, 0.98, 0.52]} material={mat('#1d1a18')}>
					<boxGeometry args={[0.07, 0.012, 0.01]} />
				</mesh>
			) : null}
			{/* sad flies on the fence */}
			{[0, 1, 2].map((i) => (
				<Fly key={i} position={[-1.4 + i * 0.25, 0.82, -0.4]} rotationY={0.3} t={t} s={1.2} flap={false} />
			))}
			<mesh position={[-1.15, 0.4, -0.4]} material={mat('#b8946a')}>
				<boxGeometry args={[0.9, 0.8, 0.06]} />
			</mesh>
		</>
	);
};
