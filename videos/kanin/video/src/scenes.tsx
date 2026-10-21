import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, interpolate} from 'remotion';
import {Cam, Person, Pose, mat, mix, mixV, rand, ramp, smooth, walk} from './kit';
import {Barangay, Dish, col} from './props';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const q = (x: number) => Math.round(x * 20) / 20; // quantised opacity keeps the material cache small

// ---------- cast (same seeds in every scene) ----------
const PAPA = {seed: 1201, shirt: '#4f6a8f', pants: '#3b4252', longHair: false};
const MAMA = {seed: 1202, shirt: '#c9784a', pants: '#4a4f5e', longHair: true};
const KID = {seed: 1203, shirt: '#d9b44a', pants: '#3b4252', longHair: false};
const TABLE_Y = 0.78;

// ---------- a cartoon face for the rice ----------
type Mood = 'happy' | 'sad' | 'angry' | 'calm';
const Face: React.FC<{r: number; mood: Mood; open?: number; tear?: number; blink?: boolean; wink?: boolean; o?: number}> = ({r, mood, open = 0, tear = 0, blink, wink, o = 1}) => {
	const tr = o < 1 ? {transparent: true, opacity: q(o)} : {};
	const ink = mat('#1d1a18', tr);
	const ex = r * 0.32, ey = r * 0.18, ez = r * 0.93;
	return (
		<group>
			{[-1, 1].map((s) => (
				<mesh key={s} position={[s * ex, ey, ez]} scale={[1, blink || (wink && s > 0) ? 0.15 : 1, 1]} material={ink}>
					<sphereGeometry args={[r * 0.085, 8, 6]} />
				</mesh>
			))}
			{[-1, 1].map((s) => (
				<mesh key={'c' + s} position={[s * r * 0.52, -r * 0.04, r * 0.84]} material={mat('#e08a7a', {transparent: true, opacity: q(0.65 * o)})}>
					<sphereGeometry args={[r * 0.1, 8, 6]} />
				</mesh>
			))}
			{mood === 'angry' || mood === 'sad'
				? [-1, 1].map((s) => (
						<mesh key={'b' + s} position={[s * ex, ey + r * 0.18, ez * 0.97]} rotation={[0, 0, s * (mood === 'angry' ? 0.5 : -0.45)]} material={ink}>
							<boxGeometry args={[r * 0.22, r * 0.045, r * 0.03]} />
						</mesh>
					))
				: null}
			{open > 0.05 ? (
				<mesh position={[0, -r * 0.24, ez * 0.97]} scale={[1, 0.4 + open, 0.5]} material={mat('#4a2a26', tr)}>
					<sphereGeometry args={[r * 0.12, 8, 6]} />
				</mesh>
			) : mood === 'angry' ? (
				<mesh position={[0, -r * 0.25, ez * 0.96]} material={ink}>
					<boxGeometry args={[r * 0.24, r * 0.04, r * 0.03]} />
				</mesh>
			) : (
				<mesh position={[0, mood === 'sad' ? -r * 0.36 : -r * 0.12, ez * 0.95]} rotation={[0, 0, mood === 'sad' ? 0 : Math.PI]} material={ink}>
					<torusGeometry args={[r * (mood === 'calm' ? 0.13 : 0.18), r * 0.045, 4, 12, Math.PI]} />
				</mesh>
			)}
			{tear > 0 && tear < 1 ? (
				<mesh position={[-ex, ey - r * 0.1 - tear * r * 0.7, ez + 0.005]} scale={[1, 1.4, 1]} material={mat('#8fd0ff', {emissive: '#5fb0ef', emissiveIntensity: 0.5})}>
					<sphereGeometry args={[r * 0.06, 8, 6]} />
				</mesh>
			) : null}
		</group>
	);
};

// rice grains dotted over a mound so it reads as rice, not a ball
const Grains: React.FC<{r: number; n?: number; o?: number}> = ({r, n = 26, o = 1}) => {
	const pts = useMemo(() => {
		const g = rand(77);
		return Array.from({length: 40}).map(() => {
			const th = g() * Math.PI * 2, ph = Math.acos(1 - g() * 1.3);
			return [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), g() * 3];
		});
	}, []);
	const m = mat('#ffffff', o < 1 ? {transparent: true, opacity: q(o)} : {});
	return (
		<>
			{pts.slice(0, n).map((p, i) => (p[2] > 0.55 && Math.abs(p[0]) < 0.6 && p[1] < 0.5 ? null : (
				<mesh key={i} position={[p[0] * r, p[1] * r, p[2] * r]} rotation={[p[3], p[3] * 2, 0]} material={m}>
					<capsuleGeometry args={[r * 0.04, r * 0.09, 2, 5]} />
				</mesh>
			)))}
		</>
	);
};

// a bowl of rice with feelings
const RiceBowl: React.FC<{position: number[]; s?: number; mood?: Mood; fill?: number; tear?: number; o?: number; open?: number; wink?: boolean; glow?: number; sigh?: number}> = ({position, s = 1, mood = 'calm', fill = 1, tear = 0, o = 1, open = 0, wink, glow = 0, sigh = 0}) => {
	const tr = o < 1 ? {transparent: true, opacity: q(o), depthWrite: false} : {};
	const r = 0.2;
	const k = mix(0.18, 1, fill);
	return (
		<group position={position as V} scale={s}>
			<mesh position={[0, 0.08, 0]} material={mat('#eef2f4', tr)}>
				<cylinderGeometry args={[0.24, 0.14, 0.16, 18]} />
			</mesh>
			<mesh position={[0, 0.13, 0]} material={mat('#4a7fb8', tr)}>
				<cylinderGeometry args={[0.235, 0.215, 0.03, 18]} />
			</mesh>
			<group position={[0, 0.1 + 0.13 * k, 0]} scale={[k, k * (0.82 - sigh * 0.1), k]}>
				<mesh material={mat('#fbfaf5', {roughness: 1, emissive: '#ffd27a', emissiveIntensity: glow * 0.6, ...tr})}>
					<icosahedronGeometry args={[r, 2]} />
				</mesh>
				<Grains r={r} o={o} />
				<Face r={r} mood={mood} tear={tear} o={o} open={open} wink={wink} />
			</group>
			{glow > 0 ? (
				<>
					<pointLight position={[0, 0.5, 0.3]} intensity={glow * 3} distance={2.5} color="#ffd27a" />
					<mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} scale={1 + glow * 0.3}>
						<torusGeometry args={[0.36, 0.012, 4, 30]} />
						<meshStandardMaterial color="#ffd27a" emissive="#ffc040" emissiveIntensity={1.5} transparent opacity={glow * 0.8} depthWrite={false} />
					</mesh>
				</>
			) : null}
		</group>
	);
};

// the rice as a little character that can walk out of the house
const RiceBall: React.FC<{position: number[]; rotationY?: number; s?: number; mood?: Mood; walkT?: number; armL?: number[]; armR?: number[]; bandana?: number; bindle?: number; open?: number; hop?: number}> = ({position, rotationY = 0, s = 1, mood = 'calm', walkT, armL = [0, -0.4], armR = [0, 0.4], bandana = 0, bindle = 0, open = 0, hop = 0}) => {
	const r = 0.16;
	const sw = walkT !== undefined ? Math.sin(walkT * Math.PI * 2 * 2.2) : 0;
	const bob = walkT !== undefined ? Math.abs(sw) * 0.02 : 0;
	const Arm = ({side, a}: {side: number; a: number[]}) => (
		<group position={[side * r * 0.92, 0.25, 0]} rotation={[a[0], 0, a[1] * side * -1 + side * 0.4]}>
			<mesh position={[0, -0.06, 0]} material={mat('#fbfaf5')}>
				<capsuleGeometry args={[0.022, 0.08, 2, 6]} />
			</mesh>
		</group>
	);
	return (
		<group position={[position[0], position[1] + bob + hop, position[2]]} rotation={[0, rotationY, 0]} scale={s}>
			<mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#000000', {transparent: true, opacity: 0.18, depthWrite: false})}>
				<circleGeometry args={[0.13, 12]} />
			</mesh>
			{[-1, 1].map((sd) => (
				<group key={sd} position={[sd * 0.06, 0.11, 0]} rotation={[sd * sw * 0.6, 0, 0]}>
					<mesh position={[0, -0.05, 0]} material={mat('#f2efe6')}>
						<capsuleGeometry args={[0.022, 0.06, 2, 6]} />
					</mesh>
					<mesh position={[0, -0.095, 0.02]} material={mat('#8a5a3a')}>
						<boxGeometry args={[0.05, 0.025, 0.07]} />
					</mesh>
				</group>
			))}
			<group position={[0, 0.25, 0]} scale={[1, 0.92, 1]}>
				<mesh material={mat('#fbfaf5', {roughness: 1})}>
					<icosahedronGeometry args={[r, 2]} />
				</mesh>
				<Grains r={r} />
				<Face r={r} mood={mood} open={open} />
				{bandana > 0 ? (
					<group scale={Math.min(1, bandana * 1.3)}>
						<mesh rotation={[-0.25, 0, 0]} material={mat('#c9503f')}>
							<sphereGeometry args={[r * 1.04, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
						</mesh>
						<mesh position={[0, r * 0.75, -r * 0.75]} material={mat('#c9503f')}>
							<sphereGeometry args={[0.03, 6, 5]} />
						</mesh>
					</group>
				) : null}
			</group>
			<Arm side={-1} a={armL} />
			<Arm side={1} a={armR} />
			{bindle > 0 ? (
				<group position={[r * 0.9, 0.3, -0.02]} rotation={[0.2, 0, 0.7]} scale={Math.min(1, bindle * 1.3)}>
					<mesh position={[0, 0.12, 0]} material={mat('#8a6448')}>
						<cylinderGeometry args={[0.008, 0.008, 0.32, 5]} />
					</mesh>
					<mesh position={[0, 0.28, 0]} material={mat('#c9503f')}>
						<icosahedronGeometry args={[0.055, 1]} />
					</mesh>
				</group>
			) : null}
		</group>
	);
};

// ---------- food ----------
const Steam: React.FC<{t: number; o?: number; color?: string}> = ({t, o = 0.5, color = '#ffffff'}) => (
	<>
		{[0, 1, 2].map((i) => {
			const k = (t * 0.45 + i / 3) % 1;
			return (
				<mesh key={i} position={[Math.sin(t * 2 + i * 2) * 0.05 + (i - 1) * 0.06, 0.2 + k * 0.45, 0]} scale={0.05 + k * 0.06}>
					<sphereGeometry args={[1, 8, 6]} />
					<meshStandardMaterial color={color} transparent opacity={o * Math.sin(Math.PI * k)} flatShading depthWrite={false} />
				</mesh>
			);
		})}
	</>
);
const AdoboPot: React.FC<{position: number[]; t: number; s?: number; steam?: boolean}> = ({position, t, s = 1, steam = true}) => {
	const chunks = useMemo(() => {
		const g = rand(41);
		return Array.from({length: 9}).map(() => [(g() - 0.5) * 0.24, (g() - 0.5) * 0.24, g() * 3]);
	}, []);
	return (
		<group position={position as V} scale={s}>
			<mesh position={[0, 0.09, 0]} material={mat('#6a4a3a')}>
				<cylinderGeometry args={[0.2, 0.16, 0.18, 14]} />
			</mesh>
			<mesh position={[0, 0.175, 0]} material={mat('#3e2716')}>
				<cylinderGeometry args={[0.185, 0.185, 0.01, 14]} />
			</mesh>
			{chunks.map((c, i) => (
				<mesh key={i} position={[c[0], 0.2, c[1]]} rotation={[c[2], c[2] * 2, 0]} material={mat(i % 3 ? '#7a4e2e' : '#5a3a24')}>
					<boxGeometry args={[0.08, 0.06, 0.07]} />
				</mesh>
			))}
			{[-1, 1].map((k) => (
				<mesh key={k} position={[k * 0.21, 0.13, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('#6a4a3a')}>
					<torusGeometry args={[0.03, 0.01, 4, 8]} />
				</mesh>
			))}
			{steam ? <Steam t={t} /> : null}
		</group>
	);
};
const Lechon: React.FC<{position: number[]; s?: number}> = ({position, s = 1}) => (
	<group position={position as V} scale={s}>
		<mesh position={[0, 0.01, 0]} scale={[1.5, 1, 0.9]} material={mat('#4f7a38')}>
			<cylinderGeometry args={[0.3, 0.3, 0.02, 16]} />
		</mesh>
		<mesh position={[-0.04, 0.13, 0]} scale={[1.5, 0.75, 0.85]} material={mat('#b5652e', {roughness: 0.5})}>
			<sphereGeometry args={[0.17, 12, 9]} />
		</mesh>
		<mesh position={[0.25, 0.14, 0]} material={mat('#a85a28', {roughness: 0.5})}>
			<sphereGeometry args={[0.1, 10, 8]} />
		</mesh>
		<mesh position={[0.34, 0.12, 0]} material={mat('#c9503f')}>
			<sphereGeometry args={[0.045, 8, 6]} />
		</mesh>
		{[-1, 1].map((k) => (
			<React.Fragment key={k}>
				<mesh position={[0.24, 0.23, k * 0.05]} rotation={[k * 0.4, 0, -0.4]} material={mat('#8a4520')}>
					<coneGeometry args={[0.035, 0.07, 4]} />
				</mesh>
				<mesh position={[0.31, 0.17, k * 0.045]} material={mat('#1d1a18')}>
					<sphereGeometry args={[0.012, 5, 4]} />
				</mesh>
			</React.Fragment>
		))}
	</group>
);
const Spaghetti: React.FC<{position: number[]; s?: number}> = ({position, s = 1}) => (
	<group position={position as V} scale={s}>
		<mesh position={[0, 0.015, 0]} material={mat('#f1efe8')}>
			<cylinderGeometry args={[0.22, 0.17, 0.03, 16]} />
		</mesh>
		<mesh position={[0, 0.04, 0]} scale={[1, 0.5, 1]} material={mat('#d9603a')}>
			<sphereGeometry args={[0.16, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2]} />
		</mesh>
		{[0, 1, 2, 3, 4].map((i) => (
			<mesh key={i} position={[Math.cos(i * 1.3) * 0.08, 0.1, Math.sin(i * 1.3) * 0.08]} rotation={[Math.PI / 2, 0, 0]} material={mat('#b8322a')}>
				<cylinderGeometry args={[0.025, 0.025, 0.015, 8]} />
			</mesh>
		))}
		<mesh position={[0, 0.12, 0]} material={mat('#f2d35a')}>
			<boxGeometry args={[0.06, 0.02, 0.06]} />
		</mesh>
	</group>
);
const RiceCooker: React.FC<{position: number[]; open?: number; light?: number; s?: number; rice?: boolean}> = ({position, open = 0, light = 0, s = 1, rice = false}) => (
	<group position={position as V} scale={s}>
		<mesh position={[0, 0.13, 0]} material={mat('#f2f0ea')}>
			<cylinderGeometry args={[0.2, 0.18, 0.26, 18]} />
		</mesh>
		<mesh position={[0, 0.255, 0]} material={mat(rice ? '#fbfaf5' : '#2a2622')}>
			<cylinderGeometry args={[0.165, 0.165, 0.01, 18]} />
		</mesh>
		<group position={[0, 0.26, -0.19]} rotation={[-open * 1.6, 0, 0]}>
			<mesh position={[0, 0.03, 0.19]} scale={[1, 0.35, 1]} material={mat('#e4e1d8')}>
				<sphereGeometry args={[0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
			</mesh>
			<mesh position={[0, 0.1, 0.19]} material={mat('#9aa0a6')}>
				<boxGeometry args={[0.1, 0.03, 0.04]} />
			</mesh>
		</group>
		<mesh position={[0, 0.1, 0.185]} material={mat('#5a6068')}>
			<boxGeometry args={[0.09, 0.06, 0.02]} />
		</mesh>
		<mesh position={[0.025, 0.1, 0.197]} material={mat(light > 0 ? '#ff9a3a' : '#5a3a2a', {emissive: '#ff8a20', emissiveIntensity: light * 2})}>
			<sphereGeometry args={[0.012, 6, 5]} />
		</mesh>
	</group>
);

// a heart for the praise the viewer dish gets
const HEART = (() => {
	const s = new THREE.Shape();
	s.moveTo(0, -0.5);
	s.bezierCurveTo(-0.1, -0.3, -0.6, -0.1, -0.6, 0.2);
	s.bezierCurveTo(-0.6, 0.5, -0.2, 0.6, 0, 0.35);
	s.bezierCurveTo(0.2, 0.6, 0.6, 0.5, 0.6, 0.2);
	s.bezierCurveTo(0.6, -0.1, 0.1, -0.3, 0, -0.5);
	return new THREE.ExtrudeGeometry(s, {depth: 0.2, bevelEnabled: false});
})();
const Hearts: React.FC<{at: number[]; t: number; t0: number; n?: number}> = ({at, t, t0, n = 8}) => (
	<>
		{Array.from({length: n}).map((_, i) => {
			const a = t0 + i * 0.16;
			const k = ramp(t, a, a + 1.8);
			if (k <= 0 || k >= 1) return null;
			const sc = 0.09 * Math.min(1, k * 6) * (1 - smooth(k, 0.75, 1));
			return (
				<mesh key={i} geometry={HEART} position={[at[0] + Math.sin(i * 2.1) * 0.3, at[1] + 0.25 + k * 0.8, at[2] + Math.cos(i * 1.7) * 0.1]} rotation={[0, Math.sin(t * 3 + i) * 0.4, 0]} scale={sc} material={mat(i % 3 ? '#e8607a' : '#f2a0b0', {emissive: '#d84060', emissiveIntensity: 0.4})} />
			);
		})}
	</>
);

// ---------- the dining room ----------
const Room: React.FC<{night?: number; door?: number; fiesta?: boolean}> = ({night = 0, door = 0, fiesta = false}) => {
	const outside = night ? '#4a5a90' : '#bfe0f5';
	return (
		<>
			<color attach="background" args={['#221d1a']} />
			<hemisphereLight args={[col('#ffe7c7', '#7080b0', night), '#3a2e24', mix(1.05, 0.5, night)]} />
			<pointLight position={[0, 2.5, 0.2]} intensity={mix(14, 5, night)} distance={10} decay={2} color="#ffcf8f" />
			<directionalLight position={[-2, 5, 4]} intensity={mix(1.3, 0.25, night)} color={col('#fff2d6', '#9fb0ff', night)} />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#9a7656')}>
				<planeGeometry args={[14, 14]} />
			</mesh>
			<mesh position={[0, 1.6, -2.65]} material={mat('#e7d9bd')}>
				<boxGeometry args={[12, 3.2, 0.1]} />
			</mesh>
			<mesh position={[-3.2, 1.6, 0]} material={mat('#dccaa8')}>
				<boxGeometry args={[0.1, 3.2, 12]} />
			</mesh>
			<mesh position={[3.4, 1.6, 0]} material={mat('#dccaa8')}>
				<boxGeometry args={[0.1, 3.2, 12]} />
			</mesh>
			{/* window */}
			<mesh position={[-1.2, 1.8, -2.59]} material={mat(outside, {emissive: outside, emissiveIntensity: night ? 0.5 : 0.8})}>
				<boxGeometry args={[1.2, 0.9, 0.02]} />
			</mesh>
			<mesh position={[-1.2, 1.8, -2.58]} material={mat('#8a6448')}>
				<boxGeometry args={[0.05, 0.9, 0.02]} />
			</mesh>
			{night ? (
				<mesh position={[-0.9, 2.05, -2.575]} material={mat('#fff6d8', {emissive: '#fff6d8', emissiveIntensity: 1})}>
					<circleGeometry args={[0.1, 14]} />
				</mesh>
			) : null}
			{/* door: the outside shows through when it swings in */}
			<mesh position={[2.2, 0.95, -2.59]} material={mat(outside, {emissive: outside, emissiveIntensity: night ? 0.6 : 0.8})}>
				<boxGeometry args={[0.9, 1.9, 0.02]} />
			</mesh>
			<mesh position={[2.2, 1.93, -2.57]} material={mat('#6e4a30')}>
				<boxGeometry args={[1.05, 0.08, 0.06]} />
			</mesh>
			<group position={[1.75, 0, -2.55]} rotation={[0, -door * 1.6, 0]}>
				<mesh position={[0.45, 0.95, 0]} material={mat('#8a6448')}>
					<boxGeometry args={[0.9, 1.9, 0.05]} />
				</mesh>
				<mesh position={[0.8, 0.95, 0.04]} material={mat('#d8b45a', {metalness: 0.5, roughness: 0.4})}>
					<sphereGeometry args={[0.03, 6, 5]} />
				</mesh>
			</group>
			{fiesta
				? Array.from({length: 22}).map((_, i) => {
						const u = i / 21;
						return (
							<mesh key={i} position={[-3 + u * 6, 2.7 - Math.sin(Math.PI * ((u * 3) % 1)) * 0.25, -2.4]} rotation={[Math.PI / 2, Math.PI, 0]} scale={[1, 0.15, 1]} material={mat(['#c9503f', '#e8b54a', '#4f7aa3', '#6f9a4a'][i % 4])}>
								<coneGeometry args={[0.1, 0.22, 3]} />
							</mesh>
						);
					})
				: null}
		</>
	);
};
const Table: React.FC<{position?: number[]}> = ({position = [0, 0, 0]}) => (
	<group position={position as V}>
		<mesh position={[0, 0.74, 0]} material={mat('#8a5f3e')}>
			<boxGeometry args={[2.4, 0.06, 1.1]} />
		</mesh>
		<mesh position={[0, 0.775, 0]} material={mat('#e9e2d0')}>
			<boxGeometry args={[2.45, 0.01, 1.15]} />
		</mesh>
		{[[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]].map((l, i) => (
			<mesh key={i} position={[l[0], 0.37, l[1]]} material={mat('#6e4a30')}>
				<boxGeometry args={[0.08, 0.74, 0.08]} />
			</mesh>
		))}
	</group>
);
const eat = (t: number, i: number): Pose => {
	const b = Math.max(0, Math.sin(t * 3 + i * 1.7));
	return {sit: true, armL: -0.6, armR: -0.8 - b * 0.6, elbow: -0.5, bob: b * 0.02};
};
const cheer = (k: number, t: number, i: number): Pose => ({sit: true, armL: mix(-0.6, -2.5, k), armR: mix(-0.8, -2.5, k) + Math.sin(t * 9 + i) * 0.15 * k, spreadL: 0.3 * k, spreadR: 0.3 * k, elbow: mix(-0.5, -0.2, k)});
const pray: Pose = {sit: true, armL: -1.25, armR: -1.25, spreadL: -0.25, spreadR: -0.25, elbow: -0.9, bend: 0.2};
// the family seated around the table: Papa and Mama at the back, the kid at the end
const Family: React.FC<{poses: Pose[]; mouths?: boolean[]; heads?: number[]}> = ({poses, mouths = [], heads = []}) => (
	<>
		<Person {...PAPA} position={[-0.55, 0, -0.95]} pose={{...poses[0], headTurn: heads[0] ?? 0}} mouth={mouths[0]} />
		<Person {...MAMA} position={[0.45, 0, -0.95]} pose={{...poses[1], headTurn: heads[1] ?? 0}} mouth={mouths[1]} />
		<Person {...KID} scale={0.72} position={[1.5, 0.12, -0.05]} rotationY={-Math.PI / 2} pose={{...poses[2], headTurn: heads[2] ?? 0}} mouth={mouths[2]} />
	</>
);
const POT: V = [-0.1, TABLE_Y, -0.1];
const BOWL: V = [0.72, TABLE_Y, 0.3];

// ================= S1: rice is never the star =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const k = smooth(t, 2.6, 7.4);
	return (
		<>
			<Cam pos={mixV([0.3, 2.1, 4.0], [1.2, 1.3, 1.8], k)} look={mixV([0.1, 0.95, -0.3], [0.6, 0.92, 0.2], k)} fov={mix(42, 38, k)} />
			<Room />
			<Table />
			<Family poses={[eat(t, 0), eat(t, 1), eat(t, 2)]} mouths={[t % 2 < 1, t % 2.4 > 1.2, false]} />
			<AdoboPot position={POT} t={t} />
			<Dish position={[-0.75, TABLE_Y, 0.1]} kind={1} />
			<RiceBowl position={BOWL} mood="sad" tear={ramp(t, 6.0, 8.6)} />
		</>
	);
};

// ================= S2: "Wow, ang sarap!" ... for the adobo =================
export const S2: React.FC<{t: number}> = ({t}) => {
	const wow = smooth(t, 3.6, 4.1) * (1 - smooth(t, 6.4, 7.2));
	const k = smooth(t, 5.6, 7.6);
	return (
		<>
			<Cam pos={mixV([mix(-1.1, -0.6, smooth(t, 0, 5)), 1.6, 2.4], [1.2, 1.3, 1.8], k)} look={mixV([0, 1.0, -0.4], [0.6, 0.92, 0.2], k)} fov={mix(42, 38, k)} />
			<Room />
			<Table />
			<Family poses={[cheer(wow, t, 0), cheer(wow, t, 1), cheer(wow, t, 2)]} mouths={[wow > 0.5, wow > 0.5, wow > 0.5]} />
			<AdoboPot position={POT} t={t} />
			<Hearts at={POT} t={t} t0={3.85} n={10} />
			<Dish position={[-0.75, TABLE_Y, 0.1]} kind={1} />
			<RiceBowl position={BOWL} mood="sad" sigh={smooth(t, 7.6, 8.4) * (1 - smooth(t, 8.4, 9.0))} />
		</>
	);
};

// ================= S3: eaten to the last grain, still invisible =================
export const S3: React.FC<{t: number}> = ({t}) => {
	const dips = [0.3, 0.75, 1.2, 1.65, 2.1];
	const done = dips.filter((d) => t > d + 0.25).length;
	const fill = Math.max(0, 1 - done / dips.length);
	const cur = dips.find((d) => t > d && t < d + 0.45);
	const sp = cur !== undefined ? ramp(t, cur, cur + 0.45) : 1;
	const spoon: V = mixV([0.72, TABLE_Y + 0.25, 0.3], [-0.4, TABLE_Y + 0.55, -0.6], Math.sin((sp * Math.PI) / 2));
	const ghost = mix(1, 0.25, smooth(t, 8.1, 8.8)) + Math.sin(t * 6) * 0.04 * smooth(t, 8.1, 8.8);
	const wow = smooth(t, 3.9, 4.3) * (1 - smooth(t, 6.2, 6.9));
	return (
		<>
			<Cam pos={[mix(1.35, 1.2, smooth(t, 0, 11)), 1.2, mix(1.5, 1.3, smooth(t, 0, 11))]} look={[0.35, 0.92, -0.2]} fov={44} />
			<Room />
			<Table />
			<Family poses={[cheer(wow, t, 0), cheer(wow, t, 1), cheer(wow, t, 2)]} mouths={[wow > 0.5, wow > 0.5, true]} />
			<AdoboPot position={POT} t={t} />
			<Hearts at={POT} t={t} t0={4.1} n={10} />
			{t < 2.6 ? (
				<group position={spoon} rotation={[0.6, 0.8, 0]}>
					<mesh position={[0, 0.12, 0]} material={mat('#c8ccd2', {metalness: 0.6, roughness: 0.3})}>
						<cylinderGeometry args={[0.01, 0.01, 0.24, 5]} />
					</mesh>
					<mesh scale={[1, 0.35, 1.4]} material={mat('#c8ccd2', {metalness: 0.6, roughness: 0.3})}>
						<sphereGeometry args={[0.04, 8, 6]} />
					</mesh>
					{sp < 1 ? (
						<mesh position={[0, 0.02, 0]} material={mat('#fbfaf5')}>
							<sphereGeometry args={[0.035, 6, 5]} />
						</mesh>
					) : null}
				</group>
			) : null}
			<RiceBowl position={BOWL} mood="sad" fill={fill} o={ghost} />
		</>
	);
};
const Tag: React.FC<{text: string; sub?: string; o: number; y: number; color?: string; size?: number}> = ({text, sub, o, y, color = '#fff', size = 170}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: y, opacity: o}}>
		<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, color, textShadow: '0 6px 30px rgba(0,0,0,0.6)', transform: `scale(${0.7 + 0.3 * o})`}}>{text}</div>
		{sub ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 64, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,0.7)', marginTop: -6}}>{sub}</div> : null}
	</AbsoluteFill>
);
export const O3: React.FC<{t: number}> = ({t}) => <Tag text="0" sub="papuri para sa kanin" color={GOLD} size={200} o={interpolate(t, [9.5, 10.0, 11.2, 11.6], [0, 1, 1, 0], clampI)} y={300} />;

// ================= S4: the rice rebels =================
export const S4: React.FC<{t: number}> = ({t}) => {
	const jump = smooth(t, 3.4, 3.95);
	const out = t >= 3.4;
	const ball: V = [mix(0.72, 0.42, jump), TABLE_Y + Math.sin(Math.PI * jump) * 0.35 + (1 - jump) * 0.1, mix(0.3, 0.4, jump)];
	const point = smooth(t, 5.3, 5.8) * (1 - smooth(t, 7.5, 7.9));
	const away = smooth(t, 7.6, 8.2);
	const steam = ramp(t, 2.9, 4.4);
	return (
		<>
			<Cam pos={[mix(1.1, 0.95, smooth(t, 0, 9)), 1.25, mix(2.2, 2.0, smooth(t, 0, 9))]} look={[0.4, 0.95, 0.05]} fov={40} />
			<Room night={0.4} />
			<Table />
			<AdoboPot position={POT} t={t} />
			<Dish position={[-0.75, TABLE_Y, 0.1]} kind={1} />
			{out ? (
				<>
					<mesh position={[BOWL[0], TABLE_Y + 0.08, BOWL[2]]} material={mat('#eef2f4')}>
						<cylinderGeometry args={[0.24, 0.14, 0.16, 18]} />
					</mesh>
					<RiceBall position={ball} rotationY={mix(-0.3, Math.PI, away)} mood="angry" s={1.15} armL={[-0.2, mix(-0.4, -1.4, point)]} armR={[mix(0, -1.2, away), 0.4]} open={t > 5.4 && t < 7.9 ? 0.4 + Math.sin(t * 14) * 0.3 : 0} />
				</>
			) : (
				<RiceBowl position={BOWL} mood={t > 2.8 ? 'angry' : 'sad'} />
			)}
			{steam > 0 && steam < 1
				? [-1, 1].map((k) => (
						<mesh key={k} position={[BOWL[0] + k * 0.1, TABLE_Y + 0.42 + steam * 0.3, BOWL[2]]} scale={0.04 + steam * 0.06}>
							<sphereGeometry args={[1, 8, 6]} />
							<meshStandardMaterial color="#d8d8d8" transparent opacity={0.8 * (1 - steam)} flatShading depthWrite={false} />
						</mesh>
					))
				: null}
		</>
	);
};

// ================= S5 (silent): the rice runs away at night =================
const DOOR: V = [2.2, 0, -2.45];
export const S5: React.FC<{t: number}> = ({t}) => {
	const lid = smooth(t, 0.3, 0.9);
	const rise = smooth(t, 0.7, 1.2);
	const hop1 = smooth(t, 1.3, 1.8);
	const hop2 = smooth(t, 2.9, 3.5);
	const go = smooth(t, 4.3, 7.4);
	const exit = smooth(t, 7.0, 7.9);
	const cooker: V = [0.3, TABLE_Y, -0.1];
	let p: V;
	if (t < 1.3) p = [cooker[0], cooker[1] + 0.05 + rise * 0.24, cooker[2]];
	else if (t < 2.9) p = [mix(cooker[0], 0.75, hop1), TABLE_Y + Math.sin(Math.PI * hop1) * 0.25 + (1 - hop1) * 0.29, mix(cooker[2], 0.3, hop1)];
	else if (t < 4.3) p = [mix(0.75, 1.45, hop2), TABLE_Y * (1 - hop2) + Math.sin(Math.PI * hop2) * 0.3, mix(0.3, 0.75, hop2)];
	else p = mixV([1.45, 0, 0.75], [DOOR[0], 0, DOOR[2] - exit * 0.5], go);
	const dir = t > 4.3 ? Math.atan2(DOOR[0] - 1.45, DOOR[2] - 0.75) : t > 3.5 ? -2.0 : 0.3;
	const walking = t > 4.3 && t < 7.8;
	const camK = smooth(t, 2.4, 4.4), camK2 = smooth(t, 4.4, 7.0);
	return (
		<>
			<Cam
				pos={mixV(mixV([1.2, 1.5, 2.0], [2.4, 0.8, 2.2], camK), [1.3, 0.55, 0.3], camK2)}
				look={mixV(mixV([0.5, 0.95, 0.0], [1.3, 0.3, 0.5], camK), [2.15, 0.45, -2.3], camK2)}
				fov={40}
			/>
			<Room night={1} door={smooth(t, 5.2, 6.0)} />
			<Table />
			<AdoboPot position={POT} t={t} steam={false} />
			<RiceCooker position={cooker} open={lid} light={t < 7.9 ? 1 : 0} />
			{exit < 1 ? <RiceBall position={p} rotationY={dir} s={1.2} mood={t > 3.6 && t < 4.4 ? 'angry' : 'calm'} walkT={walking ? t : undefined} bandana={ramp(t, 2.0, 2.3)} bindle={ramp(t, 2.4, 2.7)} armL={[0, walking ? -0.5 + Math.sin(t * 14) * 0.3 : -0.4]} /> : null}
		</>
	);
};

// ================= S6: the feast, but no rice =================
export const S6: React.FC<{t: number}> = ({t}) => {
	const pop = (a: number) => smooth(t, a - 0.2, a + 0.15);
	const shock = smooth(t, 7.5, 7.9);
	const k = smooth(t, 0.2, 7.0);
	const happy = (i: number): Pose => ({armL: mix(-0.3, -2.4, shock), armR: mix(-0.3 - Math.max(0, Math.sin(t * 4 + i)) * 0.4, -2.4, shock), spreadL: 0.3 * shock, spreadR: 0.3 * shock, elbow: -1.0 * shock});
	return (
		<>
			<Cam pos={[mix(-1.3, 1.1, k), mix(1.6, 1.4, k), mix(2.5, 2.1, k)]} look={[mix(-0.9, 0.95, k), 0.9, mix(-0.2, 0.15, k)]} fov={40} />
			<Room fiesta />
			<Table />
			<Person {...PAPA} position={[-0.6, 0, -1.0]} pose={happy(0)} mouth={shock > 0.5} />
			<Person {...MAMA} position={[0.35, 0, -1.0]} pose={happy(1)} mouth={shock > 0.5} />
			<Person {...KID} scale={0.72} position={[1.3, 0, -0.9]} pose={happy(2)} mouth />
			<Lechon position={[-0.75, TABLE_Y, -0.05]} s={pop(2.38) * 1.3} />
			<Dish position={[-0.05, TABLE_Y, 0.15]} kind={1} s={pop(3.64) * 1.4} />
			<Spaghetti position={[0.45, TABLE_Y, -0.15]} s={pop(5.4) * 1.2} />
			<RiceCooker position={[0.95, TABLE_Y, 0.2]} open={1} />
		</>
	);
};
const BigX: React.FC<{t: number; at: number}> = ({t, at}) => {
	const k = interpolate(t, [at, at + 0.3], [0, 1], clampI);
	const o = interpolate(t, [at, at + 0.1, at + 1.5, at + 1.9], [0, 1, 1, 0], clampI);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 330, opacity: o}}>
			<div style={{fontFamily: 'sans-serif', fontWeight: 900, fontSize: 420, color: '#d33a2c', lineHeight: 1, transform: `scale(${2.2 - k * 1.2}) rotate(-8deg)`, textShadow: '0 10px 40px rgba(0,0,0,0.4)'}}>✕</div>
		</AbsoluteFill>
	);
};
export const O6: React.FC<{t: number}> = ({t}) => <BigX t={t} at={7.6} />;

// ================= S7: panic! =================
export const S7: React.FC<{t: number}> = ({t}) => {
	const shout = smooth(t, 1.5, 1.9) * (1 - smooth(t, 4.0, 4.5)) + smooth(t, 6.2, 6.5) * (1 - smooth(t, 7.8, 8.3));
	const pace = t > 4.0 && t < 6.2;
	const papaX = -0.5 + (pace ? Math.sin((t - 4.0) * 2.8) * 0.45 : 0);
	const spin = smooth(t, 8.0, 10.5);
	const peek = smooth(t, 2.6, 3.4);
	const shake = Math.sin(t * 23) * 0.012 * (1 - smooth(t, 0, 10));
	return (
		<>
			<Cam pos={[0.25 + shake, 1.55, mix(2.9, 2.5, smooth(t, 0, 10.5))]} look={[0.25, 1.0, -0.5]} fov={44} />
			<Room fiesta />
			<Table />
			<Person {...PAPA} position={[papaX, 0, -1.05]} rotationY={pace ? Math.cos((t - 4.0) * 2.8) * 0.8 : 0} pose={{...(pace ? walk(t, 1.6) : {}), armL: mix(-0.2, -2.6, shout), armR: mix(-0.2, -2.6, shout), spreadL: 0.4 * shout, spreadR: 0.4 * shout, elbow: -0.3 * shout}} mouth={shout > 0.3 || pace} />
			<Person {...MAMA} position={[0.5, 0, -1.05]} rotationY={spin * Math.PI * 4} pose={{armL: -1.15, armR: -1.15, elbow: -0.35, headTurn: Math.sin(t * 3) * 0.4}} mouth={t > 8}>
				<mesh position={[0.29, 0.02, 0.1]} material={mat('#3b3b3e', {metalness: 0.4, roughness: 0.5})}>
					<cylinderGeometry args={[0.16, 0.13, 0.16, 12]} />
				</mesh>
			</Person>
			<Person {...KID} scale={0.72} position={[1.25, 0, -0.35]} rotationY={-1.9} pose={{bend: 0.8 * peek, armL: -1.0 * peek, armR: -1.0 * peek}} />
			{[[-2.0, -0.4, 1301, 0.6], [-1.7, 0.5, 1302, 1.2], [2.2, 0.3, 1303, -1.4]].map(([x, z, sd, r], i) => (
				<Person key={i} seed={sd} position={[x, 0, z]} rotationY={r + Math.sin(t * 2 + i) * 0.3} pose={{armL: -0.3, armR: i === 1 ? -1.9 : -0.3, headTurn: Math.sin(t * 2.6 + i * 2) * 0.5}} mouth={Math.sin(t * 5 + i) > 0} />
			))}
			<Lechon position={[-0.75, TABLE_Y, -0.05]} s={1.3} />
			<Dish position={[-0.05, TABLE_Y, 0.15]} kind={1} s={1.4} />
			<Spaghetti position={[0.45, TABLE_Y, -0.15]} s={1.2} />
			<RiceCooker position={[0.95, TABLE_Y, 0.2]} open={1} />
		</>
	);
};
export const O7: React.FC<{t: number}> = ({t}) => <Tag text="?!" color="#d33a2c" size={230} o={interpolate(t, [6.3, 6.6, 8.0, 8.4], [0, 1, 1, 0], clampI)} y={290} />;

// ================= S8: the rice comes home; "Salamat, kanin" =================
export const S8: React.FC<{t: number}> = ({t}) => {
	const sw = smooth(t, 5.3, 6.3); // whip from the door to the table
	const peek = smooth(t, 0.9, 1.9);
	const papaWalk = smooth(t, 2.4, 4.6);
	const thanks = smooth(t, 10.8, 11.4);
	const glow = smooth(t, 13.0, 13.8);
	const k = smooth(t, 6.3, 14.5);
	return (
		<>
			<Cam
				pos={mixV([0.9, 1.45, 0.4], mixV([0.0, 1.9, 2.9], [0.05, 1.25, 1.35], k), sw)}
				look={mixV([2.0, 0.35, -2.3], [0, 0.95, -0.1], sw)}
				fov={mix(40, 40, sw)}
			/>
			<Room door={sw < 1 ? smooth(t, 0.3, 0.9) * 0.3 : 0} />
			<Table />
			{sw < 0.5 ? (
				<>
					<RiceBall position={[mix(2.45, 2.05, peek), 0, -2.42]} rotationY={-0.6} s={1.3} mood="sad" />
					<Person {...PAPA} position={mixV([-0.3, 0, -2.0], [1.5, 0, -2.1], papaWalk)} rotationY={Math.PI / 2} pose={{...(t > 2.4 && t < 4.6 ? walk(t, 1.3) : {}), bend: smooth(t, 4.4, 5.0) * 0.5, armL: -smooth(t, 4.4, 5.0) * 1.2, armR: -smooth(t, 4.4, 5.0) * 1.2}} mouth={t > 4.6} />
				</>
			) : (
				<>
					<Family poses={[thanks > 0 ? {...pray, ...(thanks < 1 ? {} : {})} : eat(t, 0), thanks > 0 ? pray : eat(t, 1), thanks > 0 ? pray : eat(t, 2)]} mouths={[t > 11 && t < 13, t > 11 && t < 13, t > 11 && t < 13]} />
					<AdoboPot position={[-0.6, TABLE_Y, -0.05]} t={t} />
					<Dish position={[0.65, TABLE_Y, -0.05]} kind={1} />
					<RiceBowl position={[0, TABLE_Y, 0.05]} s={1.3} mood="happy" glow={glow} open={t > 11.0 && t < 11.6 ? 0.6 : 0} />
					{glow > 0
						? Array.from({length: 8}).map((_, i) => {
								const a = i * 0.785 + t * 0.8;
								return (
									<mesh key={i} position={[Math.cos(a) * 0.45, TABLE_Y + 0.35 + Math.sin(t * 3 + i) * 0.08, 0.05 + Math.sin(a) * 0.45]} scale={glow} material={mat('#fff6b0', {emissive: '#ffe060', emissiveIntensity: 1.5})}>
										<octahedronGeometry args={[0.03, 0]} />
									</mesh>
								);
							})
						: null}
				</>
			)}
		</>
	);
};

// ================= S9: rice on every table, sunset pull-back =================
export const S9: React.FC<{t: number}> = ({t}) => {
	const pull = smooth(t, 3.5, 12.5);
	return (
		<>
			<Cam pos={[mix(0.4, 3, pull), mix(1.45, 24, pull * pull), mix(2.6, 20, pull)]} look={[mix(0, 0, pull), mix(0.85, 0, pull), mix(-0.3, -6, pull)]} fov={44} far={2000} />
			<Barangay t={t} dusk={1} houses={[-10, -5, 5, 10]} />
			<Table position={[0, 0, -0.4]} />
			<group position={[0, 0, -0.4]}>
				<Family poses={[eat(t, 0), eat(t, 1), eat(t, 2)]} mouths={[true, t % 2 < 1, true]} />
				<AdoboPot position={[-0.6, TABLE_Y, -0.05]} t={t} />
				<Lechon position={[0.65, TABLE_Y, -0.1]} s={0.9} />
				<RiceBowl position={[0, TABLE_Y, 0.15]} s={1.3} mood="happy" wink={t > 8.8 && t < 9.4} glow={0.3} />
			</group>
		</>
	);
};
