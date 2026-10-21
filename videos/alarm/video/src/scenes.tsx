import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Cam, Person, Pose, mat, mix, mixV, ramp, smooth, walk} from './kit';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const RED = '#d33a2c';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const TAU = Math.PI * 2;

// ---------- props ----------
// the alarm clock character: red round body, white face with hands, two bells, tiny arms and legs
export const AlarmClock: React.FC<{
	position: number[];
	rotationY?: number;
	s?: number;
	t: number;
	ring?: number; // 0..1 shaking
	hour?: number; // e.g. 6.0 = 6:00
	sleepy?: number; // 0 open eyes .. 1 closed
	shades?: boolean;
	pack?: boolean;
	armL?: number;
	armR?: number;
	step?: number; // walking phase speed (0 = standing)
	mouth?: boolean;
	towel?: boolean;
}> = ({position, rotationY = 0, s = 1, t, ring = 0, hour = 6, sleepy = 0, shades, pack, armL = 0.4, armR = -0.4, step = 0, mouth, towel}) => {
	const sh = Math.sin(t * 55) * 0.14 * ring;
	const hop = Math.abs(Math.sin(t * 55)) * 0.02 * ring + (step ? Math.abs(Math.sin(t * step * Math.PI)) * 0.04 : 0);
	const hA = -((hour % 12) / 12) * TAU;
	const mA = -((hour % 1) * TAU);
	const legSw = step ? Math.sin(t * step * Math.PI) * 0.6 : 0;
	return (
		<group position={[position[0], position[1] + hop, position[2]]} rotation={[0, rotationY, 0]} scale={s}>
			{towel ? (
				<mesh position={[0, 0.005, 0]} material={mat('#5fb3c9')}>
					<boxGeometry args={[0.5, 0.01, 0.3]} />
				</mesh>
			) : null}
			{[-1, 1].map((k) => (
				<mesh key={'leg' + k} position={[k * 0.08, 0.05, 0]} rotation={[k * legSw, 0, 0]} material={mat('#2f2a28')}>
					<cylinderGeometry args={[0.018, 0.018, 0.1, 5]} />
				</mesh>
			))}
			<group position={[0, 0.26, 0]} rotation={[0, 0, sh]}>
				<mesh rotation={[Math.PI / 2, 0, 0]} material={mat(RED)}>
					<cylinderGeometry args={[0.17, 0.17, 0.11, 18]} />
				</mesh>
				<mesh position={[0, 0, 0.056]} material={mat('#f6f1e4')}>
					<circleGeometry args={[0.14, 18]} />
				</mesh>
				{/* hands */}
				<group position={[0, 0, 0.06]} rotation={[0, 0, hA]}>
					<mesh position={[0, 0.04, 0]} material={mat('#2a2522')}>
						<boxGeometry args={[0.014, 0.08, 0.006]} />
					</mesh>
				</group>
				<group position={[0, 0, 0.062]} rotation={[0, 0, mA]}>
					<mesh position={[0, 0.055, 0]} material={mat('#2a2522')}>
						<boxGeometry args={[0.01, 0.11, 0.006]} />
					</mesh>
				</group>
				{/* face */}
				{[-1, 1].map((k) => (
					<React.Fragment key={'e' + k}>
						<mesh position={[k * 0.06, 0.035, 0.065]} scale={[1, 1 - 0.8 * sleepy, 1]} material={mat('#1d1a18')}>
							<sphereGeometry args={[0.018, 6, 5]} />
						</mesh>
						<mesh position={[k * 0.095, -0.025, 0.06]} material={mat('#e08a7a', {transparent: true, opacity: 0.6})}>
							<sphereGeometry args={[0.02, 6, 5]} />
						</mesh>
					</React.Fragment>
				))}
				{mouth ? (
					<mesh position={[0, -0.06, 0.064]} material={mat('#4a2a26')}>
						<sphereGeometry args={[0.02, 6, 5]} />
					</mesh>
				) : null}
				{shades ? (
					<mesh position={[0, 0.04, 0.08]} material={mat('#101014', {roughness: 0.2})}>
						<boxGeometry args={[0.2, 0.05, 0.02]} />
					</mesh>
				) : null}
				{/* bells + hammer */}
				{[-1, 1].map((k) => (
					<mesh key={'b' + k} position={[k * 0.1, 0.16, 0]} rotation={[0, 0, -k * 0.5]} material={mat('#d8a93f', {metalness: 0.3, roughness: 0.4})}>
						<sphereGeometry args={[0.065, 10, 6, 0, TAU, 0, Math.PI / 2]} />
					</mesh>
				))}
				<mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.sin(t * 70) * 0.6 * ring]} material={mat('#8a8580')}>
					<boxGeometry args={[0.02, 0.07, 0.02]} />
				</mesh>
				{/* arms */}
				{[
					[-1, armL],
					[1, armR],
				].map(([k, a]) => (
					<group key={'a' + k} position={[k * 0.17, -0.02, 0]} rotation={[0, 0, a]}>
						<mesh position={[k * 0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('#2f2a28')}>
							<cylinderGeometry args={[0.014, 0.014, 0.12, 5]} />
						</mesh>
						<mesh position={[k * 0.125, 0, 0]} material={mat('#f2f0ea')}>
							<sphereGeometry args={[0.025, 6, 5]} />
						</mesh>
					</group>
				))}
				{pack ? (
					<mesh position={[0, -0.02, -0.11]} material={mat('#6f8f5a')}>
						<boxGeometry args={[0.2, 0.2, 0.1]} />
					</mesh>
				) : null}
			</group>
		</group>
	);
};

// the phone: a little dark slab with a glowing screen and dot eyes; can hold a letter
export const Phone: React.FC<{position: number[]; rotationY?: number; t: number; letter?: number; nervous?: number}> = ({position, rotationY = 0, t, letter = 0, nervous = 0}) => (
	<group position={[position[0], position[1] + Math.abs(Math.sin(t * 9)) * 0.01 * nervous, position[2]]} rotation={[0, rotationY, Math.sin(t * 30) * 0.04 * nervous]}>
		<mesh position={[0, 0.13, 0]} material={mat('#25262c')}>
			<boxGeometry args={[0.14, 0.26, 0.03]} />
		</mesh>
		<mesh position={[0, 0.13, 0.016]} material={mat('#8fd0ff', {emissive: '#5aa8e0', emissiveIntensity: 0.6})}>
			<planeGeometry args={[0.12, 0.23]} />
		</mesh>
		{[-1, 1].map((k) => (
			<mesh key={k} position={[k * 0.03, 0.17, 0.02]} material={mat('#1d1a18')}>
				<sphereGeometry args={[0.012, 6, 5]} />
			</mesh>
		))}
		{letter > 0 ? (
			<mesh position={[0.12, 0.1 + 0.12 * letter, 0.03]} rotation={[0, 0, -0.15]} scale={letter} material={mat('#fbf8f0')}>
				<boxGeometry args={[0.14, 0.18, 0.005]} />
			</mesh>
		) : null}
	</group>
);

const Bed: React.FC<{blanket?: number}> = ({blanket = 1}) => (
	<group position={[-1.5, 0, -1.9]}>
		<mesh position={[0, 0.25, 0]} material={mat('#8a6448')}>
			<boxGeometry args={[2.4, 0.5, 1.5]} />
		</mesh>
		<mesh position={[0, 0.55, 0]} material={mat('#f1ece2')}>
			<boxGeometry args={[2.3, 0.1, 1.4]} />
		</mesh>
		<mesh position={[-1.18, 0.7, 0]} material={mat('#8a6448')}>
			<boxGeometry args={[0.1, 1.0, 1.5]} />
		</mesh>
		<mesh position={[-0.85, 0.68, 0]} material={mat('#ffffff')}>
			<boxGeometry args={[0.45, 0.16, 0.9]} />
		</mesh>
		<mesh position={[0.45 + (1 - blanket) * 0.5, 0.78, 0.02]} scale={[1, blanket * 0.8 + 0.2, 1]} material={mat('#5f7fa3')}>
			<boxGeometry args={[1.4, 0.45, 1.42]} />
		</mesh>
	</group>
);

// the bedroom set. light: 0 dawn .. 1 late morning
const Bedroom: React.FC<{light?: number; door?: number}> = ({light = 0, door = 0}) => {
	const sky = light > 0.5 ? '#bfe0f5' : '#f2b27a';
	return (
		<>
			<color attach="background" args={['#2a2420']} />
			<hemisphereLight args={['#fff4e6', '#6a5040', 0.9 + 0.5 * light]} />
			<directionalLight position={[3, 5, 4]} intensity={1.2 + 0.9 * light} color={light > 0.5 ? '#fff6e8' : '#ffd2a0'} />
			<pointLight position={[1.4, 1.8, -2.4]} intensity={6 + 6 * light} distance={6} color="#ffcf8f" />
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#b98a5e')}>
				<planeGeometry args={[12, 12]} />
			</mesh>
			<mesh position={[0, 2, -3]} material={mat('#e9dcc6')}>
				<boxGeometry args={[12, 4, 0.1]} />
			</mesh>
			<mesh position={[-3, 2, 0]} material={mat('#e2d2b8')}>
				<boxGeometry args={[0.1, 4, 12]} />
			</mesh>
			{/* window */}
			<mesh position={[1.2, 1.9, -2.94]}>
				<planeGeometry args={[1.1, 1.0]} />
				<meshBasicMaterial color={sky} />
			</mesh>
			{[
				[1.2, 2.42, 1.2, 0.06],
				[1.2, 1.38, 1.2, 0.06],
				[1.2, 1.9, 0.05, 1.04],
				[0.62, 1.9, 0.06, 1.1],
				[1.78, 1.9, 0.06, 1.1],
			].map(([x, y, w, h], i) => (
				<mesh key={i} position={[x, y, -2.92]} material={mat('#f5efe4')}>
					<boxGeometry args={[w, h, 0.04]} />
				</mesh>
			))}
			{/* door */}
			<group position={[2.9, 0, -2.93]}>
				<mesh position={[0, 1.05, 0]} material={mat('#3a2a20')}>
					<boxGeometry args={[0.9, 2.1, 0.02]} />
				</mesh>
				<group position={[-0.45, 0, 0.02]} rotation={[0, door * 1.3, 0]}>
					<mesh position={[0.45, 1.05, 0]} material={mat('#9a6f4e')}>
						<boxGeometry args={[0.9, 2.1, 0.05]} />
					</mesh>
				</group>
			</group>
			<Bed />
			{/* nightstand */}
			<mesh position={[0.2, 0.3, -2.5]} material={mat('#a67c58')}>
				<boxGeometry args={[0.65, 0.6, 0.6]} />
			</mesh>
			{/* rug + poster */}
			<mesh position={[0.6, 0.01, -0.6]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#c9784a')}>
				<circleGeometry args={[0.9, 16]} />
			</mesh>
			<mesh position={[-1.5, 2.1, -2.94]} material={mat('#7d9a6b')}>
				<planeGeometry args={[0.8, 0.6]} />
			</mesh>
		</>
	);
};

const STAND: V = [0.12, 0.6, -2.45];

// the sleeper lying in bed (head on the pillow), or sitting up (up = 0..1)
const Sleeper: React.FC<{t: number; up?: number; mouth?: boolean; pose?: Pose}> = ({t, up = 0, mouth, pose}) => {
	if (up < 0.5)
		return (
			<group position={[-1.35, 0.75, -1.9]} rotation={[0, 0, Math.PI / 2 - up * 0.6]}>
				<Person seed={2001} shirt="#4f6a8f" position={[0, -0.86, 0]} pose={{bob: Math.sin(t * 1.6) * 0.01, armL: 0, armR: 0, spreadL: 0, spreadR: 0}} mouth={mouth} />
			</group>
		);
	return <Person seed={2001} shirt="#4f6a8f" position={[-0.75, 0.12, -1.6]} rotationY={0.7} pose={{sit: true, ...pose}} mouth={mouth} />;
};

// ---------- overlays ----------
const Pop: React.FC<{t: number; at: number; until?: number; text: string; color?: string; size?: number; sub?: string; top?: number; rot?: number}> = ({t, at, until = 999, text, color = '#fff', size = 150, sub, top = 320, rot = 0}) => {
	if (t < at - 0.05 || t > until + 0.3) return null;
	const k = interpolate(t, [at, at + 0.2, at + 0.4], [0.3, 1.15, 1], clampI);
	const op = interpolate(t, [at - 0.05, at + 0.1, until, until + 0.3], [0, 1, 1, 0], clampI);
	return (
		<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: top}}>
			<div style={{opacity: op, transform: `scale(${k}) rotate(${rot}deg)`, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, color, fontSize: size, lineHeight: 1, textShadow: '0 4px 20px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.7)'}}>
				{text}
				{sub ? <div style={{fontSize: 60, fontWeight: 500, marginTop: 14, color: '#fff'}}>{sub}</div> : null}
			</div>
		</AbsoluteFill>
	);
};

const Zzz: React.FC<{t: number; until?: number; x?: number; y?: number}> = ({t, until = 999, x = 300, y = 620}) => (
	<AbsoluteFill>
		{[0, 1, 2].map((i) => {
			const p = ((t * 0.5 + i / 3) % 1);
			const op = Math.sin(p * Math.PI) * interpolate(t, [until - 0.3, until], [1, 0], clampI);
			return (
				<div key={i} style={{position: 'absolute', left: x + p * 120, top: y - p * 220, opacity: op, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 60 + i * 18, color: '#fff', textShadow: '0 3px 12px rgba(0,0,0,0.5)'}}>
					z
				</div>
			);
		})}
	</AbsoluteFill>
);

const Card: React.FC<{t: number; at: number; until?: number; title: string; stamp?: string}> = ({t, at, until = 999, title, stamp}) => {
	if (t < at - 0.05 || t > until + 0.3) return null;
	const k = interpolate(t, [at, at + 0.25, at + 0.45], [0.4, 1.08, 1], clampI);
	const op = interpolate(t, [at - 0.05, at + 0.1, until, until + 0.3], [0, 1, 1, 0], clampI);
	const sk = interpolate(t, [at + 0.5, at + 0.7], [2.2, 1], clampI);
	return (
		<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 300}}>
			<div style={{opacity: op, transform: `scale(${k}) rotate(-3deg)`, background: '#f7f2e6', borderRadius: 28, padding: '40px 70px', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', position: 'relative', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 96, color: '#3a2a20'}}>
				{title}
				{stamp && t > at + 0.5 ? (
					<div style={{position: 'absolute', right: -40, top: -50, transform: `scale(${sk}) rotate(12deg)`, border: `8px solid ${RED}`, color: RED, borderRadius: 18, padding: '4px 22px', fontSize: 64, background: 'rgba(247,242,230,0.9)'}}>{stamp}</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

// ================= S1: the tired clock and the happy sleeper =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const yawn = smooth(t, 3, 4) * (1 - smooth(t, 5.5, 6.5));
	return (
		<>
			<Cam pos={mixV([1.6, 1.9, 2.4], [0.7, 0.95, -1.2], smooth(t, 0, 12.5))} look={mixV([-1.3, 0.6, -2.0], [STAND[0], 0.8, STAND[2]], smooth(t, 0, 12.5))} fov={44} />
			<Bedroom light={0} />
			<Sleeper t={t} />
			<AlarmClock position={STAND} t={t} hour={5.95} sleepy={0.7 - yawn * 0.7} mouth={yawn > 0.3} armL={0.4 + 1.6 * yawn} armR={-0.4 - 1.6 * yawn} rotationY={0.3} />
		</>
	);
};
export const O1: React.FC<{t: number}> = ({t}) => <Zzz t={t} x={260} y={700} until={6} />;

// ================= S2: snooze, snooze, snooze =================
const SLAP = 7.6;
export const S2: React.FC<{t: number}> = ({t}) => {
	const ring = (t > 1.0 && t < SLAP ? 1 : 0) + (t > 10.3 && t < 11.0 ? 1 : 0);
	const slap = (t2: number) => smooth(t, t2 - 0.3, t2) * (1 - smooth(t, t2 + 0.3, t2 + 0.7));
	const hand = Math.max(slap(SLAP), slap(11.0));
	return (
		<>
			<Cam pos={mixV([1.4, 1.3, 0.2], [1.0, 1.15, -0.5], smooth(t, 0, 14))} look={[-0.4, 0.75, -2.3]} fov={44} />
			<Bedroom light={0.2} />
			<Sleeper t={t} />
			{/* the sleeper's arm reaching out to snooze */}
			<mesh position={[mix(-0.6, -0.05, hand), 0.88 - 0.1 * hand, -2.4]} rotation={[0, 0, Math.PI / 2]} material={mat('#c8946a')}>
				<capsuleGeometry args={[0.06, 0.6 * hand + 0.01, 3, 7]} />
			</mesh>
			<AlarmClock position={STAND} t={t} ring={ring} hour={6 + Math.max(0, t - SLAP) / 60 * 8} mouth={ring > 0} rotationY={0.3} sleepy={hand > 0.5 ? 0.6 : 0} armL={ring ? 1.8 : 0.4} armR={ring ? -1.8 : -0.4} />
		</>
	);
};
export const O2: React.FC<{t: number}> = ({t}) => (
	<>
		<Pop t={t} at={SLAP} until={8.6} text="SNOOZE!" color={GOLD} size={150} />
		<Pop t={t} at={8.7} until={10.0} text="+5" size={190} sub="minuto pa…" />
		<Pop t={t} at={11.2} until={12.3} text="+5" size={190} sub="ulit…" />
		<Pop t={t} at={12.5} text="×12 = 1 oras!" color={GOLD} size={140} />
	</>
);

// ================= S3: the clock at work, unpaid =================
export const S3: React.FC<{t: number}> = ({t}) => {
	const sweat = (t * 0.8) % 1;
	return (
		<>
			<Cam pos={mixV([0.75, 1.05, -0.6], [0.5, 0.95, -1.0], smooth(t, 0, 15))} look={[STAND[0] - 0.05, 0.85, STAND[2]]} fov={36} />
			<Bedroom light={0.4} />
			<Sleeper t={t} />
			{/* paperwork pile */}
			{[0, 1, 2, 3, 4].map((i) => (
				<mesh key={i} position={[0.36, 0.62 + i * 0.025, -2.45 + (i % 2) * 0.01]} rotation={[0, i * 0.15, 0]} material={mat('#fbf8f0')}>
					<boxGeometry args={[0.18, 0.02, 0.24]} />
				</mesh>
			))}
			<AlarmClock position={STAND} t={t} hour={6.4} rotationY={0.25} mouth={t > 2 && t < 9} armL={0.4 + Math.sin(t * 4) * 0.5} armR={-1.0} sleepy={0.3} />
			{/* ID badge */}
			<mesh position={[STAND[0] + 0.03, 0.73, STAND[2] + 0.1]} rotation={[0, 0.25, 0]} material={mat('#8fd0ff')}>
				<boxGeometry args={[0.06, 0.08, 0.005]} />
			</mesh>
			{/* sweat drop */}
			<mesh position={[STAND[0] + 0.2, 0.98 - sweat * 0.25, STAND[2] + 0.1]} scale={1 - sweat * 0.5} material={mat('#8fd0ff', {transparent: true, opacity: 0.9})}>
				<sphereGeometry args={[0.025, 6, 5]} />
			</mesh>
		</>
	);
};
export const O3: React.FC<{t: number}> = ({t}) => (
	<>
		<Pop t={t} at={6.8} until={9.0} text="ini-ignore…" size={120} color="#fff" />
		<Pop t={t} at={9.4} until={12.6} text="may pangarap!" size={110} color={GOLD} />
		<Pop t={t} at={13.2} text="₱0 sweldo" color={GOLD} size={150} sub="walang day off" />
	</>
);

// ================= S4: Monday, total silence =================
const H6 = 4.8, H7 = 6.2, H8 = 7.3, AWOL = 13.66;
export const S4: React.FC<{t: number}> = ({t}) => {
	const hour = interpolate(t, [0, H6, H7, H8, 15.6], [5.9, 6, 7, 8, 8.4], clampI);
	return (
		<>
			<Cam pos={mixV([1.8, 1.6, 1.6], [1.0, 1.1, -0.9], smooth(t, 0, 15.6))} look={mixV([-0.8, 0.6, -2.0], [STAND[0], 0.8, STAND[2]], smooth(t, 0, 15.6))} fov={42} />
			<Bedroom light={smooth(t, 0, 10)} />
			<Sleeper t={t} />
			<AlarmClock position={STAND} t={t} hour={hour} rotationY={0.3} armL={-1.2} armR={1.2} sleepy={0.2} />
		</>
	);
};
export const O4: React.FC<{t: number}> = ({t}) => (
	<>
		<Pop t={t} at={1.0} until={4.4} text="LUNES" size={150} color="#fff" />
		<Pop t={t} at={H6} until={H7 - 0.15} text="6:00" size={190} sub="…tahimik" />
		<Pop t={t} at={H7} until={H8 - 0.15} text="7:00" size={190} sub="…tahimik" />
		<Pop t={t} at={H8} until={12.8} text="8:00" size={190} sub="…tahimik pa rin" />
		<Card t={t} at={AWOL - 0.4} title="Alarm Clock" stamp="AWOL" />
		<Zzz t={t} x={240} y={760} until={12.5} />
	</>
);

// ================= S5 (silent): the great escape =================
export const S5: React.FC<{t: number}> = ({t}) => {
	const hopK = smooth(t, 1.3, 2.1);
	const walkK = smooth(t, 2.2, 6.0);
	const out = smooth(t, 7.0, 8.0);
	const x = t < 2.2 ? mix(STAND[0], 0.65, hopK) : mix(0.65, 2.75, walkK);
	const y = t < 2.2 ? (1 - hopK) * 0.6 + Math.sin(hopK * Math.PI) * 0.35 : 0;
	const z = t < 2.2 ? mix(STAND[2], -2.0, hopK) : mix(-2.0, -2.75 - out * 0.4, walkK);
	const waving = t > 6.0 && t < 7.0;
	return (
		<>
			<Cam pos={mixV([1.6, 0.8, 0.6], [2.4, 0.6, 0.2], smooth(t, 0, 8.5))} look={[x * 0.6 + 0.6, 0.4, -2.4]} fov={44} />
			<Bedroom light={0.5} door={smooth(t, 3.0, 4.0)} />
			<Sleeper t={t} />
			<AlarmClock position={[x, y, z]} t={t} rotationY={waving ? 0.3 : t < 1.3 ? 0.3 : -1.3 + 1.0 * out} pack step={walkK > 0 && walkK < 1 ? 3 : 0} armR={waving ? -2.2 + Math.sin(t * 14) * 0.4 : -0.4} s={1 - out * 0.3} />
		</>
	);
};

// ================= S6: eleven o'clock! =================
const UP = 6.44, LATE = 9.58, SOCKS = 13.6, TOAST = 16.6;
export const S6: React.FC<{t: number}> = ({t}) => {
	const up = smooth(t, UP - 0.2, UP + 0.3);
	const running = t > 11;
	const rx = 0.6 + 1.3 * Math.sin((t - 11) * 0.9);
	return (
		<>
			<Cam pos={mixV([1.4, 1.5, 2.6], [1.1, 1.35, 3.2], smooth(t, 0, 19))} look={[-0.3, 0.8, -1.8]} fov={44} />
			<Bedroom light={1} door={1} />
			{running ? (
				<Person seed={2001} shirt="#4f6a8f" position={[rx, 0, -0.5]} rotationY={Math.cos((t - 11) * 0.9) > 0 ? 1.5 : -1.5} pose={{...walk(t, 2.6), armR: t > TOAST ? -2.0 : walk(t, 2.6).armR}} mouth />
			) : (
				<Sleeper t={t} up={up} mouth={t > LATE - 0.2} pose={{armL: -2.2 * smooth(t, LATE - 0.3, LATE), armR: -2.2 * smooth(t, LATE - 0.3, LATE), headTurn: up > 0.5 && t < LATE ? 0.9 : 0}} />
			)}
			{/* the empty nightstand: the clock is gone, a lonely toast waits */}
			<mesh position={[0.25, 0.62, -2.4]} material={mat('#f2f0ea')}>
				<cylinderGeometry args={[0.16, 0.14, 0.03, 12]} />
			</mesh>
			<mesh position={[0.25, 0.66 + (t > TOAST ? -smooth(t, TOAST, TOAST + 0.5) * 0.02 : 0), -2.4]} rotation={[0, 0.4, 0]} material={mat('#d9a35a')}>
				<boxGeometry args={[0.16, 0.04, 0.16]} />
			</mesh>
		</>
	);
};
const Sock: React.FC<{color: string; flip?: boolean}> = ({color, flip}) => (
	<div style={{position: 'relative', width: 120, height: 200, transform: flip ? 'scaleX(-1)' : undefined}}>
		<div style={{position: 'absolute', left: 20, top: 0, width: 70, height: 150, background: color, borderRadius: '14px 14px 0 0'}} />
		<div style={{position: 'absolute', left: 20, top: 120, width: 110, height: 70, background: color, borderRadius: '0 40px 40px 30px'}} />
		<div style={{position: 'absolute', left: 20, top: 0, width: 70, height: 22, background: 'rgba(255,255,255,0.6)'}} />
	</div>
);
export const O6: React.FC<{t: number}> = ({t}) => {
	const sk = interpolate(t, [SOCKS, SOCKS + 0.3], [0, 1], clampI) * interpolate(t, [TOAST - 0.6, TOAST - 0.3], [1, 0], clampI);
	return (
		<>
			<Pop t={t} at={1.5} until={6.0} text="11:00" color={GOLD} size={200} sub="ng umaga!" />
			<Pop t={t} at={LATE} until={12.8} text="LATE NA AKO!" color="#ff6b5a" size={130} rot={-4} />
			{sk > 0 ? (
				<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 330}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 40, opacity: sk, transform: `scale(${0.5 + 0.5 * sk})`}}>
						<Sock color="#4f7aa3" />
						<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,0.6)'}}>≠</div>
						<Sock color="#e07a9a" flip />
					</div>
				</AbsoluteFill>
			) : null}
			<Pop t={t} at={TOAST} until={19.0} text="walang almusal" color="#ff6b5a" size={130} />
		</>
	);
};

// ================= S7: "Sorry, boss. Nag-leave ako." =================
const ANSWER = 7.6, LEAVE = 9.52, FEEL = 15.56;
export const S7: React.FC<{t: number}> = ({t}) => {
	const angry = t < ANSWER;
	return (
		<>
			<Cam pos={mixV([1.8, 1.4, 0.4], [1.0, 1.0, -1.2], smooth(t, 0, 16))} look={[0.2, 0.8, -2.3]} fov={42} />
			<Bedroom light={1} />
			<Person seed={2001} shirt="#4f6a8f" position={[1.0, 0, -1.9]} rotationY={-1.9} pose={angry ? {armL: -1.8 + Math.sin(t * 6) * 0.3, armR: -0.5, elbow: -0.4} : {armL: 0.1, armR: 0.1, headTurn: Math.sin(t * 1.2) * 0.15}} mouth={angry} />
			<AlarmClock position={STAND} t={t} hour={11.2} rotationY={0.6} shades={t > 3} towel mouth={!angry && Math.sin(t * 12) > 0} armL={angry ? -1.2 : 0.8} armR={angry ? 1.2 : -0.6 - (t > FEEL ? 1.2 : 0)} />
		</>
	);
};
export const O7: React.FC<{t: number}> = ({t}) => (
	<>
		<Pop t={t} at={3.2} until={7.2} text="Bakit?!" color="#ff6b5a" size={150} />
		<Card t={t} at={LEAVE - 0.3} until={14.8} title="Out of Office" stamp="ON LEAVE" />
		<Pop t={t} at={FEEL} text="may feelings!" color={GOLD} size={110} />
	</>
);

// ================= S8: up on the first ring; the phone is nervous =================
const RESIGN = 14.0;
export const S8: React.FC<{t: number}> = ({t}) => {
	const ring = t > 1.0 && t < 1.8 ? 1 : 0;
	const up = smooth(t, 1.5, 1.9);
	return (
		<>
			<Cam pos={mixV([1.6, 1.4, 1.4], [1.0, 1.15, -0.3], smooth(t, 0, 17.8))} look={mixV([-0.6, 0.8, -2.1], [-0.1, 0.8, -2.3], smooth(t, 0, 17.8))} fov={44} />
			<Bedroom light={0.3} />
			<Sleeper t={t} up={up} mouth={t > 2 && t < 4} pose={{armR: t > 2.8 ? -2.3 : -0.2, armL: 0.1, headTurn: 0.6}} />
			<AlarmClock position={STAND} t={t} ring={ring} hour={6} rotationY={0.2} mouth={ring > 0 || (t > 3 && t < 5)} armL={t > 3 ? 1.8 : 0.4} armR={t > 3 ? -1.8 : -0.4} />
			<Phone position={[0.38, 0.6, -2.45]} rotationY={-0.2} t={t} nervous={smooth(t, 11, 12)} letter={smooth(t, RESIGN - 0.3, RESIGN + 0.2)} />
		</>
	);
};
export const O8: React.FC<{t: number}> = ({t}) => (
	<>
		<Pop t={t} at={3.0} until={6.5} text="gising agad!" color="#fff" size={110} />
		<Pop t={t} at={9.6} until={12.6} text="takot sa AWOL" color={GOLD} size={110} />
		<Card t={t} at={RESIGN} title="Resignation Letter" stamp="?!" />
	</>
);

// ================= S9: the high-five, pull back =================
const FIVE = 7.34;
export const S9: React.FC<{t: number}> = ({t}) => {
	const lean = smooth(t, FIVE - 0.4, FIVE) * (1 - smooth(t, FIVE + 0.4, FIVE + 0.8));
	return (
		<>
			<Cam pos={mixV([0.6, 0.85, -1.6], [2.6, 2.6, 3.6], smooth(t, 1, 11.6))} look={mixV([0.25, 0.8, -2.45], [-0.3, 0.8, -2.0], smooth(t, 1, 11.6))} fov={40} />
			<Bedroom light={0.8} />
			<Sleeper t={t} up={1} pose={{armL: 0.1, armR: 0.1, headTurn: 0.6}} />
			<AlarmClock position={[STAND[0] - 0.06, STAND[1], STAND[2]]} t={t} hour={7} rotationY={0.5} mouth armR={-2.2 * lean - 0.4} armL={0.6} />
			<Phone position={[0.42, 0.6, -2.45]} rotationY={-0.5} t={t} />
			{lean > 0.6 ? (
				<mesh position={[0.32, 1.0, -2.4]} scale={lean} material={mat('#ffe27a', {emissive: '#ffd040', emissiveIntensity: 1.2})}>
					<icosahedronGeometry args={[0.05, 0]} />
				</mesh>
			) : null}
		</>
	);
};
export const O9: React.FC<{t: number}> = ({t}) => <Pop t={t} at={FIVE} until={10.6} text="HIGH FIVE!" color={GOLD} size={130} />;
