import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Cloud, Person, Pose, Sky, Tree, mat, mix, rand} from './kit';

const col = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, k))).getHexString();
export {col};

// ---------- cast ----------
export const CAST = {
	nanay: {seed: 901, shirt: '#c9784a', pants: '#4a4f5e', longHair: true},
	anak: {seed: 902, shirt: '#4f7aa3', pants: '#3b4252', longHair: false},
	tita: {seed: 903, shirt: '#8a6f9f', pants: '#5b5246', longHair: true},
	office: {seed: 904, shirt: '#d8d4cc', pants: '#2f3a45', longHair: false},
	kid: {seed: 905, shirt: '#d9b44a', pants: '#3b4252', longHair: false},
};
type Who = keyof typeof CAST;
export const Actor: React.FC<{who: Who; position?: number[]; rotationY?: number; pose?: Pose; scale?: number; children?: React.ReactNode; mouth?: boolean}> = ({who, ...p}) => (
	<Person {...CAST[who]} {...p} />
);

// ---------- the blue container ----------
export type Content = 'adobo' | 'pancit' | 'feast';
const W = 0.42, Hh = 0.15, D = 0.3;

const ContentMesh: React.FC<{kind: Content; fill: number}> = ({kind, fill}) => {
	const items = useMemo(() => {
		const r = rand(kind === 'adobo' ? 1 : kind === 'pancit' ? 2 : 3);
		return Array.from({length: kind === 'pancit' ? 26 : 9}).map(() => [(r() - 0.5) * (W - 0.1), (r() - 0.5) * (D - 0.1), r(), r()]);
	}, [kind]);
	if (fill <= 0.01) return null;
	const feastCols = ['#e8c35a', '#b8743a', '#6a4a2e', '#d9a441', '#f2efe6', '#c9503f'];
	return (
		<group position={[0, Hh * 0.35, 0]} scale={[1, fill, 1]}>
			{items.map((it, i) =>
				kind === 'adobo' ? (
					<mesh key={i} position={[it[0], 0.04 + it[2] * 0.03, it[1]]} rotation={[it[2], it[3] * 3, 0]} material={mat(i % 3 ? '#5a3a24' : '#7a4e2e')}>
						<boxGeometry args={[0.07, 0.06, 0.07]} />
					</mesh>
				) : kind === 'pancit' ? (
					<mesh key={i} position={[it[0], 0.05 + it[2] * 0.03, it[1]]} rotation={[Math.PI / 2, 0, it[3] * 6]} material={mat(i % 7 === 0 ? '#d97b3a' : i % 5 === 0 ? '#6f9a4a' : '#e2c56a')}>
						<cylinderGeometry args={[0.008, 0.008, 0.18, 4]} />
					</mesh>
				) : (
					<mesh key={i} position={[it[0], 0.05 + it[2] * 0.04, it[1]]} material={mat(feastCols[i % feastCols.length])}>
						<icosahedronGeometry args={[0.05, 0]} />
					</mesh>
				),
			)}
		</group>
	);
};

export const Tupper: React.FC<{position: number[]; rotationY?: number; open?: number; content?: Content; fill?: number; sticker?: boolean; scale?: number}> = ({position, rotationY = 0, open = 0, content = 'adobo', fill = 0, sticker = false, scale = 1}) => (
	<group position={position as [number, number, number]} rotation={[0, rotationY, 0]} scale={scale}>
		<mesh position={[0, Hh / 2, 0]} material={mat('#4a86c8', {roughness: 0.4})}>
			<boxGeometry args={[W, Hh, D]} />
		</mesh>
		<ContentMesh kind={content} fill={fill} />
		<group position={[0, Hh, -D / 2]} rotation={[-open * 1.9, 0, 0]}>
			<mesh position={[0, 0.012, D / 2]} material={mat('#8bbbe6', {roughness: 0.4})}>
				<boxGeometry args={[W + 0.03, 0.024, D + 0.03]} />
			</mesh>
		</group>
		{sticker ? (
			<mesh position={[0.08, Hh * 0.55, D / 2 + 0.002]} material={mat('#e889a8')}>
				<circleGeometry args={[0.035, 12]} />
			</mesh>
		) : null}
	</group>
);

// a loose lid (Nanay's "evidence")
export const Lid: React.FC<{position?: number[]; rotation?: number[]}> = ({position = [0, 0, 0], rotation = [0, 0, 0]}) => (
	<mesh position={position as [number, number, number]} rotation={rotation as [number, number, number]} material={mat('#8bbbe6', {roughness: 0.4})}>
		<boxGeometry args={[W + 0.03, 0.024, D + 0.03]} />
	</mesh>
);

// a dish someone brings
export const Dish: React.FC<{position?: number[]; kind: number; s?: number}> = ({position = [0, 0, 0], kind, s = 1}) => {
	const k = kind % 4;
	return (
		<group position={position as [number, number, number]} scale={s}>
			<mesh position={[0, 0.015, 0]} material={mat('#f1efe8')}>
				<cylinderGeometry args={[0.2, 0.16, 0.03, 14]} />
			</mesh>
			{k === 0 ? ( // leche flan
				<>
					<mesh position={[0, 0.07, 0]} material={mat('#e8c35a')}>
						<cylinderGeometry args={[0.12, 0.14, 0.08, 14]} />
					</mesh>
					<mesh position={[0, 0.115, 0]} material={mat('#9a5a22')}>
						<cylinderGeometry args={[0.12, 0.12, 0.012, 14]} />
					</mesh>
				</>
			) : k === 1 ? ( // lumpia
				[-0.08, 0, 0.08].map((z, i) => (
					<mesh key={i} position={[0, 0.06, z]} rotation={[0, 0, Math.PI / 2]} material={mat('#d9a441')}>
						<cylinderGeometry args={[0.03, 0.03, 0.26, 7]} />
					</mesh>
				))
			) : k === 2 ? ( // biko
				<mesh position={[0, 0.06, 0]} material={mat('#6a4a2e')}>
					<boxGeometry args={[0.24, 0.07, 0.24]} />
				</mesh>
			) : ( // rice
				<mesh position={[0, 0.03, 0]} scale={[1, 0.6, 1]} material={mat('#fbfaf5', {roughness: 1})}>
					<sphereGeometry args={[0.13, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2]} />
				</mesh>
			)}
		</group>
	);
};

// ---------- buildings ----------
export const House: React.FC<{position: number[]; rotationY?: number; color: string; roof: string; lit?: number; w?: number}> = ({position, rotationY = 0, color, roof, lit = 0, w = 4}) => {
	const win = col('#3a4048', '#ffd98a', lit);
	return (
		<group position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
			<mesh position={[0, 1.5, 0]} material={mat(color)}>
				<boxGeometry args={[w, 3, 3.5]} />
			</mesh>
			<mesh position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]} scale={[w / 3.6, 1, 1.05]} material={mat(roof)}>
				<coneGeometry args={[2.85, 1.8, 4]} />
			</mesh>
			<mesh position={[0, 0.95, 1.76]} material={mat('#6e4a30')}>
				<boxGeometry args={[0.9, 1.9, 0.04]} />
			</mesh>
			{[-1, 1].map((s) => (
				<mesh key={s} position={[s * w * 0.3, 1.7, 1.76]} material={mat(win, lit > 0 ? {emissive: '#ffcf7a', emissiveIntensity: lit * 0.9} : {})}>
					<boxGeometry args={[0.8, 0.7, 0.04]} />
				</mesh>
			))}
		</group>
	);
};

const HOUSE_COLS = [['#e2d6bf', '#a85d4a'], ['#cfd8c4', '#7a7f86'], ['#e8cfb0', '#b9573f'], ['#c9d5dc', '#8a6a52'], ['#f0e3c8', '#6f8f86']];

// a barangay street running along x; door side faces +z
export const Barangay: React.FC<{t: number; night?: number; dusk?: number; houses?: number[]; lights?: number; extraRows?: boolean}> = ({t, night = 0, dusk = 0, houses = [-10, -5, 0, 5, 10], lights = 0, extraRows = false}) => {
	const skyTop = col(col('#8fc0e3', '#5f5a8a', dusk), '#141a33', night);
	const skyBot = col(col('#f1eee2', '#f2a76a', dusk), '#2c3557', night);
	const lit = Math.max(dusk * 0.7, night);
	return (
		<>
			<Sky top={skyTop} bottom={skyBot} />
			<fog attach="fog" args={[skyBot, 25, 120]} />
			<hemisphereLight args={[col('#f2efe6', '#4a5680', night), col('#5a6248', '#1c2030', night), mix(1.25, 0.75, night)]} />
			<directionalLight position={[mix(20, -30, dusk), mix(40, 12, dusk), 20]} intensity={mix(2.1, 0.8, night) * (1 - dusk * 0.3)} color={col(col('#fff1da', '#ffb070', dusk), '#9fb0ff', night)} />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat(col('#8faa64', '#2d3a2a', night))}>
				<planeGeometry args={[400, 400]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -0.6]} material={mat(col('#8d8a80', '#3a3b40', night))}>
				<planeGeometry args={[200, 3.6]} />
			</mesh>
			{houses.map((x, i) => (
				<House key={i} position={[x, 0, -5]} color={HOUSE_COLS[i % 5][0]} roof={HOUSE_COLS[i % 5][1]} lit={lit} />
			))}
			{extraRows
				? houses.map((x, i) => <House key={'b' + i} position={[x + 2.5, 0, 4.5]} rotationY={Math.PI} color={HOUSE_COLS[(i + 2) % 5][0]} roof={HOUSE_COLS[(i + 2) % 5][1]} lit={lit} />)
				: null}
			{houses.map((x, i) => (
				<Tree key={'t' + i} position={[x + 2.5, 0, -6.2]} s={1.2} color={col('#4f7a38', '#22331f', night)} />
			))}
			{night < 0.5 ? [[-20, -40], [10, -50], [35, -45]].map((c, i) => <Cloud key={i} position={[c[0] + t * 0.6, 26, c[1]]} s={4} seed={i + 70} opacity={0.9 * (1 - night)} />) : null}
			{lights > 0 ? <StringLights from={[houses[0] - 2, 3.2, -3.2]} to={[houses[houses.length - 1] + 2, 3.2, -3.2]} on={lights} /> : null}
		</>
	);
};

// warm bulbs hanging on a sagging wire
export const StringLights: React.FC<{from: number[]; to: number[]; on: number; n?: number; sag?: number}> = ({from, to, on, n = 34, sag = 0.7}) => {
	const cols = ['#ffd98a', '#ffb1a0', '#a8e0ff', '#c8ffb0'];
	return (
		<>
			{Array.from({length: n}).map((_, i) => {
				const u = i / (n - 1);
				const p = [mix(from[0], to[0], u), mix(from[1], to[1], u) - Math.sin(Math.PI * ((u * 4) % 1)) * sag, mix(from[2], to[2], u)];
				return (
					<mesh key={i} position={p as [number, number, number]} material={mat(cols[i % 4], {emissive: cols[i % 4], emissiveIntensity: on * 1.4})}>
						<sphereGeometry args={[0.07, 6, 5]} />
					</mesh>
				);
			})}
		</>
	);
};

// ---------- kitchen interior (Nanay's) ----------
export const Kitchen: React.FC<{flash?: number; night?: number; rain?: number; t?: number}> = ({flash = 0, night = 0, rain = 0, t = 0}) => {
	const winCol = col(col('#fff1d0', '#3a4466', night), '#ffffff', flash);
	return (
		<>
			<color attach="background" args={['#221d1a']} />
			<hemisphereLight args={[col('#ffe7c7', '#8890b0', night), '#3a2e24', mix(0.95, 0.5, night) + flash * 1.5]} />
			<pointLight position={[0.2, 2.6, -0.6]} intensity={mix(10, 7, night)} distance={9} decay={2} color="#ffcf8f" />
			<directionalLight position={[-1, 4, -6]} intensity={mix(1.4, 0.2, night) + flash * 5} color={col('#fff2d6', '#dfe8ff', night)} />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#9a7656')}>
				<planeGeometry args={[12, 12]} />
			</mesh>
			<mesh position={[0, 1.6, -3]} material={mat('#e7d9bd')}>
				<boxGeometry args={[12, 3.2, 0.1]} />
			</mesh>
			<mesh position={[-3.2, 1.6, 0]} material={mat('#dccaa8')}>
				<boxGeometry args={[0.1, 3.2, 12]} />
			</mesh>
			{/* window with rain */}
			<mesh position={[1.9, 1.85, -2.94]} material={mat(winCol, {emissive: winCol, emissiveIntensity: mix(0.8, 0.25, night) + flash})}>
				<boxGeometry args={[1.4, 1.0, 0.02]} />
			</mesh>
			{rain > 0
				? Array.from({length: 18}).map((_, i) => (
						<mesh key={i} position={[1.25 + (i % 9) * 0.16, 2.3 - ((t * 2.2 + i * 0.37) % 1) * 0.95, -2.92]} material={mat('#aab8d8', {transparent: true, opacity: 0.6 * rain})}>
							<boxGeometry args={[0.012, 0.12, 0.01]} />
						</mesh>
					))
				: null}
			{/* counter + stove + pot */}
			<mesh position={[-0.2, 0.45, -2.4]} material={mat('#7a6a5a')}>
				<boxGeometry args={[3.2, 0.9, 0.9]} />
			</mesh>
			<mesh position={[-0.2, 0.92, -2.4]} material={mat('#c9bba4')}>
				<boxGeometry args={[3.25, 0.05, 0.95]} />
			</mesh>
			<mesh position={[-0.9, 1.1, -2.4]} material={mat('#3b3b3e', {metalness: 0.4, roughness: 0.5})}>
				<cylinderGeometry args={[0.28, 0.24, 0.32, 14]} />
			</mesh>
		</>
	);
};

// Nanay's cabinet of mismatched lids
export const Cabinet: React.FC<{position: number[]; open: number}> = ({position, open}) => {
	const cols = ['#e0a63a', '#c9503f', '#6f9a4a', '#8a6f9f', '#e8e1c8', '#4f7aa3', '#d97b3a'];
	const r = rand(55);
	const stack = Array.from({length: 22}).map(() => [(r() - 0.5) * 1.2, Math.floor(r() * 3), (r() - 0.5) * 0.3, 0.3 + r() * 0.25, r()]);
	return (
		<group position={position as [number, number, number]}>
			<mesh position={[0, 1.3, 0]} material={mat('#8a6448')}>
				<boxGeometry args={[1.6, 1.8, 0.55]} />
			</mesh>
			<mesh position={[0, 1.3, 0.06]} material={mat('#3a2a20')}>
				<boxGeometry args={[1.48, 1.68, 0.45]} />
			</mesh>
			{[0.75, 1.3, 1.85].map((y) => (
				<mesh key={y} position={[0, y - 0.25, 0.08]} material={mat('#a07a58')}>
					<boxGeometry args={[1.48, 0.03, 0.42]} />
				</mesh>
			))}
			{stack.map((s, i) => (
				<mesh key={i} position={[s[0], 0.55 + s[1] * 0.55 + (i % 4) * 0.05, 0.1 + s[2] * 0.3]} rotation={[0, s[4], (s[4] - 0.5) * 0.4]} material={mat(cols[i % cols.length])}>
					<boxGeometry args={[s[3], 0.04, s[3] * 0.7]} />
				</mesh>
			))}
			{[-1, 1].map((sd) => (
				<group key={sd} position={[sd * 0.78, 1.3, 0.28]} rotation={[0, sd * open * 1.8, 0]}>
					<mesh position={[-sd * 0.38, 0, 0]} material={mat('#9a7052')}>
						<boxGeometry args={[0.76, 1.76, 0.04]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

// ---------- feast table (scenes 7 & 8) ----------
export const FeastTable: React.FC<{t: number; dishes: number; eat: number; boxOpen: number; boxFill: number; skipNanay?: boolean; boxPos?: number[]}> = ({t, dishes, eat, boxOpen, boxFill, skipNanay, boxPos}) => {
	const dishPos = useMemo(() => {
		const r = rand(88);
		return Array.from({length: 12}).map((_, i) => [-2.6 + (i % 6) * 1.05 + (r() - 0.5) * 0.2, (i < 6 ? -0.25 : 0.25) + (r() - 0.5) * 0.1]);
	}, []);
	const guests = useMemo(() => {
		const out: {x: number; z: number; rot: number; seed: number; s: number}[] = [];
		for (let i = 0; i < 6; i++) out.push({x: -2.6 + i * 1.05, z: -1.15, rot: 0, seed: 950 + i, s: i === 2 ? 0.75 : 1});
		for (let i = 0; i < 5; i++) out.push({x: -2.1 + i * 1.05, z: 1.15, rot: Math.PI, seed: 960 + i, s: i === 3 ? 0.75 : 1});
		return out;
	}, []);
	return (
		<group>
			<mesh position={[0, 0.76, 0]} material={mat('#8a5f3e')}>
				<boxGeometry args={[7, 0.08, 1.4]} />
			</mesh>
			<mesh position={[0, 0.805, 0]} material={mat('#e9e2d0')}>
				<boxGeometry args={[7.1, 0.01, 1.45]} />
			</mesh>
			{[[-3.3, -0.6], [3.3, -0.6], [-3.3, 0.6], [3.3, 0.6]].map((l, i) => (
				<mesh key={i} position={[l[0], 0.37, l[1]]} material={mat('#6e4a30')}>
					<boxGeometry args={[0.1, 0.74, 0.1]} />
				</mesh>
			))}
			{dishPos.map((d, i) => {
				const pop = Math.min(1, Math.max(0, (dishes * 12 - i) * 1.5));
				return pop > 0 ? <Dish key={i} position={[d[0], 0.81, d[1]]} kind={i} s={pop} /> : null;
			})}
			{guests.map((g, i) => {
				const b = Math.max(0, Math.sin(t * 3 + i * 1.7));
				if (skipNanay && i === 3) return null;
				return (
					<Person key={i} seed={g.seed} position={[g.x, 0, g.z]} rotationY={g.rot} scale={g.s} mouth={eat > 0.5 && i % 3 === 0} pose={{armL: -0.5 - eat * b * 0.6, armR: -0.7 - eat * (1 - b) * 0.7, elbow: -0.4, bob: eat * b * 0.04}} />
				);
			})}
			<Tupper position={boxPos ?? [0.5, 0.81, 0]} open={boxOpen} content="feast" fill={boxFill} sticker scale={1.6} />
		</group>
	);
};
