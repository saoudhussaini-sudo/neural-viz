export class PerformanceManager {
    constructor(app) {
        this.app = app;
        this.fpsThresholds = {
            low: 30,
            target: 55
        };
        this.checkInterval = 2000; // Check every 2s
        this.lastCheck = 0;
        this.isOptimizing = true;
    }

    update(time, fps) {
        if (!this.isOptimizing) return;
        
        if (time - this.lastCheck > this.checkInterval) {
            this.optimize(fps);
            this.lastCheck = time;
        }
    }

    optimize(fps) {
        if (fps < this.fpsThresholds.low) {
            this.downgrade();
        } else if (fps > this.fpsThresholds.target) {
            this.maybeUpgrade();
        }
    }

    downgrade() {
        // Auto reduce effects if lagging
        const quality = this.app.ui.quality.value;
        if (quality === 'high') {
            this.app.ui.quality.value = 'medium';
            this.app.sceneManager.setQuality('medium');
        } else if (quality === 'medium') {
            this.app.ui.quality.value = 'low';
            this.app.sceneManager.setQuality('low');
            this.app.ui.glow.checked = false;
        }
        
        // Reduce node count slightly if at high end
        const density = parseInt(this.app.ui.density.value);
        if (density > 500) {
            this.app.ui.density.value = Math.max(300, density - 200);
            this.app.ui.nodeVal.textContent = this.app.ui.density.value;
            this.app.triggerRegenerate();
        }
    }

    maybeUpgrade() {
        // We generally don't auto-upgrade to avoid jitter, 
        // but we can allow more particles if the user is at low settings
    }
}
