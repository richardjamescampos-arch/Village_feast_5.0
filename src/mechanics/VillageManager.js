import * as THREE from 'three';
import { RECIPES } from './CookingSystem.js';

export class VillageManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = [];
        this.prosperity = 0;
        this.maxProsperity = 100;
    }

    spawnNPCs(villageCenter) {
        const types = [
            { name: 'Elder', tex: 'npc_elder' },
            { name: 'Hunter', tex: 'npc_hunter' },
            { name: 'Child', tex: 'npc_child' },
            { name: 'Baker', tex: 'npc_baker' },
            { name: 'Fisher', tex: 'npc_fisher' }
        ];

        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            const group = new THREE.Group();

            // Simple Humanoid (hidden later, replaced by sprite in main.js)
            const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1, 4, 8), new THREE.MeshStandardMaterial({ color: 0x888888 }));
            body.position.y = 0.9;
            group.add(body);

            const head = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
            head.position.y = 1.8;
            group.add(head);

            const angle = (i / types.length) * Math.PI * 2 + Math.PI / 4;
            const dist = 10 + Math.random() * 5;
            group.position.set(
                villageCenter.x + Math.cos(angle) * dist,
                0,
                villageCenter.z + Math.sin(angle) * dist
            );

            group.userData = {
                type: 'npc',
                name: type.name,
                texName: type.tex,
                hunger: 50 + Math.random() * 30,
                requestedFood: RECIPES[Math.floor(Math.random() * RECIPES.length)].name,
                interactive: true
            };

            this.scene.add(group);
            this.npcs.push(group);
        }
    }

    feedNPC(npc, food) {
        // Simple logic: feeding reduces hunger
        npc.userData.hunger = Math.max(0, npc.userData.hunger - 30);

        // Se a comida for exatamente a que o NPC pediu, dá mais prosperidade
        const isRequested = npc.userData.requestedFood === food;
        this.prosperity += isRequested ? 20 : 10;

        if (this.prosperity > 100) this.prosperity = 100;

        // Troca o pedido para a próxima vez
        npc.userData.requestedFood = RECIPES[Math.floor(Math.random() * RECIPES.length)].name;

        console.log(`Fed ${npc.userData.name}. Prosperity: ${this.prosperity}%`);
        this.updateUI();

        if (this.prosperity >= 100) {
            this.triggerWin();
        }
    }

    updateUI() {
        document.getElementById('village-status').textContent = `Prosperity: ${this.prosperity}%`;
    }

    triggerWin() {
        const winDiv = document.createElement('div');
        winDiv.className = 'modal';
        winDiv.innerHTML = `
            <h1>VICTORY!</h1>
            <p>The village is full and healthy. Prosperity has returned!</p>
            <button onclick="location.reload()">Play Again</button>
        `;
        document.getElementById('ui-layer').appendChild(winDiv);
    }
}
