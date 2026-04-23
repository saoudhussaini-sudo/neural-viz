import './style.css';
import * as THREE from 'three';
import { SceneManager } from './engine/SceneManager';
import { NetworkGraph } from './engine/NetworkGraph';
import { Background } from './engine/Background';
import { AudioAnalyzer } from './engine/AudioAnalyzer';
import { PerformanceManager } from './engine/PerformanceManager';

class App {
    constructor() {
        this.sceneManager = new SceneManager('canvas-3d');
        this.background = new Background(this.sceneManager.scene);
        this.graph = new NetworkGraph(this.sceneManager.scene);
        this.audio = new AudioAnalyzer();
        this.perf = new PerformanceManager(this);

        this.ui = {
            fps: document.getElementById('fps-counter'),
            modeBtns: document.querySelectorAll('.mode-btn'),
            quality: document.getElementById('quality-select'),
            density: document.getElementById('density-slider'),
            nodeVal: document.getElementById('node-val'),
            speed: document.getElementById('speed-slider'),
            glow: document.getElementById('glow-toggle'),
            trails: document.getElementById('trails-toggle'),
            regenerate: document.getElementById('regenerate-btn'),
            audioToggle: document.getElementById('audio-toggle'),
            modeDisplayName: document.getElementById('mode-display-name'),
            modePurpose: document.getElementById('mode-purpose'),
            modeExampleTitle: document.getElementById('mode-example-title'),
            modeExampleDesc: document.getElementById('mode-example-desc'),
            nodeDetails: document.getElementById('node-details'),
            fileInput: document.getElementById('file-input')
        };

        this.state = {
            lastTime: 0,
            frameCount: 0,
            fpsUpdateInterval: 1000,
            lastFpsUpdate: 0,
            speed: 1.5,
            fps: 60,
            audioActive: false
        };

        this.modeData = {
            graph: { name: "Graph Mode", purpose: "Unstructured relational data mapping.", example: "Social Networks", desc: "Identifying community clusters." },
            neural: { name: "Pathway Mode", purpose: "Sequential data flow in AI architectures.", example: "Neural Networks", desc: "Visualizing activation pathways." },
            orbital: { name: "Orbital Mode", purpose: "Hierarchical systems around central nodes.", example: "Cloud Clusters", desc: "Server nodes orbiting load balancers." },
            flow: { name: "Flow Field", purpose: "Dynamic movement of high-velocity data.", example: "Stock Market", desc: "Visualizing rapid price fluctuations." },
            spiral: { name: "Spiral Mode", purpose: "Temporal data trends and cycles.", example: "Economic Data", desc: "Tracking growth over decades." },
            radial: { name: "Radial Mode", purpose: "Hub-and-spoke structural distributions.", example: "File Systems", desc: "Mapping root to leaf directories." }
        };

        this.init();
        this.animate();
    }

    init() {
        // Mode Selector
        this.ui.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.graph.setMode(mode);
                this.updateModeUI(mode);
                this.ui.modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Audio Toggle
        this.ui.audioToggle.addEventListener('click', async () => {
            if (!this.state.audioActive) {
                const success = await this.audio.init();
                if (success) {
                    this.state.audioActive = true;
                    this.ui.audioToggle.classList.add('active');
                }
            } else {
                this.state.audioActive = false;
                this.ui.audioToggle.classList.remove('active');
            }
        });

        // Performance Controls
        this.ui.quality.addEventListener('change', (e) => this.sceneManager.setQuality(e.target.value));
        this.ui.density.addEventListener('input', (e) => {
            this.ui.nodeVal.textContent = e.target.value;
        });
        this.ui.regenerate.addEventListener('click', () => this.triggerRegenerate());
        this.ui.speed.addEventListener('input', (e) => this.state.speed = parseFloat(e.target.value));
        
        this.ui.glow.addEventListener('change', (e) => {
            if (this.graph.nodeMesh) {
                this.graph.nodeMesh.material.opacity = e.target.checked ? 0.9 : 0.5;
            }
        });

        // File Upload
        this.ui.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        window.addEventListener('click', () => this.handleNodeClick());
        
        // Use event delegation for close button to be safe
        document.addEventListener('click', (e) => {
            if (e.target.id === 'close-details') {
                this.ui.nodeDetails.style.display = 'none';
            }
        });
    }

    updateModeUI(mode) {
        const data = this.modeData[mode];
        if (!data) return;
        this.ui.modeDisplayName.textContent = data.name;
        this.ui.modePurpose.textContent = data.purpose;
        this.ui.modeExampleTitle.textContent = data.example;
        this.ui.modeExampleDesc.textContent = data.desc;
    }

    triggerRegenerate() {
        this.graph.nodeCount = parseInt(this.ui.density.value);
        this.graph.dispose();
        this.graph.init();
        const activeBtn = document.querySelector('.mode-btn.active');
        if (activeBtn) {
            this.graph.setMode(activeBtn.dataset.mode, false);
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                console.log('Custom data loaded:', data);
            } catch (err) {
                alert('Invalid JSON file. Please use a simple structure.');
            }
        };
        reader.readAsText(file);
    }

    handleNodeClick() {
        if (!this.graph.nodeMesh) return;
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObject(this.graph.nodeMesh);
        if (intersects.length > 0) {
            const id = intersects[0].instanceId;
            this.ui.nodeDetails.style.display = 'block';
            document.getElementById('node-title').textContent = `NODE_0x${id.toString(16).toUpperCase()}`;
            document.getElementById('node-activity').textContent = `${Math.floor(Math.random() * 40 + 60)}%`;
            document.getElementById('node-latency').textContent = `${Math.floor(Math.random() * 20 + 5)}ms`;
        }
    }

    animate(time = 0) {
        requestAnimationFrame((t) => this.animate(t));
        
        // FPS Calc
        this.state.frameCount++;
        if (time - this.state.lastFpsUpdate > this.state.fpsUpdateInterval) {
            this.state.fps = Math.round((this.state.frameCount * 1000) / (time - this.state.lastFpsUpdate));
            this.ui.fps.textContent = this.state.fps;
            this.state.frameCount = 0;
            this.state.lastFpsUpdate = time;
        }

        // Update Systems
        if (this.state.audioActive) this.audio.update();
        this.perf.update(time, this.state.fps);
        this.graph.update(time, this.state, this.state.audioActive ? this.audio.frequencyData : null);
        this.background.update(time);
        this.sceneManager.update();
        
        // Audio Viz UI
        if (this.state.audioActive) {
            this.updateAudioVizUI();
        }
    }

    updateAudioVizUI() {
        const bars = this.audio.getBars();
        const container = document.querySelector('.bar-container');
        if (!container) return;
        
        if (!container.children.length) {
            for (let i = 0; i < 32; i++) {
                const bar = document.createElement('div');
                bar.className = 'audio-bar';
                container.appendChild(bar);
            }
        }
        for (let i = 0; i < 32; i++) {
            const val = bars[i * 4] / 255;
            container.children[i].style.height = `${val * 100}%`;
        }
    }
}

new App();
