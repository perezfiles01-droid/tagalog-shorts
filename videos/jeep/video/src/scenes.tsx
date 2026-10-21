import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Cam, Cloud, Person, Pose, Sky, Tree, mat, mix, rand, ramp, smooth, walk} from './kit';
import {House} from './props';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// recurring cast
const DRIVER = {seed: 5001, shirt: '#e8e2d2', pants: '#3b4252', longHair: false};
const LOLA = {seed: 5101, shirt: '#8a6f9f', hairColor: '#cfcac2', longHair: true};
const STUDENT = {seed: 5102, shirt: '#f2f0ea', pants: '#2f3a45', longHair: false};
const PI = Math.PI;

// ---------- overlays ----------
const Tag: React.FC<{text: string; sub?: string; o: number; y: number; color?: string; size?: number}> = ({text, sub, o, y, color = '#fff', size = 150}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: y, opacity: o}}>
		<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, color, textShadow: '0 6px 30px rgba(0,0,0,0.6)', transform: `scale(${0.7 + 0.3 * o})`, whiteSpace: 'nowrap'}}>{text}</div>
		{sub ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 60, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,0.7)', marginTop: -6}}>{sub}</div> : null}
	</AbsoluteFill>
);
const pop = (t: number, a: number, b: number) => interpolate(t, [a, a + 0.4, b - 0.4, b], [0, 1, 1, 0], clampI);

const Cross: React.FC<{o: number; y: number}> = ({o, y}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: y, opacity: o}}>
		<div style={{fontFamily: 'sans-serif', fontWeight: 900, fontSize: 260, lineHeight: 1, color: '#d33a2c', textShadow: '0 6px 30px rgba(0,0,0,0.5)', transform: `scale(${2.2 - 1.2 * Math.min(1, o * 1.4)}) rotate(-8deg)`}}>✕</div>
	</AbsoluteFill>
);

// ---------- the jeepney (open interior; cabin stretches along z) ----------
const SEATS = 7; // per side
const seatZ = (i: number, len = 1) => (-0.3 - i * 0.5) * len; // relative to the divider at z=1.4
const DIV = 1.4;
const BODY = '#cdd1d4';

type Rider = {side: number; i: number; seed: number; dz?: number; pose?: Pose; scale?: number; shirt?: string; hairColor?: string; longHair?: boolean; mouth?: boolean};

const Jeep: React.FC<{t: number; len?: number; roof?: boolean; riders?: Rider[]; driverPose?: Pose; driverMouth?: boolean; driverTurn?: number; sway?: number; wheels?: number; glow?: number}> = ({t, len = 1, roof = true, riders = [], driverPose = {}, driverMouth, driverTurn = 0, sway = 0, wheels = 0, glow = 0}) => {
	const cabinL = 3.9;
	const wheel = (x: number, z: number) => (
		<mesh key={`${x}${z}`} position={[x, 0.38, z]} rotation={[wheels, 0, PI / 2]} material={mat('#26262a')}>
			<cylinderGeometry args={[0.38, 0.38, 0.26, 12]} />
		</mesh>
	);
	const rear = DIV - cabinL * len;
	return (
		<group>
			{/* chassis + floor */}
			<mesh position={[0, 0.55, (DIV + rear) / 2 + 0.6]} material={mat('#3a3d42')}>
				<boxGeometry args={[1.9, 0.12, DIV - rear + 2.2]} />
			</mesh>
			{/* cabin: scaled along z from the divider */}
			<group position={[0, 0, DIV]} scale={[1, 1, len]}>
				{[-1, 1].map((s) => (
					<React.Fragment key={s}>
						<mesh position={[s * 1.0, 0.95, -cabinL / 2]} material={mat(BODY, {metalness: 0.35, roughness: 0.45})}>
							<boxGeometry args={[0.06, 0.75, cabinL]} />
						</mesh>
						<mesh position={[s * 1.03, 0.82, -cabinL / 2]} material={mat('#b5473b')}>
							<boxGeometry args={[0.02, 0.14, cabinL]} />
						</mesh>
						<mesh position={[s * 1.03, 1.0, -cabinL / 2]} material={mat('#d9b44a')}>
							<boxGeometry args={[0.02, 0.09, cabinL]} />
						</mesh>
						<mesh position={[s * 1.03, 1.18, -cabinL / 2]} material={mat('#3f6aa0')}>
							<boxGeometry args={[0.02, 0.08, cabinL]} />
						</mesh>
						{/* bench */}
						<mesh position={[s * 0.82, 0.83, -cabinL / 2]} material={mat('#8a3b2e')}>
							<boxGeometry args={[0.34, 0.12, cabinL - 0.1]} />
						</mesh>
						{/* window posts */}
						{roof
							? [0, 1, 2, 3, 4].map((k) => (
									<mesh key={k} position={[s * 1.0, 1.75, -k * (cabinL / 4)]} material={mat('#9aa0a6', {metalness: 0.5, roughness: 0.4})}>
										<boxGeometry args={[0.05, 0.9, 0.05 / len]} />
									</mesh>
								))
							: null}
						{/* rail for holding */}
						{roof ? (
							<mesh position={[s * 0.6, 2.15, -cabinL / 2]} rotation={[PI / 2, 0, 0]} material={mat('#c8ccd0', {metalness: 0.6, roughness: 0.3})}>
								<cylinderGeometry args={[0.025, 0.025, cabinL, 6]} />
							</mesh>
						) : null}
					</React.Fragment>
				))}
				{/* rear step + bumper */}
				<mesh position={[0, 0.42, -cabinL - 0.12]} material={mat('#9aa0a6', {metalness: 0.5, roughness: 0.4})}>
					<boxGeometry args={[1.6, 0.08, 0.3 / len]} />
				</mesh>
				{roof ? (
					<mesh position={[0, 2.25, -cabinL / 2]} material={mat('#e8e2d2')}>
						<boxGeometry args={[2.15, 0.1, cabinL + 0.2]} />
					</mesh>
				) : null}
			</group>
			{/* cab: divider, windshield frame, hood, the silver horse */}
			<mesh position={[0, 1.35, DIV + 0.02]} material={mat('#7a8088')}>
				<boxGeometry args={[2.0, 0.08, 0.06]} />
			</mesh>
			{[-1, 1].map((s) => (
				<mesh key={'cw' + s} position={[s * 1.0, 0.95, DIV + 0.6]} material={mat(BODY, {metalness: 0.35, roughness: 0.45})}>
					<boxGeometry args={[0.06, 0.75, 1.2]} />
				</mesh>
			))}
			{roof ? (
				<>
					<mesh position={[0, 2.25, DIV + 0.6]} material={mat('#e8e2d2')}>
						<boxGeometry args={[2.15, 0.1, 1.3]} />
					</mesh>
					<mesh position={[0, 2.42, DIV + 1.15]} material={mat('#f2efe6', {emissive: '#b98aff', emissiveIntensity: glow})}>
						<boxGeometry args={[1.4, 0.28, 0.06]} />
					</mesh>
					{[-1, 1].map((s) => (
						<mesh key={'ws' + s} position={[s * 0.95, 1.75, DIV + 1.2]} material={mat('#9aa0a6', {metalness: 0.5, roughness: 0.4})}>
							<boxGeometry args={[0.06, 0.95, 0.06]} />
						</mesh>
					))}
				</>
			) : null}
			<mesh position={[0, 0.95, DIV + 1.75]} material={mat(BODY, {metalness: 0.35, roughness: 0.45})}>
				<boxGeometry args={[1.7, 0.7, 1.1]} />
			</mesh>
			<mesh position={[0, 1.02, DIV + 2.31]} material={mat('#9aa0a6', {metalness: 0.6, roughness: 0.3})}>
				<boxGeometry args={[1.4, 0.5, 0.04]} />
			</mesh>
			{[-1, 1].map((s) => (
				<mesh key={'hl' + s} position={[s * 0.55, 1.0, DIV + 2.33]} material={mat('#fff6d6', {emissive: '#fff2c0', emissiveIntensity: 0.6})}>
					<sphereGeometry args={[0.11, 8, 6]} />
				</mesh>
			))}
			<group position={[0, 1.42, DIV + 2.15]}>
				<mesh position={[0, 0.08, 0]} rotation={[0.3, 0, 0]} material={mat('#e0e4e8', {metalness: 0.8, roughness: 0.2})}>
					<boxGeometry args={[0.06, 0.12, 0.22]} />
				</mesh>
				<mesh position={[0, 0.18, 0.1]} material={mat('#e0e4e8', {metalness: 0.8, roughness: 0.2})}>
					<boxGeometry args={[0.05, 0.14, 0.08]} />
				</mesh>
			</group>
			{wheel(-1.0, DIV + 1.6)}
			{wheel(1.0, DIV + 1.6)}
			{wheel(-1.0, rear + 0.9)}
			{wheel(1.0, rear + 0.9)}
			{/* driver with mortarboard and round glasses; the PhD diploma on the mirror */}
			<group position={[0.48, 0.66, DIV + 0.55]}>
				<Person {...DRIVER} scale={0.8} pose={{sit: true, armL: -1.0, armR: -1.0, elbow: -0.4, headTurn: driverTurn, ...driverPose}} mouth={driverMouth} />
				<group position={[0, 1.38 * 0.8, 0]} rotation={[0, driverTurn, 0]}>
					<mesh position={[0, 0.2, 0]} material={mat('#1d1d22')}>
						<cylinderGeometry args={[0.15, 0.17, 0.1, 10]} />
					</mesh>
					<mesh position={[0, 0.26, 0]} rotation={[0, PI / 4, 0]} material={mat('#1d1d22')}>
						<boxGeometry args={[0.46, 0.03, 0.46]} />
					</mesh>
					<mesh position={[0.18, 0.18, 0.12]} material={mat(GOLD)}>
						<boxGeometry args={[0.025, 0.16, 0.025]} />
					</mesh>
					{[-1, 1].map((s) => (
						<mesh key={s} position={[s * 0.06, 0.015, 0.17]} material={mat('#2a2a2e')}>
							<torusGeometry args={[0.045, 0.01, 6, 14]} />
						</mesh>
					))}
				</group>
			</group>
			<group position={[0.05, 2.12, DIV + 1.05]} rotation={[0, 0, Math.sin(t * 2.2) * 0.25]}>
				<mesh position={[0, -0.1, 0]} material={mat('#d33a2c')}>
					<boxGeometry args={[0.01, 0.2, 0.01]} />
				</mesh>
				<mesh position={[0, -0.28, 0]} material={mat('#f6f0dc')}>
					<boxGeometry args={[0.22, 0.16, 0.01]} />
				</mesh>
				<mesh position={[0, -0.28, 0.01]} material={mat(GOLD)}>
					<cylinderGeometry args={[0.03, 0.03, 0.01, 8]} />
				</mesh>
			</group>
			{/* riders */}
			{riders.map((r, k) => {
				const z = DIV + seatZ(r.i) + (r.dz ?? 0);
				return (
					<group key={k} position={[r.side * (0.8 + sway * Math.sin(t * 3 + k)), 0.48, z]}>
						<Person seed={r.seed} shirt={r.shirt} hairColor={r.hairColor} longHair={r.longHair} scale={r.scale ?? 0.75} rotationY={r.side > 0 ? -PI / 2 : PI / 2} pose={{sit: true, armL: 0.2, armR: 0.2, ...r.pose}} mouth={r.mouth} />
					</group>
				);
			})}
		</group>
	);
};

// a full jeep of riders, with one slot (side +1, index gap) left open
const fullRiders = (gap = -1, extra: Partial<Rider>[] = []): Rider[] => {
	const out: Rider[] = [];
	for (const side of [-1, 1])
		for (let i = 0; i < SEATS; i++) if (!(side === 1 && i === gap)) out.push({side, i, seed: 6000 + side * 50 + i});
	return out.concat(extra as Rider[]);
};

const Mouse: React.FC<{position: number[]; s: number; t: number}> = ({position, s, t}) => (
	<group position={position as V} scale={s} rotation={[0, -PI / 2, 0]}>
		<mesh position={[0, 0.08, 0]} scale={[1, 0.85, 1.3]} material={mat('#9a9aa4')}>
			<sphereGeometry args={[0.1, 10, 8]} />
		</mesh>
		<mesh position={[0, 0.14, 0.11]} material={mat('#9a9aa4')}>
			<sphereGeometry args={[0.065, 10, 8]} />
		</mesh>
		{[-1, 1].map((k) => (
			<React.Fragment key={k}>
				<mesh position={[k * 0.05, 0.21, 0.09]} material={mat('#e8a8b0')}>
					<sphereGeometry args={[0.035, 8, 6]} />
				</mesh>
				<mesh position={[k * 0.025, 0.16, 0.17]} material={mat('#1d1a18')}>
					<sphereGeometry args={[0.01, 6, 5]} />
				</mesh>
			</React.Fragment>
		))}
		<mesh position={[0, 0.12, 0.18]} material={mat('#e08a9a')}>
			<sphereGeometry args={[0.015, 6, 5]} />
		</mesh>
		<mesh position={[0, 0.06, -0.18]} rotation={[0.9 + Math.sin(t * 6) * 0.3, 0, 0]} material={mat('#c8a0a8')}>
			<cylinderGeometry args={[0.008, 0.012, 0.22, 5]} />
		</mesh>
	</group>
);

// ---------- street set ----------
const HOUSES = [['#e2d6bf', '#a85d4a'], ['#cfd8c4', '#7a7f86'], ['#e8cfb0', '#b9573f'], ['#c9d5dc', '#8a6a52'], ['#f0e3c8', '#6f8f86']];
const Street: React.FC<{z0?: number; z1?: number; dusk?: number}> = ({z0 = -40, z1 = 40}) => {
	const items = [];
	for (let z = z0, k = 0; z <= z1; z += 6, k++) {
		const [c, r] = HOUSES[k % HOUSES.length];
		const [c2, r2] = HOUSES[(k + 2) % HOUSES.length];
		items.push(<House key={'a' + z} position={[-7.5, 0, z]} rotationY={PI / 2} color={c} roof={r} />);
		items.push(<House key={'b' + z} position={[7.5, 0, z + 3]} rotationY={-PI / 2} color={c2} roof={r2} />);
		if (k % 2 === 0) items.push(<Tree key={'t' + z} position={[-4.6, 0, z + 3]} s={0.9} />);
	}
	return (
		<>
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0, (z0 + z1) / 2]} material={mat('#8f9a7c')}>
				<planeGeometry args={[80, z1 - z0 + 60]} />
			</mesh>
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.01, (z0 + z1) / 2]} material={mat('#5d6066')}>
				<planeGeometry args={[7, z1 - z0 + 60]} />
			</mesh>
			{[-1, 1].map((s) => (
				<mesh key={s} rotation={[-PI / 2, 0, 0]} position={[s * 4.2, 0.02, (z0 + z1) / 2]} material={mat('#c9c2b2')}>
					<planeGeometry args={[1.6, z1 - z0 + 60]} />
				</mesh>
			))}
			{items}
		</>
	);
};

const Day: React.FC = () => (
	<>
		<Sky top="#8fc0e3" bottom="#f1eee2" />
		<fog attach="fog" args={['#e8ece6', 25, 90]} />
		<hemisphereLight args={['#f4f1e8', '#7a8a6a', 1.25]} />
		<directionalLight position={[6, 12, 4]} intensity={2.1} color="#fff1da" />
		<Cloud position={[-20, 22, 30]} s={2.4} seed={2} />
		<Cloud position={[18, 26, 40]} s={2.8} seed={5} />
		<Cloud position={[0, 30, -60]} s={3} seed={7} />
	</>
);

// ================= S1: the PhD driver, a full jeep, and a gap for a mouse =================
export const S1: React.FC<{t: number}> = ({t}) => {
	if (t < 7.0) {
		const k = smooth(t, 0, 7);
		return (
			<>
				<Day />
				<Cam pos={[mix(1.4, 0.55, k), mix(1.9, 1.85, k), mix(6.8, 5.0, k)]} look={[0.45, 1.75, 1.9]} fov={34} />
				<Street />
				<Jeep t={t} riders={fullRiders(3)} driverMouth={t > 3.6 && t < 4.4} />
			</>
		);
	}
	const u = t - 7;
	const k = smooth(u, 0, 13.6);
	const turn = smooth(t, 13.6, 14.2) * (1 - smooth(t, 16.0, 16.6));
	const glow = smooth(t, 16.2, 16.8) * (0.6 + 0.4 * Math.sin(t * 7));
	const ms = interpolate(t, [18.85, 19.15, 19.35], [0, 1.25, 1], clampI);
	const gapZ = DIV + seatZ(3);
	return (
		<>
			<Day />
			{(() => {
				const c = smooth(t, 15.4, 17.4);
				const pos = [mix(mix(-1.6, 0.1, k), -0.2, c), mix(mix(2.3, 1.75, k), 1.85, c), mix(mix(-9.5, -5.2, k), gapZ - 2.6, c)];
				return <Cam pos={pos} look={[mix(0, 0.75, c), mix(1.3, 1.05, c), mix(-0.5, gapZ, c)]} fov={mix(44, 42, c)} />;
			})()}
			<Street />
			<Jeep t={t} riders={fullRiders(3)} driverTurn={turn * 2.6} driverMouth={t > 13.9 && t < 15.9} />
			<mesh position={[0.8, 1.05, gapZ]} material={mat('#ffe27a', {transparent: true, opacity: glow * 0.55, emissive: '#ffd040', emissiveIntensity: 1})}>
				<boxGeometry args={[0.3, 0.3, 0.16]} />
			</mesh>
			{ms > 0 ? <Mouse position={[0.8, 0.9, gapZ]} s={ms * 1.15} t={t} /> : null}
		</>
	);
};
export const O1: React.FC<{t: number}> = ({t}) => (
	<>
		<Tag text="PhD" sub="sa Physics" color={GOLD} size={170} o={pop(t, 3.6, 6.8)} y={300} />
		<Tag text="kasya pa!" color={GOLD} size={140} o={pop(t, 15.1, 17.4)} y={300} />
	</>
);

// ================= S2: three more passengers, then "Diskarte lang, Boss!" =================
export const S2: React.FC<{t: number}> = ({t}) => {
	if (t < 8.2) {
		const k = smooth(t, 0, 8.2);
		const arrive = (d: number) => smooth(t, 0, 1.9 + d);
		const looks = (i: number) => (t > 3.8 ? Math.sin((t - 3.8) * 2.2 + i * 1.7) * 0.9 : 0);
		return (
			<>
				<Day />
				<Cam pos={[mix(3.2, 1.6, k), mix(1.9, 1.6, k), mix(-9.0, -7.2, k)]} look={[0, 1.2, -2.6]} fov={42} />
				<Street />
				<Jeep t={t} riders={fullRiders(-1)} />
				{[-0.7, 0, 0.7].map((x, i) => {
					const a = arrive(i * 0.2);
					const walking = a < 1;
					return (
						<Person key={i} seed={5200 + i} position={[mix(-6 - i, x, a), 0, -3.4 - (i % 2) * 0.5]} rotationY={walking ? PI / 2 : PI} pose={walking ? walk(t, 1.6, i * 0.3) : {headTurn: looks(i), armL: i === 1 ? -0.6 : 0.1}} mouth={t > 4.2 && t < 6} />
					);
				})}
			</>
		);
	}
	const u = t - 8.2;
	const thumbs = smooth(t, 8.6, 9.0);
	return (
		<>
			<Day />
			<Cam pos={[mix(0.9, 0.6, smooth(u, 0, 2.4)), 1.85, mix(5.6, 4.6, smooth(u, 0, 2.4))]} look={[0.45, 1.75, 1.9]} fov={34} />
			<Street />
			<Jeep t={t} riders={fullRiders(-1)} driverPose={{armR: mix(-1.0, -2.5, thumbs), elbow: mix(-0.4, -0.9, thumbs)}} driverMouth={t > 8.9 && t < 9.9} />
		</>
	);
};
export const O2: React.FC<{t: number}> = ({t}) => (
	<>
		<Tag text="+3" color={GOLD} size={190} o={pop(t, 1.6, 4.0)} y={300} />
		<Tag text="?" size={220} o={pop(t, 4.3, 7.9)} y={280} />
		<Tag text="👍" size={170} o={pop(t, 8.9, 10.6)} y={300} />
	</>
);

// ================= S3: the passenger at the back, practically outside =================
export const S3: React.FC<{t: number}> = ({t}) => {
	const k = smooth(t, 0, 8.3);
	const shove = smooth(t, 5.5, 6.0) * (1 - 0.6 * smooth(t, 6.4, 7.4));
	const back: Rider = {side: 1, i: SEATS - 1, seed: 5300, shirt: '#c27b4f', dz: -0.7 - 0.25 * shove, pose: {armR: -2.6, elbow: -0.3, armL: 0.6, spreadL: 0.8}, mouth: t > 2.2 && t < 3.0};
	return (
		<>
			<Day />
			<Cam pos={[mix(-3.6, -2.6, k), mix(1.9, 1.7, k), mix(-6.4, -5.3, k)]} look={[0.4, 1.35, -2.2]} fov={40} />
			<Street />
			<Jeep t={t} riders={[...fullRiders(-1).filter((r) => !(r.side === 1 && r.i === SEATS - 1)).map((r) => ({...r, dz: r.side === 1 ? -0.12 * shove : 0})), back]} sway={0.05 * smooth(t, 5.4, 5.8) * (1 - smooth(t, 6.8, 7.6))} driverMouth={t > 5.5 && t < 7.0} />
		</>
	);
};
export const O3: React.FC<{t: number}> = ({t}) => <Tag text="usog!" color={GOLD} size={150} o={pop(t, 5.5, 8.0)} y={300} />;

// ================= S4 (silent): the Great Scoot =================
export const S4: React.FC<{t: number}> = ({t}) => {
	const k = smooth(t, 0, 9);
	const scoot = smooth(t, 0.8, 2.2) * 0.12;
	const len = 1 + 0.4 * smooth(t, 2.2, 4.0) + 0.03 * Math.sin(t * 9) * smooth(t, 2.2, 2.6) * (1 - smooth(t, 3.6, 4.0));
	const at = (a: number) => interpolate(t, [a, a + 0.2, a + 0.35], [0, 1.2, 1], clampI);
	const riders = fullRiders(-1).map((r) => ({...r, dz: (r.side === 1 ? 1 : 1) * scoot * (r.i + 1) * 0.3}));
	const extra: Rider[] = [];
	if (t > 4.0) extra.push({side: -1, i: 8, seed: LOLA.seed, shirt: LOLA.shirt, hairColor: LOLA.hairColor, longHair: true, scale: 0.75 * at(4.0)});
	if (t > 5.0) extra.push({side: 1, i: 8, seed: STUDENT.seed, shirt: STUDENT.shirt, longHair: false, scale: 0.75 * at(5.0)});
	const nod = t > 7.8 ? Math.sin((t - 7.8) * 9) * 0.04 * (1 - smooth(t, 8.4, 8.8)) : 0;
	return (
		<>
			<Day />
			<Cam pos={[mix(1.2, -0.6, k), mix(6.2, 5.4, k), mix(-6.0, -4.6, k)]} look={[0, 1.0, mix(-1.0, -0.6, k)]} fov={46} />
			<Street />
			<Jeep t={t} len={len} roof={false} riders={[...riders, ...extra]} driverPose={{bob: nod}} />
			{/* chicken in a basket and a sack of rice in the aisle */}
			{t > 6.0 ? (
				<group position={[0, 0.62, DIV + seatZ(2, len)]} scale={at(6.0)}>
					<mesh position={[0, 0.12, 0]} material={mat('#b08a52')}>
						<cylinderGeometry args={[0.24, 0.2, 0.24, 10, 1, true]} />
					</mesh>
					<mesh position={[0, 0.3, 0]} material={mat('#f2efe6')}>
						<sphereGeometry args={[0.14, 10, 8]} />
					</mesh>
					<mesh position={[0, 0.46, 0.04]} material={mat('#f2efe6')}>
						<sphereGeometry args={[0.08, 8, 6]} />
					</mesh>
					<mesh position={[0, 0.56, 0.04]} material={mat('#d33a2c')}>
						<boxGeometry args={[0.03, 0.06, 0.08]} />
					</mesh>
					<mesh position={[0, 0.45, 0.13]} rotation={[PI / 2, 0, 0]} material={mat('#e8b54a')}>
						<coneGeometry args={[0.025, 0.06, 5]} />
					</mesh>
				</group>
			) : null}
			{t > 7.0 ? (
				<mesh position={[0, 0.85, DIV + seatZ(5, len)]} rotation={[0, 0.3, PI / 2]} scale={at(7.0)} material={mat('#e6dcc4')}>
					<capsuleGeometry args={[0.24, 0.4, 3, 8]} />
				</mesh>
			) : null}
		</>
	);
};
export const O4: React.FC<{t: number}> = ({t}) => (
	<>
		<Tag text="1 cm" sub="usog lang" size={150} o={pop(t, 0.7, 3.3)} y={300} />
		{[4.0, 5.0, 6.0, 7.0].map((a, i) => (
			<Tag key={i} text={`+${i + 1}`} color={GOLD} size={190} o={pop(t, a, i === 3 ? 8.7 : a + 1.0)} y={300} />
		))}
	</>
);

// ================= S5: an ordinary jeep? into the space-time tunnel =================
const Tunnel: React.FC<{t: number}> = ({t}) => {
	const stars = useMemo(() => {
		const r = rand(77);
		return Array.from({length: 140}).map(() => [(r() - 0.5) * 30, (r() - 0.5) * 30, r() * 120, r()]);
	}, []);
	return (
		<>
			<color attach="background" args={['#120a2a']} />
			<hemisphereLight args={['#b8a0ff', '#20103a', 0.9]} />
			<pointLight position={[0, 4, 4]} intensity={18} color="#c8a8ff" distance={20} />
			{Array.from({length: 14}).map((_, i) => {
				const z = 60 - ((i * 9 + t * 22) % 126);
				return (
					<mesh key={i} position={[0, 1.5, z]} rotation={[0, 0, t * 0.6 + i]} material={mat(i % 2 ? '#7a5cff' : '#4fc3ff', {emissive: i % 2 ? '#6a4cff' : '#3fb0ff', emissiveIntensity: 1.2})}>
						<torusGeometry args={[6, 0.12, 6, 24]} />
					</mesh>
				);
			})}
			{stars.map((s, i) => {
				const z = 60 - ((s[2] + t * 40) % 120);
				const d = Math.hypot(s[0], s[1]);
				if (d < 3.5) return null;
				return (
					<mesh key={'s' + i} position={[s[0], s[1] + 1.5, z]} scale={[1, 1, 6]} material={mat('#ffffff', {emissive: '#ffffff', emissiveIntensity: 1})}>
						<sphereGeometry args={[0.05, 4, 3]} />
					</mesh>
				);
			})}
		</>
	);
};
export const S5: React.FC<{t: number}> = ({t}) => {
	if (t < 5.4) {
		const z = t * 5;
		return (
			<>
				<Day />
				<Cam pos={[mix(-3.2, -2.4, smooth(t, 0, 5.4)), 2.6, z - mix(6.5, 5.0, smooth(t, 0, 5.4))]} look={[0, 1.3, z + 1.5]} fov={44} />
				<Street z0={-30} z1={70} />
				<group position={[0, 0, z]}>
					<Jeep t={t} riders={fullRiders(-1)} wheels={t * 12} />
				</group>
			</>
		);
	}
	const u = t - 5.4;
	const shake = Math.sin(t * 40) * 0.02;
	return (
		<>
			<Cam pos={[mix(-2.4, -1.2, smooth(u, 0, 4.4)) + shake, mix(2.6, 2.3, smooth(u, 0, 4.4)), mix(-5.5, -6.8, smooth(u, 0, 4.4))]} look={[0, 1.4, 2.5]} fov={mix(44, 58, smooth(u, 0, 1.2))} />
			<Tunnel t={u} />
			<group position={[0, Math.sin(t * 3) * 0.08, 0]}>
				<Jeep t={t} riders={fullRiders(-1)} wheels={t * 18} glow={1.2 + Math.sin(t * 8) * 0.4} />
			</group>
		</>
	);
};
export const O5: React.FC<{t: number}> = ({t}) => (
	<>
		<Tag text="ordinaryo?" size={130} o={pop(t, 1.8, 4.6)} y={300} />
		<Tag text="space-time" color="#c8b0ff" size={150} o={pop(t, 7.9, 9.8)} y={300} />
	</>
);

// ================= S6: Einstein's years vs. the driver's one glance =================
const Einstein: React.FC<{t: number}> = ({t}) => {
	const write = Math.sin(t * 7) * 0.25;
	return (
		<group position={[0.6, 0, -1.2]} rotation={[0, PI * 0.85, 0]}>
			<Person seed={5400} shirt="#6b5a4a" pants="#4a4f5e" hairColor="#f2f0ea" longHair={false} pose={{armR: -2.0 + write, elbow: -0.3, armL: 0.2}} />
			{[[-0.2, 1.88, -0.05], [0.2, 1.88, -0.05], [0, 1.95, -0.18], [-0.14, 1.98, 0.02], [0.14, 1.98, 0.02], [-0.24, 1.76, -0.12], [0.24, 1.76, -0.12]].map((p, i) => (
				<mesh key={i} position={p as V} material={mat('#f2f0ea')}>
					<icosahedronGeometry args={[0.12, 0]} />
				</mesh>
			))}
			<mesh position={[0, 1.71, 0.2]} scale={[1.6, 0.6, 0.6]} material={mat('#e8e6e0')}>
				<sphereGeometry args={[0.05, 8, 6]} />
			</mesh>
		</group>
	);
};
export const S6: React.FC<{t: number}> = ({t}) => {
	if (t < 4.4) {
		const k = smooth(t, 0, 4.4);
		const lines = Math.floor(t * 3);
		return (
			<>
				<Cam pos={[mix(3.2, 2.4, k), mix(2.0, 1.9, k), mix(3.2, 2.2, k)]} look={[0, 1.6, -2.0]} fov={42} />
				<color attach="background" args={['#2a2420']} />
				<hemisphereLight args={['#f2e2c8', '#3a2e24', 0.9]} />
				<pointLight position={[1.5, 3, 1.5]} intensity={14} color="#ffcf8f" />
				<mesh rotation={[-PI / 2, 0, 0]} material={mat('#7a5a40')}>
					<planeGeometry args={[14, 14]} />
				</mesh>
				<mesh position={[0, 1.6, -2.6]} material={mat('#c9b79a')}>
					<boxGeometry args={[9, 3.4, 0.1]} />
				</mesh>
				<mesh position={[0, 1.7, -2.5]} material={mat('#2f4a3a')}>
					<boxGeometry args={[4.2, 1.9, 0.05]} />
				</mesh>
				{Array.from({length: Math.min(lines, 12)}).map((_, i) => (
					<mesh key={i} position={[-1.6 + (i % 3) * 1.2 + 0.4, 2.4 - Math.floor(i / 3) * 0.38, -2.46]} material={mat('#f2f0ea')}>
						<boxGeometry args={[0.6 + ((i * 37) % 5) * 0.08, 0.04, 0.01]} />
					</mesh>
				))}
				<Einstein t={t} />
			</>
		);
	}
	const u = t - 4.4;
	const glance = smooth(t, 6.2, 6.5) * (1 - smooth(t, 6.9, 7.2));
	const hand = smooth(t, 8.7, 9.1);
	return (
		<>
			<Day />
			<Cam pos={[mix(-1.8, -1.1, smooth(u, 0, 5.8)), 1.9, mix(5.4, 4.4, smooth(u, 0, 5.8))]} look={[0.45, 1.75, 1.9]} fov={34} />
			<Street />
			<Jeep t={t} riders={fullRiders(2)} driverTurn={glance * 2.4} driverPose={{armL: mix(-1.0, -2.6, hand), elbow: mix(-0.4, -0.1, hand)}} driverMouth={t > 8.9 && t < 9.8} />
		</>
	);
};
export const O6: React.FC<{t: number}> = ({t}) => (
	<>
		<Tag text="E = mc²" sub="ilang taon" size={140} o={pop(t, 0.7, 4.3)} y={300} />
		<Tag text="1 tingin" size={140} o={pop(t, 6.2, 8.6)} y={300} />
		<Tag text="+5 kasya!" color={GOLD} size={150} o={pop(t, 8.9, 10.5)} y={300} />
	</>
);

// ================= S7: do we still need NASA? =================
const Rocket: React.FC<{position: number[]}> = ({position}) => (
	<group position={position as V}>
		<mesh position={[0, 0.3, 0]} material={mat('#b8b4ac')}>
			<boxGeometry args={[6, 0.6, 6]} />
		</mesh>
		<mesh position={[0, 6.6, 0]} material={mat('#f2f0ea')}>
			<cylinderGeometry args={[1.1, 1.1, 11, 14]} />
		</mesh>
		<mesh position={[0, 13.4, 0]} material={mat('#f2f0ea')}>
			<coneGeometry args={[1.1, 2.6, 14]} />
		</mesh>
		<mesh position={[0, 9.5, 1.05]} material={mat('#3f6aa0')}>
			<boxGeometry args={[1.2, 0.5, 0.1]} />
		</mesh>
		{[0, 1, 2, 3].map((i) => (
			<mesh key={i} position={[Math.sin((i * PI) / 2) * 1.3, 1.9, Math.cos((i * PI) / 2) * 1.3]} rotation={[0, (i * PI) / 2, 0]} material={mat('#d33a2c')}>
				<boxGeometry args={[0.12, 2.2, 1.0]} />
			</mesh>
		))}
		<mesh position={[-2.4, 7, -0.5]} material={mat('#c27b4f')}>
			<boxGeometry args={[0.6, 14, 0.6]} />
		</mesh>
		{[3, 6, 9, 12].map((y) => (
			<mesh key={y} position={[-1.7, y, -0.5]} material={mat('#c27b4f')}>
				<boxGeometry args={[1.0, 0.15, 0.3]} />
			</mesh>
		))}
	</group>
);
export const S7: React.FC<{t: number}> = ({t}) => {
	const pan = smooth(t, 3.6, 6.4);
	const k = smooth(t, 0, 10.7);
	const wave = t > 6.2 ? Math.sin((t - 6.2) * 7) * 0.4 : 0;
	return (
		<>
			<Day />
			<Cam pos={[mix(-2, 4.5, pan), mix(3.0, 2.2, pan), mix(16, 9.5, k)]} look={[mix(-5, 2.2, pan), mix(9, 1.4, pan), 0]} fov={46} />
			<mesh rotation={[-PI / 2, 0, 0]} material={mat('#b9b28f')}>
				<planeGeometry args={[400, 400]} />
			</mesh>
			<mesh rotation={[-PI / 2, 0, 0]} position={[2, 0.01, 0]} material={mat('#8a8a86')}>
				<planeGeometry args={[18, 14]} />
			</mesh>
			<Rocket position={[-5, 0, -2]} />
			<group position={[2.6, 0, 0.5]} rotation={[0, -0.5, 0]}>
				<Jeep t={t} riders={fullRiders(-1)} driverPose={t > 6.2 ? {armL: -2.6 + wave, spreadL: 0.4} : {}} driverMouth={t > 6.2 && t < 7.4} />
			</group>
			<Tree position={[12, 0, -12]} s={1.4} />
			<Tree position={[-14, 0, -16]} s={1.6} />
		</>
	);
};
export const O7: React.FC<{t: number}> = ({t}) => (
	<>
		<Tag text="NASA?" size={150} o={pop(t, 3.3, 6.2)} y={300} />
		<Tag text="F = ma" sub="batas ng physics" size={140} o={pop(t, 7.5, 10.6)} y={300} />
		<Cross o={pop(t, 8.5, 10.6)} y={250} />
	</>
);

// ================= S8: "Kasya pa, Boss!" into the sunset =================
export const S8: React.FC<{t: number}> = ({t}) => {
	const z = -smooth(t, 6.9, 9.8) * 14 - Math.max(0, t - 9.8) * 4;
	const hop = interpolate(t, [5.8, 6.7], [0, 1], clampI);
	const bounce = Math.max(0, Math.sin((t - 6.7) * 14)) * 0.08 * (t > 6.7 && t < 7.4 ? 1 : 0);
	const k = smooth(t, 0, 9.8);
	return (
		<>
			<Sky top="#6f78a8" bottom="#f2a865" />
			<fog attach="fog" args={['#e8a878', 25, 95]} />
			<hemisphereLight args={['#ffd2a8', '#5a4a5a', 1.0]} />
			<directionalLight position={[0, 6, -30]} intensity={2.2} color="#ffb070" />
			<mesh position={[0, 6, -110]} material={mat('#ffe2a0', {emissive: '#ffb050', emissiveIntensity: 1})}>
				<sphereGeometry args={[9, 20, 14]} />
			</mesh>
			<Cam pos={[mix(2.2, 0.5, k), mix(2.0, 9.5, k), mix(7.0, 13.0, k)]} look={[0, mix(1.4, 2.0, k), mix(-1.0, -12, k)]} fov={44} />
			<Street z0={-70} z1={20} />
			<group position={[0, bounce, z]} rotation={[0, PI, 0]}>
				<Jeep t={t} riders={fullRiders(-1)} wheels={-z * 2.6} driverMouth={t > 6.7 && t < 7.8} />
			</group>
			{hop < 1 ? (
				<Person seed={5500} shirt="#7d9a6b" position={[mix(-3.5, 0, hop), Math.sin(hop * PI) * 0.5, z + 3.0]} rotationY={hop < 0.7 ? PI / 2 : PI} pose={walk(t, 2.2)} mouth />
			) : null}
		</>
	);
};
