import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, interpolate} from 'remotion';
import {Cam, Person, Sky, Tree, mat, mix, mixV, rand, ramp, smooth, walk} from './kit';
import {ISLANDS, Islands, K, LAT0, LON0, proj} from './scenesB';
import {Barangay, House, col} from './props';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------- props for this video ----------
export const Cat: React.FC<{position: number[]; rotationY?: number; color?: string; headUp?: number; tail?: number; headTurn?: number; walkT?: number}> = ({position, rotationY = 0, color = '#d98a3a', headUp = 0, tail = 0, headTurn = 0, walkT}) => {
	const m = mat(color);
	const legSwing = walkT !== undefined ? Math.sin(walkT * 10) * 0.5 : 0;
	return (
		<group position={position as V} rotation={[0, rotationY, 0]}>
			<mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} material={m}>
				<capsuleGeometry args={[0.13, 0.32, 3, 8]} />
			</mesh>
			{[[-0.08, 0.18], [0.08, 0.18], [-0.08, -0.18], [0.08, -0.18]].map(([x, z], i) => (
				<mesh key={i} position={[x, 0.12, z]} rotation={[(i % 2 ? 1 : -1) * legSwing, 0, 0]} material={m}>
					<cylinderGeometry args={[0.035, 0.035, 0.24, 5]} />
				</mesh>
			))}
			<group position={[0, 0.48, 0.28]} rotation={[-headUp * 0.6, headTurn, 0]}>
				<mesh material={m}>
					<sphereGeometry args={[0.14, 10, 8]} />
				</mesh>
				{[-1, 1].map((s) => (
					<React.Fragment key={s}>
						<mesh position={[s * 0.08, 0.13, 0]} rotation={[0, 0, -s * 0.25]} material={m}>
							<coneGeometry args={[0.05, 0.11, 4]} />
						</mesh>
						<mesh position={[s * 0.05, 0.02, 0.125]} material={mat('#1d1a18')}>
							<sphereGeometry args={[0.02, 6, 5]} />
						</mesh>
					</React.Fragment>
				))}
				<mesh position={[0, -0.03, 0.135]} material={mat('#e08a7a')}>
					<sphereGeometry args={[0.015, 5, 4]} />
				</mesh>
			</group>
			{/* tail: three segments curling up */}
			<group position={[0, 0.36, -0.28]} rotation={[-0.9 - tail * 0.3, Math.sin(tail * 3) * 0.4, 0]}>
				<mesh position={[0, 0.14, 0]} material={m}>
					<cylinderGeometry args={[0.025, 0.03, 0.3, 5]} />
				</mesh>
				<group position={[0, 0.28, 0]} rotation={[0.7, 0, 0]}>
					<mesh position={[0, 0.1, 0]} material={m}>
						<cylinderGeometry args={[0.02, 0.025, 0.22, 5]} />
					</mesh>
				</group>
			</group>
		</group>
	);
};

export const Heart: React.FC<{position: number[]; s?: number}> = ({position, s = 1}) => (
	<group position={position as V} scale={s}>
		{[-1, 1].map((k) => (
			<mesh key={k} position={[k * 0.06, 0.04, 0]} material={mat('#ff6f8f', {emissive: '#ff3f6f', emissiveIntensity: 0.6})}>
				<sphereGeometry args={[0.075, 8, 6]} />
			</mesh>
		))}
		<mesh position={[0, -0.05, 0]} rotation={[Math.PI, 0, Math.PI / 4]} material={mat('#ff6f8f', {emissive: '#ff3f6f', emissiveIntensity: 0.6})}>
			<coneGeometry args={[0.11, 0.16, 4]} />
		</mesh>
	</group>
);

const Phone: React.FC<{lit?: number}> = ({lit = 1}) => (
	<mesh rotation={[-0.4, 0, 0]} material={mat('#9fd0ff', {emissive: '#9fd0ff', emissiveIntensity: lit})}>
		<boxGeometry args={[0.09, 0.16, 0.015]} />
	</mesh>
);

// glowing "phone" dots over the islands
const point = (pt: number[], poly: number[][]) => {
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i], [xj, yj] = poly[j];
		if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
};
const PhoneLights: React.FC<{t: number; t0: number; t1: number; n?: number}> = ({t, t0, t1, n = 900}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const pts = useMemo(() => {
		const r = rand(404);
		const out: number[][] = [];
		while (out.length < n) {
			const lon = 117 + r() * 9.7, lat = 5.5 + r() * 13.2;
			if (ISLANDS.some((p) => point([lon, lat], p))) {
				const [x, y] = proj(lon, lat);
				out.push([x, -y, r()]);
			}
		}
		return out;
	}, [n]);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		pts.forEach((p, i) => {
			const on = ramp(t, mix(t0, t1, p[2]), mix(t0, t1, p[2]) + 0.4);
			const s = on * (3 + 1.5 * Math.sin(t * 6 + i));
			m.compose(new THREE.Vector3(p[0], 2, p[1]), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
			ref.current!.setMatrixAt(i, m);
		});
		ref.current!.instanceMatrix.needsUpdate = true;
	});
	const geo = useMemo(() => new THREE.SphereGeometry(1, 6, 4), []);
	return <instancedMesh ref={ref} args={[geo, mat('#bfe4ff', {emissive: '#9fd0ff', emissiveIntensity: 2}), pts.length]} frustumCulled={false} />;
};

const NightSea: React.FC<{y: number}> = ({y}) => (
	<>
		<color attach="background" args={['#0d1328']} />
		<fog attach="fog" args={['#0d1328', y * 2.2, y * 8]} />
		<hemisphereLight args={['#6b78b0', '#101420', 0.9]} />
		<directionalLight position={[300, 600, 200]} intensity={0.9} color="#a8b8ff" />
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} material={mat('#1d3550', {roughness: 0.4})}>
			<planeGeometry args={[30000, 30000]} />
		</mesh>
		<Islands />
	</>
);

const CEBU = proj(123.9, 10.3); // [x, y] -> world (x, -y)

// ================= S1: the whole country asks one question =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const p = smooth(t, 0, 12);
	const y = mix(2600, 900, p);
	const tx = mix((121.8 - LON0) * K, CEBU[0], p), tz = mix(-(11.9 - LAT0) * K, -CEBU[1], p);
	return (
		<>
			<Cam pos={[tx, y, tz + y * 0.25]} look={[tx, 0, tz]} fov={40} near={y * 0.01} far={y * 8} />
			<NightSea y={y} />
			<PhoneLights t={t} t0={1.0} t1={8.5} />
		</>
	);
};
const Bubble: React.FC<{text: string; o: number; y?: number; size?: number}> = ({text, o, y = 700, size = 120}) => (
	<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: y, opacity: o}}>
		<div style={{transform: `scale(${0.6 + 0.4 * o})`, background: 'rgba(255,255,255,0.92)', color: '#1d2440', borderRadius: 60, padding: '24px 56px', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: size, boxShadow: '0 10px 40px rgba(120,170,255,0.6)'}}>{text}</div>
	</AbsoluteFill>
);
export const O1: React.FC<{t: number}> = ({t}) => <Bubble text="???" o={interpolate(t, [3, 3.6, 11, 11.8], [0, 1, 1, 0], clampI)} y={560} size={140} />;

// ================= S2: it started on the radio =================
export const S2: React.FC<{t: number}> = ({t}) => {
	const out = smooth(t, 4.5, 11.5);
	const camP = mixV([0.9, 1.5, 2.2], [9, 14, 22], out);
	const look = mixV([0, 1.2, 0], [0, 3, -4], out);
	const waves = [0, 1, 2, 3, 4, 5];
	return (
		<>
			<Cam pos={camP} look={look} fov={40} far={600} />
			<Barangay t={t} night={0.35} dusk={0.6} houses={[-20, -15, -10, -5, 5, 10, 15, 20]} extraRows />
			{/* radio booth on a small tower, open towards the camera */}
			<group>
				<mesh position={[0, 0.02, -0.6]} material={mat('#5a5a60')}>
					<boxGeometry args={[3, 0.04, 2.2]} />
				</mesh>
				<mesh position={[0, 1.5, -1.7]} material={mat('#c9b38a')}>
					<boxGeometry args={[3, 3, 0.1]} />
				</mesh>
				{[-1.5, 1.5].map((x) => (
					<mesh key={x} position={[x, 1.5, -0.6]} material={mat('#c9b38a')}>
						<boxGeometry args={[0.1, 3, 2.2]} />
					</mesh>
				))}
				<mesh position={[0, 3.05, -0.6]} material={mat('#8a6a52')}>
					<boxGeometry args={[3.2, 0.1, 2.4]} />
				</mesh>
				<mesh position={[0, 0.4, -0.6]} material={mat('#6e4a30')}>
					<boxGeometry args={[1.6, 0.8, 0.7]} />
				</mesh>
				<mesh position={[0.2, 1.0, -0.4]} rotation={[0.4, 0, 0]} material={mat('#2e3238')}>
					<cylinderGeometry args={[0.02, 0.02, 0.4, 5]} />
				</mesh>
				<mesh position={[0.2, 1.22, -0.33]} material={mat('#3b3b3e', {metalness: 0.5})}>
					<sphereGeometry args={[0.07, 8, 6]} />
				</mesh>
				<Person seed={801} shirt="#4f6a8f" position={[0.2, 0, -1.2]} pose={{sit: true, armL: -1.1, armR: -1.0 + Math.sin(t * 4) * 0.2, elbow: -0.6}} mouth={t < 11} />
				{/* headphones */}
				<mesh position={[0.2, 1.4, -1.2]} rotation={[0, 0, Math.PI / 2]} material={mat('#1d1a18')}>
					<torusGeometry args={[0.24, 0.025, 4, 12, Math.PI]} />
				</mesh>
				<mesh position={[0, 6.5, -1.2]} material={mat('#9aa0a6')}>
					<cylinderGeometry args={[0.06, 0.12, 7, 5]} />
				</mesh>
				<mesh position={[0, 10.1, -1.2]} material={mat('#ff5a4a', {emissive: '#ff3a2a', emissiveIntensity: 1.2})}>
					<sphereGeometry args={[0.18, 8, 6]} />
				</mesh>
			</group>
			<pointLight position={[0, 2.6, -0.4]} intensity={6} distance={6} color="#ffd59a" />
			{waves.map((i) => {
				const k = ((t * 0.5 + i / waves.length) % 1);
				return (
					<mesh key={i} position={[0, 10.1, -1.2]} rotation={[Math.PI / 2, 0, 0]} scale={1 + k * 40}>
						<torusGeometry args={[1, 0.012, 4, 48]} />
						<meshBasicMaterial color="#9fe0ff" transparent opacity={(1 - k) * 0.8 * smooth(t, 3, 5)} depthWrite={false} />
					</mesh>
				);
			})}
		</>
	);
};

// ================= S3: everyone is talking about it =================
export const S3: React.FC<{t: number}> = ({t}) => {
	const cx = t < 3.4 ? -6 : t < 4.4 ? mix(-6, 0, smooth(t, 3.4, 4.4)) : t < 6.8 ? 0 : mix(0, 5.8, smooth(t, 6.8, 7.8));
	return (
		<>
			<Cam pos={[cx + 0.3, 1.6, 3.6]} look={[cx, 0.9, -0.5]} fov={44} />
			<Sky top="#8fc0e3" bottom="#f1eee2" />
			<fog attach="fog" args={['#eeeadc', 18, 80]} />
			<hemisphereLight args={['#f2efe6', '#5a6248', 1.25]} />
			<directionalLight position={[20, 40, 20]} intensity={2.1} color="#fff1da" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#8faa64')}>
				<planeGeometry args={[400, 400]} />
			</mesh>
			{/* lola on a bench squinting at her phone */}
			<mesh position={[-6, 0.3, -0.4]} material={mat('#8a6448')}>
				<boxGeometry args={[1.6, 0.08, 0.5]} />
			</mesh>
			<House position={[-6, 0, -4]} color="#e2d6bf" roof="#a85d4a" />
			<Person seed={811} shirt="#8a6f8f" hairColor="#c9c4bc" longHair position={[-6, -0.15, -0.55]} pose={{sit: true, armL: -1.3, armR: -1.3, elbow: -1.0, bob: 0}} mouth={Math.sin(t * 5) > 0}>
				<group position={[0.29, 0.1, 0.18]}>
					<Phone />
				</group>
			</Person>
			{/* classroom: blackboard with chalk scribbles, giggling students */}
			<mesh position={[0, 1.6, -1.8]} material={mat('#2f4a3c')}>
				<boxGeometry args={[3, 1.3, 0.06]} />
			</mesh>
			{[0, 1, 2, 3, 4].map((i) => (
				<mesh key={i} position={[-0.9 + i * 0.42, 1.65 + Math.sin(i * 2) * 0.1, -1.76]} rotation={[0, 0, i * 0.7]} material={mat('#f2f0ea')}>
					<boxGeometry args={[0.3, 0.035, 0.01]} />
				</mesh>
			))}
			<mesh position={[1.0, 1.6, -1.76]} material={mat('#f2f0ea')}>
				<torusGeometry args={[0.13, 0.02, 4, 12, Math.PI * 1.5]} />
			</mesh>
			<Person seed={812} shirt="#d8d4cc" position={[-1.3, 0, -1.2]} rotationY={0.4} pose={{armR: -2.0, spreadR: 0.5, armL: 0.05}} mouth />
			{[-0.5, 0.4, 1.3].map((x, i) => (
				<Person key={i} seed={820 + i} scale={0.72} position={[x, 0, 0.6]} rotationY={Math.PI} pose={{armL: -1.6, armR: -1.6, elbow: -1.4, bob: Math.abs(Math.sin(t * 9 + i)) * 0.05}} />
			))}
			{/* tricycle driver laughing */}
			<group position={[6, 0, -0.6]}>
				<mesh position={[0.6, 0.75, 0]} material={mat('#3f6aa0')}>
					<boxGeometry args={[1.0, 1.0, 1.0]} />
				</mesh>
				<mesh position={[0.6, 1.35, 0]} material={mat('#e8e2d2')}>
					<boxGeometry args={[1.1, 0.1, 1.1]} />
				</mesh>
				{[[-0.6, 0.3, 0.3], [0.6, 0.3, 0.55], [-0.6, 0.3, -0.3]].map((w, i) => (
					<mesh key={i} position={w as V} rotation={[0, 0, Math.PI / 2]} material={mat('#26262a')}>
						<cylinderGeometry args={[0.3, 0.3, 0.12, 10]} />
					</mesh>
				))}
				<mesh position={[-0.6, 0.65, 0]} material={mat('#b5473b')}>
					<boxGeometry args={[0.9, 0.25, 0.3]} />
				</mesh>
				<Person seed={831} shirt="#c27b4f" position={[-0.6, 0.15, 0]} rotationY={Math.PI / 2} pose={{sit: true, armL: -1.2, armR: -1.2 - Math.abs(Math.sin(t * 8)) * 0.3, bob: Math.abs(Math.sin(t * 8)) * 0.04}} mouth />
			</group>
		</>
	);
};

// ================= S4: two cats on a moonlit roof (silent) =================
export const S4: React.FC<{t: number}> = ({t}) => {
	const meet = smooth(t, 0.3, 3.2);
	const ridge = 3.78;
	const catA: V = [mix(-2.6, -0.32, meet), ridge, 0];
	const catB: V = [mix(2.6, 0.32, meet), ridge, 0];
	const meow = t > 4.2 && t < 6.6;
	const lightOff = t > 7.3;
	return (
		<>
			<Cam pos={[mix(0.5, 0.2, smooth(t, 0, 9)), mix(4.9, 4.6, smooth(t, 0, 9)), mix(3.6, 2.6, smooth(t, 0, 9))]} look={[0, 4.0, 0]} fov={40} />
			<color attach="background" args={['#141a33']} />
			<fog attach="fog" args={['#141a33', 15, 60]} />
			<hemisphereLight args={['#6b78b0', '#101420', 0.8]} />
			<directionalLight position={[-6, 10, 6]} intensity={1.0} color="#c8d4ff" />
			<directionalLight position={[0, 6, 8]} intensity={1.4} color="#ffe2c0" />
			<mesh position={[-3.5, 7.5, -12]}>
				<sphereGeometry args={[1.6, 20, 14]} />
				<meshBasicMaterial color="#fff6d8" fog={false} />
			</mesh>
			{Array.from({length: 40}).map((_, i) => {
				const r = rand(i + 600);
				return (
					<mesh key={i} position={[(r() - 0.5) * 40, 6 + r() * 12, -18 - r() * 6]}>
						<sphereGeometry args={[0.04 + r() * 0.04, 4, 3]} />
						<meshBasicMaterial color="#ffffff" fog={false} />
					</mesh>
				);
			})}
			<group position={[0, 0, 0]}>
				{/* house body + ridge roof */}
				<mesh position={[0, 1.5, 0]} material={mat('#c9d5dc')}>
					<boxGeometry args={[6, 3, 4]} />
				</mesh>
				{[-1, 1].map((s) => (
					<mesh key={s} position={[0, 3.3, s * 1.05]} rotation={[s * 0.62, 0, 0]} material={mat('#7a3f36')}>
						<boxGeometry args={[6.4, 0.08, 2.5]} />
					</mesh>
				))}
				<mesh position={[1.4, 1.7, 2.01]} material={mat(lightOff ? '#3a4048' : '#ffd98a', lightOff ? {} : {emissive: '#ffcf7a', emissiveIntensity: 0.9})}>
					<boxGeometry args={[0.9, 0.8, 0.04]} />
				</mesh>
			</group>
			<House position={[-7, -0.5, -4]} color="#cfd8c4" roof="#5a3f36" lit={0.8} />
			<House position={[7, -0.5, -5]} color="#e8cfb0" roof="#5a3f36" lit={0.6} />
			<Cat position={catA} rotationY={Math.PI / 2} walkT={meet < 1 ? t : undefined} headUp={meow ? Math.max(0, Math.sin((t - 4.2) * 2.6)) : 0} tail={t} color="#d98a3a" />
			<Cat position={catB} rotationY={-Math.PI / 2} walkT={meet < 1 ? t : undefined} headUp={meow ? Math.max(0, Math.sin((t - 4.6) * 2.6)) : 0} tail={t + 1} color="#8a8a90" />
			{[0, 1, 2, 3].map((i) => {
				const k = ramp(t, 3.3 + i * 0.35, 5.8 + i * 0.35);
				return k > 0 && k < 1 ? <Heart key={i} position={[(i - 1.5) * 0.18, ridge + 0.75 + k * 1.2, 0.1]} s={0.6 + Math.sin(k * Math.PI) * 0.6} /> : null;
			})}
		</>
	);
};

// ================= S5: the word splits into esmi + iring =================
const Park: React.FC<{t: number; blush?: number; hearts?: number; catsLook?: number}> = ({t, blush = 0, hearts = 0, catsLook = 0}) => (
	<>
		<color attach="background" args={['#141a33']} />
		<fog attach="fog" args={['#141a33', 14, 60]} />
		<hemisphereLight args={['#7a86c0', '#141824', 0.95]} />
		<directionalLight position={[-6, 10, 6]} intensity={0.9} color="#c8d4ff" />
		<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#2d3a2a')}>
			<planeGeometry args={[200, 200]} />
		</mesh>
		<mesh position={[-3.5, 8, -16]}>
			<sphereGeometry args={[1.6, 20, 14]} />
			<meshBasicMaterial color="#fff6d8" fog={false} />
		</mesh>
		{/* bench + lamp on the left */}
		<group position={[0, 0, 0.6]}>
			<mesh position={[0, 0.45, 0]} material={mat('#8a6448')}>
				<boxGeometry args={[1.8, 0.08, 0.5]} />
			</mesh>
			<mesh position={[0, 0.8, -0.25]} material={mat('#8a6448')}>
				<boxGeometry args={[1.8, 0.5, 0.06]} />
			</mesh>
			<mesh position={[-1.3, 1.4, 0]} material={mat('#3a3b40')}>
				<cylinderGeometry args={[0.05, 0.07, 2.8, 6]} />
			</mesh>
			<mesh position={[-1.3, 2.85, 0]} material={mat('#ffe2a0', {emissive: '#ffd27a', emissiveIntensity: 1.3})}>
				<sphereGeometry args={[0.18, 10, 8]} />
			</mesh>
			<pointLight position={[-1.3, 2.7, 0.3]} intensity={5} distance={6} color="#ffd59a" />
			<Person seed={841} shirt="#4f7aa3" position={[-0.38, -0.03, 0.05]} rotationY={0.25} pose={{sit: true, armL: -0.6, armR: -0.3, spreadR: -0.6, elbow: -0.4, headTurn: 0.4 * blush}} />
			<Person seed={842} shirt="#c9503f" longHair position={[0.38, -0.03, 0.05]} rotationY={-0.25} pose={{sit: true, armL: -0.3, spreadL: -0.6, armR: -0.6, elbow: -0.4, headTurn: -0.4 * blush}} />
			{blush > 0
				? [-0.38, 0.38].map((x) => (
						<mesh key={x} position={[x, 1.33, 0.25]} material={mat('#ff6f8f', {transparent: true, opacity: 0.55 * blush})}>
							<boxGeometry args={[0.36, 0.06, 0.01]} />
						</mesh>
					))
				: null}
			{Array.from({length: 4}).map((_, i) => {
				const k = ((t * 0.4 + i / 4) % 1);
				return hearts > 0 ? <Heart key={i} position={[(i - 1.5) * 0.25, 1.9 + k * 1.2, 0]} s={hearts * Math.sin(k * Math.PI) * 0.9} /> : null;
			})}
		</group>
		{/* roof with the cats on the right */}
		<group position={[0.5, 0, -4.2]}>
			<mesh position={[0, 1.2, 0]} material={mat('#c9d5dc')}>
				<boxGeometry args={[3, 2.4, 2.4]} />
			</mesh>
			{[-1, 1].map((s) => (
				<mesh key={s} position={[0, 2.62, s * 0.62]} rotation={[s * 0.62, 0, 0]} material={mat('#7a3f36')}>
					<boxGeometry args={[3.2, 0.08, 1.5]} />
				</mesh>
			))}
			<Cat position={[-0.3, 2.95, 0]} rotationY={Math.PI / 2} tail={t} headTurn={catsLook * 0.5} color="#d98a3a" />
			<Cat position={[0.3, 2.95, 0]} rotationY={-Math.PI / 2} tail={t + 1} headTurn={-catsLook * 0.5} color="#8a8a90" />
		</group>
	</>
);
export const S5: React.FC<{t: number}> = ({t}) => (
	<>
		<Cam pos={[0.2, mix(2.5, 2.7, smooth(t, 0, 16)), mix(8.2, 7.4, smooth(t, 0, 16))]} look={[0.2, 1.2, -1.5]} fov={44} />
		<Park t={t} />
	</>
);
// the word, its letters, and the two halves flying to their owners
export const O5: React.FC<{t: number}> = ({t}) => {
	const word = 'ESMIRINGHOY';
	const show = interpolate(t, [0.3, 1.0, 15.2, 16], [0, 1, 1, 0], clampI);
	const esmi = interpolate(t, [8.2, 8.8], [0, 1], clampI); // "esmi" is spoken at ~8.4 s
	const iring = interpolate(t, [12.1, 12.7], [0, 1], clampI); // "iring" at ~12.3 s
	const fly = interpolate(t, [13.6, 15.0], [0, 1], clampI);
	return (
		<AbsoluteFill style={{opacity: show}}>
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 300, opacity: 1 - fly}}>
				<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 118, letterSpacing: 4, color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,0.6)'}}>
					{word.split('').map((c, i) => {
						const inE = i <= 3, inI = i >= 3 && i <= 7;
						const gold = (inE && esmi > 0.5) || (inI && iring > 0.5);
						const lift = (inE ? esmi : 0) * -18 + (inI ? iring : 0) * 18;
						return (
							<span key={i} style={{display: 'inline-block', color: gold ? GOLD : '#fff', transform: `translateY(${lift}px)`}}>
								{c}
							</span>
						);
					})}
				</div>
			</AbsoluteFill>
			{[
				{txt: 'esmi', from: [300, 330], to: [430, 930], k: esmi},
				{txt: 'iring', from: [700, 330], to: [560, 420], k: iring},
			].map((c) => (
				<div key={c.txt} style={{position: 'absolute', left: mix(c.from[0], c.to[0], fly) - 110, top: mix(c.from[1], c.to[1], fly), width: 220, textAlign: 'center', opacity: fly * c.k, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 76, color: GOLD, textShadow: '0 3px 16px rgba(0,0,0,0.7)'}}>
					{c.txt}
				</div>
			))}
		</AbsoluteFill>
	);
};

// ================= S6: blushing couple, knowing cats =================
export const S6: React.FC<{t: number}> = ({t}) => (
	<>
		<Cam pos={[0.2, 2.7, mix(7.4, 6.2, smooth(t, 0, 11))]} look={[0.2, 1.3, -1.5]} fov={44} />
		<Park t={t} blush={smooth(t, 1.0, 2.0)} hearts={smooth(t, 2.0, 3.0)} catsLook={smooth(t, 3.5, 4.2) - smooth(t, 6.8, 7.4) * 0} />
		{/* thought bubble: moon + hearts */}
		{t > 5.0
			? (() => {
					const k = smooth(t, 5.0, 5.8);
					return (
						<group position={[1.9, 4.9, -4.2]} scale={k}>
							{[[-0.5, 0, 0, 0.55], [0.3, 0.2, 0, 0.65], [0.9, -0.1, 0, 0.5], [0.2, -0.35, 0, 0.5], [-0.9, -0.5, 0, 0.18], [-1.15, -0.8, 0, 0.1]].map((b, i) => (
								<mesh key={i} position={[b[0], b[1], b[2]]} material={mat('#ffffff', {emissive: '#ffffff', emissiveIntensity: 0.25})}>
									<sphereGeometry args={[b[3], 12, 9]} />
								</mesh>
							))}
							<mesh position={[0.1, 0.05, 0.6]} material={mat('#fff1b0', {emissive: '#ffe27a', emissiveIntensity: 0.8})}>
								<sphereGeometry args={[0.22, 10, 8]} />
							</mesh>
							<Heart position={[0.55, -0.1, 0.62]} s={1.4} />
						</group>
					);
				})()
			: null}
	</>
);

// ================= S7: other guesses, no dictionary entry yet =================
export const S7: React.FC<{t: number}> = ({t}) => {
	const flip = (t * 1.6) % 1;
	return (
		<>
			<Cam pos={[mix(0.6, 0.2, smooth(t, 0, 13)), mix(2.0, 1.6, smooth(t, 0, 13)), mix(2.6, 1.7, smooth(t, 0, 13))]} look={[0, 0.85, 0]} fov={40} near={0.05} />
			<color attach="background" args={['#221d1a']} />
			<hemisphereLight args={['#ffe7c7', '#3a2e24', 0.9]} />
			<pointLight position={[0.3, 2.2, 0.6]} intensity={9} distance={7} decay={2} color="#ffcf8f" />
			<mesh position={[0, 0.37, 0]} material={mat('#6e4a30')}>
				<boxGeometry args={[2.4, 0.74, 1.4]} />
			</mesh>
			{/* the big dictionary, pages turning, all blank where the word should be */}
			<group position={[0, 0.77, 0]}>
				<mesh position={[0, 0.03, 0]} material={mat('#7a2f2a')}>
					<boxGeometry args={[1.3, 0.06, 0.9]} />
				</mesh>
				{[-1, 1].map((s) => (
					<mesh key={s} position={[s * 0.31, 0.09, 0]} rotation={[0, 0, -s * 0.06]} material={mat('#f2ead6')}>
						<boxGeometry args={[0.6, 0.06, 0.84]} />
					</mesh>
				))}
				<group position={[0, 0.13, 0]} rotation={[0, 0, -flip * Math.PI]}>
					<mesh position={[0.3, 0, 0]} material={mat('#fbf6e8')}>
						<boxGeometry args={[0.6, 0.006, 0.82]} />
					</mesh>
				</group>
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<mesh key={i} position={[-0.31, 0.125, -0.3 + i * 0.12]} material={mat('#9a948a')}>
						<boxGeometry args={[0.45, 0.002, 0.025]} />
					</mesh>
				))}
			</group>
			<mesh position={[0.85, 0.88, 0.3]} rotation={[0, 0.5, 0]} material={mat('#3b3b3e')}>
				<cylinderGeometry args={[0.07, 0.06, 0.2, 10]} />
			</mesh>
		</>
	);
};
const Card: React.FC<{text: string; t: number; at: number; x: number; y: number; rot: number}> = ({text, t, at, x, y, rot}) => {
	const inK = interpolate(t, [at, at + 0.35], [0, 1], clampI);
	const stamp = interpolate(t, [at + 1.4, at + 1.6], [0, 1], clampI);
	const pop = interpolate(t, [at + 3.2, at + 3.6], [1, 0], clampI);
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${0.5 + 0.5 * inK + (1 - pop) * 0.3})`, opacity: inK * pop, background: 'rgba(255,250,238,0.95)', color: '#2a2420', borderRadius: 24, padding: '20px 34px', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 64, boxShadow: '0 10px 30px rgba(0,0,0,0.45)'}}>
			{text}
			<span style={{position: 'absolute', right: -30, top: -40, fontSize: 130, color: '#d33a2c', opacity: stamp, transform: `scale(${2 - stamp})`, fontFamily: 'sans-serif', fontStyle: 'normal'}}>?</span>
		</div>
	);
};
export const O7: React.FC<{t: number}> = ({t}) => (
	<AbsoluteFill>
		<Card text="esme + ring + hoy" t={t} at={0.6} x={150} y={330} rot={-5} />
		<Card text="esmi + iring" t={t} at={2.6} x={330} y={560} rot={4} />
		<Card text="??? + hoy" t={t} at={4.6} x={200} y={420} rot={-2} />
	</AbsoluteFill>
);

// ================= S8: words rise like stars over the islands =================
export const S8: React.FC<{t: number}> = ({t}) => {
	const p = smooth(t, 0, 13);
	const y = mix(700, 2900, p);
	const tx = mix(CEBU[0], (121.8 - LON0) * K, p), tz = mix(-CEBU[1], -(11.9 - LAT0) * K, p);
	return (
		<>
			<Cam pos={[tx, y, tz + y * 0.25]} look={[tx, 0, tz]} fov={40} near={y * 0.01} far={y * 8} />
			<NightSea y={y} />
			<PhoneLights t={t + 20} t0={0} t1={1} />
		</>
	);
};
export const O8: React.FC<{t: number}> = ({t}) => {
	const words = ['kilig', 'jowa', 'petmalu', 'charot', 'lodi', 'werpa', 'esmiringhoy', 'sana all', 'beshie', 'awit'];
	return (
		<AbsoluteFill>
			{words.map((w, i) => {
				const r = rand(i * 7919 + 77);
				const start = 0.6 + i * 0.8;
				const k = interpolate(t, [start, start + 5], [0, 1], clampI);
				const o = interpolate(t, [start, start + 0.6, 12.5, 13.5], [0, 1, 1, 0], clampI);
				const x = 120 + r() * 760;
				const y0 = 950 + r() * 300, y1 = 160 + r() * 420;
				return (
					<div key={w} style={{position: 'absolute', left: x - 120, top: mix(y0, y1, Math.pow(k, 0.7)), width: 240, textAlign: 'center', opacity: o, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: w === 'esmiringhoy' ? 64 : 50, color: w === 'esmiringhoy' ? GOLD : '#dfe9ff', textShadow: '0 0 18px rgba(160,200,255,0.9)'}}>
						{w}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
