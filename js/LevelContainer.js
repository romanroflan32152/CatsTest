// MAP_CONFIGS как раньше
// MAP_CONFIGS как раньше
const MAP_CONFIGS = [
    {
        key: 'map1',
        shelters: [
            { x: 36,  y: 515, z: 1 },
            { x: 305, y: 540, z: 3 },
            { x: 150, y: 790, z: 7 }
        ],
        spawns: [
            { x: 175, y: 295, z: 1 },
            { x: 460, y: 700, z: 5 },
            { x: 70,  y: 970, z: 10 }
        ],
        // paths[spawnIndex][shelterIndex] = [
        //   { action: 'run'|'jump'|'climb', x?, y?, z?, shelterIndex? }, ...
        // ]
        paths: [
            // spawn 0 (spawn1)
            [
                [
                    { action: 'jump', shelterIndex: 0 }
                ],
                [
                    { action: 'jump', x: 435, y: 410, z: 1 },
                    { action: 'jump', shelterIndex: 1 }
                ],
                [
                    { action: 'jump', x: 435, y: 410, z: 1 },
                    { action: 'jump', x: 210, y: 600, z: 2 },
                    { action: 'run',  x: 470, y: 800, z: 7 },
                    { action: 'run',  shelterIndex: 2 }
                ]
            ],
            // spawn 1 (spawn2)
            [
                [
                    { action: 'run', shelterIndex: 0 }
                ],
                [
                    { action: 'run', shelterIndex: 1 }
                ],
                [
                    { action: 'run', x: 400, y: 800, z: 7 },
                    { action: 'run', shelterIndex: 2 }
                ]
            ],
            // spawn 2 (spawn3)
            [
                [
                    { action: 'run', x: 500, y: 750, z: 5 },
                    { action: 'run', shelterIndex: 0 }
                ],
                [
                    { action: 'run', x: 450, y: 850, z: 7 },
                    { action: 'run', shelterIndex: 1 }
                ],
                [
                    { action: 'run', shelterIndex: 2 }
                ]
            ]
        ]
    },
    {
        key: 'map2',
        shelters: [
            { x: 36,  y: 515, z: 10 },
            { x: 305, y: 540, z: 7 },
            { x: 150, y: 790, z: 2 }
        ],
        spawns: [
            { x: 175, y: 295, z: 10 },
            { x: 460, y: 700, z: 6 },
            { x: 70,  y: 970, z: 1 }
        ],
        paths: [] // пока без явных путей
    },
    {
        key: 'map3',
        shelters: [
            { x: 36,  y: 515, z: 10 },
            { x: 305, y: 540, z: 7 },
            { x: 150, y: 790, z: 2 }
        ],
        spawns: [
            { x: 175, y: 295, z: 10 },
            { x: 460, y: 700, z: 6 },
            { x: 70,  y: 970, z: 1 }
        ],
        paths: [] // пока без явных путей
    }
];

class LevelContainer {
    constructor(scene) {
        this.scene = scene;
        this.mapImage = null;

        this.targets = [];
        this.spawnHints = [];

        this.grayForbiddenSpawnIndex = 0;

        this.currentShelterPositions = [];
        this.currentSpawnPositions   = [];
    }

    setupLevel(mapIndex) {
        const cfg = MAP_CONFIGS[mapIndex];

        this.currentShelterPositions = cfg.shelters;
        this.currentSpawnPositions   = cfg.spawns;

        if (!this.mapImage) {
            this.mapImage = this.scene.add.image(0, 0, cfg.key)
                .setOrigin(0)
                .setDepth(0);
            this.mapImage.setScale(0.667);
        } else {
            this.mapImage.setTexture(cfg.key);
        }

        this.targets.forEach(t => t.sprite.destroy());
        this.targets = [];

        this.spawnHints.forEach(hh => hh.sprite.destroy());
        this.spawnHints = [];

        // ✦ таргеты скрыты по дефолту
        cfg.shelters.forEach((pos, index) => {
            const sprite = this.scene.add.sprite(pos.x, pos.y, 'crosshair2')
                .setOrigin(0.5)
                .setDepth(1)
                .setVisible(false);

            // масштаб по z как у кота (но depth не трогаем)
            if (typeof pos.z === 'number') {
                const scale = 1 + pos.z * 0.1;
                sprite.setScale(scale);
            }

            sprite.disableInteractive();
            this.targets.push({ sprite, index });
        });

        this.grayForbiddenSpawnIndex = Phaser.Math.Between(0, cfg.spawns.length - 1);

        cfg.spawns.forEach((pos, index) => {
            const hint = this.scene.add.sprite(pos.x, pos.y, 'cat_unknown')
                .setOrigin(0.5, 1)    // ✅ origin (0.5, 1)
                .setDepth(0.5);

            // масштаб по z как у кота (но depth не трогаем)
            if (typeof pos.z === 'number') {
                const scale = 0.4 + pos.z * 0.08;
                hint.setScale(scale);
            }

            hint.setAlpha(0.7);
            this.spawnHints.push({ sprite: hint, index });
        });

        this.hideSpawnHints();
    }

    // внутри LevelContainer
    showSpawnHintsForColor(color, spawnIndices) {
        // Сначала всё скрываем
        if (this.spawnHints && this.spawnHints.length) {
            this.spawnHints.forEach(h => {
                if (h && h.sprite) {
                    h.sprite.setVisible(true);
                }
            });
        }

        // для серого прячем запрещённый
        if (color === 'gray') {
            // Если нам передали конкретные индексы спавнов для этого кота
            if (Array.isArray(spawnIndices) && spawnIndices.length > 0) {
                Phaser.Utils.Array.GetRandom(this.spawnHints.filter((_, index) => index !== spawnIndices[0]))?.sprite?.setVisible(false);
            }
        }
    }

    hideSpawnHints() {
        this.spawnHints.forEach(h => h.sprite.setVisible(false));
    }

    destroyTargets() {
        this.targets.forEach(t => t.sprite.destroy());
        this.targets = [];
    }
}
