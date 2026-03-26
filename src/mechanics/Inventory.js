export class Inventory {
    constructor() {
        this.items = {};
    }

    addItem(name) {
        if (!this.items[name]) this.items[name] = 0;
        this.items[name]++;
        this.updateUI();
    }

    removeItem(name) {
        if (this.items[name] > 0) {
            this.items[name]--;
            if (this.items[name] === 0) delete this.items[name];
        }
        this.updateUI();
    }

    updateUI() {
        const statsDiv = document.getElementById('stats');
        // Clear existing ingredient displays
        const existing = statsDiv.querySelectorAll('.inv-item');
        existing.forEach(e => e.remove());

        Object.keys(this.items).forEach(name => {
            const div = document.createElement('div');
            div.className = 'stat inv-item';
            div.textContent = `${name}: ${this.items[name]}`;
            statsDiv.appendChild(div);
        });
    }
}
