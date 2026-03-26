import * as THREE from 'three';
import { WorldGenerator } from './src/systems/WorldGenerator.js';
import { AssetManager } from './src/systems/AssetManager.js';
import { Minimap } from './src/ui/Minimap.js';
import { Inventory } from './src/mechanics/Inventory.js';
import { CookingSystem } from './src/mechanics/CookingSystem.js';
import { CookingUI } from './src/ui/CookingUI.js';
import { FoodCodexUI } from './src/ui/FoodCodexUI.js';
import { VillageManager } from './src/mechanics/VillageManager.js';
import { QTEUI } from './src/ui/QTEUI.js';

// Game State
const state = {
    hunger: 0,
    villageDiscovered: false,
    discoveredRecipes: [],
    keys: { W: false, A: false, S: false, D: false },
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    isMenuOpen: false,
    gameStarted: false,
    playerFrameRenderTimer: 0,
    walkFrame: 0
};

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Top-Down Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
// Camera initial position to look at village for start screen
camera.position.set(200, 30, 225);
camera.lookAt(200, 0, 200);

const renderer = new THREE.WebGLRenderer({ antialias: false }); // false for pixel art crispness
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('game-container').appendChild(renderer.domElement);

// Initialize Asset Manager
const assetManager = new AssetManager();
assetManager.init();

const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(50, 100, 50);
scene.add(sunLight);

// Player Setup
const player = new THREE.Group();
const playerSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: assetManager.get('player_walk_0'), color: 0xffffff }));
playerSprite.scale.set(4, 4, 1);
playerSprite.position.y = 2;
player.add(playerSprite);

// Player Sword
const swordMat = new THREE.SpriteMaterial({ map: assetManager.get('sword') });
const playerSword = new THREE.Sprite(swordMat);
playerSword.scale.set(2.5, 2.5, 1);
playerSword.position.set(2, 2, 0);
playerSword.visible = false;
player.add(playerSword);

scene.add(player);

// Systems
const world = new WorldGenerator(scene, assetManager);
world.generate();

const villageManager = new VillageManager(scene);
villageManager.spawnNPCs(world.villageCenter);

// Helper: create a thought bubble sprite with text
function createThoughtBubble(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Bubble background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    const bx = 10, by = 5, bw = 236, bh = 60, br = 16;
    ctx.beginPath();
    ctx.moveTo(bx + br, by);
    ctx.lineTo(bx + bw - br, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
    ctx.lineTo(bx + bw, by + bh - br);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
    ctx.lineTo(bx + br, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
    ctx.lineTo(bx, by + br);
    ctx.quadraticCurveTo(bx, by, bx + br, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Small thought circles below bubble
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath(); ctx.arc(118, 75, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(125, 88, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Truncate if too long
    const displayText = text.length > 18 ? text.substring(0, 16) + '…' : text;
    ctx.fillText('💭 ' + displayText, 128, 35);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(8, 3, 1);
    sprite.position.set(0, 7, 0);
    sprite.renderOrder = 999;
    return sprite;
}

// Apply unique NPC skins & thought bubbles
villageManager.npcs.forEach(npcGroup => {
    // Hide 3D mesh children and add pixel art sprite
    npcGroup.children.forEach(c => c.visible = false);
    const texName = npcGroup.userData.texName || 'npc_elder';
    const npcSprite = world.createSprite(texName, 4, 2);
    npcGroup.add(npcSprite);

    // Add thought bubble showing requested food
    const bubble = createThoughtBubble(npcGroup.userData.requestedFood || '???');
    bubble.userData = { isBubble: true };
    npcGroup.add(bubble);
});


const minimap = new Minimap();
const inventory = new Inventory();
const cookingSystem = new CookingSystem(inventory, villageManager);
const cookingUI = new CookingUI(cookingSystem, inventory);
const codexUI = new FoodCodexUI(cookingSystem);
const qteUI = new QTEUI();

// No Lights needed for Sprite/BasicMaterials, but preserving Ambient just in case
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Hide HUD until game starts
document.getElementById('ui-layer').style.display = 'none';

document.getElementById('start-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('ui-layer').style.display = 'flex';
    state.gameStarted = true;
    // Set player start position
    player.position.set(200, 0, 230);
});

// Controls & Mouse
window.addEventListener('mousemove', (event) => {
    state.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});
// Mouse
window.addEventListener('click', (e) => {
    if (!state.gameStarted) return;
    const isOverUI = e.target.closest('#ui-layer') || e.target.closest('.modal');
    if (state.gameStarted && !isOverUI && !state.isMenuOpen) {
        swingSword();
        checkInteraction(true);
    }
});

const onKeyDown = (event) => {
    if (state.isMenuOpen && event.code !== 'KeyC' && event.code !== 'Escape') return;

    switch (event.code) {
        case 'KeyW': state.keys.W = true; break;
        case 'KeyA': state.keys.A = true; break;
        case 'KeyS': state.keys.S = true; break;
        case 'KeyD': state.keys.D = true; break;
        case 'KeyC': if (state.gameStarted) toggleCodex(); break;
        case 'KeyE':
            if (!state.isMenuOpen && state.gameStarted) {
                swingSword();
                checkInteraction(false);
            }
            break;
        case 'Space':
            if (!state.isMenuOpen && state.gameStarted) {
                swingSword();
            }
            break;
        case 'Escape': if (state.isMenuOpen) closeAllMenus(); break;
    }
};

const onKeyUp = (event) => {
    switch (event.code) {
        case 'KeyW': state.keys.W = false; break;
        case 'KeyA': state.keys.A = false; break;
        case 'KeyS': state.keys.S = false; break;
        case 'KeyD': state.keys.D = false; break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

function toggleCodex() {
    state.isMenuOpen = !state.isMenuOpen;
    codexUI.toggle();
}

function closeAllMenus() {
    state.isMenuOpen = false;
    cookingUI.hide();
    const dialogUI = document.getElementById('npc-dialog-screen');
    if (dialogUI) dialogUI.classList.add('hidden');
    if (!document.getElementById('codex-window').classList.contains('hidden')) codexUI.toggle();
}

// Ensure global access for UI closing
window.closeAllMenus = closeAllMenus;
window.feedNPCCurrent = feedNPCCurrent;

window.addEventListener('cooking-closed', () => {
    state.isMenuOpen = false;
});

// NPC Dialog State
let currentNPC = null;

// Interaction Logic (Point and Click or Keyboard)
function checkInteraction(useMouse = true) {
    const interactables = [
        ...world.ingredients,
        ...world.animals,
        ...villageManager.npcs,
        world.chest,
        ...world.objects.filter(o => o && o.userData && o.userData.interactive)
    ].filter(obj => obj && obj.parent);
    let targetObject = null;
    let targetDist = Infinity;

    if (useMouse) {
        state.raycaster.setFromCamera(state.mouse, camera);
        const intersects = state.raycaster.intersectObjects(interactables, true);
        if (intersects.length > 0) {
            let object = intersects[0].object;
            while (object.parent && !object.userData.type && object.parent.type !== "Scene") object = object.parent;
            targetObject = object;
            targetDist = player.position.distanceTo(object.position);
        }
    } else {
        // Find closest object within interaction range
        for (const obj of interactables) {
            let rootObj = obj;
            while (rootObj.parent && !rootObj.userData.type && rootObj.parent.type !== "Scene") rootObj = rootObj.parent;
            const dist = player.position.distanceTo(rootObj.position);
            if (dist < 20 && dist < targetDist) {
                targetDist = dist;
                targetObject = rootObj;
            }
        }
    }

    if (targetObject) {
        const object = targetObject;
        const distance = targetDist;

        if (object.userData.type === 'ingredient' && distance < 15) {
            inventory.addItem(object.userData.name);
            scene.remove(object);
            world.ingredients = world.ingredients.filter(i => i !== object);
            return;
        }

        if (object.userData.type === 'fruit_tree' && distance < 15) {
            const fruit = object.userData.fruitType;
            inventory.addItem(fruit);
            object.userData.type = 'tree';
            object.material.map = assetManager.get('tree');
            return;
        }

        if (object.userData.type === 'animal' && distance < 15) {
            // Animals are handled by swingSword() — no direct attack here
            // The sword swing animation already damages animals in range
            return;
        }

        if (object.userData.type === 'npc' && distance < 20) {
            currentNPC = object;
            openNPCDialog(object.userData.name);
            return;
        }

        if (object.userData.type === 'chest' && distance < 15) {
            if (!object.userData.opened) {
                object.userData.opened = true;
                object.material.map = assetManager.get('chest_open');
                inventory.addItem("Red Berries");
                inventory.addItem("Raw Meat");
                alert("You opened the chest! You received Red Berries and Raw Meat.");
            }
            return;
        }
    }

    // Check Village Fire
    if (state.villageDiscovered) {
        let interactFire = false;
        const distPlayerToFire = player.position.distanceTo(world.villageCenter);

        if (useMouse) {
            state.raycaster.setFromCamera(state.mouse, camera);
            const distToFire = state.raycaster.ray.distanceToPoint(new THREE.Vector3(world.villageCenter.x, 3, world.villageCenter.z));
            if (distToFire < 5 && distPlayerToFire < 20) interactFire = true;
        } else {
            if (distPlayerToFire < 20) interactFire = true;
        }

        if (interactFire) {
            state.isMenuOpen = true;
            cookingUI.show();
        }
    }
}

function openNPCDialog(npcName) {
    state.isMenuOpen = true;
    const dialogUI = document.getElementById('npc-dialog-screen');
    if (dialogUI) {
        document.getElementById('npc-name-title').innerText = npcName + " (Villager)";
        if (currentNPC && currentNPC.userData.requestedFood) {
            document.getElementById('npc-dialog-text').innerText = `I am so hungry... I really want some ${currentNPC.userData.requestedFood}!`;
        } else {
            document.getElementById('npc-dialog-text').innerText = "I am so hungry... Do you have any cooked meals or berries?";
        }
        dialogUI.classList.remove('hidden');
    }
}

function feedNPCCurrent() {
    if (!currentNPC) return;
    const foodItems = Object.keys(inventory.items).filter(name =>
        cookingSystem.discoveredRecipes.includes(name) || name === "Red Berries"
    );

    if (foodItems.length > 0) {
        const selectedFood = foodItems[0];
        inventory.removeItem(selectedFood);
        villageManager.feedNPC(currentNPC, selectedFood);
        document.getElementById('npc-dialog-text').innerText = "Thank you! The village prospers!";
        // Update thought bubble to show new request
        updateNPCBubble(currentNPC);
    } else {
        document.getElementById('npc-dialog-text').innerText = "I am so hungry... Do you have any cooked meals or berries?";
    }
}

// Update an NPC's thought bubble after being fed
function updateNPCBubble(npcGroup) {
    // Remove old bubble
    const oldBubble = npcGroup.children.find(c => c.userData && c.userData.isBubble);
    if (oldBubble) npcGroup.remove(oldBubble);
    // Create new bubble with updated food request
    const newBubble = createThoughtBubble(npcGroup.userData.requestedFood || '???');
    newBubble.userData = { isBubble: true };
    npcGroup.add(newBubble);
}

// Player State & Constants
let prevTime = performance.now();
const playerSpeed = 50;
let playerVelY = 0;
const gravity = -0.01;
let isGrounded = true;

// Sword Animation Logic
let isSwinging = false;
function swingSword() {
    if (isSwinging) return;
    isSwinging = true;
    playerSword.visible = true;
    playerSword.position.set(2, 2, 0);
    playerSword.material.rotation = 0;

    // Check for nearby animals to damage on swing
    const attackRange = 12;
    const animalsInRange = world.animals.filter(a => a && a.parent && player.position.distanceTo(a.position) < attackRange);
    animalsInRange.forEach(animal => attackAnimal(animal));

    let frame = 0;
    const interval = setInterval(() => {
        frame++;
        // Animação de arco da espada indo de cima pra baixo
        playerSword.position.set(2 + Math.sin(frame * 0.2), 2 - frame * 0.15, 0);
        playerSword.material.rotation -= 0.15;
        if (frame > 10) {
            clearInterval(interval);
            playerSword.visible = false;
            playerSword.material.rotation = 0;
            isSwinging = false;
        }
    }, 20);
}

// Attack animal directly: reduce health, flash red, drop meat on death
function attackAnimal(animal) {
    if (!animal || !animal.parent) return;
    animal.userData.health--;
    if (animal.material) {
        animal.material.color.setHex(0xff0000);
        setTimeout(() => {
            if (animal.material) animal.material.color.setHex(0xffffff);
        }, 150);
    }
    if (animal.userData.health <= 0) {
        const meatType = animal.userData.name === 'Goblin' ? 'Mysterious Meat' : 'Raw Meat';
        inventory.addItem(meatType);
        scene.remove(animal);
        world.animals = world.animals.filter(a => a !== animal);
    }
}

// Main Game Loop
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    prevTime = time;

    if (!state.isMenuOpen && state.gameStarted) {

        let isMoving = false;

        if (state.keys.W) { player.position.z -= playerSpeed * delta; isMoving = true; }
        if (state.keys.S) { player.position.z += playerSpeed * delta; isMoving = true; }
        if (state.keys.A) {
            player.position.x -= playerSpeed * delta;
            isMoving = true;
            playerSprite.material.map.repeat.set(-1, 1);
            playerSprite.material.map.offset.set(1, 0);
        }
        if (state.keys.D) {
            player.position.x += playerSpeed * delta;
            isMoving = true;
            playerSprite.material.map.repeat.set(1, 1);
            playerSprite.material.map.offset.set(0, 0);
        }

        // boundaries
        player.position.x = Math.max(-1000, Math.min(1000, player.position.x));
        player.position.z = Math.max(-1000, Math.min(1000, player.position.z));

        // Walking Animation Frame update
        if (isMoving) {
            if (!state.playerFrameRenderTimer) state.playerFrameRenderTimer = 0;
            state.playerFrameRenderTimer += delta;
            if (state.playerFrameRenderTimer > 0.15) { // swap every 0.15s
                state.playerFrameRenderTimer = 0;
                state.walkFrame = state.walkFrame === 0 ? 1 : 0;
                const curTex = assetManager.get(`player_walk_${state.walkFrame}`);
                playerSprite.material.map = curTex;

                // Maintain direction
                if (state.keys.A) {
                    playerSprite.material.map.repeat.set(-1, 1);
                    playerSprite.material.map.offset.set(1, 0);
                } else if (state.keys.D) {
                    playerSprite.material.map.repeat.set(1, 1);
                    playerSprite.material.map.offset.set(0, 0);
                }
            }
        } else {
            playerSprite.material.map = assetManager.get('player_walk_0');
            if (state.keys.A) {
                playerSprite.material.map.repeat.set(-1, 1);
                playerSprite.material.map.offset.set(1, 0);
            } else {
                playerSprite.material.map.repeat.set(1, 1);
                playerSprite.material.map.offset.set(0, 0);
            }
        }

        // Camera Follow
        camera.position.x = player.position.x;
        camera.position.z = player.position.z + 25; // Offset Z for pseudo-isometric/top-down
        camera.position.y = 35; // Height
        camera.lookAt(player.position.x, player.position.y, player.position.z);

        world.update(delta);
        minimap.update(player.position, world.villageCenter);

        // Animate NPC thought bubbles (gentle bob + proximity visibility)
        const distToVillage = player.position.distanceTo(world.villageCenter);
        villageManager.npcs.forEach(npcGroup => {
            npcGroup.children.forEach(child => {
                if (child.userData && child.userData.isBubble) {
                    child.visible = distToVillage < 60;
                    child.position.y = 7 + Math.sin(time * 0.002 + npcGroup.position.x) * 0.3;
                }
            });
        });

        // Update Village Navigation Arrow
        const playerPos = player.position;
        const villagePos = world.villageCenter;

        // Calculate angle in 2D
        const angleToVillage = Math.atan2(villagePos.x - playerPos.x, -(villagePos.z - playerPos.z));
        document.getElementById('village-arrow').style.transform = `rotate(${angleToVillage}rad)`;

        if (!state.villageDiscovered) {
            const dist = player.position.distanceTo(world.villageCenter);
            if (dist < 40) {
                state.villageDiscovered = true;
                document.getElementById('village-status').textContent = "At Village";
            }
        }

    }

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
