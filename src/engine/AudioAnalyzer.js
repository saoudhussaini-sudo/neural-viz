export class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyzer = null;
        this.dataArray = null;
        this.source = null;
        this.isActive = false;
        this.frequencyData = {
            bass: 0,
            mid: 0,
            high: 0
        };
    }

    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.analyzer = this.audioContext.createAnalyser();
            this.analyzer.fftSize = 256;
            
            const bufferLength = this.analyzer.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.source.connect(this.analyzer);
            this.isActive = true;
            return true;
        } catch (err) {
            console.error('Audio initialization failed:', err);
            return false;
        }
    }

    update() {
        if (!this.isActive) return;
        this.analyzer.getByteFrequencyData(this.dataArray);

        // Map frequency bands
        let bass = 0;
        let mid = 0;
        let high = 0;

        const len = this.dataArray.length;
        for (let i = 0; i < len; i++) {
            if (i < len * 0.3) bass += this.dataArray[i];
            else if (i < len * 0.6) mid += this.dataArray[i];
            else high += this.dataArray[i];
        }

        this.frequencyData.bass = (bass / (len * 0.3)) / 255;
        this.frequencyData.mid = (mid / (len * 0.3)) / 255;
        this.frequencyData.high = (high / (len * 0.4)) / 255;
    }

    getBars() {
        return this.dataArray;
    }
}
