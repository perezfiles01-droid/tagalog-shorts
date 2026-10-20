import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {C, Cam, Cloud, Mountain, Person, Sky, Stalk, TerraceHill, mat, mix, mixV, rand, ramp, smooth, walk} from './kit';

const col = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, k))).getHexString();

// ================= Scene 1: descent onto the terraces at dawn =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const p = 1 - Math.pow(1 - ramp(t, 0, 13), 2.6);
	const r = rand(11);
	const clouds = useMemo(() => Array.from({length: 12}).map(() => [(r() - 0.5) * 90, 40 + r() * 16, (r() - 0.5) * 70 + 10, 1.6 + r() * 2.2]), []);
	const hills = [
		{pos: [0, 0, 0], R: 16, n: 13, s: 0.75},
		{pos: [-34, -1, -20], R: 20, n: 14, s: 0.8},
		{pos: [33, -1, -26], R: 18, n: 13, s: 0.8},
		{pos: [-8, -2, -62], R: 27, n: 16, s: 0.9},
		{pos: [42, -2, -78], R: 24, n: 15, s: 0.9},
		{pos: [-50, -2, -70], R: 22, n: 14, s: 0.85},
	];
	return (
		<>
			<Cam pos={[mix(-4, 9, p), mix(70, 12.5, p), mix(16, 33, p)]} look={[0, mix(0, 5, p), mix(0, -4, p)]} fov={42} far={2500} />
			<Sky top="#7fa6d1" bottom="#f6caa0" />
			<fog attach="fog" args={['#efd8c2', 50, 300]} />
			<hemisphereLight args={['#f7dfc6', '#4f6145', 1.25]} />
			<directionalLight position={[70, 28, -40]} intensity={2.4} color="#ffc68f" />
			<mesh position={[230, 34, -560]}>
				<sphereGeometry args={[16, 20, 14]} />
				<meshBasicMaterial color="#ffe6bd" fog={false} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} material={mat('#6c8c52')}>
				<planeGeometry args={[800, 800]} />
			</mesh>
			{hills.map((h, i) => (
				<TerraceHill key={i} position={h.pos} radius={h.R} tiers={h.n} step={h.s} arc={Math.PI * 2} water={0.55} seed={i + 2} />
			))}
			{[[-120, -190, 60, 85], [-30, -230, 75, 105], [80, -210, 65, 90], [170, -180, 55, 70], [-200, -150, 50, 60]].map((m, i) => (
				<Mountain key={i} position={[m[0], -2, m[1]]} r={m[2]} h={m[3]} color="#8e9f97" seed={i} />
			))}
			{/* valley mist */}
			{[0, 1, 2].map((i) => (
				<mesh key={i} position={[((t * 1.2 + i * 25) % 90) - 45, 1.2 + i * 0.6, 14 - i * 16]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#ffffff', {transparent: true, opacity: 0.28, depthWrite: false})}>
					<planeGeometry args={[70, 14]} />
				</mesh>
			))}
			{clouds.map((c, i) => (
				<Cloud key={i} position={[c[0] + t * 0.5, c[1], c[2]]} s={c[3]} seed={i + 5} opacity={0.92} />
			))}
			{/* farmers walking along the terraces */}
			{[3, 5, 7, 9, 4].map((tier, i) => {
				const R = 16 * (1 - tier / 14.5) - 0.7;
				const a = 0.2 + i * 0.5 + t * 0.03 * (i % 2 ? 1 : -1);
				return (
					<Person key={i} seed={i + 30} hat position={[Math.sin(a) * R, tier * 0.75 + 0.75, Math.cos(a) * R]} rotationY={a + (i % 2 ? Math.PI / 2 : -Math.PI / 2)} scale={0.9} pose={walk(t, 0.8, i * 0.3)} />
				);
			})}
		</>
	);
};

// ================= Scene 2: planting seedlings in the paddy =================
const Seedling: React.FC<{position: number[]; g: number; color: string}> = ({position, g, color}) => (
	<group position={position as [number, number, number]} scale={[g, g, g]}>
		{[-0.35, 0, 0.35].map((a, i) => (
			<mesh key={i} position={[Math.sin(a) * 0.05, 0.14, 0]} rotation={[0, i * 2, a]} material={mat(color)}>
				<coneGeometry args={[0.018, 0.32, 4]} />
			</mesh>
		))}
	</group>
);

export const S2: React.FC<{t: number}> = ({t}) => {
	const p = smooth(t, 0, 10.5);
	const lapse = smooth(t, 6, 10);
	const fz = (time: number) => 3 - time * 0.45 - Math.max(0, time - 6) * 0.6;
	const farmerX = [-2.2, 0, 2.2];
	const rows = 22;
	const seedColor = col('#a9cf72', '#5d9a3c', lapse);
	const sunA = 0.6 + lapse * 2.4;
	return (
		<>
			<Cam pos={[mix(-4.5, 3.5, p), mix(2.4, 3.6, p), mix(9.5, 8.5, p)]} look={[0, 0.5, mix(0.5, -3.5, p)]} fov={40} />
			<Sky top="#93bddc" bottom="#e9eee9" />
			<fog attach="fog" args={['#dfe7e2', 14, 95]} />
			<hemisphereLight args={['#eef3f0', '#59664c', 1.2]} />
			<directionalLight position={[Math.cos(sunA) * 40, 40, Math.sin(sunA) * 30]} intensity={2.2} color="#fff0d8" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#8e9a85', {roughness: 0.28, metalness: 0.18})}>
				<planeGeometry args={[200, 200]} />
			</mesh>
			<TerraceHill position={[0, -0.4, -62]} radius={46} tiers={13} step={1.7} arc={Math.PI * 2} water={0.45} seed={8} />
			<TerraceHill position={[-60, -0.4, -40]} radius={30} tiers={12} step={1.5} arc={Math.PI * 2} water={0.45} seed={9} />
			{[[-14, -15], [-8, -42], [6, -32], [-12, -38]].map((c, i) => (
				<Cloud key={i} position={[c[0] + t * (lapse > 0 ? 4 : 0.4) * (1 + lapse * 3), 22 + i * 3, c[1] - 30]} s={4} seed={i + 40} />
			))}
			{farmerX.map((x, i) => {
				const z = fz(t);
				const plant = Math.sin(t * Math.PI * 2 * 0.85 + i * 1.3);
				return (
					<Person key={i} seed={i + 50} hat position={[x, -0.05, z]} rotationY={0} pose={{bend: 0.9, armR: -0.55 + plant * 0.45, armL: -0.95, spreadL: 0.25, elbow: -0.3, leg: 0.12}} />
				);
			})}
			{farmerX.map((x, i) =>
				Array.from({length: rows}).map((_, k) => {
					const zk = 3.25 - k * 0.42;
					// time the farmer passed this row
					let tp = -1;
					for (let s = 0; s <= 10.5; s += 0.05) {
						if (fz(s) < zk - 0.35) {
							tp = s;
							break;
						}
					}
					if (tp < 0 || t < tp) return null;
					const pop = Math.min(1, (t - tp) / 0.25);
					const g = pop * (1 + 2.3 * lapse);
					return [-0.55, 0, 0.55].map((dx, j) => {
						const age = t - tp - j * 0.12;
						const ripple = age > 0 && age < 1.4 && lapse < 0.3;
						return (
							<React.Fragment key={`${i}-${k}-${j}`}>
								<Seedling position={[x + dx, 0, zk]} g={g} color={seedColor} />
								{ripple ? (
									<mesh position={[x + dx, 0.02, zk]} rotation={[-Math.PI / 2, 0, 0]} scale={0.15 + age * 0.6} material={mat('#ffffff', {transparent: true, opacity: 0.5 * (1 - age / 1.4), depthWrite: false})}>
										<ringGeometry args={[0.85, 1, 20]} />
									</mesh>
								) : null}
							</React.Fragment>
						);
					});
				}),
			)}
		</>
	);
};

// ================= instanced rice field =================
const Field: React.FC<{t: number; color: string; n?: number; spacing?: number; clear?: number; center?: number[]; sway?: number}> = ({t, color, n = 54, spacing = 0.34, clear = 0, center = [0, 0, 0], sway = 1}) => {
	const stems = useRef<THREE.InstancedMesh>(null);
	const heads = useRef<THREE.InstancedMesh>(null);
	const pts = useMemo(() => {
		const r = rand(77);
		const out: number[][] = [];
		for (let i = 0; i < n; i++)
			for (let j = 0; j < n; j++) {
				const x = (i - n / 2) * spacing + (r() - 0.5) * 0.15 + center[0];
				const z = (j - n / 2) * spacing + (r() - 0.5) * 0.15 + center[2];
				if (clear && Math.hypot(x, z) < clear) continue;
				out.push([x, z, 0.9 + r() * 0.35, r() * 6.28]);
			}
		return out;
	}, [n, spacing, clear]);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
		pts.forEach((pt, i) => {
			const a = (Math.sin(t * 1.6 + pt[0] * 0.5 + pt[1] * 0.3) * 0.08 + 0.04) * sway;
			e.set(a, pt[3], a * 0.6);
			q.setFromEuler(e);
			s.set(1, pt[2], 1);
			m.compose(new THREE.Vector3(pt[0], 0, pt[1]), q, s);
			stems.current!.setMatrixAt(i, m);
			const top = new THREE.Vector3(0.05, pt[2] * 1.05, 0).applyQuaternion(q);
			const hq = q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.9)));
			m.compose(new THREE.Vector3(pt[0] + top.x, top.y, pt[1] + top.z), hq, new THREE.Vector3(1, 1, 1));
			heads.current!.setMatrixAt(i, m);
		});
		stems.current!.instanceMatrix.needsUpdate = true;
		heads.current!.instanceMatrix.needsUpdate = true;
	});
	const stemGeo = useMemo(() => new THREE.CylinderGeometry(0.014, 0.022, 1, 4).translate(0, 0.5, 0), []);
	const headGeo = useMemo(() => new THREE.ConeGeometry(0.05, 0.34, 5), []);
	return (
		<>
			<instancedMesh ref={stems} args={[stemGeo, mat(color), pts.length]} frustumCulled={false} />
			<instancedMesh ref={heads} args={[headGeo, mat(color), pts.length]} frustumCulled={false} />
		</>
	);
};

const Rain: React.FC<{t: number; amount: number}> = ({t, amount}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const drops = useMemo(() => {
		const r = rand(5);
		return Array.from({length: 500}).map(() => [(r() - 0.5) * 24, r() * 12, (r() - 0.5) * 24 + 2, 0.7 + r() * 0.6]);
	}, []);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		drops.forEach((d, i) => {
			const y = 12 - ((d[1] + t * 14 * d[3]) % 12);
			m.makeTranslation(d[0], y, d[2]);
			ref.current!.setMatrixAt(i, m);
		});
		ref.current!.instanceMatrix.needsUpdate = true;
	});
	const geo = useMemo(() => new THREE.BoxGeometry(0.012, 0.45, 0.012), []);
	return <instancedMesh ref={ref} args={[geo, mat('#dfe8ef', {transparent: true, opacity: 0.55 * amount}), drops.length]} frustumCulled={false} visible={amount > 0.01} />;
};

// ================= Scene 3: four months of sun and rain, field turns gold =================
export const S3: React.FC<{t: number}> = ({t}) => {
	const grow = smooth(t, 0.3, 7.5);
	const sun = smooth(t, 3.4, 4.4) * (1 - smooth(t, 5.2, 5.8));
	const rain = smooth(t, 5.4, 5.9) * (1 - smooth(t, 7.4, 8.0));
	const golden = smooth(t, 7.6, 9);
	const fieldCol = col('#6f9a4a', C.gold, grow);
	const skyTop = col(col('#8fbbe0', '#6f7f8f', rain), '#e6a565', golden * 0.6);
	const skyBot = col(col('#eef0e2', '#a7b0b4', rain), '#f6d39a', golden);
	const sunX = mix(-160, 120, smooth(t, 0, 8));
	const close = smooth(t, 7.2, 11.6);
	const hero = [0.8, 0, 6.4];
	const camPos = mixV([mix(-9, 5, smooth(t, 0, 7.5)), mix(6.5, 4.2, smooth(t, 0, 7.5)), 15], [hero[0] + 0.32, 1.28, hero[2] + 0.7], close);
	const look = mixV([0, 0.6, 0], [hero[0] + 0.05, 1.22, hero[2]], close);
	const grains = 13;
	return (
		<>
			<Cam pos={camPos} look={look} fov={mix(42, 30, close)} near={0.02} />
			<Sky top={skyTop} bottom={skyBot} />
			<fog attach="fog" args={[skyBot, 12, 70]} />
			<hemisphereLight args={[skyBot, '#5c5a3a', 1.1 - rain * 0.4]} />
			<directionalLight position={[sunX * 0.3, 30, -20]} intensity={(2 + sun * 1.8) * (1 - rain * 0.7)} color={col('#fff4dc', '#ffc27a', golden)} />
			<mesh position={[sunX, 70 - Math.abs(sunX) * 0.2, -300]}>
				<sphereGeometry args={[10 + sun * 6, 20, 14]} />
				<meshBasicMaterial color={col('#fff6d8', '#ffd28a', golden)} fog={false} transparent opacity={1 - rain} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat(col('#6d7f4f', '#a08a45', grow))}>
				<planeGeometry args={[300, 300]} />
			</mesh>
			<Field t={t} color={fieldCol} />
			<Rain t={t} amount={rain} />
			{[[-30, -60], [0, -75], [35, -65]].map((m, i) => (
				<Mountain key={i} position={[m[0], 0, m[1]]} r={26} h={30} color="#7c9078" seed={i} />
			))}
			<Person seed={61} hat position={[3.6, 0, 6.2]} rotationY={-2.4} pose={{armL: 0.05, armR: -0.3, elbow: -1.2}} />
			{/* hero stalk */}
			<group position={hero as [number, number, number]}>
				<Stalk position={[0, 0, 0]} h={1.18} color={fieldCol} head={false} sway={Math.sin(t * 1.3) * 0.03} />
				{Array.from({length: grains}).map((_, i) => {
					const u = i / (grains - 1);
					const glow = i === 8 ? smooth(t, 10.2, 11.2) : 0;
					return (
						<mesh key={i} position={[0.02 + u * 0.16, 1.2 - u * u * 0.22, (i % 2 ? 1 : -1) * 0.02]} rotation={[0, 0, -0.5 - u]} scale={[0.026, 0.05, 0.026]} material={mat(i === 8 && glow > 0 ? '#ffd76a' : fieldCol, i === 8 ? {emissive: '#ffb53a', emissiveIntensity: glow * 1.2} : {})}>
							<sphereGeometry args={[1, 8, 6]} />
						</mesh>
					);
				})}
			</group>
		</>
	);
};

// ================= Scene 4: harvest & threshing in slow motion =================
const Sickle: React.FC = () => (
	<mesh rotation={[0, 0, Math.PI / 2]} material={mat('#9aa0a6', {metalness: 0.6, roughness: 0.3})}>
		<torusGeometry args={[0.16, 0.012, 4, 10, Math.PI]} />
	</mesh>
);

const Bundle: React.FC<{position?: number[]; rotation?: number[]}> = ({position = [0, 0, 0], rotation = [0, 0, 0]}) => (
	<group position={position as [number, number, number]} rotation={rotation as [number, number, number]}>
		<mesh material={mat(C.gold)}>
			<cylinderGeometry args={[0.16, 0.12, 0.7, 7]} />
		</mesh>
		<mesh position={[0, 0.05, 0]} material={mat('#7a5a32')}>
			<cylinderGeometry args={[0.135, 0.135, 0.05, 7]} />
		</mesh>
	</group>
);

const Burst: React.FC<{t: number; slams: number[]}> = ({t, slams}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const N = 90;
	const vel = useMemo(() => {
		const r = rand(9);
		return slams.map(() => Array.from({length: N}).map(() => [(r() - 0.5) * 4, 2 + r() * 3.5, (r() - 0.5) * 4, r() * 6]));
	}, [slams]);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
		let idx = 0;
		slams.forEach((ts, b) => {
			const tau = (t - ts) * 0.42; // slow motion
			vel[b].forEach((v) => {
				const on = tau > 0 && tau < 1.6;
				const y = 0.75 + v[1] * tau - 4.9 * tau * tau;
				e.set(v[3] + tau * 5, v[3], 0);
				q.setFromEuler(e);
				const s = on && y > 0.02 ? 1 : 0;
				m.compose(new THREE.Vector3(v[0] * tau, Math.max(0.02, y), 0.35 + v[2] * tau), q, new THREE.Vector3(0.03 * s, 0.055 * s, 0.03 * s));
				ref.current!.setMatrixAt(idx++, m);
			});
		});
		ref.current!.instanceMatrix.needsUpdate = true;
	});
	const geo = useMemo(() => new THREE.SphereGeometry(1, 6, 5), []);
	return <instancedMesh ref={ref} args={[geo, mat('#e5bb55', {emissive: '#6b4a10', emissiveIntensity: 0.3}), slams.length * N]} frustumCulled={false} />;
};

export const S4: React.FC<{t: number}> = ({t}) => {
	const period = 2.4;
	const ph = ((t + 0.4) % period) / period;
	const raise = ph < 0.62 ? smooth(ph, 0, 0.6) : 1 - smooth(ph, 0.62, 0.72);
	const slams = [0, 1, 2, 3].map((k) => k * period + 0.72 * period - 0.4);
	const ang = mix(0.9, -0.5, smooth(t, 0, 8.5));
	return (
		<>
			<Cam pos={[Math.sin(ang) * 6.2, mix(1.5, 2.3, smooth(t, 0, 8)), Math.cos(ang) * 6.2]} look={[0, 1.0, 0]} fov={38} />
			<Sky top="#e9a868" bottom="#f8dcaa" />
			<fog attach="fog" args={['#f3d3a2', 12, 70]} />
			<hemisphereLight args={['#fbe2bd', '#6a5532', 1.2]} />
			<directionalLight position={[-30, 18, -25]} intensity={2.6} color="#ffbe78" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#b39352')}>
				<planeGeometry args={[300, 300]} />
			</mesh>
			<Field t={t} color={C.gold} clear={4.6} n={60} />
			{/* threshing block + thresher */}
			<mesh position={[0, 0.3, 0.6]} material={mat('#6e4c32')}>
				<boxGeometry args={[1.0, 0.6, 0.6]} />
			</mesh>
			<Person seed={71} position={[0, 0, -0.35]} pose={{armL: mix(-0.6, -2.8, raise), armR: mix(-0.6, -2.8, raise), spreadL: 0.05, spreadR: 0.05, bend: mix(0.35, -0.1, raise)}}>
				<Bundle position={[0.15, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} />
			</Person>
			<Burst t={t} slams={slams} />
			{[0, 1, 2].map((i) => {
				const a = 2.2 + i * 0.9;
				return (
					<Person key={i} seed={80 + i} hat position={[Math.sin(a) * 4.9, 0, Math.cos(a) * 4.9]} rotationY={a + Math.PI} pose={{bend: 0.95, armL: -0.9, armR: -0.4 + Math.sin(t * 4 + i) * 0.7, elbow: -0.2}}>
						<Sickle />
					</Person>
				);
			})}
			{[[2.2, 1.8, 0.4], [-2.4, 1.2, 1.2], [1.4, -2.3, 2.2], [-1.6, -2.0, 0.9], [2.9, -0.6, 1.6], [-3.0, 0.3, 2.6]].map((b, i) => (
				<Bundle key={i} position={[b[0], 0.16, b[1]]} rotation={[Math.PI / 2, 0, b[2]]} />
			))}
		</>
	);
};
