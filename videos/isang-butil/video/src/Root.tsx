import React from 'react';
import {Composition} from 'remotion';
import {IsangButil, TOTAL} from './Video';
import {FPS, H, W} from './kit';
import {ChannelCover, Mascot, Portrait, SceneStill} from './Brand';
import {Thumbnail} from './Thumbnail';

export const Root: React.FC = () => (
	<>
		<Composition id="IsangButil" component={IsangButil} durationInFrames={TOTAL * FPS} fps={FPS} width={W} height={H} />
		<Composition id="Preview" component={IsangButil} durationInFrames={TOTAL * 15} fps={15} width={W} height={H} />
		<Composition id="Profile" component={SceneStill} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{scene: 'S3', t: 11.8, width: 1080, height: 1080}} />
		<Composition id="Portrait" component={Portrait} durationInFrames={1} fps={FPS} width={1080} height={1080} />
		<Composition id="ProfileAlt" component={SceneStill} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{scene: 'S4', t: 2.4, width: 1080, height: 1080}} />
		<Composition id="Cover" component={SceneStill} durationInFrames={1} fps={FPS} width={1640} height={624} defaultProps={{scene: 'S1', t: 13.5, width: 1640, height: 624}} />
		<Composition id="CoverAlt" component={SceneStill} durationInFrames={1} fps={FPS} width={1640} height={624} defaultProps={{scene: 'S3', t: 8.5, width: 1640, height: 624}} />
		<Composition id="Mascot" component={Mascot} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{hat: false}} />
		<Composition id="MascotHat" component={Mascot} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{hat: true}} />
		<Composition id="ChannelCover" component={ChannelCover} durationInFrames={1} fps={FPS} width={1640} height={624} />
		{[
			{id: 'ThumbA', scene: 'S3', t: 11.6},
			{id: 'ThumbB', scene: 'S1', t: 13.8},
			{id: 'ThumbC', scene: 'S4', t: 2.6},
		].map((c) => (
			<Composition key={c.id} id={c.id} component={Thumbnail} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{scene: c.scene, t: c.t, title: 'Isang', gold: 'Butil', sub: 'Ang mahabang paglalakbay ng bigas'}} />
		))}
	</>
);
