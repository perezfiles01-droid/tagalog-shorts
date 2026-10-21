import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Cam, Person, Pose, Sky, Tree, mat, mix, rand, ramp, smooth, walk} from './kit';
import {Barangay, Dish} from './props';
import {Islands, Jeepney, K, LAT0, LON0} from './scenesB';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// recurring cast
const GUY = {seed: 2001, shirt: '#4f6a8f'};
const NANAY = {seed: 1102, shirt: '#c9784a', longHair: true};
const KID = {seed: 2004, shirt: '#d9b44a', scale: 0.72};
const TEEN = {seed: 3001, shirt: '#6f8f86', scale: 0.88};
const LOLO = {seed: 3002, shirt: '#d8d4cc', hairColor: '#cfcac2', longHair: false};
const BARONG = '#efe6cf';
const ZSKIN = '#8fae6a';

// ---------- the zombie: a toy Person with green head and hands, arms out front ----------
const Zombie: React.FC<{position: number[]; rotationY?: number; t: number; seed?: number; barong?: boolean; walking?: number; sit?: boolean; mouth?: boolean; belly?: number; lean?: number; pose?: Pose; noHands?: boolean}> = ({position, rotationY = 0, t, seed = 4001, barong = false, walking = 0, sit = false, mouth = true, belly = 0, lean = 0, pose = {}, noHands}) => {
	const sway = Math.sin(t * 2.4 + seed) * 0.12;
	const dy = sit ? -0.38 : 0;
	const p: Pose = {armL: -1.5, armR: -1.5, spreadL: 0.05, spreadR: 0.05, leg: walking * Math.sin(t * 3.2 + seed) * 0.3, sit, ...pose};
	const eyeM = barong ? mat('#f2c84a', {emissive: '#d8a020', emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.3}) : mat('#f4f1e4');
	const shirt = barong ? BARONG : ['#6f6a5a', '#5b6a72', '#7a5f5a'][seed % 3];
	return (
		<group position={position as V} rotation={[lean, rotationY, sway * 0.4]}>
			<Person seed={seed} shirt={shirt} pants={barong ? '#2f3a45' : '#4a4f5e'} longHair={false} pose={p} mouth={false} />
			<group position={[0, 1.76 + dy, 0]}>
				<mesh material={mat(ZSKIN)}>
					<sphereGeometry args={[0.228, 12, 9]} />
				</mesh>
				{[-1, 1].map((s) => (
					<mesh key={s} position={[s * 0.08, 0.03, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={eyeM}>
						<cylinderGeometry args={[barong ? 0.055 : 0.04, barong ? 0.055 : 0.04, 0.03, 10]} />
					</mesh>
				))}
				{mouth ? (
					<mesh position={[0, -0.1, 0.205]} scale={[1.6, 1, 1]} material={mat('#3a2a26')}>
						<sphereGeometry args={[0.035, 8, 5]} />
					</mesh>
				) : null}
			</group>
			{noHands
				? null
				: [-1, 1].map((s) => (
						<mesh key={'h' + s} position={[s * 0.3, 1.31 + dy, 0.72]} material={mat(ZSKIN)}>
							<sphereGeometry args={[0.085, 8, 6]} />
						</mesh>
					))}
			{barong ? (
				<>
					{/* barong embroidery stripe */}
					<mesh position={[0, 1.2 + dy, 0.24]} material={mat('#d8cba8')}>
						<boxGeometry args={[0.12, 0.4, 0.02]} />
					</mesh>
					{belly > 0 ? (
						<mesh position={[0, 1.08 + dy, 0.12 + belly * 0.1]} scale={[1, 0.9, 0.7 + belly * 0.6]} material={mat(BARONG)}>
							<sphereGeometry args={[0.26 + belly * 0.1, 12, 9]} />
						</mesh>
					) : null}
				</>
			) : null}
		</group>
	);
};

// a horde shuffling along x
const Horde: React.FC<{t: number; n: number; x0: number; z: number; speed?: number; barong?: boolean; spread?: number}> = ({t, n, x0, z, speed = 0.35, barong = false, spread = 1.6}) => (
	<>
		{Array.from({length: n}).map((_, i) => (
			<Zombie key={i} t={t} seed={4001 + i} barong={barong} walking={1} position={[x0 + i * spread + t * speed, 0, z + (i % 2) * 0.9]} rotationY={Math.PI / 2} />
		))}
	</>
);

const Phone: React.FC<{position: number[]; rotation?: number[]; glow?: number}> = ({position, rotation = [0, 0, 0], glow = 1}) => (
	<group position={position as V} rotation={rotation as V}>
		<mesh material={mat('#24262c', {roughness: 0.4})}>
			<boxGeometry args={[0.09, 0.17, 0.014]} />
		</mesh>
		<mesh position={[0, 0, 0.0075]} material={mat('#8fc0ff', {emissive: '#6fa8ff', emissiveIntensity: glow})}>
			<boxGeometry args={[0.078, 0.152, 0.002]} />
		</mesh>
	</group>
);

const Tag: React.FC<{text: string; sub?: string; o: number; y: number; color?: string; size?: number}> = ({text, sub, o, y, color = '#fff', size = 150}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: y, opacity: o}}>
		<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, color, textShadow: '0 6px 30px rgba(0,0,0,0.6)', transform: `scale(${0.7 + 0.3 * o})`, whiteSpace: 'nowrap'}}>{text}</div>
		{sub ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 60, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,0.7)', marginTop: -6}}>{sub}</div> : null}
	</AbsoluteFill>
);
const pop = (t: number, a: number, b: number) => interpolate(t, [a, a + 0.4, b - 0.4, b], [0, 1, 1, 0], clampI);

// ---------- town hall ----------
const TownHall: React.FC<{position?: number[]}> = ({position = [0, 0, -5]}) => (
	<group position={position as V}>
		<mesh position={[0, 2, 0]} material={mat('#ece6d8')}>
			<boxGeometry args={[7, 4, 3.5]} />
		</mesh>
		<mesh position={[0, 4.6, 1.2]} rotation={[0, 0, 0]} scale={[1, 0.35, 0.3]} material={mat('#e2dccb')}>
			<coneGeometry args={[3.9, 3.2, 3]} />
		</mesh>
		{[-2.4, -0.8, 0.8, 2.4].map((x) => (
			<mesh key={x} position={[x, 2, 2.1]} material={mat('#f6f2e8')}>
				<cylinderGeometry args={[0.2, 0.22, 4, 10]} />
			</mesh>
		))}
		{[0, 1, 2].map((i) => (
			<mesh key={i} position={[0, 0.12 + i * 0.24, 3.0 - i * 0.4]} material={mat('#d8d2c2')}>
				<boxGeometry args={[5 - i * 0.4, 0.24, 0.8]} />
			</mesh>
		))}
		<mesh position={[0, 3.6, 1.8]} material={mat('#6e4a30')}>
			<boxGeometry args={[1.4, 0.4, 0.05]} />
		</mesh>
		<mesh position={[0, 5.3, 0]} material={mat('#b0b0b0')}>
			<cylinderGeometry args={[0.03, 0.03, 2.4, 5]} />
		</mesh>
	</group>
);

// ================= S1: night outbreak, and the guy hiding under his bed =================
export const S1: React.FC<{t: number}> = ({t}) => {
	if (t < 5.0) {
		const k = smooth(t, 0, 5.0);
		return (
			<>
				<Cam pos={[mix(-3, 0.6, k), mix(3.2, 1.9, k), mix(11, 6.5, k)]} look={[0, 1.3, -1.5]} fov={44} far={2000} />
				<Barangay t={t} night={1} lights={0} houses={[-10, -5, 0, 5, 10]} />
				<mesh position={[30, 40, -200]} material={mat('#fff6d8', {emissive: '#fff0c0', emissiveIntensity: 1})}>
					<sphereGeometry args={[8, 14, 10]} />
				</mesh>
				<Horde t={t} n={5} x0={-7} z={0.2} speed={0.4} spread={2.2} />
			</>
		);
	}
	const u = t - 5.0;
	const reach = smooth(t, 9.6, 11.0);
	const pop = t > 11.37;
	return (
		<>
			<Cam pos={[mix(1.9, 1.25, smooth(u, 0, 7.7)), mix(0.55, 0.4, smooth(u, 0, 7.7)), mix(-0.4, -1.0, smooth(u, 0, 7.7))]} look={[0, 0.12, -1.55]} fov={42} near={0.02} />
			<color attach="background" args={['#15141c']} />
			<hemisphereLight args={['#6a7090', '#1a1820', 0.5]} />
			<pointLight position={[0.15, 0.32, -1.55]} intensity={6} distance={2.5} color="#8fc0ff" />
			<pointLight position={[1.4, 0.4, -1.2]} intensity={2.5} distance={3} color="#9fb0ff" />
			<pointLight position={[1.5, 2.2, 0.6]} intensity={3} distance={6} color="#9fb0ff" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#5a4636')}>
				<planeGeometry args={[12, 12]} />
			</mesh>
			<mesh position={[0, 1.5, -3]} material={mat('#3a3a4a')}>
				<boxGeometry args={[8, 3, 0.1]} />
			</mesh>
			{/* the bed */}
			<mesh position={[0, 0.5, -1.0]} material={mat('#7a5a40')}>
				<boxGeometry args={[1.2, 0.1, 2.4]} />
			</mesh>
			<mesh position={[0, 0.65, -1.0]} material={mat('#c8c4d8')}>
				<boxGeometry args={[1.15, 0.2, 2.35]} />
			</mesh>
			<mesh position={[0, 0.8, -2.0]} material={mat('#e8e6f0')}>
				<boxGeometry args={[0.8, 0.12, 0.4]} />
			</mesh>
			{[[-0.55, 0.1], [0.55, 0.1], [-0.55, -2.1], [0.55, -2.1]].map(([x, z], i) => (
				<mesh key={i} position={[x, 0.22, z]} material={mat('#6a4a32')}>
					<boxGeometry args={[0.08, 0.45, 0.08]} />
				</mesh>
			))}
			{/* the guy lying on his back under it, phone over his face */}
			<group position={[0, 0.13, -0.15]} rotation={[-Math.PI / 2, 0, 0]} scale={0.85}>
				<Person {...GUY} pose={{armL: -1.3, armR: -1.3, elbow: -0.7, headTurn: pop ? 0.6 : 0}} mouth={pop} />
			</group>
			<Phone position={[0, pop ? 0.25 : 0.38, -1.55]} rotation={[-Math.PI / 2, 0, 0]} />
			{/* the zombie hand creeping in from the side */}
			<group position={[mix(1.6, 0.42, reach), 0.12, -1.5]}>
				<mesh rotation={[0, 0, Math.PI / 2]} position={[0.5, 0, 0]} material={mat('#6f6a5a')}>
					<capsuleGeometry args={[0.06, 0.9, 3, 7]} />
				</mesh>
				<mesh material={mat(ZSKIN)}>
					<sphereGeometry args={[0.09, 8, 6]} />
				</mesh>
				{[0, 1, 2].map((i) => (
					<mesh key={i} position={[-0.09, 0, -0.05 + i * 0.05]} rotation={[0, 0, Math.PI / 2 + Math.sin(t * 6 + i) * 0.3]} material={mat(ZSKIN)}>
						<capsuleGeometry args={[0.018, 0.08, 2, 5]} />
					</mesh>
				))}
			</group>
		</>
	);
};

// ================= S2: the outbreak map =================
const CITIES = [[121.0, 14.6, 230], [123.9, 10.3, 200], [125.6, 7.1, 170]];
const REMOTE = [[121.0, 17.4], [118.6, 9.6], [122.4, 12.4], [126.1, 8.6]];
const P = (lon: number, lat: number): [number, number] => [(lon - LON0) * K, -(lat - LAT0) * K];
export const S2: React.FC<{t: number}> = ({t}) => {
	const spread = smooth(t, 4.0, 7.0);
	const glow = 0.7 + 0.3 * Math.sin(t * 4);
	const hi = smooth(t, 8.3, 8.9);
	const k = smooth(t, 0, 12.6);
	return (
		<>
			<Cam pos={[mix(100, 60, k), mix(1900, 1650, k), mix(700, 640, k)]} look={[mix(80, 60, k), 0, mix(470, 450, k)]} fov={40} near={5} far={6000} />
			<color attach="background" args={['#0f1a2a']} />
			<hemisphereLight args={['#c8d8f0', '#203040', 1.1]} />
			<directionalLight position={[300, 800, 300]} intensity={1.4} />
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} material={mat('#1f3a52', {roughness: 0.5})}>
				<planeGeometry args={[30000, 30000]} />
			</mesh>
			<Islands />
			{CITIES.map(([lo, la, r], i) => {
				const [x, z] = P(lo, la);
				const rr = 8 + r * spread;
				return (
					<group key={i} position={[x, 2, z]}>
						<mesh rotation={[-Math.PI / 2, 0, 0]}>
							<circleGeometry args={[rr, 32]} />
							<meshBasicMaterial color="#7fd44a" transparent opacity={0.45} depthWrite={false} />
						</mesh>
						<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
							<ringGeometry args={[rr * 0.94, rr, 32]} />
							<meshBasicMaterial color="#b8ff6a" transparent opacity={0.8} depthWrite={false} />
						</mesh>
						<mesh position={[0, 6, 0]} material={mat('#e84a3a', {emissive: '#e84a3a', emissiveIntensity: 0.8})}>
							<sphereGeometry args={[9, 10, 8]} />
						</mesh>
					</group>
				);
			})}
			{REMOTE.map(([lo, la], i) => {
				const [x, z] = P(lo, la);
				return (
					<group key={i} position={[x, 6, z]}>
						<mesh material={mat('#ffd98a', {emissive: '#ffcf6a', emissiveIntensity: 1.2 * glow})}>
							<sphereGeometry args={[10, 10, 8]} />
						</mesh>
						<mesh rotation={[-Math.PI / 2, 0, 0]} scale={1 + hi * 0.6 + Math.sin(t * 5 + i) * 0.1 * hi}>
							<ringGeometry args={[24, 30, 32]} />
							<meshBasicMaterial color="#ffe08a" transparent opacity={0.85 * hi} depthWrite={false} />
						</mesh>
					</group>
				);
			})}
		</>
	);
};
export const O2: React.FC<{t: number}> = ({t}) => (
	<>
		<Tag text="Cornell, 2015" sub="pag-aaral sa zombie outbreak" size={110} o={pop(t, 2.0, 6.5)} y={300} />
		<Tag text="ligtas" sub="ang malalayong lugar" color="#ffd98a" size={130} o={pop(t, 8.4, 12.4)} y={300} />
	</>
);

// ================= S3: it's the TV news… then the town hall =================
export const S3: React.FC<{t: number}> = ({t}) => {
	if (t < 6.9) {
		const k = smooth(t, 0, 3.4);
		const flash = t > 4.8 ? 1 : 0;
		return (
			<>
				<Cam pos={[mix(0.1, 1.2, k), mix(1.2, 1.7, k), mix(-1.2, 2.8, k)]} look={[0, 1.0, -2.6]} fov={42} />
				<color attach="background" args={['#2a2420']} />
				<hemisphereLight args={['#f2e2c8', '#3a2e24', 0.7]} />
				<pointLight position={[0, 1.2, -2.0]} intensity={6} distance={5} color={flash ? '#ffffff' : '#9fe07a'} />
				<pointLight position={[1.2, 2.4, 1.0]} intensity={6} color="#ffcf8f" />
				<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#6a4a32')}>
					<planeGeometry args={[12, 12]} />
				</mesh>
				<mesh position={[0, 1.5, -3.2]} material={mat('#c9b79a')}>
					<boxGeometry args={[8, 3, 0.1]} />
				</mesh>
				<mesh position={[0, 0.3, -2.7]} material={mat('#5a3e2a')}>
					<boxGeometry args={[1.8, 0.6, 0.5]} />
				</mesh>
				<mesh position={[0, 1.05, -2.75]} material={mat('#1d1d22')}>
					<boxGeometry args={[1.5, 0.9, 0.08]} />
				</mesh>
				<mesh position={[0, 1.05, -2.705]} material={mat(flash ? '#dfe8f0' : '#3a6a3a', {emissive: flash ? '#c0d0e0' : '#5fbf3a', emissiveIntensity: 0.8})}>
					<boxGeometry args={[1.38, 0.8, 0.01]} />
				</mesh>
				{flash ? (
					<mesh position={[0, 1.0, -2.69]} material={mat(BARONG, {emissive: '#ffffff', emissiveIntensity: 0.2})}>
						<boxGeometry args={[0.5, 0.45, 0.01]} />
					</mesh>
				) : (
					<mesh position={[0.1, 1.08, -2.69]} material={mat('#7fd44a', {emissive: '#7fd44a', emissiveIntensity: 0.6})}>
						<circleGeometry args={[0.2 + 0.05 * Math.sin(t * 3), 16]} />
					</mesh>
				)}
				{/* the sofa and the family watching */}
				<mesh position={[0, 0.25, 0.9]} material={mat('#7a8a9a')}>
					<boxGeometry args={[2.2, 0.5, 0.8]} />
				</mesh>
				<mesh position={[0, 0.7, 1.25]} material={mat('#6a7a8a')}>
					<boxGeometry args={[2.2, 0.6, 0.2]} />
				</mesh>
				<Person {...NANAY} position={[-0.5, 0.05, 0.85]} rotationY={Math.PI} pose={{sit: true, armL: -0.6, armR: -0.6, elbow: -0.6}} mouth={t > 5.5} />
				<Person {...KID} position={[0.45, 0.1, 0.85]} rotationY={Math.PI} pose={{sit: true, armL: t > 5.5 ? -2.3 : -0.3, armR: t > 5.5 ? -2.3 : -0.3}} mouth={t > 5.5} />
			</>
		);
	}
	const u = t - 6.9;
	return (
		<>
			<Cam pos={[mix(-2.5, -1.2, smooth(u, 0, 2.8)), mix(1.4, 2.0, smooth(u, 0, 2.8)), mix(7.5, 6.6, smooth(u, 0, 2.8))]} look={[0, 2.0, -3]} fov={44} far={2000} />
			<Sky top="#8fc0e3" bottom="#f1eee2" />
			<fog attach="fog" args={['#eeeadc', 20, 90]} />
			<hemisphereLight args={['#f2efe6', '#5a6248', 1.25]} />
			<directionalLight position={[20, 30, 20]} intensity={2.1} color="#fff1da" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#9a9890')}>
				<planeGeometry args={[200, 200]} />
			</mesh>
			<TownHall position={[0, 0, -5]} />
			{[-6, 6].map((x) => <Tree key={x} position={[x, 0, -4]} s={1.4} />)}
			{[[-1.2, 0], [0.3, 0.6], [1.4, -0.3]].map(([x, d], i) => {
				const z = mix(2.0 + d, -1.4 + d * 0.3, smooth(u, 0, 2.8));
				const y = z < -1.0 ? Math.min(0.72, (-1.0 - z) * 0.6) : 0;
				return <Zombie key={i} t={t} seed={5001 + i} barong walking={1} position={[x, y, z]} rotationY={Math.PI} />;
			})}
		</>
	);
};

// ================= S4: zombie buffet (silent) =================
export const S4: React.FC<{t: number}> = ({t}) => {
	const road = 1 - smooth(t, 0.8, 2.8);
	const bridge = 1 - smooth(t, 3.0, 4.8);
	const folder = 1 - smooth(t, 5.0, 6.6);
	const crumble = smooth(t, 6.8, 7.8);
	const k = smooth(t, 0, 8.5);
	const chew = (a: number, b: number) => (t > a && t < b ? Math.abs(Math.sin(t * 14)) * 0.4 : 0);
	return (
		<>
			<Cam pos={[mix(-0.8, 0.8, k), 1.7, mix(4.8, 4.2, k)]} look={[0, 1.1, -0.6]} fov={44} far={2000} />
			<Sky top="#8fc0e3" bottom="#f1eee2" />
			<fog attach="fog" args={['#eeeadc', 20, 90]} />
			<hemisphereLight args={['#f2efe6', '#5a6248', 1.25]} />
			<directionalLight position={[20, 30, 20]} intensity={2.1} color="#fff1da" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#9a9890')}>
				<planeGeometry args={[200, 200]} />
			</mesh>
			<TownHall position={[1.5, 0, -7]} />
			{/* the flood wall, crumbling at the end */}
			{Array.from({length: 30}).map((_, i) => {
				const row = Math.floor(i / 5), col = i % 5;
				const fall = row >= 5 || (row === 4 && col > 1) ? crumble : 0;
				return (
					<mesh key={i} position={[-1.25 + col * 0.62 + fall * (col - 2) * 0.4, 0.2 + row * 0.38 - fall * (0.2 + row * 0.3), -3.0 + fall * 0.9]} rotation={[fall * 0.8, 0, fall * (col - 2) * 0.4]} material={mat('#a8a8a4')}>
						<boxGeometry args={[0.58, 0.34, 0.4]} />
					</mesh>
				);
			})}
			{/* the buffet table */}
			<mesh position={[0, 0.37, -0.2]} material={mat('#8a5f3e')}>
				<boxGeometry args={[2.8, 0.74, 0.9]} />
			</mesh>
			<mesh position={[0, 0.745, -0.2]} material={mat('#f2efe6')}>
				<boxGeometry args={[2.9, 0.01, 1.0]} />
			</mesh>
			{/* road slab */}
			<group position={[-0.95, 0.79, 0.0]} scale={[1, 1, Math.max(0.001, road)]}>
				<mesh position={[0, 0, -0.25]} material={mat('#55575c')}>
					<boxGeometry args={[0.35, 0.05, 0.5]} />
				</mesh>
				{[0, 1].map((i) => (
					<mesh key={i} position={[0, 0.027, -0.12 - i * 0.25]} material={mat('#f2d14a')}>
						<boxGeometry args={[0.04, 0.005, 0.12]} />
					</mesh>
				))}
			</group>
			{/* little bridge */}
			<group position={[0, 0.78, 0.0]} scale={Math.max(0.001, bridge)}>
				<mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, -0.2]} material={mat('#b0a890')}>
					<torusGeometry args={[0.2, 0.04, 6, 12, Math.PI]} />
				</mesh>
				<mesh position={[0, 0.2, -0.2]} material={mat('#9a9280')}>
					<boxGeometry args={[0.12, 0.03, 0.55]} />
				</mesh>
			</group>
			{/* the PONDO folder */}
			<mesh position={[0.95, 0.8, -0.1]} scale={[1, Math.max(0.001, folder), Math.max(0.001, folder)]} material={mat('#e8c87a')}>
				<boxGeometry args={[0.4, 0.06, 0.3]} />
			</mesh>
			{[-0.95, 0, 0.95].map((x, i) => (
				<Zombie key={i} t={t} seed={5001 + i} barong position={[x, 0, -0.95]} lean={[chew(0.8, 2.8), chew(3.0, 4.8), chew(5.0, 6.6)][i] * 0.3} belly={smooth(t, [2.8, 4.8, 6.6][i], [3.2, 5.2, 7.0][i]) * 0.6} pose={{armL: -1.2, armR: -1.2}} />
			))}
		</>
	);
};
export const O4: React.FC<{t: number}> = ({t}) => (
	<>
		<Tag text="kalsada" size={100} o={pop(t, 0.8, 2.9)} y={300} />
		<Tag text="tulay" size={100} o={pop(t, 3.0, 4.9)} y={300} />
		<Tag text="pondo" size={100} color={GOLD} o={pop(t, 5.0, 6.8)} y={300} />
	</>
);

// ================= S5: eating the future =================
export const S5: React.FC<{t: number}> = ({t}) => {
	const k = smooth(t, 0, 11.15);
	const gone = (a: number) => 1 - smooth(t, a, a + 0.5);
	const eaten = (t > 5.3 ? 1 : 0) + (t > 6.83 ? 1 : 0) + (t > 7.61 ? 1 : 0);
	return (
		<>
			<Cam pos={[mix(1.4, 0.4, k), mix(1.6, 1.4, k), mix(4.0, 2.9, k)]} look={[0, 0.95, -1.0]} fov={42} />
			<color attach="background" args={['#2a2420']} />
			<hemisphereLight args={['#f2e2c8', '#3a2e24', 0.8]} />
			<pointLight position={[0, 2.6, 0.2]} intensity={14} color="#ffcf8f" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#7a5a40')}>
				<planeGeometry args={[14, 14]} />
			</mesh>
			{/* back wall with a big window, the families looking in */}
			<mesh position={[-2.4, 1.6, -2.6]} material={mat('#c9b79a')}>
				<boxGeometry args={[3, 3.2, 0.1]} />
			</mesh>
			<mesh position={[2.4, 1.6, -2.6]} material={mat('#c9b79a')}>
				<boxGeometry args={[3, 3.2, 0.1]} />
			</mesh>
			<mesh position={[0, 2.75, -2.6]} material={mat('#c9b79a')}>
				<boxGeometry args={[1.8, 0.9, 0.1]} />
			</mesh>
			<mesh position={[0, 0.5, -2.6]} material={mat('#c9b79a')}>
				<boxGeometry args={[1.8, 1.0, 0.1]} />
			</mesh>
			<mesh position={[0, 1.65, -4.5]} material={mat('#8fc0e3', {emissive: '#8fc0e3', emissiveIntensity: 0.4})}>
				<boxGeometry args={[6, 3.5, 0.1]} />
			</mesh>
			{[[-0.5, NANAY], [0.15, KID], [0.6, LOLO]].map(([x, c], i) => (
				<Person key={i} {...(c as object)} position={[x as number, 0, -3.2]} pose={{armL: -0.3, armR: -0.3}} mouth={eaten > i} />
			))}
			{/* the long table */}
			<mesh position={[0, 0.37, -0.6]} material={mat('#6a3f2a')}>
				<boxGeometry args={[2.4, 0.74, 1.4]} />
			</mesh>
			<Zombie t={t} seed={5002} barong sit position={[0, 0.1, -1.55]} belly={eaten * 0.35} pose={{armL: -1.3, armR: -1.3}} />
			{/* the "food": a school, rice sacks, a jeepney */}
			<group position={[-0.6, 0.76, -0.4]} scale={gone(5.3)}>
				<mesh position={[0, 0.12, 0]} material={mat('#f0e2b8')}>
					<boxGeometry args={[0.45, 0.24, 0.25]} />
				</mesh>
				<mesh position={[0, 0.3, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.2, 1, 0.75]} material={mat('#a85d4a')}>
					<coneGeometry args={[0.26, 0.14, 4]} />
				</mesh>
				<mesh position={[0, 0.48, 0.1]} material={mat('#3a5fa8')}>
					<boxGeometry args={[0.08, 0.05, 0.005]} />
				</mesh>
			</group>
			<group position={[0, 0.76, -0.3]} scale={gone(6.83)}>
				{[-0.1, 0.1].map((x) => (
					<mesh key={x} position={[x, 0.12, 0]} material={mat('#e2d6b0')}>
						<cylinderGeometry args={[0.09, 0.1, 0.24, 8]} />
					</mesh>
				))}
			</group>
			<group position={[0.6, 0.76, -0.35]} scale={gone(7.61) * 0.18}>
				<Jeepney rotationY={Math.PI / 2} />
			</group>
			<Dish position={[0, 0.76, -0.85]} kind={3} s={0.8} />
		</>
	);
};
export const O5: React.FC<{t: number}> = ({t}) => (
	<>
		<Tag text="utak" color="#f2a0b8" o={pop(t, 1.1, 4.3)} y={300} />
		<Tag text="kinabukasan" color={GOLD} size={130} o={pop(t, 7.6, 10.9)} y={300} />
	</>
);

// ================= S6: rain, the half-built flood wall, they get full =================
const RAIN = Array.from({length: 140}).map((_, i) => {
	const g = rand(i + 77);
	return [(g() - 0.5) * 24, g() * 8, (g() - 0.5) * 12 - 1, 0.7 + g() * 0.6];
});
export const S6: React.FC<{t: number}> = ({t}) => {
	const water = mix(-0.05, 0.85, smooth(t, 10.4, 14.4));
	const pan = smooth(t, 15.3, 16.3);
	const coins = smooth(t, 5.9, 9.5);
	const k = smooth(t, 0, 15.3);
	return (
		<>
			<Cam pos={[mix(mix(-1.5, 0.5, k), 13.5, pan), mix(mix(4.6, 5.0, k), 5.6, pan), mix(mix(10, 9.2, k), 4.6, pan)]} look={[mix(0, 14, pan), mix(1.0, 4.6, pan), mix(-1.5, -1.5, pan)]} fov={44} far={2000} />
			<Barangay t={t} night={0.45} houses={[-10, -5, 0, 5]} />
			{/* the dry hill and hall where "they" stay full */}
			<mesh position={[14, 1.6, -2]} material={mat('#6f8a5a')}>
				<cylinderGeometry args={[3.2, 4.2, 3.2, 9]} />
			</mesh>
			<TownHall position={[14, 3.2, -3.4]} />
			<Zombie t={t} seed={5003} barong position={[14, 3.2, -0.6]} belly={1.2} pose={{armL: -0.6, armR: -0.9 - Math.abs(Math.sin(t * 5)) * 0.25 * smooth(t, 16.6, 17.0), elbow: -1.0}} />
			{/* half-built flood wall in front of the houses */}
			{Array.from({length: 10}).map((_, i) => (
				<mesh key={i} position={[-6 + i * 0.6, 0.35, 0.6]} material={mat('#a8a8a4')}>
					<boxGeometry args={[0.56, 0.7, 0.35]} />
				</mesh>
			))}
			{[0, 1, 2].map((i) => (
				<mesh key={'r' + i} position={[0.4 + i * 0.6, 0.1, 0.6]} rotation={[0, i * 0.4, 0.3]} material={mat('#8a8a86')}>
					<boxGeometry args={[0.3, 0.16, 0.3]} />
				</mesh>
			))}
			{/* the pesos floating away from the gap */}
			{coins > 0
				? Array.from({length: 9}).map((_, i) => {
						const u = Math.max(0, coins * 1.4 - i * 0.05);
						return (
							<mesh key={i} position={[1 + i * 0.3 + u * 3, 0.5 + u * (2 + (i % 3)), 0.6 - u * 2]} rotation={[Math.PI / 2, t * 2 + i, 0]} material={mat('#e8c35a', {metalness: 0.6, roughness: 0.3, emissive: '#a07820', emissiveIntensity: 0.3})}>
								<cylinderGeometry args={[0.12, 0.12, 0.03, 12]} />
							</mesh>
						);
					})
				: null}
			{/* rising water */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, water, 0]} material={mat('#6f8f9f', {transparent: true, opacity: 0.85, roughness: 0.2, metalness: 0.1})}>
				<planeGeometry args={[24, 30]} />
			</mesh>
			{/* kid on the roof with an umbrella */}
			<group position={[0, 3.0, -3.3]}>
				<Person {...KID} pose={{armR: -2.6, elbow: 0, armL: 0.1}} mouth={t > 14} />
				<mesh position={[0.2, 1.9, 0]} material={mat('#d33a2c')}>
					<coneGeometry args={[0.55, 0.3, 10]} />
				</mesh>
				<mesh position={[0.2, 1.5, 0]} material={mat('#3a3a3a')}>
					<cylinderGeometry args={[0.012, 0.012, 0.8, 4]} />
				</mesh>
			</group>
			{/* rain */}
			{RAIN.map(([x, y0, z, sp], i) => (
				<mesh key={i} position={[x + pan * 13, ((y0 - t * 9 * sp) % 8 + 8) % 8, z]} material={mat('#c8d8e8', {transparent: true, opacity: 0.5})}>
					<boxGeometry args={[0.012, 0.35, 0.012]} />
				</mesh>
			))}
		</>
	);
};
export const O6: React.FC<{t: number}> = ({t}) => <Tag text="₱ bilyon-bilyon" sub="kada taon, nawala" color={GOLD} size={120} o={pop(t, 5.9, 9.8)} y={300} />;

// ================= S7: the cure is people coming together =================
const NEIGHBORS = [3011, 3012, 3013, 3014, 3015];
export const S7: React.FC<{t: number}> = ({t}) => {
	const out = smooth(t, 5.0, 6.8);
	const march = smooth(t, 10.5, 12.3);
	const back = smooth(t, 10.8, 12.3);
	const k = smooth(t, 0, 12.35);
	const lift = (a: number) => smooth(t, a, a + 0.35);
	return (
		<>
			<Cam pos={[mix(-0.6, 0.4, k), mix(3.0, 2.6, k), mix(13.5, 12, k)]} look={[mix(-0.3, 0.4, k), 1.0, -0.6]} fov={44} far={2000} />
			<Barangay t={t} houses={[-10, -5, 0, 5, 10]} />
			{/* zombies at the right end of the street, backing off */}
			{[0, 1].map((i) => (
				<Zombie key={i} t={t} seed={5001 + i} barong walking={back} position={[2.2 + i * 0.8 + back * 2.5, 0, -0.4 + i * 0.7]} rotationY={-Math.PI / 2 + back * 0.6} />
			))}
			{/* the crowd */}
			<Person {...NANAY} position={[mix(-4.5, -1.0, out) + march * 1.2, 0, mix(-3.0, -0.2, out)]} rotationY={Math.PI / 2 - 0.5} pose={{...(out > 0 && out < 1 ? walk(t, 1.2) : march > 0 && march < 1 ? walk(t, 1.2) : {}), armR: -2.2 * lift(7.0), armL: -1.15 * lift(7.0), elbow: -0.35}} mouth={t > 7}>
				<mesh position={[0, -0.03, 0.08]} material={mat('#f2f0ea')}>
					<boxGeometry args={[0.18, 0.24, 0.03]} />
				</mesh>
			</Person>
			<Person {...TEEN} position={[mix(-5.5, -0.2, out) + march * 1.2, 0, mix(-3.0, 0.5, out)]} rotationY={Math.PI / 2 - 0.3} pose={{armR: -1.7 * lift(8.5), armL: 0.1, elbow: -0.3}} mouth={t > 8.5}>
				<Phone position={[0, 0, 0.06]} rotation={[-0.2, 0, 0]} glow={1.5} />
			</Person>
			<Person {...LOLO} position={[mix(-6.5, -1.8, out) + march * 1.2, 0, mix(-3.0, 0.7, out)]} rotationY={Math.PI / 2 - 0.4} pose={{armR: -2.5 * lift(10.1), armL: 0.1}} mouth={t > 10.1}>
				<mesh position={[0, 0, 0.06]} material={mat('#e8eef8')}>
					<boxGeometry args={[0.2, 0.13, 0.01]} />
				</mesh>
				<mesh position={[0.05, 0, 0.066]} material={mat('#3a5fa8')}>
					<boxGeometry args={[0.07, 0.08, 0.003]} />
				</mesh>
			</Person>
			{NEIGHBORS.map((sd, i) => (
				<Person key={sd} seed={sd} position={[mix(-8 - i, -2.6 - (i % 3) * 0.6, out) + march * 1.2, 0, mix(-3.0, -0.6 + (i % 2) * 1.4, out)]} rotationY={Math.PI / 2 - 0.3} pose={out > 0 && out < 1 ? walk(t + i * 0.2, 1.2) : {armL: 0.1, armR: march > 0 ? -1.0 : 0.1}} scale={i === 4 ? 0.72 : 1} />
			))}
		</>
	);
};

// ================= S8: fire, the awake public, and the receipt =================
export const S8: React.FC<{t: number}> = ({t}) => {
	const pan = smooth(t, 3.5, 4.3);
	const lunge = smooth(t, 4.3, 4.9) * (1 - smooth(t, 9.4, 9.7));
	const stand = smooth(t, 6.9, 7.5);
	const strip = smooth(t, 8.5, 9.3);
	const run = smooth(t, 9.6, 11.2);
	const rise = smooth(t, 9.4, 12.9);
	const recoil = smooth(t, 2.4, 2.9);
	const zx = mix(1.6, 0.9, lunge) + run * 6;
	return (
		<>
			<Cam pos={[mix(-5.6, 0.4, pan), mix(mix(1.5, 1.8, pan), 9, rise), mix(mix(3.4, 5.4, pan), 12, rise)]} look={[mix(-6, 0.2, pan), mix(1.0, 0.6, rise), mix(0, -1, rise)]} fov={44} far={2000} />
			<Barangay t={t} dusk={0.35} houses={[-10, -5, 0, 5, 10]} />
			{/* the classic zombie and the fire */}
			<Zombie t={t} seed={4002} position={[-6, 0, -0.8 - recoil * 0.4]} lean={-0.35 * recoil} />
			<group position={[-6, 0, 0.4]}>
				{[0, 1, 2].map((i) => (
					<mesh key={i} position={[0, 0.06, 0]} rotation={[0, i * 1.05, Math.PI / 2]} material={mat('#6b5040')}>
						<cylinderGeometry args={[0.04, 0.04, 0.5, 5]} />
					</mesh>
				))}
				{[0, 1, 2].map((i) => (
					<mesh key={'f' + i} position={[Math.sin(i * 2) * 0.06, 0.2 + i * 0.1 + Math.sin(t * 12 + i) * 0.03, Math.cos(i * 2) * 0.06]} scale={[1, 1.6 - i * 0.3, 1]} material={mat(['#f2742a', '#f5a03a', '#ffd86a'][i], {emissive: ['#f2742a', '#f5a03a', '#ffd86a'][i], emissiveIntensity: 1.2})}>
						<coneGeometry args={[0.16 - i * 0.04, 0.3, 6]} />
					</mesh>
				))}
				<pointLight position={[0, 0.5, 0.2]} intensity={3} distance={4} color="#ffa040" />
			</group>
			{/* the corrupt zombie lunges at the crowd, gets the receipt, runs */}
			<Zombie t={t} seed={5002} barong walking={run} position={[zx, 0, -0.2]} rotationY={run > 0.05 ? Math.PI / 2 : -Math.PI / 2} lean={0.25 * lunge} mouth />
			{strip > 0 ? (
				<mesh position={[mix(-0.9, (zx - 0.9) / 2 - 0.2, 1) + (run > 0 ? run * 3 : 0), mix(1.15, 1.45, strip), -0.2]} rotation={[0, 0, 0.15]} material={mat('#fbfaf5')}>
					<boxGeometry args={[Math.max(0.05, strip * Math.max(0.2, zx - 0.9 + 0.7) - run * 1.2), 0.16, 0.01]} />
				</mesh>
			) : null}
			<Person {...NANAY} position={[-1.1, 0, -0.2]} rotationY={Math.PI / 2} pose={{armR: -1.5 * Math.max(stand, strip), armL: -1.0 * stand}} mouth />
			<Person {...LOLO} position={[-1.7, 0, 0.6]} rotationY={Math.PI / 2 - 0.2} pose={{armR: -2.5 * stand, armL: 0.1}} mouth={stand > 0.5} />
			<Person {...TEEN} position={[-1.6, 0, -0.9]} rotationY={Math.PI / 2 + 0.2} pose={{armR: -1.7 * stand, elbow: -0.3}} mouth={stand > 0.5} />
			<Person {...KID} position={[-0.9, 0, 0.7]} rotationY={Math.PI / 2 - 0.4} pose={{armL: -2.4 * stand, armR: -2.4 * stand}} mouth />
			{NEIGHBORS.slice(0, 4).map((sd, i) => (
				<Person key={sd} seed={sd} position={[-2.4 - (i % 2) * 0.7, 0, -0.9 + i * 0.6]} rotationY={Math.PI / 2} pose={{armL: 0.1, armR: -2.3 * stand}} mouth={stand > 0.5} />
			))}
		</>
	);
};
