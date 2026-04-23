import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class SceneManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });

        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupControls();
        this.onWindowResize();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x050508, 1);
    }

    setupCamera() {
        this.camera.position.set(0, 50, 150);
        this.scene.add(this.camera);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x00f2ff, 1, 500);
        pointLight.position.set(50, 50, 50);
        this.scene.add(pointLight);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.maxDistance = 800;
        this.controls.minDistance = 20;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    setQuality(level) {
        switch(level) {
            case 'low':
                this.renderer.setPixelRatio(1);
                this.renderer.antialias = false;
                break;
            case 'medium':
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.antialias = true;
                break;
            case 'high':
                this.renderer.setPixelRatio(Math.max(window.devicePixelRatio, 2));
                this.renderer.antialias = true;
                break;
        }
    }
}
