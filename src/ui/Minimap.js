export class Minimap {
    constructor() {
        this.canvas = document.getElementById('minimap');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 150;
        this.canvas.height = 150;
    }

    update(playerPos, villagePos, zoom = 0.5) {
        this.ctx.clearRect(0, 0, 150, 150);
        
        // Background
        this.ctx.fillStyle = 'rgba(26, 26, 26, 0.8)';
        this.ctx.fillRect(0, 0, 150, 150);

        const centerX = 75;
        const centerY = 75;

        // Village
        if (villagePos) {
            let vx = (villagePos.x - playerPos.x) * zoom + centerX;
            let vz = (villagePos.z - playerPos.z) * zoom + centerY;
            
            const dx = vx - centerX;
            const dy = vz - centerY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const maxRadius = 65;
            
            if (dist > maxRadius) {
                vx = centerX + (dx / dist) * maxRadius;
                vz = centerY + (dy / dist) * maxRadius;
            }
            
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.beginPath();
            this.ctx.arc(vx, vz, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('Village', vx - 20, vz - 10);
        }

        // Player (Center)
        this.ctx.fillStyle = '#c0392b';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - 8);
        this.ctx.lineTo(centerX + 5, centerY + 5);
        this.ctx.lineTo(centerX - 5, centerY + 5);
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = '#ecf0f1';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, 150, 150);
    }
}
