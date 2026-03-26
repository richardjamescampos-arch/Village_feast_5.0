export const METHODS = {
    ROAST: 'Roast',
    BOIL: 'Boil',
    SMOKE: 'Smoke'
};

export const RECIPES = [
    {
        name: 'Rustic Stew',
        ingredients: ['Raw Meat', 'Wild Herb'],
        method: METHODS.BOIL,
        bonus: '+20 Hunger, +10 Village Moral'
    },
    {
        name: 'Roasted Berries',
        ingredients: ['Red Berries'],
        method: METHODS.ROAST,
        bonus: '+5 Hunger'
    },
    {
        name: 'Herb Infusion',
        ingredients: ['Wild Herb', 'Mushroom'],
        method: METHODS.BOIL,
        bonus: '+10 Health, +5 Moral'
    },
    {
        name: 'Smoked Meat',
        ingredients: ['Raw Meat'],
        method: METHODS.SMOKE,
        bonus: '+30 Hunger'
    },
    {
        name: 'Baked Apple',
        ingredients: ['Apple'],
        method: METHODS.ROAST,
        bonus: '+10 Hunger'
    },
    {
        name: 'Fruit Salad',
        ingredients: ['Apple', 'Orange', 'Red Berries'],
        method: METHODS.BOIL,
        bonus: '+25 Hunger, +15 Moral'
    },
    {
        name: 'Smoked Orange',
        ingredients: ['Orange'],
        method: METHODS.SMOKE,
        bonus: '+15 Hunger'
    }
];

export class CookingSystem {
    constructor(inventory, villageManager) {
        this.inventory = inventory;
        this.villageManager = villageManager;
        this.discoveredRecipes = JSON.parse(localStorage.getItem('foodCodex')) || [];
    }

    cook(selectedIngredients, method) {
        // 85% de chance de dar certo e ser o prato que um villager pediu
        if (Math.random() < 0.85 && this.villageManager && this.villageManager.npcs.length > 0) {
            const randomNPC = this.villageManager.npcs[Math.floor(Math.random() * this.villageManager.npcs.length)];
            const targetRecipeName = randomNPC.userData.requestedFood || RECIPES[0].name;
            const recipe = RECIPES.find(r => r.name === targetRecipeName);
            
            console.log("Success (85% Forced)! Cooked:", recipe.name);
            if (!this.discoveredRecipes.includes(recipe.name)) {
                this.discoveredRecipes.push(recipe.name);
                localStorage.setItem('foodCodex', JSON.stringify(this.discoveredRecipes));
            }
            selectedIngredients.forEach(ing => this.inventory.removeItem(ing));
            return recipe;
        }

        // Restante dos 15% segue a lógica normal de combinar receitas
        // Sort ingredients to match recipe easily
        const sortedSelected = [...selectedIngredients].sort();
        
        const recipe = RECIPES.find(r => {
            if (r.method !== method) return false;
            if (r.ingredients.length !== sortedSelected.length) return false;
            const sortedRecipeIngs = [...r.ingredients].sort();
            return sortedRecipeIngs.every((ing, index) => ing === sortedSelected[index]);
        });

        if (recipe) {
            console.log("Success! Cooked:", recipe.name);
            if (!this.discoveredRecipes.includes(recipe.name)) {
                this.discoveredRecipes.push(recipe.name);
                localStorage.setItem('foodCodex', JSON.stringify(this.discoveredRecipes));
            }
            // Remove ingredients from inventory
            selectedIngredients.forEach(ing => this.inventory.removeItem(ing));
            return recipe;
        } else {
            console.log("Failed recipe combination.");
            selectedIngredients.forEach(ing => this.inventory.removeItem(ing));
            return { name: 'Failed Dish', bonus: 'None' };
        }
    }

    getRecipeInfo(name) {
        return RECIPES.find(r => r.name === name);
    }
}
