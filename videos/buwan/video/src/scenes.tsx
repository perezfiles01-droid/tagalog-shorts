import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import * as THREE from 'three';
import {Cam, Person, Pose, Sky, Tree, mat, mix, rand, ramp, smooth, walk} from './kit';
import {Barangay, House} from './props';
import {Jeepney} from './scenesB';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const pop = (t: number, a: number, b: number) => interpolate(t, [a, a + 0.4, b - 0.4, b], [0, 1, 1, 0], clampI);

// recurring cast
const GUY = {seed: 2001, shirt: '#4f6a8f'};
const LOLA = {seed: 1001, shirt: '#8a6f8f', longHair: true, hairColor: '#cfcac2'};
const TITO = {seed: 3021, shirt: '#c27b4f'};
const KID = {seed: 2004, shirt: '#d9b44a', scale: 0.72};
const FISHER = {seed: 2002, shirt: '#d9c9a3', hat: true};

const MOON_POS: V = [8, 55, -220];

// ---------- overlays ----------
// the timeline chip at the top: "UNANG ORAS", "UNANG GABI", ...
const Chip: React.FC<{text: string; o: number}> = ({text, o}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: 170, opacity: o}}>
		<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 52, color: '#fff', letterSpacing: 2, padding: '10px 34px', borderRadius: 40, background: 'rgba(20,20,30,0.45)', border: `2px solid ${GOLD}`, textShadow: '0 2px 10px rgba(0,0,0,0.6)'}}>{text}</div>
	</AbsoluteFill>
);
const Tag: React.FC<{text: string; sub?: string; o: number; y: number; color?: string; size?: number}> = ({text, sub, o, y, color = '#fff', size = 140}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: y, opacity: o}}>
		<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, color, textShadow: '0 6px 30px rgba(0,0,0,0.6)', transform: `scale(${0.7 + 0.3 * o})`, whiteSpace: 'nowrap'}}>{text}</div>
		{sub ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 60, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,0.7)', marginTop: -6}}>{sub}</div> : null}
	</AbsoluteFill>
);
const chipO = (t: number, dur: number) => interpolate(t, [0.3, 0.8, dur - 0.6, dur - 0.1], [0, 1, 1, 0], clampI);

// ---------- props ----------
const Moon: React.FC<{position?: number[]; r?: number; burst?: number; t?: number}> = ({position = MOON_POS, r = 14, burst = 0, t = 0}) => {
	const chunks = useMemo(() => {
		const g = rand(42);
		return Array.from({length: 26}).map(() => {
			const d = new THREE.Vector3(g() - 0.5, g() - 0.5, (g() - 0.5) * 0.4).normalize();
			return [d.x, d.y, d.z, 0.25 + g() * 0.35, g() * 6];
		});
	}, []);
	const moonM = mat('#f2ead2', {emissive: '#fff0c0', emissiveIntensity: 1.0, fog: false});
	if (burst <= 0)
		return (
			<group position={position as V}>
				<mesh material={moonM}>
					<icosahedronGeometry args={[r, 2]} />
				</mesh>
				{[[-4, 3, 0.9], [5, -2, 0.7], [1, 6, 0.6]].map(([x, y, s], i) => (
					<mesh key={i} position={[x, y, r * 0.9]} scale={[s * 3, s * 3, 0.5]} material={mat('#d8cfb4', {emissive: '#d8cfb4', emissiveIntensity: 0.6, fog: false})}>
						<sphereGeometry args={[1, 8, 6]} />
					</mesh>
				))}
			</group>
		);
	const flash = Math.max(0, 1 - burst * 3);
	return (
		<group position={position as V}>
			{flash > 0 ? (
				<mesh scale={r * (1 + burst * 6)}>
					<sphereGeometry args={[1, 16, 12]} />
					<meshBasicMaterial color="#fff6d8" transparent opacity={flash} depthWrite={false} />
				</mesh>
			) : null}
			{chunks.map(([x, y, z, s, sp], i) => (
				<mesh key={i} position={[x * r * (0.6 + burst * 4), y * r * (0.6 + burst * 4), z * r * (0.6 + burst * 4)]} rotation={[sp + t, sp * 2 + t * 0.7, 0]} scale={r * s} material={moonM}>
					<icosahedronGeometry args={[1, 0]} />
				</mesh>
			))}
		</group>
	);
};

const Stars: React.FC<{n?: number; r?: number; o?: number}> = ({n = 220, r = 700, o = 1}) => {
	const pts = useMemo(() => {
		const g = rand(7);
		return Array.from({length: n}).map(() => {
			const v = new THREE.Vector3(g() - 0.5, g() * 0.9 + 0.05, g() - 0.5).normalize().multiplyScalar(r);
			return [v.x, v.y, v.z, 1 + g() * 1.5];
		});
	}, [n, r]);
	const m = mat('#ffffff', {emissive: '#ffffff', emissiveIntensity: 1, transparent: true, opacity: o, fog: false});
	return (
		<>
			{pts.map((p, i) => (
				<mesh key={i} position={[p[0], p[1], p[2]]} scale={p[3]} material={m}>
					<octahedronGeometry args={[1, 0]} />
				</mesh>
			))}
		</>
	);
};

// the Earth from space, with an optional debris belt (spread 0 = clump, 1 = full ring)
const EarthSpace: React.FC<{t: number; spread: number; ring?: number; tilt?: number; spin?: number}> = ({t, spread, ring = 0, tilt = 0.41, spin = 0.05}) => {
	const bits = useMemo(() => {
		const g = rand(99);
		return Array.from({length: 160}).map(() => [g() * Math.PI * 2, 9 + g() * 4, (g() - 0.5) * 0.8, 0.08 + g() * 0.25, g()]);
	}, []);
	const land = useMemo(() => {
		const g = rand(5);
		return Array.from({length: 14}).map(() => {
			const v = new THREE.Vector3(g() - 0.5, (g() - 0.5) * 1.4, g() - 0.5).normalize().multiplyScalar(5);
			return [v.x, v.y, v.z, 1.0 + g() * 1.4];
		});
	}, []);
	return (
		<>
			<color attach="background" args={['#05060c']} />
			<ambientLight intensity={0.25} />
			<directionalLight position={[30, 10, 20]} intensity={2.6} color="#fff4e0" />
			<Stars n={260} r={400} />
			<group rotation={[0, 0, tilt]}>
				<group rotation={[0, t * spin, 0]}>
					<mesh material={mat('#3f78b0', {roughness: 0.6})}>
						<icosahedronGeometry args={[5, 3]} />
					</mesh>
					{land.map(([x, y, z, s], i) => (
						<mesh key={i} position={[x, y, z]} scale={[s, s, s]} material={mat(i % 4 === 0 ? '#e8e4dc' : '#6f9a4a')}>
							<icosahedronGeometry args={[0.6, 0]} />
						</mesh>
					))}
				</group>
				<mesh scale={5.35}>
					<sphereGeometry args={[1, 24, 16]} />
					<meshBasicMaterial color="#8fc8ff" transparent opacity={0.12} depthWrite={false} />
				</mesh>
				{/* debris: from a clump to a ring in the equator plane */}
				{bits.map(([a0, rad, h, s, sp], i) => {
					const a = mix(0.6 + (a0 - Math.PI) * 0.12, a0, spread) + t * (0.15 + sp * 0.05);
					const rr = mix(16, rad, spread);
					const y = mix(h * 6, h * (1 - ring) * 1.2, spread);
					return (
						<mesh key={i} position={[Math.cos(a) * rr, y, Math.sin(a) * rr]} rotation={[i, t + i, 0]} scale={s} material={mat('#d8cfb4', {emissive: '#8a8270', emissiveIntensity: 0.3})}>
							<icosahedronGeometry args={[1, 0]} />
						</mesh>
					);
				})}
				{ring > 0 ? (
					<mesh rotation={[-Math.PI / 2, 0, 0]}>
						<ringGeometry args={[8.5, 13.5, 64]} />
						<meshBasicMaterial color="#d8cfb4" transparent opacity={0.35 * ring} side={THREE.DoubleSide} depthWrite={false} />
					</mesh>
				) : null}
			</group>
		</>
	);
};

const Phone: React.FC<{position?: number[]; rotation?: number[]; glow?: number}> = ({position = [0, 0, 0], rotation = [0, 0, 0], glow = 1}) => (
	<group position={position as V} rotation={rotation as V}>
		<mesh material={mat('#24262c', {roughness: 0.4})}>
			<boxGeometry args={[0.09, 0.17, 0.014]} />
		</mesh>
		<mesh position={[0, 0, 0.0075]} material={mat('#8fc0ff', {emissive: '#6fa8ff', emissiveIntensity: glow})}>
			<boxGeometry args={[0.078, 0.152, 0.002]} />
		</mesh>
	</group>
);

const Chicken: React.FC<{position: number[]; t: number; rotationY?: number; crow?: number; s?: number}> = ({position, t, rotationY = 0, crow = 0, s = 0.6}) => (
	<group position={position as V} rotation={[0, rotationY, 0]} scale={s}>
		<mesh position={[0, 0.35, 0]} scale={[1, 0.85, 1.2]} material={mat('#c8743a')}>
			<icosahedronGeometry args={[0.25, 1]} />
		</mesh>
		<mesh position={[0, 0.5, -0.3]} rotation={[0.9, 0, 0]} material={mat('#2a3a2a')}>
			<coneGeometry args={[0.14, 0.4, 5]} />
		</mesh>
		<group position={[0, 0.66 + crow * 0.08, 0.18]} rotation={[-crow * 0.7, 0, 0]}>
			<mesh material={mat('#d8843a')}>
				<icosahedronGeometry args={[0.12, 1]} />
			</mesh>
			<mesh position={[0, 0.14, 0]} material={mat('#c8352a')}>
				<boxGeometry args={[0.03, 0.1, 0.14]} />
			</mesh>
			<mesh position={[0, 0.02 + crow * 0.02, 0.13]} rotation={[Math.PI / 2 - crow * 0.4, 0, 0]} material={mat('#e8b54a')}>
				<coneGeometry args={[0.035, 0.08, 4]} />
			</mesh>
			<mesh position={[0, -0.03 - crow * 0.02, 0.13]} rotation={[Math.PI / 2 + crow * 0.4, 0, 0]} material={mat('#e8b54a')}>
				<coneGeometry args={[0.03, 0.07, 4]} />
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

// the ring seen from the ground: a thin pale arc across the sky
const SkyRing: React.FC<{o?: number}> = ({o = 1}) => (
	<mesh position={[0, -60, -300]} rotation={[0.25, 0, 0.35]}>
		<torusGeometry args={[330, 5, 4, 90]} />
		<meshBasicMaterial color="#f2ead2" transparent opacity={0.55 * o} fog={false} depthWrite={false} />
	</mesh>
);

// ================= S1: 7 PM, the moon explodes, phones light up =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const BOOM = 3.7;
	const burst = ramp(t, BOOM, BOOM + 4);
	const phones = t > 8.5;
	const k = smooth(t, 0, 13.35);
	const shake = t > BOOM && t < BOOM + 0.6 ? Math.sin(t * 60) * 0.04 * (1 - (t - BOOM) / 0.6) : 0;
	return (
		<>
			<Cam pos={[mix(-1.5, 0.8, k) + shake, mix(1.4, 1.7, k), mix(7.5, 6.2, k)]} look={[mix(0.5, 0.8, k), mix(4, 2.6, k), -20]} fov={46} far={2000} />
			<Barangay t={t} night={1} lights={0.6} houses={[-10, -5, 0, 5, 10]} />
			<ambientLight intensity={0.9} color="#b8c4ff" />
			<pointLight position={[0, 4, 4]} intensity={20} distance={14} color="#ffe6c0" />
			<Stars />
			<Moon burst={burst} t={t} />
			<pointLight position={[0, 10, -10]} intensity={burst > 0 && burst < 0.15 ? 40 : 0} distance={60} color="#fff6d8" />
			{/* Lola at the window with her rosary */}
			<Person {...LOLA} position={[-1.4, 0, -3.1]} pose={{armL: -1.2, armR: -1.2, elbow: -0.9, headTurn: t > BOOM ? 0.3 : 0}} mouth={t > BOOM && t < 8} />
			{/* the guy taking a moon selfie */}
			<Person {...GUY} position={[1.4, 0, 0.6]} rotationY={Math.PI - 0.4} pose={{armR: -2.2, elbow: -0.2, armL: phones ? -1.2 : 0.1, headTurn: 0.2}} mouth={t > BOOM}>
				<Phone position={[0, 0.02, 0.05]} glow={1.5} />
			</Person>
			{/* neighbours all on their phones */}
			{[[3.0, 0.2, 3031], [-3.0, 0.8, 3032], [4.4, -0.6, 3033], [-0.2, 1.4, 3034]].map(([x, z, sd], i) => (
				<Person key={sd} seed={sd} position={[x, 0, z]} rotationY={Math.PI + (i - 1.5) * 0.3} pose={{armR: phones ? -1.3 : 0.1, elbow: phones ? -0.6 : 0, headTurn: 0}} mouth={phones}>
					{phones ? <Phone position={[0, 0.02, 0.05]} rotation={[-0.4, 0, 0]} glow={2} /> : null}
				</Person>
			))}
		</>
	);
};
export const O1: React.FC<{t: number}> = ({t}) => (
	<>
		<Chip text="7:00 PM" o={chipO(t, 13.35)} />
		<AbsoluteFill style={{alignItems: 'center', paddingTop: 320, opacity: pop(t, 11.1, 13.3)}}>
			<div style={{background: '#f6f4ee', borderRadius: 28, padding: '22px 40px', width: 700, boxShadow: '0 14px 40px rgba(0,0,0,0.45)', transform: `scale(${0.8 + 0.2 * pop(t, 11.1, 13.3)})`}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
					<div style={{width: 64, height: 64, borderRadius: 32, background: '#c27b4f'}} />
					<div style={{fontFamily: 'sans-serif', fontWeight: 700, fontSize: 34, color: '#333'}}>Kapitbahay</div>
				</div>
				<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 64, color: '#222', marginTop: 12}}>sana all, buo pa…</div>
			</div>
		</AbsoluteFill>
	</>
);

// ================= S2: the first hour, from space =================
export const S2: React.FC<{t: number}> = ({t}) => {
	const k = smooth(t, 0, 12.95);
	return (
		<>
			<Cam pos={[mix(4, -6, k), mix(14, 9, k), mix(34, 30, k)]} look={[0, 0, 0]} fov={42} far={3000} />
			<EarthSpace t={t} spread={smooth(t, 1.0, 12.5) * 0.45} />
		</>
	);
};
export const O2: React.FC<{t: number}> = ({t}) => <Chip text="UNANG ORAS" o={chipO(t, 12.95)} />;

// ================= S3: the first night, meteor shower =================
const METEORS = Array.from({length: 40}).map((_, i) => {
	const g = rand(i + 300);
	return [(g() - 0.5) * 80, 25 + g() * 25, -30 - g() * 60, g() * 3, 0.8 + g() * 0.6];
});
export const S3: React.FC<{t: number}> = ({t}) => {
	const toTito = smooth(t, 11.6, 12.6);
	const k = smooth(t, 0, 11.6);
	const wish = t > 7.6;
	const clank = t > 13.8;
	return (
		<>
			<Cam pos={[mix(mix(0, 0.6, k), 3.2, toTito), mix(1.3, 1.5, toTito), mix(mix(7, 6, k), 2.8, toTito)]} look={[mix(0, 3.2, toTito), mix(mix(3.5, 2.6, k), 1.6, toTito), mix(-10, -0.5, toTito)]} fov={46} far={2000} />
			<Barangay t={t} night={1} lights={1} houses={[-10, -5, 0, 5, 10]} />
			<ambientLight intensity={0.9} color="#b8c4ff" />
			<pointLight position={[1, 4, 4]} intensity={22} distance={14} color="#ffe6c0" />
			<Stars />
			{METEORS.map(([x, y, z, ph, sp], i) => {
				const u = ((t * 0.5 * sp + ph / 3) % 1 + 1) % 1;
				return (
					<mesh key={i} position={[x + u * 30, y - u * 20, z]} rotation={[0, 0, 0.6]} material={mat('#fff2c8', {emissive: '#ffe08a', emissiveIntensity: 1.5, transparent: true, opacity: Math.sin(Math.PI * u)})}>
						<boxGeometry args={[3.0, 0.12, 0.12]} />
					</mesh>
				);
			})}
			{/* the barangay outside, wishing */}
			{[[-2.2, 0.4, 3041], [-1.0, 1.0, 3042], [0.2, 0.6, 3043], [1.3, 1.2, 3044], [-0.4, -0.4, 3045]].map(([x, z, sd], i) => (
				<Person key={sd} seed={sd} position={[x, 0, z]} rotationY={Math.PI + (i - 2) * 0.15} pose={wish ? {armL: -1.4, armR: -1.4, elbow: -1.3, spreadL: -0.15, spreadR: -0.15} : {armR: i % 2 ? -2.2 : 0.1, armL: 0.1}} mouth={!wish} />
			))}
			<Person {...LOLA} position={[-3.2, 0, -0.2]} rotationY={Math.PI} pose={{armL: -1.4, armR: -1.4, elbow: -1.3}} />
			{/* Tito with a kaldero helmet, and his jeepney under a banig */}
			<Person {...TITO} position={[3.2, 0, 0.2]} rotationY={Math.PI - 0.5} pose={{armL: -2.6, armR: -2.6, elbow: -0.4}} mouth={clank} />
			<mesh position={[3.2, 1.92, 0.2]} material={mat('#2a2a2e', {metalness: 0.5, roughness: 0.4})}>
				<sphereGeometry args={[0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
			</mesh>
			<group position={[5.4, 0, -1.2]} rotation={[0, -0.5, 0]}>
				<Jeepney />
				<mesh position={[0, 1.65, -0.2]} material={mat('#c9a96b')}>
					<boxGeometry args={[1.6, 0.05, 3.5]} />
				</mesh>
			</group>
			{clank ? (
				<mesh position={[3.2, 2.3 + Math.max(0, 0.4 - (t - 13.8) * 2), 0.2]} material={mat('#d8cfb4', {emissive: '#ffd890', emissiveIntensity: 0.6})}>
					<icosahedronGeometry args={[0.05, 0]} />
				</mesh>
			) : null}
		</>
	);
};
export const O3: React.FC<{t: number}> = ({t}) => <Chip text="UNANG GABI" o={chipO(t, 14.65)} />;

// ================= S4: the morning after (silent montage) =================
const SETX = [0, 10, 20];
export const S4: React.FC<{t: number}> = ({t}) => {
	const cx = t < 2.4 ? 0 : t < 2.9 ? mix(0, 10, smooth(t, 2.4, 2.9)) : t < 5.1 ? 10 : mix(10, 20, smooth(t, 5.1, 5.6));
	const crow = t > 6.2 && t < 7.4 ? 1 : 0;
	return (
		<>
			<Cam pos={[cx + 0.4, 1.5, 4.4]} look={[cx, 1.2, 0]} fov={44} far={2000} />
			<Sky top="#9cc4e0" bottom="#f6d6a8" />
			<fog attach="fog" args={['#f2dcb8', 20, 90]} />
			<hemisphereLight args={['#f7ead6', '#5a6248', 1.2]} />
			<directionalLight position={[30, 12, 20]} intensity={2.0} color="#ffe2b8" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#8faa64')}>
				<planeGeometry args={[400, 400]} />
			</mesh>
			<SkyRing />
			{[-4, 6, 16, 26].map((x, i) => <House key={i} position={[x, 0, -6]} color={['#e2d6bf', '#cfd8c4', '#e8cfb0', '#c9d5dc'][i]} roof={['#a85d4a', '#7a7f86', '#b9573f', '#8a6a52'][i]} />)}
			{/* 1. Lola pulling in the sinampay */}
			<mesh position={[SETX[0], 1.7, -1]} rotation={[0, 0, Math.PI / 2]} material={mat('#6a6a6a')}>
				<cylinderGeometry args={[0.01, 0.01, 4, 4]} />
			</mesh>
			{[0, 1, 2, 3].map((i) => {
				const grabbed = t > 0.5 + i * 0.4;
				return grabbed ? null : (
					<mesh key={i} position={[SETX[0] + 1.6 - i * 0.6, 1.4, -1]} material={mat(['#d33a2c', '#4f6a8f', '#f2f0ea', '#d9b44a'][i])}>
						<boxGeometry args={[0.4, 0.55, 0.02]} />
					</mesh>
				);
			})}
			<Person {...LOLA} position={[SETX[0] + mix(-1.2, 0.8, smooth(t, 0.3, 2.3)), 0, -0.6]} rotationY={Math.PI / 2} pose={{...walk(t, 2), armR: -2.4, armL: -1.1, elbow: -0.4}} mouth>
				<mesh position={[0, -0.1, 0.1]} material={mat('#c9b8d8')}>
					<boxGeometry args={[0.35, 0.3, 0.3]} />
				</mesh>
			</Person>
			{[0, 1, 2].map((i) => (
				<mesh key={i} position={[SETX[0] + 1.5 - i, mix(3, 0.05, ramp(t, 0.6 + i * 0.5, 1.2 + i * 0.5)), 0.3]} material={mat('#d8cfb4', {emissive: '#ffd890', emissiveIntensity: 0.5})}>
					<icosahedronGeometry args={[0.05, 0]} />
				</mesh>
			))}
			{/* 2. kids' moon-rock stall */}
			<mesh position={[SETX[1], 0.45, -0.6]} material={mat('#8a5f3e')}>
				<boxGeometry args={[1.6, 0.9, 0.7]} />
			</mesh>
			{[-0.5, -0.15, 0.2, 0.55].map((x, i) => (
				<mesh key={i} position={[SETX[1] + x, 0.98, -0.6]} material={mat('#d8cfb4', {emissive: '#ffe8a0', emissiveIntensity: 0.6 + 0.3 * Math.sin(t * 4 + i)})}>
					<icosahedronGeometry args={[0.1, 0]} />
				</mesh>
			))}
			<Person {...KID} position={[SETX[1] - 0.3, 0, -1.3]} pose={{armR: -2.2, armL: 0.1}} mouth />
			<Person seed={2006} shirt="#7d9a6b" scale={0.72} position={[SETX[1] + 0.5, 0, -1.3]} pose={{armL: -1.4, armR: 0.1}} mouth />
			{/* 3. the rooster, confused by the ring */}
			<mesh position={[SETX[2], 0.5, 0]} material={mat('#8a6a48')}>
				<boxGeometry args={[1.2, 1.0, 0.4]} />
			</mesh>
			<Chicken position={[SETX[2], 1.0, 0]} t={t} s={1.2} rotationY={0.4} crow={crow} />
		</>
	);
};
export const O4: React.FC<{t: number}> = ({t}) => (
	<>
		<Chip text="KINAUMAGAHAN" o={chipO(t, 8)} />
		<AbsoluteFill style={{alignItems: 'center', paddingTop: 300, opacity: pop(t, 3.0, 5.1)}}>
			<div style={{background: '#f6f1e6', borderRadius: 26, padding: '18px 44px', boxShadow: '0 14px 40px rgba(0,0,0,0.35)', transform: 'rotate(-3deg)', textAlign: 'center'}}>
				<div style={{fontFamily: 'sans-serif', fontWeight: 900, fontSize: 70, color: '#2b211c'}}>BATO NG BUWAN</div>
				<div style={{fontFamily: 'sans-serif', fontWeight: 900, fontSize: 64, color: '#d33a2c'}}>₱20 isa</div>
			</div>
		</AbsoluteFill>
	</>
);

// ================= S5: the first day, the sea barely moves =================
export const S5: React.FC<{t: number}> = ({t}) => {
	const k = smooth(t, 0, 14.3);
	const watch = smooth(t, 9.8, 10.3) * (1 - smooth(t, 11.0, 11.4));
	const scratch = smooth(t, 11.2, 11.6);
	const wave = Math.sin(t * 0.8) * 0.01;
	return (
		<>
			<Cam pos={[mix(-2.5, 1.8, k), mix(2.0, 1.6, k), mix(6.5, 5.0, k)]} look={[0, 0.8, -1]} fov={44} far={2000} />
			<Sky top="#8fc0e3" bottom="#f1eee2" />
			<fog attach="fog" args={['#eeeadc', 25, 120]} />
			<hemisphereLight args={['#f2efe6', '#7a7050', 1.25]} />
			<directionalLight position={[20, 30, 20]} intensity={2.1} color="#fff1da" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#e2d2a8')}>
				<planeGeometry args={[400, 400]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02 + wave, -60]} material={mat('#5f9ab8', {roughness: 0.25, metalness: 0.1})}>
				<planeGeometry args={[400, 116]} />
			</mesh>
			{/* the stranded bangka */}
			<group position={[1.4, 0.15, -0.6]} rotation={[0, 0.3, 0.1]}>
				<mesh scale={[0.5, 0.35, 2.4]} material={mat('#3f78b0')}>
					<sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
				</mesh>
				<mesh position={[0, 0.05, 0]} scale={[0.45, 0.06, 2.3]} material={mat('#f2f0ea')}>
					<boxGeometry args={[1, 1, 1]} />
				</mesh>
				{[-1, 1].map((s) => (
					<mesh key={s} position={[s * 1.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat('#c9b48a')}>
						<cylinderGeometry args={[0.04, 0.04, 2.6, 5]} />
					</mesh>
				))}
			</group>
			{[-8, 9, 14].map((x, i) => <Tree key={i} position={[x, 0, 2 - i * 2]} s={1.6} color="#5d8a45" />)}
			<Person {...FISHER} position={[-0.6, 0, 0.4]} rotationY={-0.4} pose={{armL: -1.6 * watch, elbow: -1.4 * watch, armR: -2.8 * scratch, spreadR: 0.3 * scratch, headTurn: Math.sin(t * 1.2) * 0.3 * (1 - watch)}} mouth={t > 10.3} />
		</>
	);
};
export const O5: React.FC<{t: number}> = ({t}) => <Chip text="UNANG ARAW" o={chipO(t, 14.3)} />;

// ================= S6: a few years: the ring, then a dark baywalk date =================
export const S6: React.FC<{t: number}> = ({t}) => {
	if (t < 7.6) {
		const k = smooth(t, 0, 7.6);
		const sat = smooth(t, 6.2, 6.8);
		return (
			<>
				<Cam pos={[mix(-10, 6, k), mix(12, 7, k), mix(30, 28, k)]} look={[mix(0, 6, sat), 0, 0]} fov={42} far={3000} />
				<EarthSpace t={t + 10} spread={1} ring={smooth(t, 2.4, 3.6)} />
				<group position={[22, 4, -10]} scale={sat}>
					<mesh material={mat('#e2c88a')}>
						<icosahedronGeometry args={[3, 2]} />
					</mesh>
					<mesh rotation={[-1.2, 0, 0.3]}>
						<ringGeometry args={[4, 6.5, 48]} />
						<meshBasicMaterial color="#d8c08a" transparent opacity={0.7} side={THREE.DoubleSide} />
					</mesh>
				</group>
			</>
		);
	}
	const u = t - 7.6;
	const point = smooth(t, 13.4, 13.9);
	return (
		<>
			<Cam pos={[mix(-0.6, 0.4, smooth(u, 0, 8.35)), mix(1.3, 1.1, smooth(u, 0, 8.35)), mix(4.2, 3.2, smooth(u, 0, 8.35))]} look={[0, 1.6, -8]} fov={46} far={2000} />
			<color attach="background" args={['#06070e']} />
			<fog attach="fog" args={['#06070e', 30, 400]} />
			<hemisphereLight args={['#6a7090', '#202030', 1.0]} />
			<pointLight position={[0, 2.6, -1.2]} intensity={10} distance={6} color="#ffcf8a" />
			<Stars />
			<SkyRing o={0.8} />
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, -40]} material={mat('#141c2e', {roughness: 0.2, metalness: 0.2})}>
				<planeGeometry args={[400, 70]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]} material={mat('#5a5650')}>
				<planeGeometry args={[60, 12]} />
			</mesh>
			<mesh position={[0, 0.35, -3.6]} material={mat('#8a8680')}>
				<boxGeometry args={[60, 0.7, 0.3]} />
			</mesh>
			{[-6, -2, 2, 6].map((x) => (
				<group key={x} position={[x, 0, -3.2]}>
					<mesh position={[0, 1.6, 0]} material={mat('#3a3a40')}>
						<cylinderGeometry args={[0.05, 0.06, 3.2, 6]} />
					</mesh>
					<mesh position={[0, 3.25, 0]} material={mat('#ffd98a', {emissive: '#ffcf7a', emissiveIntensity: 1})}>
						<sphereGeometry args={[0.14, 8, 6]} />
					</mesh>
					<pointLight position={[0, 3.0, 0.3]} intensity={3} distance={6} color="#ffcf8a" />
				</group>
			))}
			{/* bench, the couple, the busker */}
			<mesh position={[0, 0.4, -2.6]} material={mat('#7a5a40')}>
				<boxGeometry args={[1.6, 0.08, 0.5]} />
			</mesh>
			<Person seed={3051} shirt="#4f6a8f" position={[0.35, 0, -2.6]} rotationY={Math.PI} pose={{sit: true, armR: -2.5 * point, armL: 0.1, headTurn: 0}} mouth={point > 0.5} />
			<Person seed={3052} shirt="#c95a7a" longHair position={[-0.35, 0, -2.6]} rotationY={Math.PI} pose={{sit: true, armL: 0.1, armR: 0.1, headTurn: point > 0.5 ? 0.4 : 0}} />
			<Person seed={3053} shirt="#7d9a6b" position={[2.2, 0, -1.6]} rotationY={-2.6} pose={{armL: -1.0, armR: -0.8 + Math.sin(t * 9) * 0.15 * (1 - point), elbow: -1.2}} mouth>
				<mesh position={[0.1, 0.1, 0.12]} rotation={[0, 0, 0.9]} material={mat('#b58b58')}>
					<boxGeometry args={[0.24, 0.6, 0.08]} />
				</mesh>
			</Person>
		</>
	);
};
export const O6: React.FC<{t: number}> = ({t}) => (
	<>
		<Chip text="SA LOOB NG ILANG TAON" o={chipO(t, 15.95)} />
	</>
);

// ================= S7: thousands of years: the wobbling Earth, the swaying tito =================
export const S7: React.FC<{t: number}> = ({t}) => {
	const fiesta = t > 6.4 && t < 8.9;
	if (fiesta) {
		const sway = Math.sin(t * 2.6) * 0.25;
		return (
			<>
				<Cam pos={[0.3, 1.5, 4.2]} look={[0, 1.2, 0]} fov={44} far={2000} />
				<Sky top="#8fc0e3" bottom="#f1eee2" />
				<hemisphereLight args={['#f2efe6', '#5a6248', 1.25]} />
				<directionalLight position={[20, 30, 20]} intensity={2.1} color="#fff1da" />
				<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#8d8a80')}>
					<planeGeometry args={[200, 200]} />
				</mesh>
				{Array.from({length: 24}).map((_, i) => (
					<mesh key={i} position={[-3 + i * 0.26, 3.0 - Math.sin((i / 23) * Math.PI) * 0.4, -1.5]} rotation={[0, 0, Math.PI]} material={mat(['#d33a2c', '#f2d14a', '#3f78b0', '#6f9a4a'][i % 4])}>
						<coneGeometry args={[0.1, 0.22, 3]} />
					</mesh>
				))}
				<House position={[0, 0, -6]} color="#e8cfb0" roof="#b9573f" />
				<group rotation={[0, 0, sway]}>
					<Person {...TITO} position={[0, 0, 0]} pose={{armL: -0.4 + sway, armR: -1.8, elbow: -0.6, headTurn: sway}} mouth>
						<mesh position={[0, 0, 0.06]} material={mat('#c8a050', {transparent: true, opacity: 0.85})}>
							<cylinderGeometry args={[0.05, 0.05, 0.18, 8]} />
						</mesh>
					</Person>
				</group>
				<Person seed={3061} shirt="#7d9a6b" position={[-1.3, 0, -0.6]} rotationY={0.5} pose={{armL: -0.6, armR: -0.6, elbow: -1.2}} mouth />
			</>
		);
	}
	const wob = smooth(t, 3.8, 5.0);
	const tilt = 0.41 + wob * Math.sin(t * 1.6) * 0.35;
	const k = smooth(t, 0, 14.8);
	const season = t > 11.8 ? (Math.floor((t - 11.8) * 2) % 2 === 0 ? 1 : 0) : -1;
	return (
		<>
			<Cam pos={[mix(-6, 6, k), 6, 26]} look={[0, 0, 0]} fov={40} far={3000} />
			<EarthSpace t={t + 20} spread={1} ring={1} tilt={tilt} spin={0.3} />
			{season >= 0 ? <pointLight position={[0, 0, 12]} intensity={season ? 30 : 10} distance={30} color={season ? '#ffb86a' : '#6fa8ff'} /> : null}
		</>
	);
};
export const O7: React.FC<{t: number}> = ({t}) => (
	<>
		<Chip text="LIBU-LIBONG TAON" o={chipO(t, 14.8)} />
		<Tag text="tag-init?" color="#ffb86a" size={110} o={pop(t, 11.8, 13.7)} y={300} />
		<Tag text="tag-ulan?" color="#8fd0ff" size={110} o={pop(t, 13.8, 14.8)} y={300} />
	</>
);

// ================= S8: back to now: the moon is whole =================
export const S8: React.FC<{t: number}> = ({t}) => {
	const look = smooth(t, 3.0, 3.8);
	const rise = smooth(t, 9.5, 16.5);
	return (
		<>
			<Cam pos={[mix(0.8, 2, rise), mix(1.6, 20, rise * rise), mix(6.2, -20, rise)]} look={[mix(0.6, MOON_POS[0], rise), mix(2.4, MOON_POS[1], rise), mix(-20, MOON_POS[2], rise)]} fov={46} far={2000} />
			<Barangay t={t} night={1} lights={0.6} houses={[-10, -5, 0, 5, 10]} />
			<ambientLight intensity={0.9} color="#b8c4ff" />
			<pointLight position={[0, 4, 4]} intensity={20} distance={14} color="#ffe6c0" />
			<Stars />
			<Moon />
			<Person {...LOLA} position={[-1.4, 0, -3.1]} pose={{armL: -1.2, armR: -1.2, elbow: -0.9}} mouth />
			<Person {...GUY} position={[1.4, 0, 0.6]} rotationY={Math.PI - 0.4} pose={{armR: mix(-2.2, 0.1, look), elbow: mix(-0.2, 0, look), armL: 0.1, headTurn: 0.2}} mouth={false}>
				<Phone position={[0, 0.02, 0.05]} glow={1.5 * (1 - look)} />
			</Person>
		</>
	);
};
export const O8: React.FC<{t: number}> = ({t}) => <Chip text="NGAYON" o={chipO(t, 9.5)} />;
