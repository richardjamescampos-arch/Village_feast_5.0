import * as THREE from 'three';

export class WorldGenerator {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.am = assetManager; // assetManager
        this.objects = [];
        this.ingredients = [];
        this.animals = [];
        this.enemies = [];
        this.villageCenter = new THREE.Vector3(200, 0, 200);
        this.chest = null;
    }

    generate() {
        // Flat tiled grass ground
        const groundGeo = new THREE.PlaneGeometry(2000, 2000);
        groundGeo.rotateX(-Math.PI / 2);

        const groundMat = new THREE.MeshBasicMaterial({
            map: this.am.get('grass'),
            side: THREE.FrontSide
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.scene.add(this.ground);

        for (let i = 0; i < 1600; i++) {
            const x = (Math.random() - 0.5) * 1600;
            const z = (Math.random() - 0.5) * 1600;
            this.createTree(x, z);
        }

        // Enemies instead of rocks
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 800;
            const z = (Math.random() - 0.5) * 800;
            this.createEnemy(x, z);
        }

        this.spawnIngredients();
        this.spawnAnimals();
        this.createVillage(this.villageCenter.x, this.villageCenter.z);
    }

    getGroundHeight(x, z) {
        return 0; // Flat world for 2D pixel art style
    }

    createSprite(textureName, scale, yOffset) {
        const tex = this.am.get(textureName);
        const mat = new THREE.SpriteMaterial({ map: tex, color: 0xffffff });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(scale, scale, 1);
        sprite.position.y = yOffset;
        return sprite;
    }

    spawnIngredients() {
        const types = [
            { name: 'Red Berries', tex: 'red_berries', size: 2 },
            { name: 'Wild Herb', tex: 'wild_herb', size: 2 },
            { name: 'Mushroom', tex: 'mysterious_mushroom', size: 2 },
            { name: 'Mushroom', tex: 'mysterious_mushroom', size: 2 },
            { name: 'Mushroom', tex: 'mysterious_mushroom', size: 2 },
            { name: 'Mushroom', tex: 'mysterious_mushroom', size: 2 }
        ];

        for (let i = 0; i < 1000; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const x = (Math.random() - 0.5) * 1800;
            const z = (Math.random() - 0.5) * 1800;

            if (new THREE.Vector2(x, z).distanceTo(new THREE.Vector2(this.villageCenter.x, this.villageCenter.z)) < 30) continue;

            const sprite = this.createSprite(type.tex, type.size, type.size / 2);
            sprite.position.set(x, type.size / 2, z);
            sprite.userData = { type: 'ingredient', name: type.name, interactive: true };
            this.scene.add(sprite);
            this.ingredients.push(sprite);
        }
    }

    spawnAnimals() {
        const types = [
            { name: 'Boar', tex: 'animal', size: 10 },
            { name: 'Deer', tex: 'deer', size: 2.5 }
        ];

        for (let i = 0; i < 150; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const x = (Math.random() - 0.5) * 1000;
            const z = (Math.random() - 0.5) * 1000;

            if (new THREE.Vector2(x, z).distanceTo(new THREE.Vector2(this.villageCenter.x, this.villageCenter.z)) < 40) continue;

            const sprite = this.createSprite(type.tex, type.size, type.size / 2);
            sprite.position.set(x, type.size / 2, z);

            sprite.userData = {
                type: 'animal',
                name: type.name,
                health: 2,
                velocity: new THREE.Vector3(),
                nextWander: 0,
                texName: type.tex,
                size: type.size
            };
            this.scene.add(sprite);
            this.animals.push(sprite);
        }
    }

    update(delta) {
        this.animals.forEach(animal => {
            const data = animal.userData;
            if (Date.now() > data.nextWander) {
                const angle = Math.random() * Math.PI * 2;
                data.velocity.set(Math.cos(angle) * 5, 0, Math.sin(angle) * 5);
                data.nextWander = Date.now() + 2000 + Math.random() * 3000;
                // Flip sprite horizontally if moving left
                if (data.velocity.x < 0) {
                    animal.material.map.repeat.set(-1, 1);
                    animal.material.map.offset.set(1, 0); // Correct offset after repeating -1
                } else {
                    animal.material.map.repeat.set(1, 1);
                    animal.material.map.offset.set(0, 0);
                }
            }
            animal.position.addScaledVector(data.velocity, delta);

            if (Math.abs(animal.position.x) > 1000) data.velocity.x *= -1;
            if (Math.abs(animal.position.z) > 1000) data.velocity.z *= -1;
        });
    }

    createTree(x, z) {
        const rand = Math.random();
        let texName = 'tree';
        let fruitType = null;

        if (rand < 0.1) {
            texName = 'apple_tree';
            fruitType = 'Apple';
        } else if (rand < 0.2) {
            texName = 'orange_tree';
            fruitType = 'Orange';
        }

        const sprite = this.createSprite(texName, 10, 5);
        sprite.position.set(x, 5, z);

        if (fruitType) {
            sprite.userData = { type: 'fruit_tree', fruitType: fruitType, interactive: true };
        }

        this.scene.add(sprite);
        this.objects.push(sprite);
    }

    createEnemy(x, z) {
        const sprite = this.createSprite('enemy', 3, 1.5);
        sprite.position.set(x, 1.5, z);
        // Wait, let's treat enemies like animals for combat for now
        sprite.userData = { type: 'animal', name: 'Goblin', health: 3, velocity: new THREE.Vector3(), nextWander: 0 };
        this.scene.add(sprite);
        this.animals.push(sprite);
    }

    createVillage(x, z) {
        // Village area marker
        const markerGeo = new THREE.CircleGeometry(45, 32);
        markerGeo.rotateX(-Math.PI / 2);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x8b5a2b });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(x, 0.05, z);
        this.scene.add(marker);

        const fire = this.createSprite('village_fire', 6, 3);
        fire.position.set(x, 3, z);
        this.scene.add(fire);

        // Chest
        this.chest = this.createSprite('chest_closed', 3, 1.5);
        this.chest.position.set(x + 10, 1.5, z + 5);
        this.chest.userData = { type: 'chest', opened: false };
        this.scene.add(this.chest);

        // Houses in a full circle around the campfire, doors facing center
        const houseCount = 5;
        const houseRadius = 38;
        for (let i = 0; i < houseCount; i++) {
            // Full 360° circle, evenly spaced
            const angle = (i / houseCount) * Math.PI * 2;
            const hX = x + Math.cos(angle) * houseRadius;
            const hZ = z + Math.sin(angle) * houseRadius;
            const house = this.createSprite('house', 30, 15);
            house.position.set(hX, 15, hZ);
            this.scene.add(house);
            this.objects.push(house);
        }
    }
}
