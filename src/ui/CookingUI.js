export class CookingUI {
    constructor(cookingSystem, inventory) {
        this.cookingSystem = cookingSystem;
        this.inventory = inventory;
        this.selectedIngredients = [];
        this.selectedMethod = 'Boil';
        
        this.setupDOM();
    }

    setupDOM() {
        const modal = document.createElement('div');
        modal.id = 'cooking-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <h2>Village Fire - Cooking</h2>
            <div id="inventory-selection">
                <h3>Select Ingredients</h3>
                <div id="ing-list" class="flex-row"></div>
            </div>
            <div id="method-selection">
                <h3>Select Method</h3>
                <button class="method-btn active" data-method="Boil">Boil</button>
                <button class="method-btn" data-method="Roast">Roast</button>
                <button class="method-btn" data-method="Smoke">Smoke</button>
            </div>
            <div id="selection-summary">
                Selected: <span id="current-selection">None</span>
            </div>
            <div id="cooking-result" style="color: #f1c40f; margin-top: 10px; font-weight: bold;"></div>
            <div class="modal-actions">
                <button id="cook-btn">Cook!</button>
                <button id="close-cooking">Close</button>
            </div>
        `;
        document.getElementById('ui-layer').appendChild(modal);

        this.modal = modal;
        this.ingList = modal.querySelector('#ing-list');
        
        modal.querySelectorAll('.method-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedMethod = btn.dataset.method;
            });
        });

        modal.querySelector('#cook-btn').addEventListener('click', () => this.handleCook());
        modal.querySelector('#close-cooking').addEventListener('click', () => this.hide());
    }

    show() {
        this.selectedIngredients = [];
        document.getElementById('cooking-result').textContent = '';
        this.modal.classList.remove('hidden');
        this.renderIngredients();
        this.updateSummary();
    }

    hide() {
        this.modal.classList.add('hidden');
        window.dispatchEvent(new CustomEvent('cooking-closed'));
    }

    renderIngredients() {
        this.ingList.innerHTML = '';
        const items = this.inventory.items;
        Object.keys(items).forEach(name => {
            for (let i = 0; i < items[name]; i++) {
                const btn = document.createElement('button');
                btn.className = 'ing-btn';
                btn.textContent = name;
                btn.addEventListener('click', () => {
                   if (btn.classList.toggle('selected')) {
                       this.selectedIngredients.push(name);
                   } else {
                       const idx = this.selectedIngredients.indexOf(name);
                       if (idx > -1) this.selectedIngredients.splice(idx, 1);
                   }
                   this.updateSummary();
                });
                this.ingList.appendChild(btn);
            }
        });
    }

    updateSummary() {
        document.getElementById('current-selection').textContent = 
            this.selectedIngredients.length > 0 ? this.selectedIngredients.join(', ') : 'None';
    }

    handleCook() {
        if (this.selectedIngredients.length === 0) {
            document.getElementById('cooking-result').textContent = "Please select ingredients first.";
            return;
        }
        
        const result = this.cookingSystem.cook(this.selectedIngredients, this.selectedMethod);
        
        if (result.name !== 'Failed Dish') {
            this.inventory.addItem(result.name);
            document.getElementById('cooking-result').textContent = `Success! You made ${result.name}.`;
            document.getElementById('cooking-result').style.color = "#2ecc71";
        } else {
            document.getElementById('cooking-result').textContent = `Failed combination! Ingredients lost.`;
            document.getElementById('cooking-result').style.color = "#e74c3c";
        }
        
        this.selectedIngredients = [];
        this.updateSummary();
        this.renderIngredients();
    }
}
