const MAP_CONFIGS = [
    {
        key: 'map1',
        shelters: [
            { x: 36,  y: 522, z: 2, finalPose: { x: 36, y: 522 , z: 1, scale: 0.20} },
            { x: 305, y: 575, z: 4, finalPose: { x: 306, y: 575 , z: 3, scale: 0.4}  },
            { x: 150, y: 815, z: 7, finalPose: { x: 152, y: 815 , z: 6, scale: 0.5}  }
        ],
        spawns: [
            { x: 175, y: 295, z: 2 },
            { x: 460, y: 700, z: 6 },
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
                    { action: 'jump', x: 435, y: 410, z: 2 },
                    { action: 'jump', shelterIndex: 1 }
                ],
                [
                    { action: 'jump', x: 435, y: 410, z: 2 },
                    { action: 'jump', x: 210, y: 600, z: 3 },
                    { action: 'run',  x: 470, y: 800, z: 9 },
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
                    { action: 'run', x: 400, y: 800, z: 9 },
                    { action: 'run', shelterIndex: 2 }
                ]
            ],
            // spawn 2 (spawn3)
            [
                [
                    { action: 'run', x: 500, y: 750, z: 6 },
                    { action: 'run', shelterIndex: 0 }
                ],
                [
                    { action: 'run', x: 450, y: 850, z: 8 },
                    { action: 'run', shelterIndex: 1 }
                ],
                [
                    { action: 'run', shelterIndex: 2 }
                ]
            ]
        ],
        objects: [
            { sprite: 'car2', scale: 2, x: -7, y: 697, z: 7 },
            { sprite: 'box2_forward', scale: 0.65, x: 38, y: 508, z: 2 },
            { sprite: 'box1_forward', scale: 0.525, x: 305, y: 559, z: 4 },
            { sprite: 'banana', scale: 1.5, x: 383, y: 742, z: 1 , onCollision: {action: 'scare', parameters: [200]}},
        ]
    },
    {
        key: 'map2',
        shelters: [
            { x: 427,  y: 760, z: 7, finalPose: { x: 430, y: 755 , z: 6, scale: 0.5} },
            { x: 155, y: 545, z: 4, finalPose: { x: 155, y: 550 , z: 3, scale: 0.2} },
            { x: 235, y: 545, z: 3, finalPose: { x: 235, y: 533 , z: 1, scale: 0.2} }
        ],
        spawns: [
            { x: 475, y: 970, z: 9 },
            { x: 425, y: 553, z: 5 },
            { x: 300,  y: 436, z: 1 }
        ],
        paths: [
            // spawn 0 (spawn1)
            [
                [
                    { action: 'run',  x: 350, y: 850, z: 8 },
                    { action: 'run', shelterIndex: 0 }
                ],
                [
                    { action: 'run', x: 200, y: 850, z: 8 },
                    { action: 'run', x: 155, y: 600, z: 5 },
                    { action: 'climb', shelterIndex: 1 }
                ],
                [
                    { action: 'run', x: 200, y: 850, z: 8 },
                    { action: 'run', x: 170, y: 600, z: 5 },
                    { action: 'run',  shelterIndex: 2 }
                ]
            ],
            // spawn 1 (spawn2)
            [
                [
                    { action: 'jump',  x: 350, y: 560, z: 5 },
                    { action: 'jump',  x: 250, y: 650, z: 6 },
                    { action: 'run',  x: 150, y: 750, z: 8 },
                    { action: 'run', shelterIndex: 0 }
                ],
                [
                    { action: 'jump',  x: 350, y: 560, z: 5 },
                    { action: 'jump',  x: 250, y: 600, z: 5 },
                    { action: 'run',  x: 155, y: 600, z: 5 },
                    { action: 'climb', shelterIndex: 1 }
                ],
                [
                    { action: 'jump',  x: 350, y: 560, z: 5 },
                    { action: 'jump',  x: 250, y: 575, z: 4 },
                    { action: 'run',  shelterIndex: 2 }
                ]
            ],
            // spawn 2 (spawn3)
            [
                [
                    { action: 'jump',  x: 290, y: 480, z: 2 },
                    { action: 'jump',  x: 250, y: 575, z: 4 },
                    { action: 'run',  x: 200, y: 600, z: 5 },
                    { action: 'run',  x: 150, y: 770, z: 8 },
                    { action: 'run', shelterIndex: 0 }
                ],
                [
                    { action: 'jump',  x: 290, y: 480, z: 2 },
                    { action: 'jump',  x: 250, y: 575, z: 4 },
                    { action: 'run',  x: 155, y: 600, z: 5 },
                    { action: 'climb', shelterIndex: 1 }
                ],
                [
                    { action: 'jump',  x: 290, y: 480, z: 2 },
                    { action: 'jump',  x: 260, y: 495, z: 3 },
                    { action: 'jump',  shelterIndex: 2 }
                ]
            ]
        ],
        objects: [
            { sprite: 'busket1', scale: 1, x: 471, y: 895, z: 7 },

            { sprite: 'box3_forward', scale: 0.79, x: 430, y: 739, z: 7 },
            { sprite: 'box2_forward', scale: 0.56, x: 154, y: 533, z: 4 },
            { sprite: 'box1_forward', scale: 0.23, x: 234, y: 528, z: 2 },

            { sprite: 'banana', scale: 0.8, x: 245, y: 625, z: 1 , onCollision: {action: 'scare', parameters: [200]}},
        ]
    },
    {
        key: 'map3',
        shelters: [
            { x: 432,  y: 835, z: 6, finalPose: { x: 430, y: 835 , z: 6, scale: 0.3} },
            { x: 113, y: 820, z: 7, finalPose: { x: 113, y: 820 , z: 7, scale: 0.3} },
            { x: 287, y: 703, z: 4, finalPose: { x: 287, y: 703 , z: 4, scale: 0.2} }
        ],
        spawns: [
            { x: 368, y: 826, z: 6 },
            { x: 77, y: 835, z: 7 },
            { x: 285,  y: 635, z: 3 }
        ],
        paths: [
            // spawn 0 (spawn1)
            [
                [
                    { action: 'jump', shelterIndex: 0 }
                ],
                [
                    { action: 'run', x: 320, y: 845, z: 6 },
                    { action: 'run', x: 240, y: 847, z: 6 },
                    { action: 'run', x: 167, y: 833, z: 6 },
                    { action: 'jump', shelterIndex: 1 }
                ],
                [
                    { action: 'jump', x: 340, y: 841, z: 7 },
                    { action: 'run', x: 248, y: 836, z: 7 },
                    { action: 'climb', x: 248, y: 693, z: 6 },
                    { action: 'run',  shelterIndex: 2 }
                ]
            ],
            // spawn 1 (spawn2)
            [
                [
                    { action: 'run', x: 392, y: 840, z: 7 },
                    { action: 'jump', shelterIndex: 0 }
                ],
                [
                    { action: 'jump', shelterIndex: 1 }
                ],
                [
                    { action: 'run', x: 248, y: 834, z: 7 },
                    { action: 'climb', x: 248, y: 693, z: 6 },
                    { action: 'run',  shelterIndex: 2 }
                ]
            ],
            // spawn 2 (spawn3)
            [
                [
                    { action: 'jump', x: 274, y: 693, z: 6 },
                    { action: 'jump', x: 244, y: 838, z: 7 },
                    { action: 'run', x: 409, y: 842, z: 7 },
                    { action: 'jump', shelterIndex: 0 }
                ],
                [

                    { action: 'jump', x: 274, y: 693, z: 6 },
                    { action: 'jump', x: 244, y: 836, z: 7 },
                    { action: 'run', x: 132, y: 835, z: 7 },
                    { action: 'jump', shelterIndex: 1 }
                ],
                [
                    { action: 'jump',  shelterIndex: 2 }
                ]
            ]
        ],
        objects: [
            { sprite: 'map3_decor6', scale: 0.59, x: 248, y: 562 + 62, z: 2 },
            { sprite: 'map3_decor5', scale: 0.59, x: 271, y: 661 + 30, z: 6 },
            { sprite: 'map3_decor4', scale: 0.5, x: 423, y: 823 + 9, z: 5 },
            { sprite: 'map3_decor3', scale: 0.58, x: 267, y: 860, z: 7 },
            { sprite: 'map3_decor2', scale: 0.59, x: 233, y: 899, z: 6 },
            { sprite: 'map3_decor1', scale: 0.59, x: 242, y: 853, z: 2 },
        ]
    }
];

class LevelContainer {
    constructor(scene) {
        this.scene = scene;
        this.mapImage = null;

        this.targets = [];
        this.spawnHints = [];
        this.objects = []; // ✦ объекты уровня

        this.grayForbiddenSpawnIndex = 0;

        this.currentShelterPositions = [];
        this.currentSpawnPositions   = [];
    }

    setupLevel(mapIndex) {
        const cfg = MAP_CONFIGS[mapIndex];

        this.currentShelterPositions = cfg.shelters || [];
        this.currentSpawnPositions   = cfg.spawns   || [];

        if (!this.mapImage) {
            this.mapImage = this.scene.add.image(0, 0, cfg.key)
                .setOrigin(0)
                .setDepth(0);
            this.mapImage.setScale(0.667);
        } else {
            this.mapImage.setTexture(cfg.key);
        }

        // --- чистим старое ---
        this.targets.forEach(t => t.sprite.destroy());
        this.targets = [];

        this.spawnHints.forEach(hh => hh.sprite.destroy());
        this.spawnHints = [];

        this.objects.forEach(o => {
            if (o.sprite) o.sprite.destroy();
            if (o.debugCollider) o.debugCollider.destroy(); // ✦ уничтожаем дебажный круг
        });
        this.objects = [];

        // --- таргеты убежищ (крестики) ---
        this.currentShelterPositions.forEach((pos, index) => {
            const sprite = this.scene.add.sprite(pos.x, pos.y, 'crosshair2')
                .setOrigin(0.5, 1)
                .setDepth(10)
                .setVisible(false);

            // масштаб по z как у кота (но depth не трогаем)
            if (typeof pos.z === 'number') {
                const scale = 1 + pos.z * 0.1;
                sprite.setScale(scale * LEVEL_SCALE_FACTOR);
            }

            sprite.disableInteractive();
            this.targets.push({ sprite, index });
        });

        // --- спавн-хинты (кошачьи силуэты) ---
        this.grayForbiddenSpawnIndex = Phaser.Math.Between(0, this.currentSpawnPositions.length - 1);

        this.currentSpawnPositions.forEach((pos, index) => {
            const hint = this.scene.add.sprite(pos.x, pos.y, 'cat_unknown')
                .setOrigin(0.5, 1)
                .setDepth(10);

            if (typeof pos.z === 'number') {
                const scale = 0.4 + pos.z * 0.08;
                hint.setScale(scale * LEVEL_SCALE_FACTOR);
            }

            hint.setAlpha(0.7);
            this.spawnHints.push({ sprite: hint, index });
        });

        // --- статические объекты уровня ---
        if (Array.isArray(cfg.objects)) {
            cfg.objects.forEach(objCfg => {
                const sprite = this.scene.add.sprite(objCfg.x, objCfg.y, objCfg.sprite)
                    .setOrigin(0.5)
                    .setDepth(typeof objCfg.z === 'number' ? objCfg.z : 5);

                if (typeof objCfg.scale === 'number') {
                    sprite.setScale(objCfg.scale);
                }

                this.objects.push({
                    sprite,
                    config: objCfg,
                    used: false,
                    debugCollider: null,   // ✦ сюда положим Graphics
                    debugRadius: 0         // ✦ радиус, который используем и для коллизии, и для отрисовки
                });
            });
        }

        this.hideSpawnHints();
    }

    // подсказки спавнов для выбранного кота
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
