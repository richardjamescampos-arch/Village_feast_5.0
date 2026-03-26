export class QTEUI {
    constructor() {
        this.isActive = false;
        this.onSuccess = null;
        this.onFail = null;
        this.stage = 1;
        this.maxStages = 3;
        this.angle = 0;
        this.speed = 0;
        this.zoneStart = 0;
        this.zoneEnd = 0;
        this.rafId = null;
        
        this.setupDOM();
    }

    setupDOM() {
        const container = document.createElement('div');
        container.id = 'qte-container';
        container.className = 'hidden';
        container.innerHTML = `
            <div id="qte-instruction">HIT SPACE IN GREEN! (1/3)</div>
            <div id="qte-spinner-container">
                <div id="qte-spinner-zone"></div>
                <div id="qte-spinner-pointer"></div>
            </div>
        `;
        document.getElementById('ui-layer').appendChild(container);
        this.container = container;
        this.instruction = container.querySelector('#qte-instruction');
        this.zoneEl = container.querySelector('#qte-spinner-zone');
        this.pointerEl = container.querySelector('#qte-spinner-pointer');

        window.addEventListener('keydown', (e) => {
            if (this.isActive && (e.code === 'Space' || e.code === 'KeyE')) {
                e.preventDefault();
                this.checkHit();
            }
        });
        
        setTimeout(() => {
            window.addEventListener('click', (e) => {
                if (this.isActive && e.isTrusted) {
                    this.checkHit();
                }
            });
        }, 100);
    }

    start(onSuccess, onFail) {
        if (this.isActive) return;
        this.isActive = true;
        this.onSuccess = onSuccess;
        this.onFail = onFail;
        this.stage = 1;
        this.maxStages = 3;
        this.container.classList.remove('hidden');
        
        this.loadStage();
        this.updateLoop();
    }

    loadStage() {
        this.angle = 0;
        this.speed = 3 + (this.stage * 1.5); // Avança mais rápido a cada estágio
        this.instruction.innerText = `HIT SPACE IN GREEN! (${this.stage}/${this.maxStages})`;
        
        const zoneLength = 90 - (this.stage * 15); // A fatia verde diminui
        this.zoneStart = 45 + Math.random() * (360 - 90 - zoneLength); 
        this.zoneEnd = this.zoneStart + zoneLength;
        
        this.zoneEl.style.background = `conic-gradient(from ${this.zoneStart}deg, #2ecc71 0deg, #2ecc71 ${zoneLength}deg, transparent ${zoneLength}deg)`;
    }

    updateLoop() {
        if (!this.isActive) return;
        
        this.angle += this.speed;
        
        if (this.angle > 360) {
            this.angle = 360;
            this.pointerEl.style.transform = `rotate(${this.angle}deg)`;
            this.fail();
            return;
        }
        
        this.pointerEl.style.transform = `rotate(${this.angle}deg)`;
        this.rafId = requestAnimationFrame(() => this.updateLoop());
    }

    checkHit() {
        if (!this.isActive) return;
        
        if (this.angle >= this.zoneStart && this.angle <= this.zoneEnd) {
            if (this.stage >= this.maxStages) {
                this.success();
            } else {
                this.stage++;
                this.loadStage();
            }
        } else {
            this.fail();
        }
    }

    success() {
        this.isActive = false;
        cancelAnimationFrame(this.rafId);
        this.container.classList.add('hidden');
        if (this.onSuccess) this.onSuccess();
    }

    fail() {
        this.isActive = false;
        cancelAnimationFrame(this.rafId);
        this.container.classList.add('hidden');
        if (this.onFail) this.onFail();
    }
}
