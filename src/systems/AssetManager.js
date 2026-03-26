import * as THREE from 'three';

// A simple utility to generate low-res pixel art textures on the fly.
// Ensures hard edges using NearestFilter.
export class AssetManager {
    constructor() {
        this.textures = {};
    }

    // Creates an 8x8 or 16x16 pixel art texture by drawing to an offscreen canvas
    generatePixelArtTexture(name, pixelData, size = 8, widthScale = 1) {
        const canvas = document.createElement('canvas');
        canvas.width = size * widthScale;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size * widthScale; x++) {
                const colorCode = pixelData[y][x];
                if (colorCode !== '0' && colorCode !== ' ') {
                    ctx.fillStyle = this.getColorFromCode(colorCode);
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        this.textures[name] = texture;
        return texture;
    }

    getColorFromCode(code) {
        const colors = {
            'R': '#ff0000', // Red
            'G': '#00ff00', // Green
            'B': '#0000ff', // Blue
            'Y': '#ffff00', // Yellow
            'W': '#ffffff', // White
            'K': '#000000', // Black
            '0': 'transparent', // Transparent
            ' ': 'transparent',
            'D': '#5c4033', // Dark Brown
            'L': '#8b5a2b', // Light Brown
            'g': '#228b22', // Dark Green
            'S': '#808080', // Gray (Stone/Chest)
            'C': '#d4af37', // Gold
            'P': '#ffb6c1', // Pink/Skin
            'E': '#800000', // Dark Red (Enemy)
            'H': '#dc143c', // Crimson (Enemy accent)
            'w': '#f5deb3', // Wheat (Crafting Table top)
            'O': '#FFA500', // Orange
        };
        return colors[code] || 'transparent';
    }

    init() {
        // Caçador Walking Frames (8x8)
        this.generatePixelArtTexture('player_walk_0', [
            '00ggg000',
            '0ggggg00',
            '00PPP000',
            '00PPP000',
            '0LLLLL00',
            '0LLLLL00',
            '00KK0000',
            '0KK00000'
        ]);
        this.generatePixelArtTexture('player_walk_1', [
            '00ggg000',
            '0ggggg00',
            '00PPP000',
            '00PPP000',
            '0LLLLL00',
            '0LLLLL00',
            '00KK0000',
            '00000KK0'
        ]);

        // Grass floor (External Tile Set) - Auto Crop Borders
        const grassTex = new THREE.Texture();
        grassTex.magFilter = THREE.NearestFilter;
        grassTex.minFilter = THREE.NearestFilter;
        grassTex.colorSpace = THREE.SRGBColorSpace;
        grassTex.wrapS = THREE.RepeatWrapping;
        grassTex.wrapT = THREE.RepeatWrapping;
        grassTex.repeat.set(100, 100);
        this.textures['grass'] = grassTex;

        const img = new Image();
        img.src = './grass-tile-set-for-my-game-feedback-appreciated-v0-ellpegql8ch21.webp';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, img.width, img.height).data;

            const isBorder = (x, y) => {
                const i = (y * img.width + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                if (a < 10) return true;
                const isGreyOrBlack = Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && Math.abs(r - b) < 25 && r < 180;
                return isGreyOrBlack;
            };

            let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
            let found = false;
            for (let y = 0; y < img.height; y++) {
                for (let x = 0; x < img.width; x++) {
                    if (!isBorder(x, y)) {
                        found = true;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (found) {
                const cropW = maxX - minX + 1;
                const cropH = maxY - minY + 1;
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = cropW;
                cropCanvas.height = cropH;
                const cropCtx = cropCanvas.getContext('2d');
                cropCtx.drawImage(img, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
                grassTex.image = cropCanvas;
            } else {
                grassTex.image = img;
            }
            grassTex.needsUpdate = true;
        };

        // Tree
        this.generatePixelArtTexture('tree', [
            '000G0000',
            '00GgG000',
            '0GgGgG00',
            'GgGgGgG0',
            '0GgGgG00',
            '000D0000',
            '000D0000',
            '000D0000'
        ]);

        // Apple Tree
        this.generatePixelArtTexture('apple_tree', [
            '000G0000',
            '00GRG000',
            '0GgGgR00',
            'GgRgGgG0',
            '0GgGgG00',
            '000D0000',
            '000D0000',
            '000D0000'
        ]);

        // Orange Tree
        this.generatePixelArtTexture('orange_tree', [
            '000G0000',
            '00GOG000',
            '0GgGgO00',
            'GgOgGgG0',
            '0GgGgG00',
            '000D0000',
            '000D0000',
            '000D0000'
        ]);

        // Sword
        this.generatePixelArtTexture('sword', [
            '00000000',
            '0000000W',
            '000000WS',
            '00000WS0',
            '0000WS00',
            '000WS000',
            '0DD0w000',
            'D00D0000'
        ]);

        // House (16x16)
        this.generatePixelArtTexture('house', [
            '000000000SS00000',
            '000000000SS00000',
            '0000000RR0000000',
            '000000RRRRRR0000',
            '0000RRRRRRRRR000',
            '000RRRRRRRRRRR00',
            '00RRRRRRRRRRRRR0',
            '0RRRRRRRRRRRRRRR',
            '000SSSSSSSSSSS00',
            '000SSSSSSSSSSS00',
            '000SBBSSSBBSSS00',
            '000SBBSSSBBSSS00',
            '000SSSSLLSSSSS00',
            '000SSSSLDSSSSS00',
            '000SSSSLLSSSSS00',
            '000SSSSLLSSSSS00'
        ], 16);

        // Animal (Boar/Pig -> Pink Pig AVIF)
        const animalTex = new THREE.Texture();
        animalTex.magFilter = THREE.NearestFilter;
        animalTex.minFilter = THREE.NearestFilter;
        animalTex.colorSpace = THREE.SRGBColorSpace;
        this.textures['animal'] = animalTex;

        const animalImg = new Image();
        animalImg.src = './icone-de-pixel-art-de-porco-rosa-fofo-logotipo-de-animal-de-fazenda-desenvolvimento-de-jogos-aplicativo-movel-sprite-de-8-bits_418367-192.avif';
        animalImg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = animalImg.width;
            canvas.height = animalImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(animalImg, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            // Remove solid backgrounds with aggressive tolerance for noisy AVIFs
            const bgR = data[0], bgG = data[1], bgB = data[2];
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                // Many stock icons use pure white background
                const isWhite = (r > 240 && g > 240 && b > 240);
                const isBgColor = (Math.abs(r - bgR) < 55 && Math.abs(g - bgG) < 55 && Math.abs(b - bgB) < 55);

                if (isBgColor || isWhite) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imgData, 0, 0);
            animalTex.image = canvas;
            animalTex.needsUpdate = true;
        };

        // Animal (Deer -> Chicken AVIF)
        const deerTex = new THREE.Texture();
        deerTex.magFilter = THREE.NearestFilter;
        deerTex.minFilter = THREE.NearestFilter;
        deerTex.colorSpace = THREE.SRGBColorSpace;
        this.textures['deer'] = deerTex;

        const deerImg = new Image();
        deerImg.src = './pixel-art-ilustracao-frango-pixelated-chicken-galinha-chicken-farm-animal-icone-pixelizado-para-o-jogo_1038602-222.avif';
        deerImg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = deerImg.width;
            canvas.height = deerImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(deerImg, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            // Remove solid backgrounds with aggressive tolerance for noisy AVIFs
            const bgR = data[0], bgG = data[1], bgB = data[2];
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                // Many stock icons use pure white background
                const isWhite = (r > 240 && g > 240 && b > 240);
                const isBgColor = (Math.abs(r - bgR) < 55 && Math.abs(g - bgG) < 55 && Math.abs(b - bgB) < 55);

                if (isBgColor || isWhite) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imgData, 0, 0);
            deerTex.image = canvas;
            deerTex.needsUpdate = true;
        };

        // Enemy (Sheep) - Using uploaded AVIF with Auto-Background Removal
        const enemyTex = new THREE.Texture();
        enemyTex.magFilter = THREE.NearestFilter;
        enemyTex.minFilter = THREE.NearestFilter;
        enemyTex.colorSpace = THREE.SRGBColorSpace;
        this.textures['enemy'] = enemyTex;

        const enemyImg = new Image();
        enemyImg.src = './icone-de-pixel-art-de-ovelha-de-fazenda-logotipo-de-animal-de-pele-fofa-desenvolvimento-de-jogos-aplicativo-movel-sprite-de-8-bits_418367-174.avif';
        enemyImg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = enemyImg.width;
            canvas.height = enemyImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(enemyImg, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // Auto Remove Solid Background matching top-left pixel
            // Remove solid backgrounds with aggressive tolerance for noisy AVIFs
            const bgR = data[0], bgG = data[1], bgB = data[2];
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                // Many stock icons use pure white background
                const isWhite = (r > 240 && g > 240 && b > 240);
                const isBgColor = (Math.abs(r - bgR) < 55 && Math.abs(g - bgG) < 55 && Math.abs(b - bgB) < 55);

                if (isBgColor || isWhite) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imgData, 0, 0);

            enemyTex.image = canvas;
            enemyTex.needsUpdate = true;
        };

        // Red Berries
        this.generatePixelArtTexture('red_berries', [
            '00000000',
            '000g0000',
            '000D0000',
            '00R0R000',
            '0RRYRR00',
            '00R0R000',
            '00000000',
            '00000000'
        ]);

        // Wild Herb
        this.generatePixelArtTexture('wild_herb', [
            '00000000',
            '00GgG000',
            '000D0000',
            '000g0000',
            '0g0g0g00',
            '00gGg000',
            '000D0000',
            '00000000'
        ]);

        // Mysterious Mushroom
        this.generatePixelArtTexture('mysterious_mushroom', [
            '00000000',
            '00000000',
            '000E0000',
            '00EwE000',
            '00wEw000',
            '00www000',
            '000w0000',
            '00000000'
        ]);

        // Chest (Closed)
        this.generatePixelArtTexture('chest_closed', [
            '00000000',
            '00000000',
            '00000000',
            'LLLLLLLL',
            'LDDDDDDL',
            'LLLYYLLL',
            'LDDDDDDL',
            'LLLLLLLL'
        ]);

        // Chest (Open)
        this.generatePixelArtTexture('chest_open', [
            '00000000',
            'LLLLLLLL',
            'LDDDDDDL',
            'LLLLLLLL',
            'L000000L',
            'L000000L',
            'LDDDDDDL',
            'LLLLLLLL'
        ]);

        // NPC - Elder (white hair, brown robe)
        this.generatePixelArtTexture('npc_elder', [
            '00WWW000',
            '0WWWWW00',
            '00PPP000',
            '00PPP000',
            '0DDDDD00',
            '0DLDLD00',
            '00KK0000',
            '0KK00000'
        ]);

        // NPC - Hunter (green cap, leather vest)
        this.generatePixelArtTexture('npc_hunter', [
            '00ggg000',
            '0ggggg00',
            '00PPP000',
            '00PPP000',
            '0LLGLL00',
            '0LGGGL00',
            '00LL0000',
            '0LL00000'
        ]);

        // NPC - Child (smaller, blue clothes)
        this.generatePixelArtTexture('npc_child', [
            '00000000',
            '00LLL000',
            '00PPP000',
            '00PPP000',
            '00BBB000',
            '00BBB000',
            '00KK0000',
            '00K0K000'
        ]);

        // NPC - Baker (chef hat, white apron)
        this.generatePixelArtTexture('npc_baker', [
            '00WWW000',
            '0WWWWW00',
            '00PPP000',
            '00PPP000',
            '0WWWWW00',
            '0WDDDW00',
            '00KK0000',
            '0KK00000'
        ]);

        // NPC - Fisher (blue outfit, hat)
        this.generatePixelArtTexture('npc_fisher', [
            '00BBB000',
            '0BBBBB00',
            '00PPP000',
            '00PPP000',
            '0BBBBB00',
            '0BBLBB00',
            '00LL0000',
            '0LL00000'
        ]);

        // Crafting Table
        this.generatePixelArtTexture('crafting_table', [
            '00000000',
            '00000000',
            'wwwwwwww',
            'LwwwwwwL',
            'LLDDDDLL',
            'LL0000LL',
            'LL0000LL',
            'LL0000LL'
        ]);

        // Raw Meat
        this.generatePixelArtTexture('raw_meat', [
            '00000000',
            '00000000',
            '000w0000',
            '00RRw000',
            '0RRR0000',
            '00000000',
            '00000000',
            '00000000'
        ]);

        // Village Fire
        this.generatePixelArtTexture('village_fire', [
            '000Y0000',
            '00YRY000',
            '0RYYYR00',
            'RYEYEYR0',
            'S0SYS0S0',
            '0SS0SS00',
            'S00S00S0',
            '00S0S000'
        ]);

    }

    get(name) {
        return this.textures[name];
    }
}
