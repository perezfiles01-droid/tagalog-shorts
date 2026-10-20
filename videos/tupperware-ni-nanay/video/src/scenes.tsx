import React from 'react';
import {Cam, Person, Sky, Tree, mat, mix, mixV, ramp, smooth, walk} from './kit';
import {Jeepney} from './scenesB';
import {Actor, Barangay, Cabinet, Dish, FeastTable, House, Kitchen, Lid, StringLights, Tupper, col} from './props';

type V = [number, number, number];
// container hop between two points with an arc
const arc = (a: number[], b: number[], k: number, h = 0.6): V => [mix(a[0], b[0], k), mix(a[1], b[1], k) + Math.sin(Math.PI * k) * h, mix(a[2], b[2], k)];
// where a person's hands are when holding something in front
const hands = (pos: number[], rotY: number, fwd = 0.42, y = 1.02): V => [pos[0] + Math.sin(rotY) * fwd, y, pos[2] + Math.cos(rotY) * fwd];
const HOLD = {armL: -1.15, armR: -1.15, spreadL: -0.05, spreadR: -0.05, elbow: -0.35};

// ================= S1: Nanay packs the adobo, the one rule =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const pieces = 6;
	const filled = Math.min(pieces, Math.max(0, Math.floor((t - 1.0) / 0.5)));
	const lid = 1 - smooth(t, 4.9, 5.5);
	const counter: V = [0.35, 0.945, -2.25];
	const sonPos = mixV([3.4, 0, -0.4], [1.35, 0, -0.6], smooth(t, 6.0, 8.2));
	const sonRot = -Math.PI / 2;
	const nanayRot = mix(Math.PI, Math.PI / 2, smooth(t, 6.4, 7.4));
	const nanayPos: V = [0.15, 0, -1.4];
	const give = smooth(t, 8.6, 9.8);
	const boxP = give < 1 ? arc(counter, hands(sonPos, sonRot), give, 0.25) : hands(sonPos, sonRot);
	const wag = t > 10.4 && t < 14.6;
	const leave = smooth(t, 14.0, 15.5);
	const camP = mixV([1.7, 1.55, -1.75], [2.4, 2.0, 3.0], smooth(t, 5.0, 7.5));
	const look = mixV([-0.2, 1.05, -2.3], [0.9, 1.15, -1.0], smooth(t, 5.0, 7.5));
	return (
		<>
			<Cam pos={camP} look={look} fov={40} near={0.05} />
			<Kitchen />
			{/* door to the outside */}
			<mesh position={[3.1, 1.1, -0.6]} material={mat('#fff1d0', {emissive: '#ffe8b8', emissiveIntensity: 0.9})}>
				<boxGeometry args={[0.04, 2.2, 1.0]} />
			</mesh>
			{/* adobo pieces flying from the pot */}
			{Array.from({length: pieces}).map((_, i) => {
				const k = ramp(t, 1.0 + i * 0.5, 1.45 + i * 0.5);
				if (k <= 0 || k >= 1) return null;
				return (
					<mesh key={i} position={arc([-0.9, 1.3, -2.4], [counter[0], counter[1] + 0.1, counter[2]], k, 0.35)} rotation={[k * 6, k * 4, 0]} material={mat('#5a3a24')}>
						<boxGeometry args={[0.07, 0.06, 0.07]} />
					</mesh>
				);
			})}
			<Tupper position={boxP} rotationY={give > 0.5 ? sonRot : 0} open={lid} content="adobo" fill={filled / pieces} />
			<Actor who="nanay" position={nanayPos} rotationY={nanayRot} pose={wag ? {armL: 0.05, armR: -2.3, spreadR: 0.25 + Math.sin(t * 14) * 0.2, elbow: -0.6} : t < 5 ? {armL: -0.9, armR: -0.6 + Math.sin(t * 6) * 0.3, elbow: -0.3} : give > 0 && give < 1 ? HOLD : {armL: 0.05, armR: 0.05}} mouth={wag} />
			<Actor who="anak" position={[sonPos[0] + leave * 2.5, 0, sonPos[2]]} rotationY={leave > 0 ? Math.PI / 2 : sonRot} pose={{...(t > 6 && t < 8.2 ? walk(t, 1) : leave > 0 ? walk(t, 1) : {}), ...(give > 0.6 ? HOLD : {}), bob: wag ? Math.abs(Math.sin(t * 5)) * 0.04 : 0}} />
		</>
	);
};

// ================= S2: Tita's house, adobo becomes pancit =================
export const S2: React.FC<{t: number}> = ({t}) => {
	const door: V = [0, 0, -2.75];
	const sonPos = mixV([-6, 0, -1.4], [-0.75, 0, -1.4], smooth(t, 0, 4.0));
	const sonRot = t < 4 ? Math.PI / 2 : Math.PI * 0.85;
	const titaRot = 0;
	const toTita = smooth(t, 4.3, 5.1);
	const kidPos = mixV([5, 0, -1.4], [0.85, 0, -1.4], smooth(t, 5.5, 7.6));
	const kidLeave = smooth(t, 8.6, 9.6);
	const toKid = smooth(t, 8.0, 8.6);
	const open = smooth(t, 5.4, 5.9) * (1 - smooth(t, 7.4, 7.8));
	const adobo = 1 - smooth(t, 5.9, 6.5);
	const pancit = smooth(t, 6.5, 7.2);
	const titaHands = hands(door, titaRot, 0.42);
	const kidP: V = [kidPos[0] + kidLeave * 4, 0, kidPos[2]];
	const kidRot = kidLeave > 0 ? Math.PI / 2 : -Math.PI / 2;
	let boxP: V;
	if (toTita < 1) boxP = arc(hands(sonPos, sonRot), titaHands, toTita, 0.2);
	else if (toKid < 1) boxP = titaHands;
	else boxP = hands(kidP, kidRot, 0.36, 0.82);
	if (toKid > 0 && toKid < 1) boxP = arc(titaHands, hands(kidPos, kidRot, 0.36, 0.82), toKid, 0.2);
	const cx = mix(-3.2, 1.4, smooth(t, 0, 9.5));
	return (
		<>
			<Cam pos={[cx, 2.4, 4.6]} look={[cx * 0.8, 1.0, -2.4]} fov={40} />
			<Barangay t={t} houses={[-10, -5, 0, 5, 10]} />
			<Tupper position={boxP} rotationY={0} open={open} content={pancit > 0 ? 'pancit' : 'adobo'} fill={pancit > 0 ? pancit : adobo} />
			<Actor who="anak" position={sonPos} rotationY={sonRot} pose={{...(t < 4 ? walk(t, 1) : {}), ...(toTita < 0.6 ? HOLD : {})}} />
			<Actor who="tita" position={door} rotationY={titaRot} pose={toTita > 0.5 && toKid < 0.6 ? HOLD : {armL: 0.05, armR: 0.05}} mouth={t > 5 && t < 8} />
			<Actor who="kid" scale={0.75} position={kidP} rotationY={kidRot} pose={{...(t > 5.5 && t < 7.6 ? walk(t, 1.2) : kidLeave > 0 ? walk(t, 1.2) : {}), ...(toKid > 0.5 ? HOLD : {})}} />
		</>
	);
};

// ================= S3: the container travels: office, jeepney, a stranger's party =================
export const S3: React.FC<{t: number}> = ({t}) => {
	const desk: V = [0.25, 0.79, 0.1];
	const jx = mix(10, 21, smooth(t, 3.4, 7.8, ));
	const roof: V = [jx, 1.72, 0];
	const party: V = [30.3, 0.81, 0.15];
	let boxP: V;
	const h1 = ramp(t, 2.9, 3.7), h2 = ramp(t, 7.3, 8.2);
	if (t < 2.9) boxP = desk;
	else if (h1 < 1) boxP = arc(desk, [10.6, 1.72, 0], h1, 2.2);
	else if (h2 <= 0) boxP = roof;
	else if (h2 < 1) boxP = arc([21, 1.72, 0], party, h2, 2.2);
	else boxP = party;
	const camP: V = t < 3.2 ? [1.4, 1.55, 2.6] : t < 7.6 ? [boxP[0] - 1.5, 3.0, 6.2] : [31.6, 1.7, 3.0];
	const look: V = t < 3.2 ? [0.2, 0.95, -0.2] : t < 7.6 ? [boxP[0], 1.2, 0] : [30.2, 1.05, -0.2];
	return (
		<>
			<Cam pos={camP} look={look} fov={42} />
			<Sky top="#8fc0e3" bottom="#f1eee2" />
			<fog attach="fog" args={['#eeeadc', 20, 90]} />
			<hemisphereLight args={['#f2efe6', '#5a6248', 1.25]} />
			<directionalLight position={[20, 40, 20]} intensity={2.1} color="#fff1da" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#8faa64')}>
				<planeGeometry args={[400, 400]} />
			</mesh>
			{/* office */}
			<mesh position={[0, 1.6, -1.6]} material={mat('#c9d1d6')}>
				<boxGeometry args={[6, 3.2, 0.1]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={mat('#9aa2a8')}>
				<planeGeometry args={[6, 4]} />
			</mesh>
			<mesh position={[0, 0.37, 0]} material={mat('#e8e2d6')}>
				<boxGeometry args={[1.6, 0.74, 0.8]} />
			</mesh>
			<mesh position={[-0.35, 1.0, -0.2]} material={mat('#2e3238')}>
				<boxGeometry args={[0.6, 0.4, 0.04]} />
			</mesh>
			<Actor who="office" position={[-0.35, 0, -0.75]} rotationY={0} pose={{sit: true, armL: -1.1 + Math.sin(t * 12) * 0.08, armR: -1.1 + Math.cos(t * 12) * 0.08, elbow: -0.5}} />
			<Tree position={[1.9, 0, -1.2]} s={0.5} />
			{/* road for the jeepney */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[16, 0.02, 0]} material={mat('#6b6a66')}>
				<planeGeometry args={[22, 2.8]} />
			</mesh>
			{[8, 11, 14, 17, 20, 23].map((x, i) => (
				<Tree key={i} position={[x, 0, -3 - (i % 2) * 1.5]} s={1.3} />
			))}
			<Jeepney position={[jx, 0, 0]} rotationY={Math.PI / 2} t={t} />
			{/* the party: balloons, bunting, dancing strangers */}
			<mesh position={[30, 0.37, 0]} material={mat('#e9e2d0')}>
				<boxGeometry args={[2.2, 0.74, 1.1]} />
			</mesh>
			{[0, 1, 2].map((i) => (
				<Dish key={i} position={[29.4 + i * 0.4 + (i === 2 ? 0.4 : 0), 0.75, -0.2]} kind={i + 1} />
			))}
			{[['#e8889a', 28.6], ['#f2c14e', 29.1], ['#7fc8e8', 31.4], ['#a8d88a', 31.9]].map(([c, x], i) => (
				<group key={i} position={[x as number, 2.2 + Math.sin(t * 2 + i) * 0.08, -0.8]}>
					<mesh scale={[1, 1.2, 1]} material={mat(c as string)}>
						<sphereGeometry args={[0.22, 10, 8]} />
					</mesh>
					<mesh position={[0, -0.8, 0]} material={mat('#ffffff')}>
						<cylinderGeometry args={[0.005, 0.005, 1.4, 3]} />
					</mesh>
				</group>
			))}
			<StringLights from={[27.5, 2.9, -1.3]} to={[33, 2.9, -1.3]} on={0.6} n={16} sag={0.3} />
			{[[28.2, -1.2], [29.2, -1.5], [31.2, -1.4], [32.2, -1.0], [28.4, 1.2], [32.0, 1.3]].map((p, i) => (
				<Person key={i} seed={970 + i} position={[p[0], 0, p[1]]} rotationY={p[1] > 0 ? Math.PI : 0} pose={{armL: -2.4 + Math.sin(t * 6 + i) * 0.4, armR: -2.4 + Math.cos(t * 6 + i) * 0.4, spreadL: 0.4, spreadR: 0.4, bob: Math.abs(Math.sin(t * 6 + i)) * 0.08}} mouth />
			))}
			<Tupper position={boxP} rotationY={t > 3 && t < 7.6 ? Math.PI / 2 : 0} content="pancit" fill={t > 7.6 ? 0 : 1} sticker={t > 2.4} />
		</>
	);
};

// ================= S4: the empty cabinet, a detective is born (silent) =================
export const S4: React.FC<{t: number}> = ({t}) => {
	const flash = Math.max(0, 1 - Math.abs(t - 1.0) * 6) + Math.max(0, 1 - Math.abs(t - 5.5) * 6) * 0.8;
	const turn = smooth(t, 2.4, 3.0);
	const nPos: V = [0.0, 0, -1.5];
	const zoom = smooth(t, 2.6, 4.2);
	const back = smooth(t, 4.6, 6.0);
	const camP = mixV(mixV([0.6, 1.75, 0.4], [0.3, 1.8, mix(0.6, -0.1, zoom)], turn), [1.4, 1.7, 1.5], back);
	const look = mixV(mixV([0, 1.25, -2.6], [0, 1.72, -1.5], turn), [0, 1.4, -1.5], back);
	const fall = ramp(t, 0.6, 1.4);
	return (
		<>
			<Cam pos={camP} look={look} fov={mix(40, 34, zoom * (1 - back))} near={0.05} />
			<Kitchen night={1} flash={flash} rain={1} t={t} />
			<Cabinet position={[0, 0, -2.75]} open={1} />
			{fall > 0 ? <Lid position={[0.4, mix(1.55, 0.02, fall * fall), mix(-2.45, -2.0, fall)]} rotation={[fall * 5, 0, fall * 3]} /> : null}
			<Actor who="nanay" position={nPos} rotationY={mix(Math.PI, 0, turn)} pose={t < 2.4 ? {armL: -1.4, armR: -1.4, spreadL: 0.4, spreadR: 0.4} : t < 4.6 ? {armL: 0.05, armR: 0.05} : {armL: 0.05, armR: -2.0 - Math.sin(t * 2) * 0.1, elbow: -0.4, headTurn: Math.sin((t - 4.6) * 2.2) * 0.6}} mouth={t > 2.6}>
				{t > 4.6 ? <Lid position={[0, -0.05, 0.05]} rotation={[Math.PI / 2, 0, 0]} /> : null}
			</Actor>
		</>
	);
};

// ================= S5: door to door with the evidence =================
const stops = [
	{at: 1.0, x: -5},
	{at: 4.2, x: 0},
	{at: 7.4, x: 5},
];
export const S5: React.FC<{t: number}> = ({t}) => {
	// Nanay's x along the street
	let nx = -7.5;
	let walking = true;
	const path = [{t: 0, x: -7.5}, {t: 1.0, x: -5}, {t: 3.4, x: -5}, {t: 4.2, x: 0}, {t: 6.6, x: 0}, {t: 7.4, x: 5}, {t: 9.8, x: 5}, {t: 11.5, x: 8.5}];
	for (let i = 0; i < path.length - 1; i++) {
		const a = path[i], b = path[i + 1];
		if (t >= a.t && t <= b.t) {
			nx = mix(a.x, b.x, (t - a.t) / (b.t - a.t));
			walking = a.x !== b.x;
		}
	}
	if (t > 11.5) nx = 8.5;
	const facingDoor = !walking;
	const nRot = facingDoor ? Math.PI : Math.PI / 2;
	return (
		<>
			<Cam pos={[nx * 0.85, 2.3, 5.2]} look={[nx, 1.15, -2.8]} fov={42} />
			<Barangay t={t} dusk={1} />
			{stops.map((s, i) => {
				const lt = t - s.at;
				const out = smooth(lt, 0.7, 1.1) * (1 - smooth(lt, 2.4, 2.9));
				const shrug = lt > 1.1 && lt < 1.9;
				const point = lt >= 1.9 && lt < 2.5;
				return out > 0 ? (
					<Person key={i} seed={980 + i} position={[s.x, 0, mix(-3.6, -2.75, out)]} rotationY={point ? Math.PI / 2 : 0} pose={shrug ? {armL: -0.5, armR: -0.5, spreadL: 1.0, spreadR: 1.0, elbow: -1.2} : point ? {armR: -1.5, armL: 0.05} : {armL: 0.05, armR: 0.05}} mouth={shrug} />
				) : null;
			})}
			<Actor who="nanay" position={[nx, 0, -1.6]} rotationY={nRot} pose={walking ? {...walk(t, 0.9), armR: -1.9, elbow: -0.3} : stops.some((s) => t - s.at > 0.1 && t - s.at < 0.7) ? {armR: -1.4 + Math.sin(t * 22) * 0.25, armL: 0.05} : {armR: -2.1, elbow: -0.3, armL: 0.05}}>
				<Lid position={[0, -0.05, 0.05]} rotation={[Math.PI / 2, 0, 0]} />
			</Actor>
		</>
	);
};

// ================= S6: a knock at night, the parade arrives =================
export const S6: React.FC<{t: number}> = ({t}) => {
	const look = smooth(t, 3.2, 3.9);
	const surprise = smooth(t, 7.0, 7.6);
	const p = smooth(t, 4.6, 8.0);
	const people = 8;
	const camP = mixV([1.6, 1.25, 0.2], [-3.2, 2.7, 5.8], p);
	const lookAt = mixV([0, 0.95, -3.0], [4.5, 1.0, -1.8], p);
	return (
		<>
			<Cam pos={camP} look={lookAt} fov={42} />
			<Barangay t={t} night={1} />
			<pointLight position={[0, 2.4, -2.9]} intensity={7} distance={8} decay={2} color="#ffcf8f" />
			<mesh position={[0, 0.2, -3.0]} material={mat('#8d8a80')}>
				<boxGeometry args={[1.6, 0.4, 0.6]} />
			</mesh>
			<Actor who="nanay" position={[0, 0, -2.95]} rotationY={look * 1.1} pose={{sit: true, armL: -0.9, armR: surprise > 0 ? -2.4 * surprise : -1.3, elbow: surprise > 0 ? -0.4 : -1.8, spreadR: 0.3 * surprise, spreadL: 0.1}} mouth={surprise > 0.5} />
			{Array.from({length: people}).map((_, i) => {
				const start = 3.6 + i * 0.25;
				const arrive = 1.6 + (i % 4) * 1.1;
				const zz = -1.0 - Math.floor(i / 4) * 0.9 + (i % 2) * 0.2;
				const x = mix(22 + i * 1.2, arrive, smooth(t, start, start + 4.8));
				const moving = t > start && t < start + 4.8;
				const pos: V = [x, 0, zz];
				const rot = -Math.PI / 2;
				return (
					<React.Fragment key={i}>
						<Person seed={i === 0 ? 902 : 990 + i} shirt={i === 0 ? '#4f7aa3' : undefined} position={pos} rotationY={rot} scale={i === 5 ? 0.75 : 1} pose={{...(moving ? walk(t, 1, i * 0.2) : {}), ...HOLD}} mouth={!moving && i % 2 === 0} />
						{i === 0 ? <Tupper position={hands(pos, rot)} rotationY={rot} content="feast" fill={1} sticker /> : <Dish position={hands(pos, rot, 0.42, i === 5 ? 0.78 : 1.0)} kind={i} s={0.9} />}
					</React.Fragment>
				);
			})}
		</>
	);
};

// ================= S7: the whole barangay feast =================
export const S7: React.FC<{t: number}> = ({t}) => {
	const crane = smooth(t, 0, 13);
	return (
		<>
			<Cam pos={mixV([0.6, 6.5, 7.5], [2.6, 2.1, 4.2], crane)} look={mixV([0, 0.6, -1.0], [0.4, 1.0, -0.6], crane)} fov={40} />
			<Barangay t={t} night={1} lights={1} />
			<pointLight position={[0, 3, -0.5]} intensity={18} distance={12} decay={2} color="#ffd59a" />
			<group position={[0, 0, -0.6]}>
				<FeastTable t={t} dishes={smooth(t, 1.5, 7.5)} eat={smooth(t, 7.5, 8.5)} boxOpen={smooth(t, 0.6, 1.4)} boxFill={smooth(t, 1.0, 2.0)} skipNanay />
				<Actor who="nanay" position={[0.55, 0, -1.15]} rotationY={0} pose={{armL: -0.9, armR: -0.9 - Math.max(0, Math.sin(t * 2)) * 0.6, elbow: -0.5}} mouth={t > 3} />
			</group>
		</>
	);
};

// ================= S8: lid clicks shut, lent out again, pull back over the barangay =================
export const S8: React.FC<{t: number}> = ({t}) => {
	const lid = 1 - smooth(t, 0.8, 1.4);
	const table: V = [0.5, 0.21, -0.6];
	const boxOnTable: V = [table[0], 0.81, table[2]];
	const nanay: V = [0.55, 0, -1.75];
	const kidPos = mixV([2.6, 0, 0.4], [1.0, 0, -0.2], smooth(t, 1.4, 3.2));
	const kidLeave = smooth(t, 5.0, 9.5);
	const kidP: V = [kidPos[0] + kidLeave * 7, 0, kidPos[2] + kidLeave * 2];
	const kidRot = kidLeave > 0 ? 1.3 : -2.2;
	const lift = smooth(t, 2.2, 3.0);
	const give = smooth(t, 3.4, 4.2);
	const nanayHands = hands(nanay, 0.4, 0.45);
	let boxP: V = boxOnTable;
	if (lift > 0) boxP = arc(boxOnTable, nanayHands, lift, 0.1);
	if (give > 0) boxP = arc(nanayHands, hands(kidPos, -2.2, 0.36, 0.82), give, 0.15);
	if (give >= 1) boxP = hands(kidP, kidRot, 0.36, 0.82);
	const up = smooth(t, 4.5, 15.5);
	const camP: V = [mix(1.4, 4, up), mix(2.9, 70, up * up), mix(0.9, 30, up)];
	const look: V = [mix(0.5, 2, up), mix(0.85, 0, up), mix(-1.2, -6, up)];
	const town = [-40, -30, -20, -10, 0, 10, 20, 30, 40];
	return (
		<>
			<Cam pos={camP} look={look} fov={40} near={0.05} far={600} />
			<Barangay t={t} night={1} lights={1} houses={[-10, -5, 0, 5, 10]} extraRows />
			<pointLight position={[0, 3, -0.5]} intensity={18} distance={12} decay={2} color="#ffd59a" />
			{/* more of the barangay revealed by the pull-back */}
			{town.flatMap((x, i) =>
				[-16, -27, 14, 25].map((z, j) =>
					Math.abs(x) <= 10 && (z === -16 || z === 14) ? null : <House key={`${i}-${j}`} position={[x + (j % 2) * 3, 0, z]} rotationY={z > 0 ? Math.PI : 0} color={['#e2d6bf', '#cfd8c4', '#e8cfb0', '#c9d5dc'][(i + j) % 4]} roof={['#a85d4a', '#7a7f86', '#b9573f', '#8a6a52'][(i + j) % 4]} lit={((i * 7 + j * 3) % 5) / 5 + 0.3} />,
				),
			)}
			<group position={[0, 0, -0.6]}>
				<FeastTable t={t + 14} dishes={1} eat={1} boxOpen={0} boxFill={0} skipNanay boxPos={[50, -10, 0]} />
			</group>
			<Actor who="nanay" position={nanay} rotationY={lift > 0 && give < 1 ? 0.4 : 0} pose={t < 1.6 ? {armL: -1.2, armR: -1.2, elbow: -0.6} : lift > 0 && give < 1 ? HOLD : {armL: 0.05, armR: -0.6, elbow: -0.8}} mouth={t > 3 && t < 5} />
			<Actor who="kid" scale={0.75} position={kidP} rotationY={kidRot} pose={{...(t > 1.4 && t < 3.2 ? walk(t, 1.2) : kidLeave > 0 && kidLeave < 1 ? walk(t, 1.2) : {}), ...(give > 0.5 ? HOLD : {})}} />
			<Tupper position={boxP} rotationY={give > 0.5 ? kidRot : 0} open={lid} content="feast" fill={1} sticker />
		</>
	);
};
