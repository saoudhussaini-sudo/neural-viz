import * as THREE from 'three';

export class Background {
    constructor(scene) {
        this.scene = scene;
        this.stars = null;
        this.init();
    }

    init() {
        const vertices = [];
        for (let i = 0; i < 2000; i++) {
            const x = THREE.MathUtils.randFloatSpread(2000);
            const y = THREE.MathUtils.randFloatSpread(2000);
            const z = THREE.MathUtils.randFloatSpread(2000);
            vertices.push(x, y, z);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.7,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    update(time) {
        if (this.stars) {
            this.stars.rotation.y = time * 0.00005;
            this.stars.rotation.x = time * 0.00002;
        }
    }
}
