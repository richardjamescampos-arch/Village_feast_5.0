export class FoodCodexUI {
    constructor(cookingSystem) {
        this.cookingSystem = cookingSystem;
        this.window = document.getElementById('codex-window');
        this.list = document.getElementById('recipe-list');
    }

    toggle() {
        this.window.classList.toggle('hidden');
        if (!this.window.classList.contains('hidden')) {
            this.render();
        }
    }

    render() {
        this.list.innerHTML = '';
        const discovered = this.cookingSystem.discoveredRecipes;
        
        if (discovered.length === 0) {
            this.list.innerHTML = '<p>No recipes discovered yet. Start experimenting at the Village Fire!</p>';
            return;
        }

        discovered.forEach(name => {
            const recipeInfo = this.cookingSystem.getRecipeInfo(name);
            const div = document.createElement('div');
            div.className = 'recipe-entry';
            div.innerHTML = `
                <h3>${name}</h3>
                <p>Ingredients: ${recipeInfo.ingredients.join(', ')}</p>
                <p>Method: ${recipeInfo.method}</p>
                <p>Effect: ${recipeInfo.bonus}</p>
            `;
            this.list.appendChild(div);
        });
    }
}
