import {useLayoutEffect, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

// Render-speed helper: every frame, gather all opaque, flat-shaded meshes that
// share the same geometry shape and the same material object, hide them, and
// draw each group as one InstancedMesh. Same geometry, material and world
// matrices, so the picture is unchanged; only the number of draw calls drops.
// Transparent and smooth-shaded meshes are left alone (draw order and normal
// handling could otherwise differ).
const geoKey = (g: THREE.BufferGeometry) => g.type + JSON.stringify((g as unknown as {parameters?: unknown}).parameters ?? g.uuid);

export const AutoBatch: React.FC<{enabled?: boolean}> = ({enabled = true}) => {
	const {scene} = useThree();
	const pool = useRef(new Map<string, THREE.InstancedMesh>());
	useLayoutEffect(() => {
		const batches = pool.current;
		if (!enabled) {
			batches.forEach((b) => (b.count = 0));
			return;
		}
		scene.updateMatrixWorld(true);
		const groups = new Map<string, {geo: THREE.BufferGeometry; mat: THREE.Material; mats: THREE.Matrix4[]}>();
		scene.traverse((o) => {
			const m = o as THREE.Mesh;
			if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh || m.userData.isBatch) return;
			const mat = m.material as THREE.MeshStandardMaterial;
			if (Array.isArray(mat) || mat.transparent || !mat.flatShading) return;
			// a mesh counts only if it and all its ancestors are meant to be visible
			let shown = m.userData.batched ? m.userData.wasVisible : m.visible;
			for (let p = m.parent; p && shown; p = p.parent) shown = p.visible;
			if (!m.userData.batched) {
				m.userData.batched = true;
				m.userData.wasVisible = m.visible;
			}
			m.visible = false;
			if (!shown) return;
			const key = geoKey(m.geometry) + '|' + mat.uuid;
			let g = groups.get(key);
			if (!g) groups.set(key, (g = {geo: m.geometry, mat, mats: []}));
			g.mats.push(m.matrixWorld.clone());
		});
		batches.forEach((b) => (b.count = 0));
		groups.forEach((g, key) => {
			let b = batches.get(key);
			if (!b || b.instanceMatrix.count < g.mats.length) {
				if (b) scene.remove(b);
				b = new THREE.InstancedMesh(g.geo, g.mat, Math.max(16, g.mats.length * 2));
				b.userData.isBatch = true;
				b.frustumCulled = false;
				batches.set(key, b);
				scene.add(b);
			}
			g.mats.forEach((mx, i) => b!.setMatrixAt(i, mx));
			b.count = g.mats.length;
			b.instanceMatrix.needsUpdate = true;
		});
	});
	return null;
};
