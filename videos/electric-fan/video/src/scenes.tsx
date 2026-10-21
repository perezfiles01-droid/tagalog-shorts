import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Cam, Person, Pose, mat, mix, mixV, rand, ramp, smooth, walk} from './kit';

type V = [number, number, number];
const SERIF = 'NewsreaderItalic';
const GOLD = '#e8b54a';
const clampI = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const col = (a: string, b: string, k: number) => {
	const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
	const A = p(a), B = p(b);
	return '#' + A.map((v, i) => Math.round(mix(v, B[i], Math.min(1, Math.max(0, k)))).toString(16).padStart(2, '0')).join('');
};

// recurring cast: the fan's owner
const OWNER = {seed: 1201, shirt: '#5f7f8a', pants: '#3b4252'};

// ---------- the electric fan (a toy character) ----------
type FanProps = {
	position?: number[];
	yaw?: number; // body heading
	headYaw?: number; // oscillation / turning to look
	headPitch?: number; // + looks down (droop), - looks up
	phase?: number; // blade angle
	blur?: number; // 0..1 motion-blur disc
	eye?: number; // eye height: 1 open, 0.15 shut, 1.6 wide
	brow?: number; // -1 sad, +1 angry, 0 none
	mouth?: number; // 0 closed .. 1 wide open
	cry?: number;
	sweat?: number;
	steam?: number;
	shades?: boolean;
	btn?: number; // pressed speed button 0..3
	t?: number;
	s?: number;
};
export const Fan: React.FC<FanProps> = ({position = [0, 0, 0], yaw = 0, headYaw = 0, headPitch = 0, phase = 0, blur = 0, eye = 1, brow = 0, mouth = 0, cry = 0, sweat = 0, steam = 0, shades = false, btn = 0, t = 0, s = 1}) => {
	const body = mat('#e9e4da');
	const blue = mat('#7fb6c9');
	const cage = mat('#d9d4ca', {metalness: 0.2, roughness: 0.5});
	return (
		<group position={position as V} rotation={[0, yaw, 0]} scale={s}>
			<mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#000000', {transparent: true, opacity: 0.18, depthWrite: false})}>
				<circleGeometry args={[0.42, 16]} />
			</mesh>
			{/* base + speed buttons */}
			<mesh position={[0, 0.05, 0]} material={body}>
				<cylinderGeometry args={[0.34, 0.38, 0.1, 16]} />
			</mesh>
			{[0, 1, 2, 3].map((i) => (
				<mesh key={i} position={[(i - 1.5) * 0.11, btn === i ? 0.09 : 0.115, 0.19]} material={btn === i && i > 0 ? mat('#ffb340', {emissive: '#ff9a20', emissiveIntensity: 1.2}) : mat(i === 0 ? '#c9553f' : '#5a6b78')}>
					<boxGeometry args={[0.08, 0.05, 0.07]} />
				</mesh>
			))}
			<mesh position={[0, 0.65, 0]} material={body}>
				<cylinderGeometry args={[0.035, 0.045, 1.15, 8]} />
			</mesh>
			{/* head */}
			<group position={[0, 1.25, 0]} rotation={[headPitch, headYaw, 0, 'YXZ']}>
				<mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]} material={body}>
					<capsuleGeometry args={[0.13, 0.12, 4, 10]} />
				</mesh>
				{[0.19, -0.02].map((z, i) => (
					<mesh key={i} position={[0, 0, z]} material={cage}>
						<torusGeometry args={[0.36, 0.014, 5, 28]} />
					</mesh>
				))}
				{Array.from({length: 8}).map((_, i) => (
					<mesh key={'s' + i} position={[0, 0, 0.19]} rotation={[0, 0, (i * Math.PI) / 8]} material={cage}>
						<boxGeometry args={[0.72, 0.008, 0.008]} />
					</mesh>
				))}
				<group position={[0, 0, 0.08]} rotation={[0, 0, phase]}>
					{[0, 1, 2].map((i) => (
						<group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
							<mesh position={[0, 0.17, 0]} rotation={[0, 0.35, 0]} scale={[0.55, 1, 0.08]} material={mat('#9fd0de', {transparent: true, opacity: 1 - blur * 0.75})}>
								<sphereGeometry args={[0.17, 10, 6]} />
							</mesh>
						</group>
					))}
				</group>
				{blur > 0 ? (
					<mesh position={[0, 0, 0.085]} material={mat('#bfe2ec', {transparent: true, opacity: blur * 0.45, depthWrite: false})}>
						<circleGeometry args={[0.34, 28]} />
					</mesh>
				) : null}
				{/* face cap */}
				<mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={blue}>
					<cylinderGeometry args={[0.13, 0.13, 0.04, 18]} />
				</mesh>
				<group position={[0, 0, 0.225]}>
					{[-1, 1].map((k) => (
						<React.Fragment key={k}>
							<mesh position={[k * 0.045, 0.025, 0]} scale={[1, eye, 1]} material={mat('#1d1a18')}>
								<sphereGeometry args={[0.019, 8, 6]} />
							</mesh>
							<mesh position={[k * 0.08, -0.02, -0.005]} material={mat('#e08a7a', {transparent: true, opacity: 0.7})}>
								<sphereGeometry args={[0.02, 6, 5]} />
							</mesh>
							{brow !== 0 ? (
								<mesh position={[k * 0.045, 0.062, 0]} rotation={[0, 0, -k * brow * 0.45]} material={mat('#1d1a18')}>
									<boxGeometry args={[0.045, 0.009, 0.006]} />
								</mesh>
							) : null}
							{cry > 0
								? [0, 1].map((j) => {
										const p = (t * 1.4 + j * 0.5 + (k > 0 ? 0.25 : 0)) % 1;
										return (
											<mesh key={j} position={[k * 0.05, 0.0 - p * 0.32, 0.01]} scale={cry * (1 - p * 0.5)} material={mat('#7fc4f0', {emissive: '#3f8fd0', emissiveIntensity: 0.3})}>
												<sphereGeometry args={[0.014, 6, 5]} />
											</mesh>
										);
									})
								: null}
						</React.Fragment>
					))}
					{mouth > 0.02 ? (
						<mesh position={[0, -0.045, 0]} scale={[1.2, 0.35 + mouth * 1.2, 0.5]} material={mat('#4a2a26')}>
							<sphereGeometry args={[0.02, 8, 6]} />
						</mesh>
					) : (
						<mesh position={[0, -0.045, 0]} material={mat('#4a2a26')}>
							<boxGeometry args={[0.03, 0.006, 0.005]} />
						</mesh>
					)}
					{shades ? (
						<group position={[0, 0.025, 0.02]}>
							{[-1, 1].map((k) => (
								<mesh key={k} position={[k * 0.045, 0, 0]} material={mat('#101014', {roughness: 0.2})}>
									<boxGeometry args={[0.07, 0.04, 0.01]} />
								</mesh>
							))}
							<mesh material={mat('#101014')}>
								<boxGeometry args={[0.16, 0.008, 0.01]} />
							</mesh>
						</group>
					) : null}
				</group>
				{sweat > 0
					? Array.from({length: 6}).map((_, i) => {
							const p = (t * 1.2 + i / 6) % 1;
							const a = i * 1.05 + 0.4;
							return (
								<mesh key={'sw' + i} position={[Math.cos(a) * (0.3 + p * 0.5), 0.3 + p * 0.45 - p * p * 0.8, 0.05 + Math.sin(a) * 0.15]} scale={sweat * (1 - p * 0.6)} material={mat('#8fd0ff', {emissive: '#4f9fd8', emissiveIntensity: 0.3})}>
									<sphereGeometry args={[0.028, 6, 5]} />
								</mesh>
							);
						})
					: null}
				{steam > 0
					? Array.from({length: 4}).map((_, i) => {
							const p = (t * 1.1 + i / 4) % 1;
							return (
								<mesh key={'st' + i} position={[(i % 2 ? 1 : -1) * (0.12 + p * 0.08), 0.42 + p * 0.5, -0.05]} scale={steam * (0.6 + p)} material={mat('#ffffff', {transparent: true, opacity: 0.8 * (1 - p), depthWrite: false})}>
									<icosahedronGeometry args={[0.07, 0]} />
								</mesh>
							);
						})
					: null}
			</group>
		</group>
	);
};

// ---------- the bedroom ----------
const SKY = {day: '#9fd0f0', dusk: '#f2a76a', night: '#1c2448'};
export const FAN_POS: V = [-0.3, 0, -1.9];
export const FAN_YAW = -1.0;
const BED = {x: -1.8, z: -1.8, top: 0.55};

const Room: React.FC<{t: number; tod?: number; wind?: number}> = ({t, tod = 0, wind = 0}) => {
	// tod: 0 day, 1 dusk, 2 night
	const sky = tod <= 1 ? col(SKY.day, SKY.dusk, tod) : col(SKY.dusk, SKY.night, tod - 1);
	const night = Math.max(0, tod - 1);
	const sway = wind * (0.18 + 0.08 * Math.sin(t * 9));
	const sunA = mix(0.2, 1.0, Math.min(1, tod)); // across the window
	return (
		<>
			<color attach="background" args={['#2a2420']} />
			<fog attach="fog" args={['#2a2420', 9, 26]} />
			<hemisphereLight args={[col('#f6efe2', '#8a90b8', night), '#6a5a48', mix(1.15, 0.55, night)]} />
			<directionalLight position={[2, 5, 6]} intensity={mix(1.6, 0.4, night)} color={col('#fff1da', '#9fb0ff', night)} />
			<pointLight position={[0.2, 2.6, 0.4]} intensity={mix(7, 13, night)} color="#ffcf8f" distance={12} />
			{/* floor, rug, walls */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={mat('#b98d62')}>
				<planeGeometry args={[16, 16]} />
			</mesh>
			<mesh position={[-0.6, 0.006, -0.9]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#c9784a')}>
				<circleGeometry args={[1.3, 20]} />
			</mesh>
			<mesh position={[0, 2, -3]} material={mat('#e8dcc4')}>
				<boxGeometry args={[12, 4, 0.1]} />
			</mesh>
			<mesh position={[-3, 2, 0]} material={mat('#dccfb5')}>
				<boxGeometry args={[0.1, 4, 12]} />
			</mesh>
			<mesh position={[3.6, 2, 0]} material={mat('#dccfb5')}>
				<boxGeometry args={[0.1, 4, 12]} />
			</mesh>
			{/* window */}
			<group position={[1.0, 1.75, -2.94]}>
				<mesh material={mat(sky, {emissive: sky, emissiveIntensity: 0.9})}>
					<boxGeometry args={[1.3, 1.1, 0.02]} />
				</mesh>
				{tod < 1.6 ? (
					<mesh position={[mix(-0.45, 0.45, sunA), mix(0.3, -0.35, Math.min(1, tod)), 0.02]} material={mat('#ffe28a', {emissive: '#ffc84a', emissiveIntensity: 1})}>
						<circleGeometry args={[0.11, 14]} />
					</mesh>
				) : (
					<mesh position={[mix(0.4, -0.2, ramp(tod, 1.6, 2)), 0.28, 0.02]} material={mat('#fff6d8', {emissive: '#fff6d8', emissiveIntensity: 0.9})}>
						<circleGeometry args={[0.09, 14]} />
					</mesh>
				)}
				{[[0, 0, 1.38, 0.06], [0, 0.58, 1.38, 0.06], [0, -0.58, 1.38, 0.06], [0.68, 0, 0.06, 1.2], [-0.68, 0, 0.06, 1.2], [0, 0, 0.04, 1.1]].map(([x, y, w, h], i) => (
					<mesh key={i} position={[x, y, 0.03]} material={mat('#f4efe4')}>
						<boxGeometry args={[w, h, 0.05]} />
					</mesh>
				))}
				{[-1, 1].map((k) => (
					<group key={k} position={[k * 0.88, 0.62, 0.12]} rotation={[sway, 0, k * sway * 0.3]}>
						<mesh position={[0, -0.7, 0]} material={mat('#8fb3a0')}>
							<boxGeometry args={[0.36, 1.4, 0.04]} />
						</mesh>
					</group>
				))}
			</group>
			{/* bed */}
			<group position={[BED.x, 0, BED.z]}>
				<mesh position={[0, 0.2, 0]} material={mat('#8a6448')}>
					<boxGeometry args={[1.7, 0.4, 2.3]} />
				</mesh>
				<mesh position={[0, 0.47, 0]} material={mat('#f3efe6')}>
					<boxGeometry args={[1.6, 0.16, 2.2]} />
				</mesh>
				<mesh position={[0, 0.56, 0.35]} material={mat('#6f8fb3')}>
					<boxGeometry args={[1.64, 0.06, 1.4]} />
				</mesh>
				<mesh position={[0, 0.65, -0.82]} material={mat('#fbfaf5')}>
					<boxGeometry args={[1.0, 0.18, 0.45]} />
				</mesh>
				<mesh position={[0, 0.7, -1.15]} material={mat('#7a573e')}>
					<boxGeometry args={[1.7, 1.4, 0.08]} />
				</mesh>
			</group>
			{/* aircon above the bed */}
			<Aircon />
			{/* side table + lamp */}
			<group position={[-2.55, 0, -0.35]}>
				<mesh position={[0, 0.3, 0]} material={mat('#8a6448')}>
					<boxGeometry args={[0.5, 0.6, 0.5]} />
				</mesh>
				<mesh position={[0, 0.8, 0]} material={mat('#f2d9a0', {emissive: '#ffcf8f', emissiveIntensity: 0.3 + night * 0.8})}>
					<coneGeometry args={[0.18, 0.28, 10, 1, true]} />
				</mesh>
			</group>
		</>
	);
};

export const AIRCON: V = [-1.8, 2.6, -2.86];
const Aircon: React.FC<{paper?: number}> = ({paper = 0}) => (
	<group position={AIRCON}>
		<mesh material={mat('#f4f4f0')}>
			<boxGeometry args={[1.15, 0.36, 0.26]} />
		</mesh>
		<mesh position={[0, -0.12, 0.135]} material={mat('#c9ccd0')}>
			<boxGeometry args={[0.95, 0.04, 0.01]} />
		</mesh>
		<mesh position={[0.45, 0.08, 0.135]} material={mat('#5fd06a', {emissive: '#5fd06a', emissiveIntensity: 1})}>
			<sphereGeometry args={[0.012, 6, 5]} />
		</mesh>
	</group>
);
// a tiny paper sliding out of the aircon (in world space)
const Paper: React.FC<{k: number; t: number}> = ({k, t}) =>
	k > 0 ? (
		<group position={[AIRCON[0], AIRCON[1] - 0.16 - k * 0.3, AIRCON[2] + 0.17]} rotation={[0.15, 0, Math.sin(t * 3) * 0.06 * k]}>
			<mesh position={[0, -0.0, 0]} material={mat('#fbfaf5')}>
				<boxGeometry args={[0.36, 0.46 * k, 0.005]} />
			</mesh>
			{[0, 1, 2, 3].map((i) => (
				<mesh key={i} position={[0, 0.16 * k - i * 0.08 * k, 0.004]} material={mat(i === 0 ? '#d33a2c' : '#9a9a9a')}>
					<boxGeometry args={[i === 0 ? 0.26 : 0.22, 0.015, 0.002]} />
				</mesh>
			))}
		</group>
	) : null;

// lying in bed, face up, head on the pillow
const LIE: V = [BED.x, 0.62, -0.75];
const Lying: React.FC<{pose?: Pose; mouth?: boolean; phone?: number; children?: React.ReactNode}> = ({pose = {}, mouth, phone = 0}) => (
	<group position={LIE} rotation={[-Math.PI / 2, 0, 0]}>
		<Person {...OWNER} pose={{armL: 0.1, armR: -1.5, elbow: -1.2, ...pose}} mouth={mouth}>
			{phone > 0 ? (
				<group rotation={[0, 0, 0]}>
					<mesh material={mat('#1a1a1e')}>
						<boxGeometry args={[0.14, 0.24, 0.02]} />
					</mesh>
					<mesh position={[0, 0, 0.012]} material={mat(col('#5fd0e8', '#ff4f8a', phone), {emissive: col('#5fd0e8', '#ff4f8a', phone), emissiveIntensity: 1})}>
						<boxGeometry args={[0.12, 0.21, 0.002]} />
					</mesh>
				</group>
			) : null}
		</Person>
	</group>
);

const Chips: React.FC<{position: number[]}> = ({position}) => (
	<group position={position as V}>
		<mesh material={mat('#d33a2c')}>
			<cylinderGeometry args={[0.16, 0.1, 0.1, 12]} />
		</mesh>
		{[0, 1, 2, 3, 4].map((i) => (
			<mesh key={i} position={[Math.cos(i * 1.3) * 0.07, 0.06, Math.sin(i * 1.3) * 0.07]} rotation={[i, i * 2, 0]} material={mat('#f0c75a')}>
				<boxGeometry args={[0.07, 0.01, 0.06]} />
			</mesh>
		))}
	</group>
);

// camera helper: a point in front of the fan's face
const front = (d: number, h: number, side = 0, pos: V = FAN_POS, yaw = FAN_YAW): V => [pos[0] + Math.sin(yaw + side) * d, h, pos[2] + Math.cos(yaw + side) * d];
const HEAD: V = [FAN_POS[0], 1.25, FAN_POS[2]];
const osc = (t: number, amp = 0.55, f = 0.35) => Math.sin(t * f * Math.PI * 2) * amp;

// ---------- overlays ----------
const Tag: React.FC<{text: string; sub?: string; o: number; y: number; color?: string; size?: number}> = ({text, sub, o, y, color = '#fff', size = 170}) => (
	<AbsoluteFill style={{alignItems: 'center', paddingTop: y, opacity: o}}>
		<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: size, color, textShadow: '0 6px 30px rgba(0,0,0,0.6)', transform: `scale(${0.7 + 0.3 * o})`, textAlign: 'center', lineHeight: 1.0, whiteSpace: 'pre-line'}}>{text}</div>
		{sub ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 64, color: '#fff', textShadow: '0 3px 14px rgba(0,0,0,0.7)', marginTop: -6}}>{sub}</div> : null}
	</AbsoluteFill>
);

// ================= S1: spinning from morning till night =================
export const S1: React.FC<{t: number}> = ({t}) => {
	const tod = mix(0, 2, smooth(t, 3.0, 8.0));
	const k = smooth(t, 0, 12.4);
	return (
		<>
			<Cam pos={mixV(front(2.6, 1.55, 0.25), front(1.75, 1.35, 0.1), k)} look={[HEAD[0], mix(1.05, 1.22, k), HEAD[2]]} fov={44} />
			<Room t={t} tod={tod} wind={0.5} />
			<Fan position={FAN_POS} yaw={FAN_YAW} headYaw={osc(t)} phase={t * 9} blur={0.6} t={t} btn={2} eye={mix(1, 0.55, smooth(t, 9.5, 11.5))} brow={t > 10 ? -1 : 0} />
		</>
	);
};
export const O1: React.FC<{t: number}> = ({t}) => <Tag text="0" sub="day off" color={GOLD} size={200} o={interpolate(t, [11.3, 11.7, 12.2, 12.6], [0, 1, 1, 0], clampI)} y={300} />;

// ================= S2: you lie there, it works hard =================
export const S2: React.FC<{t: number}> = ({t}) => {
	const a = mix(-0.15, 0.4, smooth(t, 0, 11.8));
	const c: V = [-1.1, 0.9, -1.8];
	const tik = smooth(t, 6.3, 6.7);
	const lean = smooth(t, 7.6, 9.2);
	return (
		<>
			<Cam pos={[c[0] + Math.sin(a) * 5.0, 2.4, c[2] + Math.cos(a) * 5.0]} look={c} fov={44} />
			<Room t={t} wind={0.6} />
			<Lying phone={t < 6.4 ? 0.0001 : 1} mouth={t > 6.5 && t < 9 && Math.sin(t * 14) > 0} pose={{armR: -1.5, armL: t < 6 ? -1.2 + Math.max(0, Math.sin(t * 2.4)) * 0.5 : 0.1, elbow: -1.2}} />
			<Chips position={[BED.x + 0.5, BED.top + 0.08, BED.z - 0.2]} />
			<Fan position={FAN_POS} yaw={FAN_YAW} headYaw={0.15 + Math.sin(t * 2.2) * 0.08} headPitch={0.25 + lean * 0.1} phase={t * 11} blur={0.7} sweat={0.4 + lean * 0.6} t={t} btn={2} brow={-1 * lean} mouth={lean * (0.4 + 0.3 * Math.sin(t * 9))} />
		</>
	);
};

// ================= S3: number three, still not satisfied =================
export const S3: React.FC<{t: number}> = ({t}) => {
	const three = t >= 2.46;
	const press = 1 - smooth(Math.abs(t - 2.46), 0, 0.25);
	const sitUp = smooth(t, 6.4, 7.2);
	const k1 = smooth(t, 0, 2.2);
	const k2 = smooth(t, 3.4, 5.6);
	const base = front(0.24, 0.1);
	const camA = mixV(front(1.5, 0.8, 0.95), front(1.2, 0.6, 0.85), k1);
	const camB: V = [0.6, 1.8, 2.2];
	const sad = smooth(t, 9.8, 10.6);
	return (
		<>
			<Cam pos={mixV(camA, camB, k2)} look={mixV(base, [-1.1, 0.95, -1.8], k2)} fov={mix(30, 46, k2)} />
			<Room t={t} wind={three ? 1.6 : 0.6} />
			{sitUp < 0.5 ? (
				<Lying phone={0.5} pose={{armR: -1.5}} />
			) : (
				<Person {...OWNER} position={[BED.x + 0.1, BED.top - 0.48 + 0.05, -1.35]} rotationY={0.4} mouth={(t > 6.9 && t < 7.8) || (t > 8.3 && t < 9.0)} pose={{sit: true, armR: -1.6 + Math.sin(t * 16) * 0.35, elbow: -1.2, armL: t > 8.3 && t < 9.2 ? -2.3 : 0.1, spreadL: 0.3}} />
			)}
			<Fan position={FAN_POS} yaw={FAN_YAW} headYaw={0.2} headPitch={0.2} phase={three ? t * 16 : t * 11} blur={three ? 1 : 0.7} sweat={three ? 1 : 0.5} btn={three ? 3 : 2} t={t} eye={1 - press * 0.3} brow={-1} cry={sad} mouth={three && t < 4 ? 0.3 : 0} />
		</>
	);
};
export const O3: React.FC<{t: number}> = ({t}) => <Tag text="3" sub="speed" color={GOLD} size={220} o={interpolate(t, [2.46, 2.8, 4.4, 4.9], [0, 1, 1, 0], clampI)} y={300} />;

// ================= S4: (silent) the fan winds down and stops =================
export const S4: React.FC<{t: number}> = ({t}) => {
	// blade speed 16 rad/s easing to 0 by t=3.6; phase is its integral
	const T = 3.6;
	const tt = Math.min(t, T);
	const phase = 16 * (tt - (tt * tt) / (2 * T)) + 40;
	const speed = 16 * (1 - tt / T);
	const sigh = smooth(t, 4.4, 5.2);
	return (
		<>
			<Cam pos={mixV(front(1.9, 1.45, 0.3), front(1.15, 1.32, 0.15), smooth(t, 0, 6))} look={HEAD} fov={40} />
			<Room t={t} wind={speed / 16} />
			<Fan position={FAN_POS} yaw={FAN_YAW} headYaw={0.2 + (t > 3.6 && t < 4.2 ? Math.sin((t - 3.6) * 30) * 0.03 : 0)} headPitch={0.1 + sigh * 0.25} phase={phase} blur={Math.min(1, speed / 12)} btn={3} t={t} eye={mix(1, 0.18, sigh)} brow={-sigh} />
			{sigh > 0 && sigh < 1 ? (
				<mesh position={[HEAD[0] - 0.5 * sigh, HEAD[1] - 0.05, HEAD[2] + 0.25 * sigh]} scale={0.6 + sigh} material={mat('#ffffff', {transparent: true, opacity: 0.6 * (1 - sigh), depthWrite: false})}>
					<icosahedronGeometry args={[0.1, 0]} />
				</mesh>
			) : null}
		</>
	);
};

// ================= S5: silent quitting =================
const RainCloud: React.FC<{position: number[]; k: number; t: number}> = ({position, k, t}) => {
	const parts = useMemo(() => {
		const r = rand(55);
		return Array.from({length: 6}).map(() => [(r() - 0.5) * 0.5, (r() - 0.5) * 0.1, (r() - 0.5) * 0.25, 0.1 + r() * 0.08]);
	}, []);
	if (k <= 0) return null;
	return (
		<group position={position as V} scale={k * 0.7}>
			{parts.map((p, i) => (
				<mesh key={i} position={[p[0], p[1], p[2]]} scale={p[3]} material={mat('#a9aeb8')}>
					<icosahedronGeometry args={[1, 0]} />
				</mesh>
			))}
			{Array.from({length: 7}).map((_, i) => {
				const p = (t * 1.6 + i / 7) % 1;
				return (
					<mesh key={'r' + i} position={[(i / 6 - 0.5) * 0.45, -0.12 - p * 0.5, ((i * 37) % 5) * 0.04 - 0.08]} material={mat('#7fb6e0')}>
						<boxGeometry args={[0.008, 0.07, 0.008]} />
					</mesh>
				);
			})}
		</group>
	);
};
export const S5: React.FC<{t: number}> = ({t}) => {
	const droop = smooth(t, 5.8, 7.2);
	const cloud = smooth(t, 7.6, 8.6);
	return (
		<>
			<Cam pos={mixV(front(1.2, 1.35, 0.15), front(2.6, 1.7, 0.35), smooth(t, 0, 7))} look={[HEAD[0], mix(1.2, 1.25, droop), HEAD[2]]} fov={42} />
			<Room t={t} wind={0} />
			<Fan position={FAN_POS} yaw={FAN_YAW} headYaw={0.2} headPitch={0.35 + droop * 0.4} phase={40} btn={3} t={t} eye={mix(0.25, 0.15, droop)} brow={-1} cry={droop * 0.8} />
			<RainCloud position={[HEAD[0] - 0.05, 1.95, HEAD[2] + 0.05]} k={cloud} t={t} />
		</>
	);
};
export const O5: React.FC<{t: number}> = ({t}) => <Tag text={'SILENT\nQUITTING'} color="#c9d3e0" size={120} o={interpolate(t, [9.6, 10.0, 12.3, 12.9], [0, 1, 1, 0], clampI)} y={300} />;

// ================= S6: "Hoy!" poking the fan =================
const STAND_A: V = [BED.x + 0.6, 0, -0.9];
const STAND_B: V = [-0.82, 0, -1.3];
export const S6: React.FC<{t: number}> = ({t}) => {
	const up = t > 7.9;
	const w = smooth(t, 8.2, 9.6);
	const p = mixV(STAND_A, STAND_B, w);
	const ry = Math.atan2(FAN_POS[0] - p[0], FAN_POS[2] - p[2]);
	const pokes = t > 9.6 ? Math.max(0, Math.sin((t - 9.6) * 9)) : 0;
	const angry = (t > 3.3 && t < 4.5) || (t > 4.9 && t < 6.2);
	return (
		<>
			<Cam pos={mixV([0.7, 2.1, 3.0], [1.5, 1.8, 1.7], smooth(t, 7.5, 11))} look={mixV([-0.8, 0.9, -1.6], [-0.5, 1.0, -1.6], smooth(t, 7.5, 11))} fov={44} />
			<Room t={t} wind={0} />
			{!up ? (
				<Person {...OWNER} position={[BED.x + 0.1, BED.top - 0.43, -1.0]} rotationY={0.9} mouth={angry && Math.sin(t * 14) > -0.3} pose={{sit: true, armL: angry ? -2.4 : 0.1, armR: angry ? -2.4 : -0.3, spreadL: 0.4, spreadR: 0.4, bob: angry ? Math.abs(Math.sin(t * 8)) * 0.03 : 0}} />
			) : (
				<Person {...OWNER} position={p} rotationY={ry} pose={w < 1 ? walk(t, 1.6) : {armR: -1.5 + pokes * 0.25, elbow: -0.2, bend: 0.15}} mouth={t > 11 && t < 12.5} />
			)}
			<Fan position={FAN_POS} yaw={FAN_YAW} headYaw={0.2} headPitch={0.75} phase={40} btn={pokes > 0.5 ? 1 + (Math.floor(t * 3) % 3) : 3} t={t} eye={0.15} brow={-1} />
		</>
	);
};
export const O6: React.FC<{t: number}> = ({t}) => {
	const k = interpolate(t, [11.2, 11.5], [0, 1], clampI);
	const o = interpolate(t, [11.2, 11.3, 13.6, 14.2], [0, 1, 1, 0], clampI);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 330, opacity: o}}>
			<div style={{fontFamily: 'sans-serif', fontWeight: 900, fontSize: 420, color: '#d33a2c', lineHeight: 1, transform: `scale(${2.2 - k * 1.2}) rotate(-8deg)`, textShadow: '0 10px 40px rgba(0,0,0,0.4)'}}>✕</div>
		</AbsoluteFill>
	);
};

// ================= S7: the fan talks back =================
export const S7: React.FC<{t: number}> = ({t}) => {
	const snap = smooth(t, 0.7, 1.0);
	const talking = t > 2.9 && t < 13.4 && !(t > 8.8 && t < 9.9);
	const back = smooth(t, 1.0, 1.6);
	const pp = mixV(STAND_B, [-0.6, 0, -0.75], back);
	const pyaw = Math.atan2(FAN_POS[0] - STAND_B[0], FAN_POS[2] - STAND_B[2]);
	const toOwner = Math.atan2(STAND_B[0] - FAN_POS[0], STAND_B[2] - FAN_POS[2]) - FAN_YAW;
	const push = smooth(t, 2.8, 6);
	const fanFront = front(1, 1.3, toOwner * 0.6);
	return (
		<>
			<Cam pos={mixV([1.5, 1.8, 1.7], fanFront, push)} look={mixV([-0.5, 1.1, -1.5], HEAD, push)} fov={mix(44, 36, push)} />
			<Room t={t} wind={0} />
			<Person {...OWNER} position={pp} rotationY={pyaw} pose={{bend: -0.25 * back, armL: -2.2 * back, armR: -2.2 * back, spreadL: 0.5, spreadR: 0.5}} mouth={t > 0.9} />
			<Fan position={FAN_POS} yaw={FAN_YAW} headYaw={mix(0.2, toOwner, snap) + (talking ? Math.sin(t * 5) * 0.05 : 0)} headPitch={mix(0.75, -0.05, snap)} phase={40} btn={0} t={t} eye={mix(0.15, 1.5, snap)} brow={snap > 0.5 ? 1 : -1} mouth={talking ? 0.35 + 0.65 * Math.abs(Math.sin(t * 11)) : snap * 0.5} steam={t > 7.5 ? 1 : 0} />
		</>
	);
};

// ================= S8: the fan has the remote now =================
const FAN_BED: V = [BED.x, BED.top, BED.z - 0.3];
const RUN_A: V = [0.3, 0, -0.7];
const RUN_B: V = [BED.x + 1.05, 0, BED.z - 0.25];
export const S8: React.FC<{t: number}> = ({t}) => {
	const clicks = [5.3, 7.7, 9.9, 12.0];
	// owner: dash to the fan after each click, press, dash back
	let k = 0;
	for (const c of clicks) k = Math.max(k, smooth(t, c + 0.1, c + 0.8) * (1 - smooth(t, c + 1.3, c + 2.0)));
	const p = mixV(RUN_A, RUN_B, k);
	const moving = clicks.some((c) => (t > c + 0.1 && t < c + 0.8) || (t > c + 1.3 && t < c + 2.0));
	const toward = clicks.some((c) => t > c + 0.1 && t < c + 1.3);
	const ry = toward ? Math.atan2(RUN_B[0] - RUN_A[0], RUN_B[2] - RUN_A[2]) : Math.atan2(RUN_A[0] - RUN_B[0], RUN_A[2] - RUN_B[2]);
	const pressing = clicks.some((c) => t > c + 0.8 && t < c + 1.3);
	const lvl = clicks.filter((c) => t > c + 1.0).length;
	const speed = [0, 6, 12, 16, 9][lvl];
	const phase = t * speed;
	const signal = clicks.map((c) => ramp(t, c, c + 0.5)).find((x) => x > 0 && x < 1) ?? 0;
	const relax = smooth(t, 13.6, 14.6);
	return (
		<>
			<Cam pos={mixV([1.0, 2.4, 3.4], [0.7, 2.0, 2.6], smooth(t, 0, 16))} look={[-0.75, 1.0, -1.6]} fov={46} />
			<Room t={t} wind={speed / 16} />
			<Fan position={FAN_BED} yaw={0.6} headYaw={0} headPitch={mix(-0.25, -0.45, relax)} phase={phase} blur={Math.min(1, speed / 12)} shades btn={Math.min(3, lvl)} t={t} mouth={(t > 12.6 && t < 13.6) || (t > 14.1 && t < 15.2) ? 0.3 + 0.4 * Math.abs(Math.sin(t * 10)) : 0} s={0.85} />
			{/* the remote on the mattress, beaming a signal */}
			<group position={[FAN_BED[0] + 0.45, FAN_BED[1] + 0.03, FAN_BED[2] + 0.35]} rotation={[0, 0.4, 0]}>
				<mesh material={mat('#2a2a30')}>
					<boxGeometry args={[0.1, 0.04, 0.3]} />
				</mesh>
				<mesh position={[0, 0.025, 0.12]} material={mat('#ff4a3a', {emissive: '#ff3020', emissiveIntensity: signal > 0 ? 2 : 0.2})}>
					<sphereGeometry args={[0.015, 6, 5]} />
				</mesh>
				{signal > 0 ? (
					<mesh position={[0, 0.03, 0.15 + signal * 0.4]} scale={0.3 + signal} material={mat('#ffd84a', {transparent: true, opacity: 1 - signal, emissive: '#ffd84a', emissiveIntensity: 1, depthWrite: false})}>
						<torusGeometry args={[0.1, 0.008, 4, 18]} />
					</mesh>
				) : null}
			</group>
			<Person {...OWNER} position={p} rotationY={pressing ? Math.atan2(FAN_BED[0] - RUN_B[0], FAN_BED[2] - RUN_B[2]) : ry} pose={moving ? walk(t, 2.6) : pressing ? {armR: -1.3, bend: 0.45} : {armL: -0.3, armR: -0.3}} mouth={moving || (t > 11.8 && t < 12.8)} />
			{/* owner sweats too */}
			{Array.from({length: 3}).map((_, i) => {
				const q = (t * 1.5 + i / 3) % 1;
				return (
					<mesh key={i} position={[p[0] + (i - 1) * 0.15, 2.05 + q * 0.2 - q * q * 0.5, p[2]]} scale={1 - q * 0.5} material={mat('#8fd0ff', {emissive: '#4f9fd8', emissiveIntensity: 0.3})}>
						<sphereGeometry args={[0.025, 6, 5]} />
					</mesh>
				);
			})}
		</>
	);
};
export const O8: React.FC<{t: number}> = () => null;

// ================= S9: be kind to your fan... the aircon resigns =================
export const S9: React.FC<{t: number}> = ({t}) => {
	const fanP: V = [-0.1, 0, -2.1];
	const pat = t > 1.0 && t < 5.5 ? Math.max(0, Math.sin((t - 1.0) * 6)) : 0;
	const rise = smooth(t, 6.0, 10.6);
	const paper = smooth(t, 9.4, 10.4);
	const turn = smooth(t, 10.6, 11.2);
	return (
		<>
			<Cam pos={mixV([0.9, 1.5, 2.4], [0.2, 2.35, 0.6], rise)} look={mixV([-0.7, 1.0, -1.8], [AIRCON[0], AIRCON[1] - 0.25, AIRCON[2]], rise)} fov={mix(44, 40, rise)} />
			<Room t={t} tod={mix(0, 1, smooth(t, 0, 12))} wind={0.4} />
			<Person {...OWNER} position={[BED.x + 0.55, BED.top - 0.43, -1.45]} rotationY={0.9 - turn * 1.2} pose={{sit: true, armR: -1.2 + pat * 0.3, spreadR: -0.1, elbow: -0.4, headTurn: turn * -0.6}} mouth={t > 0.6 && t < 4.6 && Math.sin(t * 12) > 0} />
			<Fan position={fanP} yaw={-0.5} headYaw={-0.35 * (1 - turn) + turn * 0.6} headPitch={-0.1 - turn * 0.5} phase={t * 6} blur={0.5} btn={1} t={t} eye={turn > 0.5 ? 1.5 : 0.6} mouth={turn > 0.5 ? 0.8 : 0.2} />
			<Paper k={paper} t={t} />
		</>
	);
};
export const O9: React.FC<{t: number}> = ({t}) => {
	const o = interpolate(t, [10.6, 11.0, 13.0, 13.6], [0, 1, 1, 0], clampI);
	return (
		<AbsoluteFill style={{alignItems: 'center', paddingTop: 300, opacity: o}}>
			<div style={{position: 'relative', background: '#fbf8f0', borderRadius: 28, padding: '34px 56px', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', transform: `scale(${0.7 + 0.3 * o}) rotate(-3deg)`, textAlign: 'center'}}>
				<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 92, color: '#2a2420', lineHeight: 1}}>Resignation Letter</div>
				<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 52, color: '#6a5a48', marginTop: 12}}>mula kay Aircon</div>
				<div style={{position: 'absolute', top: -40, right: -30, width: 96, height: 96, borderRadius: 48, background: '#d33a2c', color: '#fff', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)'}}>?</div>
			</div>
		</AbsoluteFill>
	);
};
