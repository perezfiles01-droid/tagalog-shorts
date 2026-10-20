import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {C, Cam, Mountain, Person, Sky, TerraceHill, mat, mix, mixV, rand, ramp, smooth, walk} from './kit';

// ================= shared props =================
export const Jeepney: React.FC<{position?: number[]; rotationY?: number; t?: number}> = ({position = [0, 0, 0], rotationY = 0, t = 0}) => {
	const wheel = (x: number, z: number) => (
		<mesh key={`${x}${z}`} position={[x, 0.32, z]} rotation={[t * 6, 0, Math.PI / 2]} material={mat('#26262a')}>
			<cylinderGeometry args={[0.32, 0.32, 0.22, 10]} />
		</mesh>
	);
	return (
		<group position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
			<mesh position={[0, 1.0, -0.2]} material={mat('#cdd1d4', {metalness: 0.35, roughness: 0.45})}>
				<boxGeometry args={[1.4, 1.15, 3.3]} />
			</mesh>
			{[-1, 1].map((s) => (
				<React.Fragment key={s}>
					<mesh position={[s * 0.71, 0.75, -0.2]} material={mat('#b5473b')}>
						<boxGeometry args={[0.02, 0.12, 3.3]} />
					</mesh>
					<mesh position={[s * 0.71, 0.9, -0.2]} material={mat('#d9b44a')}>
						<boxGeometry args={[0.02, 0.08, 3.3]} />
					</mesh>
					<mesh position={[s * 0.71, 0.62, -0.2]} material={mat('#3f6aa0')}>
						<boxGeometry args={[0.02, 0.07, 3.3]} />
					</mesh>
					<mesh position={[s * 0.711, 1.25, -0.4]} material={mat('#2e3238')}>
						<boxGeometry args={[0.02, 0.35, 2.4]} />
					</mesh>
				</React.Fragment>
			))}
			<mesh position={[0, 0.72, 1.85]} material={mat('#cdd1d4', {metalness: 0.35, roughness: 0.45})}>
				<boxGeometry args={[1.2, 0.6, 0.85]} />
			</mesh>
			<mesh position={[0, 1.25, 1.36]} rotation={[-0.25, 0, 0]} material={mat('#2e3238')}>
				<boxGeometry args={[1.25, 0.45, 0.04]} />
			</mesh>
			<mesh position={[0, 1.62, -0.2]} material={mat('#e8e2d2')}>
				<boxGeometry args={[1.55, 0.08, 3.5]} />
			</mesh>
			{[-1.2, -0.45, 0.3, 0.95].map((z, i) => (
				<mesh key={i} position={[(i % 2 ? 0.25 : -0.25), 1.82, z]} rotation={[0, i, 0]} material={mat('#e6dcc4')}>
					<capsuleGeometry args={[0.22, 0.35, 3, 8]} />
				</mesh>
			))}
			{[-1, 1].map((s) => (
				<mesh key={s} position={[s * 0.4, 0.8, 2.29]} material={mat('#fff6d6', {emissive: '#fff2c0', emissiveIntensity: 0.6})}>
					<sphereGeometry args={[0.09, 8, 6]} />
				</mesh>
			))}
			{wheel(-0.68, 1.6)}
			{wheel(0.68, 1.6)}
			{wheel(-0.68, -1.3)}
			{wheel(0.68, -1.3)}
		</group>
	);
};

const Sack: React.FC<{position?: number[]; rotation?: number}> = ({position = [0, 0, 0], rotation = 0}) => (
	<mesh position={position as [number, number, number]} rotation={[0, rotation, Math.PI / 2]} material={mat('#e6dcc4')}>
		<capsuleGeometry args={[0.2, 0.32, 3, 8]} />
	</mesh>
);

const instColor = (ref: React.RefObject<THREE.InstancedMesh | null>, cols: string[]) => {
	const c = new THREE.Color();
	cols.forEach((h, i) => ref.current!.setColorAt(i, c.set(h)));
	if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
};

// ================= Scene 5: jeepney down the zigzag road =================
export const S5: React.FC<{t: number}> = ({t}) => {
	const curve = useMemo(
		() =>
			new THREE.CatmullRomCurve3(
				[[-16, -70], [16, -58], [-16, -44], [16, -30], [-16, -16], [16, -2], [-8, 12], [0, 28], [0, 70]].map(([x, z]) => new THREE.Vector3(x, 0, z)),
				false,
				'centripetal',
			),
		[],
	);
	const road = useMemo(() => {
		const pts = curve.getSpacedPoints(600);
		const pos: number[] = [];
		const w = 1.4;
		for (let i = 0; i < pts.length - 1; i++) {
			const a = pts[i], b = pts[i + 1];
			const d = b.clone().sub(a).normalize();
			const n = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(w);
			const a1 = a.clone().add(n), a2 = a.clone().sub(n), b1 = b.clone().add(n), b2 = b.clone().sub(n);
			pos.push(a1.x, 0.03, a1.z, b1.x, 0.03, b1.z, a2.x, 0.03, a2.z, a2.x, 0.03, a2.z, b1.x, 0.03, b1.z, b2.x, 0.03, b2.z);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.computeVertexNormals();
		return {g, pts};
	}, [curve]);
	const trees = useRef<THREE.InstancedMesh>(null);
	const treePts = useMemo(() => {
		const r = rand(21);
		const out: number[][] = [];
		while (out.length < 700) {
			const x = (r() - 0.5) * 90, z = -90 + r() * 140;
			let ok = true;
			for (let i = 0; i < road.pts.length; i += 4) if (Math.hypot(road.pts[i].x - x, road.pts[i].z - z) < 3.2) { ok = false; break; }
			if (ok) out.push([x, z, 0.9 + r() * 1.1, r()]);
		}
		return out;
	}, [road]);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		treePts.forEach((p, i) => {
			m.compose(new THREE.Vector3(p[0], p[2] * 1.3, p[1]), new THREE.Quaternion(), new THREE.Vector3(p[2], p[2] * 1.2, p[2]));
			trees.current!.setMatrixAt(i, m);
		});
		trees.current!.instanceMatrix.needsUpdate = true;
		instColor(trees, treePts.map((p) => (p[3] > 0.6 ? '#4f7a38' : p[3] > 0.3 ? '#5d8a42' : '#6f9a4a')));
	}, [treePts]);
	const treeGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);

	const u = mix(0.03, 0.97, t / 11);
	const pos = curve.getPointAt(u);
	const tan = curve.getTangentAt(u);
	const rotY = Math.atan2(tan.x, tan.z);
	const chase = smooth(t, 5.5, 10.5);
	const camTop = [pos.x * 0.6, 30, pos.z + 7];
	const camChase = [pos.x - tan.x * 8, 3.2, pos.z - tan.z * 8];
	const lookTop = [pos.x * 0.6, 0, pos.z];
	const lookChase = [pos.x + tan.x * 12, 1.2, pos.z + tan.z * 12];
	return (
		<>
			<Cam pos={mixV(camTop, camChase, chase)} look={mixV(lookTop, lookChase, chase)} fov={40} far={1200} />
			<Sky top="#86b3da" bottom="#eaeee6" />
			<fog attach="fog" args={['#e2e9e4', 40, 190]} />
			<hemisphereLight args={['#eef4f0', '#51603f', 1.25]} />
			<directionalLight position={[40, 60, 20]} intensity={2.2} color="#fff1d8" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#79995a')}>
				<planeGeometry args={[600, 600]} />
			</mesh>
			<mesh geometry={road.g} material={mat('#6b6a66', {flatShading: false})} />
			<instancedMesh ref={trees} args={[treeGeo, mat('#ffffff'), treePts.length]} frustumCulled={false} />
			<TerraceHill position={[0, 0, -108]} radius={30} tiers={12} step={1.4} arc={Math.PI * 2} water={0.4} seed={4} />
			{[[-60, -120, 40, 50], [55, -125, 38, 46], [-80, -40, 30, 34], [80, -50, 30, 38]].map((m, i) => (
				<Mountain key={i} position={[m[0], 0, m[1]]} r={m[2]} h={m[3]} color="#728f69" seed={i} />
			))}
			{/* distant city */}
			{Array.from({length: 18}).map((_, i) => {
				const r = rand(i + 300);
				const h = 6 + r() * 16;
				return (
					<mesh key={i} position={[(i - 9) * 4.2 + r() * 2, h / 2, 100 + r() * 14]} material={mat(['#b9b6ad', '#a6a9a7', '#cfc8b8'][i % 3])}>
						<boxGeometry args={[3.2, h, 3.2]} />
					</mesh>
				);
			})}
			<Jeepney position={[pos.x, 0, pos.z]} rotationY={rotY} t={t} />
		</>
	);
};

// ================= Scene 6: market, the sack passes from hand to hand =================
const Stall: React.FC<{position: number[]; side: number; color: string; seed: number}> = ({position, side, color, seed}) => {
	const r = rand(seed);
	const produce = ['#c9503f', '#e0a63a', '#6f9a4a', '#d97b3a', '#8a5a9a', '#e8e1c8'];
	return (
		<group position={position as [number, number, number]}>
			<mesh position={[0, 0.45, 0]} material={mat('#8a6448')}>
				<boxGeometry args={[1.3, 0.9, 2.1]} />
			</mesh>
			<mesh position={[side * 0.25, 2.25, 0]} rotation={[0, 0, side * 0.35]} material={mat(color)}>
				<boxGeometry args={[1.9, 0.05, 2.3]} />
			</mesh>
			{[-0.9, 0.9].map((z) => (
				<mesh key={z} position={[side * 0.55, 1.2, z]} material={mat('#5a4636')}>
					<cylinderGeometry args={[0.04, 0.04, 2.3, 5]} />
				</mesh>
			))}
			{Array.from({length: 7}).map((_, i) => (
				<mesh key={i} position={[(r() - 0.5) * 0.9, 0.98, (r() - 0.5) * 1.7]} material={mat(produce[Math.floor(r() * produce.length)])}>
					<icosahedronGeometry args={[0.13 + r() * 0.06, 0]} />
				</mesh>
			))}
		</group>
	);
};

export const S6: React.FC<{t: number}> = ({t}) => {
	const awn = ['#b8574a', '#4f7aa3', '#d9b44a', '#6f9a5a', '#c9784a', '#8a6f9f'];
	const chainZ = -8;
	const holders = [-2.6, -1.3, 0, 1.3];
	const hand = (k: number) => (k < holders.length ? [holders[k] + 0.45, 1.3, chainZ + 0.25] : [3.2, 1.1, chainZ]);
	const s = Math.min(holders.length, Math.max(0, (t - 1.5) / 2.1));
	const k = Math.min(holders.length - 1, Math.floor(s));
	const f = s - k;
	const fe = f < 0.45 ? 0 : smooth(f, 0.45, 1);
	const a = hand(k), b = hand(k + 1);
	const sackPos = [mix(a[0], b[0], fe), mix(a[1], b[1], fe) + Math.sin(Math.PI * fe) * 0.35, mix(a[2], b[2], fe)];
	const walkers = useMemo(() => {
		const r = rand(66);
		return Array.from({length: 34}).map((_, i) => ({x: (r() - 0.5) * 3.6, z: -40 + r() * 28, v: (r() > 0.5 ? 1 : -1) * (0.7 + r() * 0.5), seed: 100 + i, ph: r()}));
	}, []);
	const shoppers = useMemo(() => {
		const r = rand(67);
		return Array.from({length: 10}).map((_, i) => ({side: i % 2 ? 1 : -1, z: -3 + r() * 14, seed: 200 + i}));
	}, []);
	const p = smooth(t, 0, 12);
	const stallZ = Array.from({length: 18}).map((_, i) => 12 - i * 2.7);
	return (
		<>
			<Cam pos={[mix(1.4, 0.5, p), mix(3.8, 2.7, p), mix(13, -0.5, p)]} look={[mix(0, 0.6, p), 1.2, mix(-6, chainZ, p)]} fov={42} />
			<Sky top="#9cc2de" bottom="#f1ece0" />
			<fog attach="fog" args={['#ebe6da', 18, 80]} />
			<hemisphereLight args={['#f6efe2', '#5a5248', 1.25]} />
			<directionalLight position={[20, 40, 15]} intensity={2.1} color="#fff1da" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#6d6c68')}>
				<planeGeometry args={[300, 300]} />
			</mesh>
			{stallZ.map((z, i) => (
				<React.Fragment key={i}>
					{Math.abs(z - chainZ) > 1.5 ? <Stall position={[-3.4, 0, z]} side={-1} color={awn[i % 6]} seed={i} /> : null}
					<Stall position={[3.4, 0, z]} side={1} color={awn[(i + 3) % 6]} seed={i + 50} />
					<Person seed={300 + i} position={[4.5, 0, z + 0.3]} rotationY={-Math.PI / 2} pose={{armL: -0.3, armR: -0.2 + Math.sin(t * 2 + i) * 0.2}} mouth={i % 3 === 0} />
					{Math.abs(z - chainZ) > 1.5 ? <Person seed={400 + i} position={[-4.5, 0, z - 0.3]} rotationY={Math.PI / 2} pose={{armL: -0.2, armR: -0.3}} /> : null}
				</React.Fragment>
			))}
			{/* buildings behind the stalls */}
			{Array.from({length: 16}).map((_, i) => {
				const r = rand(i + 900);
				const h = 5 + r() * 9;
				const side = i % 2 ? 1 : -1;
				return (
					<group key={i} position={[side * 9, 0, 14 - Math.floor(i / 2) * 6.5]}>
						<mesh position={[0, h / 2, 0]} material={mat(['#cfc3ad', '#b7b1a6', '#d8cdb8', '#a9a39a'][i % 4])}>
							<boxGeometry args={[6, h, 6]} />
						</mesh>
						{Array.from({length: Math.floor(h / 1.8)}).map((_, j) => (
							<mesh key={j} position={[-side * 3.01, 1.6 + j * 1.8, 0]} material={mat('#6f7378')}>
								<boxGeometry args={[0.02, 0.6, 4.4]} />
							</mesh>
						))}
					</group>
				);
			})}
			{walkers.map((w, i) => {
				const span = 30;
				const z = ((((w.z + 40 + t * w.v) % span) + span) % span) - 40;
				return <Person key={i} seed={w.seed} position={[w.x, 0, z]} rotationY={w.v > 0 ? 0 : Math.PI} pose={walk(t, 0.9, w.ph)} />;
			})}
			{shoppers.map((sh, i) => (
				<Person key={i} seed={sh.seed} position={[sh.side * 2.3, 0, sh.z]} rotationY={sh.side * Math.PI / 2} pose={{armL: -0.4, armR: -0.7 + Math.sin(t * 1.5 + i) * 0.25, bob: Math.abs(Math.sin(t + i)) * 0.02}} />
			))}
			{/* chain of hands */}
			{[[-3.6, chainZ - 0.5], [-3.9, chainZ + 0.3], [-3.4, chainZ + 0.9]].map((sp, i) => (
				<Sack key={i} position={[sp[0], 0.22, sp[1]]} rotation={i} />
			))}
			{holders.map((x, i) => {
				const near = Math.abs(s - i) < 0.75 || (i === k && f < 0.7);
				const reach = near ? -1.25 : -0.15;
				return <Person key={i} seed={500 + i} position={[x, 0, chainZ - 0.1]} rotationY={Math.PI / 2 - 0.5} pose={{armL: reach, armR: reach, spreadL: 0.05, spreadR: 0.05}} />;
			})}
			<Sack position={sackPos} rotation={0} />
		</>
	);
};

// ================= the family table (used in scenes 7 & 8) =================
const Family: React.FC<{t: number; bowlOn: boolean; eat: number}> = ({t, bowlOn, eat}) => {
	const seats = [
		{pos: [-1.3, 0, 0], rot: Math.PI / 2, s: 1, seed: 701, plate: [-0.75, 0]},
		{pos: [1.3, 0, 0], rot: -Math.PI / 2, s: 1, seed: 702, plate: [0.75, 0]},
		{pos: [-0.4, 0, -0.95], rot: 0, s: 0.74, seed: 703, plate: [-0.4, -0.38]},
		{pos: [0.4, 0, -0.95], rot: 0, s: 0.74, seed: 704, plate: [0.4, -0.38]},
	];
	return (
		<group>
			<mesh position={[0, 0.76, 0]} material={mat('#8a5f3e')}>
				<boxGeometry args={[2.2, 0.08, 1.3]} />
			</mesh>
			{[[-1, -0.55], [1, -0.55], [-1, 0.55], [1, 0.55]].map((l, i) => (
				<mesh key={i} position={[l[0], 0.37, l[1]]} material={mat('#6e4a30')}>
					<boxGeometry args={[0.08, 0.74, 0.08]} />
				</mesh>
			))}
			{seats.map((st, i) => (
				<React.Fragment key={i}>
					<mesh position={[st.pos[0] * 1.05, 0.2 * st.s, st.pos[2] * 1.05]} material={mat('#7a5638')}>
						<boxGeometry args={[0.45, 0.4 * st.s, 0.45]} />
					</mesh>
					<Person seed={st.seed} position={[st.pos[0], 0.0, st.pos[2]]} rotationY={st.rot} scale={st.s} pose={{sit: true, armL: -0.9, armR: -0.9 - Math.max(0, Math.sin(t * 3 + i)) * 0.5 * eat, elbow: -0.6, spreadL: 0.1, spreadR: 0.1}} mouth={eat > 0.5 && i % 2 === 0} />
					<mesh position={[st.plate[0], 0.81, st.plate[1]]} material={mat('#f1efe8')}>
						<cylinderGeometry args={[0.17, 0.13, 0.03, 14]} />
					</mesh>
					{eat > 0 ? (
						<mesh position={[st.plate[0], 0.83, st.plate[1]]} scale={[1, 0.6 * eat, 1]} material={mat('#fbfaf5', {roughness: 1})}>
							<sphereGeometry args={[0.11, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
						</mesh>
					) : null}
				</React.Fragment>
			))}
			{bowlOn ? <RiceBowl position={[0, 0.8, 0.05]} /> : null}
		</group>
	);
};

const RiceBowl: React.FC<{position?: number[]}> = ({position = [0, 0, 0]}) => (
	<group position={position as [number, number, number]}>
		<mesh position={[0, 0.1, 0]} rotation={[Math.PI, 0, 0]} material={mat('#d9cdb4')}>
			<sphereGeometry args={[0.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
		</mesh>
		<mesh position={[0, 0.1, 0]} scale={[1, 0.55, 1]} material={mat('#fdfcf7', {roughness: 1})}>
			<sphereGeometry args={[0.22, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
		</mesh>
	</group>
);

const Steam: React.FC<{t: number; position: number[]}> = ({t, position}) => {
	const parts = useMemo(() => {
		const r = rand(13);
		return Array.from({length: 22}).map(() => [r() * 3, (r() - 0.5) * 0.2, (r() - 0.5) * 0.2]);
	}, []);
	return (
		<group position={position as [number, number, number]}>
			{parts.map((p, i) => {
				const age = (t + p[0]) % 3;
				const k = age / 3;
				return (
					<mesh key={i} position={[p[1] + Math.sin(age * 2 + i) * 0.1, age * 0.75, p[2]]} scale={0.07 + k * 0.28}>
						<icosahedronGeometry args={[1, 1]} />
						<meshStandardMaterial color="#ffffff" transparent opacity={0.45 * Math.sin(Math.PI * k)} depthWrite={false} flatShading />
					</mesh>
				);
			})}
		</group>
	);
};

// ================= Scene 7: kitchen, rice reaches the table =================
export const S7: React.FC<{t: number}> = ({t}) => {
	const T = [0.6, 0, 0.2]; // table centre
	const stove = [-3.0, 0, -2.0];
	const walkP = smooth(t, 1.4, 6.0);
	const motherPos = mixV([-2.5, 0, -1.3], [T[0] + 0.0, 0, T[2] + 0.62], walkP);
	const moving = walkP > 0 && walkP < 1;
	const placed = t > 6.4;
	const eat = smooth(t, 7.0, 8.0);
	const pan = smooth(t, 3.6, 7.5);
	const push = smooth(t, 7.5, 12.5);
	const camPos = mixV(mixV([-1.6, 2.1, 1.0], [3.6, 3.0, 5.6], pan), [2.9, 2.5, 4.4], push);
	const look = mixV([-3.0, 1.25, -2.0], [T[0], 0.9, T[2]], pan);
	return (
		<>
			<Cam pos={camPos} look={look} fov={42} near={0.05} />
			<color attach="background" args={['#2a2420']} />
			<hemisphereLight args={['#ffe7c7', '#4a3a2a', 0.9]} />
			<pointLight position={[T[0], 2.7, T[2]]} intensity={14} distance={9} decay={2} color="#ffcf8f" />
			<directionalLight position={[-1, 4, -6]} intensity={1.4} color="#fff2d6" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#9a7656')}>
				<planeGeometry args={[12, 12]} />
			</mesh>
			<mesh position={[0, 1.6, -3]} material={mat('#e4d6c0')}>
				<boxGeometry args={[12, 3.2, 0.1]} />
			</mesh>
			<mesh position={[-4.2, 1.6, 0]} material={mat('#d9c8ae')}>
				<boxGeometry args={[0.1, 3.2, 12]} />
			</mesh>
			<mesh position={[0.9, 1.8, -2.94]} material={mat('#fff1d0', {emissive: '#ffe8b8', emissiveIntensity: 0.9})}>
				<boxGeometry args={[1.6, 1.1, 0.02]} />
			</mesh>
			{[-0.82, 0.82].map((x) => (
				<mesh key={x} position={[0.9 + x, 1.8, -2.92]} material={mat('#6e4a30')}>
					<boxGeometry args={[0.07, 1.2, 0.05]} />
				</mesh>
			))}
			{/* stove + pot */}
			<mesh position={[stove[0], 0.45, stove[2]]} material={mat('#7a6a5a')}>
				<boxGeometry args={[1.6, 0.9, 0.9]} />
			</mesh>
			<mesh position={[stove[0], 1.08, stove[2]]} material={mat('#3b3b3e', {metalness: 0.4, roughness: 0.5})}>
				<cylinderGeometry args={[0.3, 0.26, 0.36, 14]} />
			</mesh>
			<mesh position={[stove[0], 1.28, stove[2]]} material={mat('#4a4a4e', {metalness: 0.4, roughness: 0.5})}>
				<cylinderGeometry args={[0.31, 0.31, 0.04, 14]} />
			</mesh>
			<Steam t={t} position={[stove[0], 1.32, stove[2]]} />
			<group position={T as [number, number, number]}>
				<Family t={t} bowlOn={placed} eat={eat} />
			</group>
			<Person seed={705} position={motherPos} rotationY={moving ? Math.atan2(T[0] - -2.5, T[2] + 0.62 - -1.3) : Math.PI} pose={{...(moving ? walk(t, 0.9) : {}), armL: placed ? -0.2 : -1.0, armR: placed ? -0.2 : -1.0, elbow: placed ? 0 : -0.5, spreadL: 0.05, spreadR: 0.05}}>
				{!placed ? <RiceBowl position={[0.0, 0.05, 0.12]} /> : null}
			</Person>
		</>
	);
};

// ================= Scene 8: pull back to the whole archipelago =================
export const ISLANDS: number[][][] = [
	[[120.6, 18.5], [121.9, 18.6], [122.3, 17.2], [122.2, 16.2], [121.6, 15.8], [121.6, 14.6], [122.0, 14.1], [122.9, 14.2], [123.4, 13.8], [124.2, 13.0], [123.9, 12.6], [123.2, 13.0], [122.6, 13.4], [121.8, 13.9], [121.0, 13.7], [120.6, 14.3], [120.9, 14.8], [120.0, 15.0], [119.8, 16.2], [120.3, 16.4], [120.4, 17.5]],
	[[120.3, 13.5], [121.5, 13.2], [121.2, 12.2], [120.3, 12.6]],
	[[117.2, 8.4], [117.8, 8.2], [119.5, 10.4], [119.6, 11.4], [119.2, 11.0], [118.5, 9.9], [117.3, 8.8]],
	[[121.9, 11.9], [122.9, 11.4], [122.6, 10.7], [121.9, 10.5], [121.9, 11.4]],
	[[122.4, 10.9], [123.2, 10.9], [123.5, 10.2], [123.2, 9.1], [122.8, 9.3], [122.4, 10.2]],
	[[123.9, 11.3], [124.1, 11.0], [123.4, 9.6], [123.3, 9.9]],
	[[123.8, 10.1], [124.6, 10.1], [124.4, 9.6], [123.8, 9.7]],
	[[124.3, 12.5], [125.4, 12.3], [125.6, 11.1], [125.0, 11.1], [124.4, 11.6]],
	[[124.4, 11.5], [125.0, 11.1], [125.2, 10.2], [124.8, 10.0], [124.3, 10.9]],
	[[121.9, 7.0], [122.4, 8.0], [123.5, 8.6], [124.5, 8.6], [125.5, 9.8], [126.5, 8.4], [126.6, 7.0], [126.0, 6.3], [125.4, 5.6], [124.2, 6.3], [124.0, 7.3], [123.0, 7.5], [122.1, 6.9]],
];
export const K = 100;
export const LON0 = 121.1, LAT0 = 16.9;
export const proj = (lon: number, lat: number) => [(lon - LON0) * K, (lat - LAT0) * K];

export const Islands: React.FC = () => {
	const geo = useMemo(
		() =>
			ISLANDS.map((poly) => {
				const sh = new THREE.Shape();
				poly.forEach(([lo, la], i) => {
					const [x, y] = proj(lo, la);
					if (i === 0) sh.moveTo(x, y);
					else sh.lineTo(x, y);
				});
				const g = new THREE.ExtrudeGeometry(sh, {depth: 1, bevelEnabled: true, bevelSize: 2, bevelThickness: 0.3, bevelSegments: 1});
				g.rotateX(-Math.PI / 2);
				return g;
			}),
		[],
	);
	return (
		<>
			{geo.map((g, i) => (
				<mesh key={i} geometry={g} position={[0, -1.02, 0]} material={mat('#7d9c5c')} />
			))}
		</>
	);
};

const Town: React.FC = () => {
	const bodies = useRef<THREE.InstancedMesh>(null);
	const roofs = useRef<THREE.InstancedMesh>(null);
	const fields = useRef<THREE.InstancedMesh>(null);
	const hills = useRef<THREE.InstancedMesh>(null);
	const data = useMemo(() => {
		const r = rand(31);
		const houses: number[][] = [];
		for (let x = -60; x <= 60; x += 5.5)
			for (let z = -60; z <= 60; z += 5.5) {
				const d = Math.hypot(x, z);
				if (d < 7 || r() < 0.25 + d / 120) continue;
				houses.push([x + (r() - 0.5) * 1.5, z + (r() - 0.5) * 1.5, 2 + r() * 1.6, r() * 1.5]);
			}
		const fl: number[][] = [];
		for (let i = 0; i < 700; i++) {
			const a = r() * Math.PI * 2, d = 55 + r() * 140;
			fl.push([Math.cos(a) * d, Math.sin(a) * d, 5 + r() * 9, r()]);
		}
		const hl: number[][] = [];
		for (let i = 0; i < 140; i++) {
			const x = -60 + r() * 180, z = -140 + r() * 270;
			if (Math.hypot(x, z) < 110) continue;
			hl.push([x, z, 5 + r() * 12]);
		}
		return {houses, fl, hl};
	}, []);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
		const hc = ['#d9cdb8', '#c9b79a', '#b9c2c4', '#e2d9c6', '#c7a98a'];
		const rc = ['#a85d4a', '#7a7f86', '#b9573f', '#8a6a52'];
		data.houses.forEach((h, i) => {
			q.setFromEuler(e.set(0, h[3], 0));
			m.compose(new THREE.Vector3(h[0], h[2] / 2, h[1]), q, new THREE.Vector3(h[2] * 1.2, h[2], h[2]));
			bodies.current!.setMatrixAt(i, m);
			q.setFromEuler(e.set(0, h[3] + Math.PI / 4, 0));
			m.compose(new THREE.Vector3(h[0], h[2] + h[2] * 0.3, h[1]), q, new THREE.Vector3(h[2] * 1.05, h[2] * 0.6, h[2] * 1.05));
			roofs.current!.setMatrixAt(i, m);
		});
		instColor(bodies, data.houses.map((_, i) => hc[i % hc.length]));
		instColor(roofs, data.houses.map((_, i) => rc[i % rc.length]));
		data.fl.forEach((f, i) => {
			q.setFromEuler(e.set(0, f[3] * 3, 0));
			m.compose(new THREE.Vector3(f[0], 0.02, f[1]), q, new THREE.Vector3(f[2], 0.05, f[2] * 0.7));
			fields.current!.setMatrixAt(i, m);
		});
		instColor(fields, data.fl.map((f) => (f[3] > 0.7 ? '#d2b25a' : f[3] > 0.4 ? '#8fb065' : '#6f9a4a')));
		data.hl.forEach((h, i) => {
			m.compose(new THREE.Vector3(h[0], h[2] / 2 - 0.5, h[1]), new THREE.Quaternion(), new THREE.Vector3(h[2] * 1.4, h[2], h[2] * 1.4));
			hills.current!.setMatrixAt(i, m);
		});
		instColor(hills, data.hl.map(() => '#5f8a4e'));
		[bodies, roofs, fields, hills].forEach((r) => (r.current!.instanceMatrix.needsUpdate = true));
	}, [data]);
	const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
	const roof = useMemo(() => new THREE.ConeGeometry(0.75, 1, 4), []);
	const cone = useMemo(() => new THREE.ConeGeometry(1, 1, 6), []);
	return (
		<>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} material={mat('#8d8a80')}>
				<circleGeometry args={[66, 32]} />
			</mesh>
			<instancedMesh ref={bodies} args={[box, mat('#ffffff'), data.houses.length]} frustumCulled={false} />
			<instancedMesh ref={roofs} args={[roof, mat('#ffffff'), data.houses.length]} frustumCulled={false} />
			<instancedMesh ref={fields} args={[box, mat('#ffffff'), data.fl.length]} frustumCulled={false} />
			<instancedMesh ref={hills} args={[cone, mat('#ffffff'), data.hl.length]} frustumCulled={false} />
		</>
	);
};

export const S8: React.FC<{t: number}> = ({t}) => {
	const p = 0.5 - 0.5 * Math.cos(Math.PI * ramp(t, 0.3, 13.6));
	const y = 2.3 * Math.pow(2900 / 2.3, p);
	const drift = smooth(t, 5, 13.5);
	const tx = drift * (121.8 - LON0) * K;
	const tz = -drift * (11.9 - LAT0) * K;
	const roofOpacity = smooth(y, 3.2, 6.5);
	const tilt = mix(0.12, 0.06, p);
	return (
		<>
			<Cam pos={[tx, y, tz + y * tilt]} look={[tx, 0, tz]} fov={40} near={Math.max(0.03, y * 0.01)} far={y * 6 + 200} />
			<color attach="background" args={['#cfe3ea']} />
			<fog attach="fog" args={['#cfe3ea', y * 2.5, y * 9]} />
			<hemisphereLight args={['#f2f6f2', '#58664a', 1.3]} />
			<directionalLight position={[300, 600, 200]} intensity={2.2} color="#fff2dc" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} material={mat('#5d8fae', {roughness: 0.4})}>
				<planeGeometry args={[30000, 30000]} />
			</mesh>
			<Islands />
			<Town />
			<TerraceHill position={[-26, 0, -30]} radius={12} tiers={9} step={0.9} arc={Math.PI * 2} water={0.4} seed={5} />
			<TerraceHill position={[32, 0, -44]} radius={14} tiers={10} step={0.9} arc={Math.PI * 2} water={0.4} seed={6} />
			{/* the house around the table */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={mat('#9a7656')}>
				<planeGeometry args={[6, 5]} />
			</mesh>
			{[[0, -2.5, 6, 0.12], [0, 2.5, 6, 0.12], [-3, 0, 0.12, 5], [3, 0, 0.12, 5]].map((w, i) => (
				<mesh key={i} position={[w[0], 1.3, w[1]]} material={mat('#e4d6c0')}>
					<boxGeometry args={[w[2], 2.6, w[3]]} />
				</mesh>
			))}
			<mesh position={[0, 3.6, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.25, 1, 1]}>
				<coneGeometry args={[4.6, 2.2, 4]} />
				<meshStandardMaterial color="#a85d4a" flatShading transparent opacity={roofOpacity} depthWrite={roofOpacity > 0.95} />
			</mesh>
			<pointLight position={[0, 2.4, 0]} intensity={8} distance={7} color="#ffcf8f" />
			<Family t={t + 12} bowlOn eat={1} />
		</>
	);
};
