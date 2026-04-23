import * as THREE from 'three';

export class NetworkGraph {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.nodeCount = options.nodeCount || 400;
        this.connectionDensity = options.connectionDensity || 2;
        this.nodes = [];
        this.edges = [];
        
        this.nodeMesh = null;
        this.lineMesh = null;
        this.pulseMesh = null;
        this.pulseData = [];

        this.currentMode = 'graph';
        this.transitionProgress = 1;
        this.transitioning = false;

        this.dummy = new THREE.Object3D();

        this.colors = {
            node: new THREE.Color(0x00f2ff),
            edge: new THREE.Color(0x004466),
            pulse: new THREE.Color(0xffffff)
        };

        this.init();
    }

    init() {
        this.generateData();
        this.createNodeMesh();
        this.createEdgeMesh();
        this.createPulseMesh();
        this.setMode('graph', false);
    }

    generateData() {
        this.nodes = [];
        for (let i = 0; i < this.nodeCount; i++) {
            this.nodes.push({
                id: i,
                currentPos: new THREE.Vector3(0, 0, 0),
                targetPos: new THREE.Vector3(0, 0, 0),
                startPos: new THREE.Vector3(0, 0, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                cluster: Math.floor(Math.random() * 5),
                offset: Math.random() * 100,
                speed: 0.1 + Math.random() * 0.5
            });
        }
        this.generateEdges();
    }

    generateEdges() {
        this.edges = [];
        for (let i = 0; i < this.nodeCount; i++) {
            const count = Math.floor(Math.random() * this.connectionDensity) + 1;
            for (let j = 0; j < count; j++) {
                const targetId = Math.floor(Math.random() * this.nodeCount);
                if (targetId !== i) {
                    this.edges.push({ from: i, to: targetId });
                }
            }
        }
        this.pulseData = this.edges.map(edge => ({
            edge, progress: Math.random(), speed: 0.005 + Math.random() * 0.01, active: Math.random() > 0.5
        }));
    }

    setMode(mode, animate = true) {
        this.currentMode = mode;
        this.transitionProgress = 0;
        this.transitioning = animate;

        const radius = 150;
        
        this.nodes.forEach((node, i) => {
            node.startPos.copy(node.currentPos);
            
            switch(mode) {
                case 'graph':
                    node.targetPos.set((Math.random()-0.5)*radius*2.5, (Math.random()-0.5)*radius*2.5, (Math.random()-0.5)*radius*2.5);
                    break;
                
                case 'neural':
                    const layers = 8;
                    const layer = i % layers;
                    const layerSize = 120;
                    node.targetPos.set((layer - layers/2)*60, (Math.random()-0.5)*layerSize*1.5, (Math.random()-0.5)*layerSize*1.5);
                    break;

                case 'orbital':
                    const orbitRadius = 40 + (node.cluster * 40);
                    const angle = (i / (this.nodeCount/5)) * Math.PI * 2;
                    node.targetPos.set(Math.cos(angle)*orbitRadius, Math.sin(angle)*orbitRadius, (Math.random()-0.5)*20);
                    break;

                case 'flow':
                    node.targetPos.set((Math.random()-0.5)*500, (Math.random()-0.5)*100, (Math.random()-0.5)*500);
                    break;

                case 'spiral':
                    const phi = Math.acos(-1 + (2 * i) / this.nodeCount);
                    const theta = Math.sqrt(this.nodeCount * Math.PI) * phi;
                    node.targetPos.set(radius*Math.cos(theta)*Math.sin(phi), i*0.5 - (this.nodeCount*0.25), radius*Math.sin(theta)*Math.sin(phi));
                    break;

                case 'radial':
                    const r = 20 + (i / this.nodeCount) * 200;
                    const a = (i / this.nodeCount) * Math.PI * 20;
                    node.targetPos.set(Math.cos(a)*r, Math.sin(a)*r, (Math.random()-0.5)*20);
                    break;
            }

            if (!animate) node.currentPos.copy(node.targetPos);
        });

        if (!animate) {
            this.transitionProgress = 1;
            this.updateMeshes(0);
        }
    }

    update(time, state, audioData) {
        const speed = state.speed;
        const audio = audioData || { bass: 0, mid: 0, high: 0 };

        if (this.transitioning) {
            this.transitionProgress += 0.02;
            if (this.transitionProgress >= 1) {
                this.transitionProgress = 1;
                this.transitioning = false;
            }
            const ease = 1 - Math.pow(1 - this.transitionProgress, 3);
            this.nodes.forEach(node => {
                node.currentPos.lerpVectors(node.startPos, node.targetPos, ease);
            });
        } else {
            // Dynamic motion
            this.nodes.forEach((node, i) => {
                const t = time * 0.001 * speed;
                const audioPulse = audio.bass * 20;

                switch(this.currentMode) {
                    case 'orbital':
                        const orbitRadius = 40 + (node.cluster * 40) + audioPulse;
                        const angle = (i / (this.nodeCount/5)) * Math.PI * 2 + t * node.speed;
                        node.currentPos.set(Math.cos(angle)*orbitRadius, Math.sin(angle)*orbitRadius, Math.sin(t + node.offset)*10);
                        break;
                    case 'flow':
                        node.currentPos.x += Math.cos(t + node.currentPos.z * 0.01) * 0.5;
                        node.currentPos.z += Math.sin(t + node.currentPos.x * 0.01) * 0.5;
                        node.currentPos.y = Math.sin(t * 0.5 + i) * 20 + audio.mid * 50;
                        break;
                    case 'graph':
                        node.currentPos.y += Math.sin(t + node.offset) * 0.1;
                        break;
                }
            });
        }

        this.updateMeshes(audio.bass);
        this.updatePulses(time, speed, audio.high);
    }

    updateMeshes(bass) {
        if (!this.nodeMesh || !this.lineMesh) return;
        
        const scale = 1 + bass * 0.5;

        this.nodes.forEach((node, i) => {
            this.dummy.position.copy(node.currentPos);
            this.dummy.scale.set(scale, scale, scale);
            this.dummy.updateMatrix();
            this.nodeMesh.setMatrixAt(i, this.dummy.matrix);
        });
        this.nodeMesh.instanceMatrix.needsUpdate = true;

        const positions = this.lineMesh.geometry.attributes.position.array;
        let idx = 0;
        this.edges.forEach((edge) => {
            const from = this.nodes[edge.from].currentPos;
            const to = this.nodes[edge.to].currentPos;
            positions[idx++] = from.x;
            positions[idx++] = from.y;
            positions[idx++] = from.z;
            positions[idx++] = to.x;
            positions[idx++] = to.y;
            positions[idx++] = to.z;
        });
        this.lineMesh.geometry.attributes.position.needsUpdate = true;
    }

    updatePulses(time, speed, high) {
        if (!this.pulseMesh) return;
        const pulseSpeed = speed * (1 + high);

        this.pulseData.forEach((pulse, i) => {
            if (pulse.active) {
                pulse.progress += pulse.speed * pulseSpeed;
                if (pulse.progress > 1) {
                    pulse.progress = 0;
                    pulse.active = Math.random() > 0.2;
                }
                const from = this.nodes[pulse.edge.from].currentPos;
                const to = this.nodes[pulse.edge.to].currentPos;
                this.dummy.position.lerpVectors(from, to, pulse.progress);
                this.dummy.scale.setScalar(0.5 + high);
                this.dummy.updateMatrix();
                this.pulseMesh.setMatrixAt(i, this.dummy.matrix);
            } else {
                this.dummy.scale.setScalar(0);
                this.dummy.updateMatrix();
                this.pulseMesh.setMatrixAt(i, this.dummy.matrix);
                if (Math.random() > 0.995) pulse.active = true;
            }
        });
        this.pulseMesh.instanceMatrix.needsUpdate = true;
    }

    createNodeMesh() {
        const geometry = new THREE.SphereGeometry(0.7, 6, 6);
        const material = new THREE.MeshBasicMaterial({ color: this.colors.node, transparent: true, opacity: 0.9 });
        this.nodeMesh = new THREE.InstancedMesh(geometry, material, this.nodeCount);
        this.scene.add(this.nodeMesh);
    }

    createPulseMesh() {
        const geometry = new THREE.SphereGeometry(0.35, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: this.colors.pulse, transparent: true, opacity: 0.8 });
        this.pulseMesh = new THREE.InstancedMesh(geometry, material, this.edges.length);
        this.scene.add(this.pulseMesh);
    }

    createEdgeMesh() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.edges.length * 6);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({ color: this.colors.edge, transparent: true, opacity: 0.1 });
        this.lineMesh = new THREE.LineSegments(geometry, material);
        this.scene.add(this.lineMesh);
    }

    dispose() {
        [this.nodeMesh, this.lineMesh, this.pulseMesh].forEach(mesh => {
            if (mesh) {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
        });
    }
}
