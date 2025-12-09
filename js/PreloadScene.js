class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');

        this.centerX = GAME_WIDTH / 2;
        this.centerY = GAME_HEIGHT / 2;
    }

    preload() {
        // нежно-зелёный фон
        this.cameras.main.setBackgroundColor(0x94A857);

        this.createLoaderUI();
        this.createLoaderCat();   // ✦ кот-лоадер

        // изображения
        this.loadImages('./assets/images/');

        // звуки
        this.loadSounds('./assets/sounds/');
    }

    create() {
        this.createPlayButton();
    }

    // ------------------------------
    //       АВТО-ЗАГРУЗЧИК
    // ------------------------------

    loadImages(path) {
        const images = [
            "banana.png",
            "box1.png", "box2.png", "box3.png", "box4.png",
            "box1_forward.png", "box2_forward.png", "box3_forward.png", "box4_forward.png",
            "busket1.png", "busket2.png",
            "car1.png", "car2.png", "car3.png",
            "cat_choice.png",
            "cat_climb_black.png", "cat_climb_gray.png", "cat_climb_orange.png",
            "cat_fight_black_gray.png", "cat_fight_black_orange.png",
            "cat_fight_orange_black.png", "cat_fight_orange_gray.png",
            "cat_fight_gray_black.png", "cat_fight_gray_orange.png",
            "cat_idle_black.png", "cat_idle_gray.png", "cat_idle_orange.png",
            "cat_jump_black.png", "cat_jump_gray.png", "cat_jump_orange.png",
            "cat_run1_black.png", "cat_run1_gray.png", "cat_run1_orange.png",
            "cat_run2_black.png", "cat_run2_gray.png", "cat_run2_orange.png",
            "cat_scared_black.png", "cat_scared_gray.png", "cat_scared_orange.png",
            "cat_unknown.png",
            "crosshair1.png", "crosshair2.png",
            "garbage1.png", "garbage2.png",
            "map1.png", "map2.png", "map3.png",
            "map3_decor1.png", "map3_decor2.png", "map3_decor3.png",
            "map3_decor4.png", "map3_decor5.png", "map3_decor6.png"
        ];

        images.forEach(file => {
            const key = file.replace('.png', '');
            this.load.image(key, `${path}${file}`);
        });
    }

    loadSounds(path) {
        const sounds = [
            "catfight.mp3",
            "click.mp3",
            "end.mp3",
            "fall.mp3",
            "jump.mp3",
            "jumpdown.mp3",
            "meow1.mp3",
            "meow2.mp3",
            "success1.mp3",
            "success2.mp3",
            "success3.mp3",
            "timer.mp3"
        ];

        sounds.forEach(file => {
            const key = file.replace('.mp3', '');
            this.load.audio(key, `${path}${file}`);
        });
    }

    // ------------------------------
    //    UI загрузки
    // ------------------------------

    createLoaderUI() {
        this.loadingText = this.add.text(GAME_WIDTH / 2, 700, 'Loading: 0%', {
            fontFamily: 'DynaPuff',
            fontSize: '25px',
            color: '#f0f0f0'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            this.loadingText.setText(`Loading: ${Math.round(value * 90)}%`);
        });
    }

    // ✦ Кот в центре экрана
    createLoaderCat() {
        // как только загрузился cat_run1_black — создаём спрайт и запускаем мигание
        this.load.once('filecomplete-image-cat_run1_black', () => {
            this.loaderCat = this.add.sprite(this.centerX, this.centerY, 'cat_run1_black')
                .setOrigin(0.5).setScale(1.3);

            // таймер переключения между кадрами раз в 0.25 c
            this.catRunTimer = this.time.addEvent({
                delay: 250,
                loop: true,
                callback: () => {
                    if (!this.loaderCat) return;

                    const currentKey = this.loaderCat.texture.key;
                    const nextKey = (currentKey === 'cat_run1_black')
                        ? 'cat_run2_black'
                        : 'cat_run1_black';

                    if (this.textures.exists(nextKey)) {
                        this.loaderCat.setTexture(nextKey);
                    }
                }
            });
        }, this);
    }

    createPlayButton() {
        setTimeout(() => this.loadingText.setText("Loading: 93%"), 100);
        setTimeout(() => this.loadingText.setText("Loading: 94%"), 230);
        setTimeout(() => this.loadingText.setText("Loading: 95%"), 310);
        setTimeout(() => this.loadingText.setText("Loading: 96%"), 450);
        setTimeout(() => this.loadingText.setText("Loading: 98%"), 560);
        setTimeout(() => {
            this.loadingText.setText("Loading: 100%");
            this.tweens.add({
                targets: this.loadingText,
                alpha: { from: 1, to: 0.2 },
                duration: 150,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    // ✦ после мигания показываем "Tap to play"
                    this.loadingText.setText("Tap to play");
                    this.loadingText.setAlpha(1);

                    // включаем ввод
                    this.input.once('pointerdown', () => {
                        this.scene.start('GameScene');
                    });

                    this.tweens.add({
                        targets: this.loadingText,
                        scale: {from: 1.5, to: 1.3},
                        duration: 500,
                        yoyo: true,
                        repeat: -1
                    });

                    if (this.catRunTimer) {
                        this.catRunTimer.remove(false);
                        this.catRunTimer = null;
                    }

                    if (this.loaderCat && this.textures.exists('cat_idle_black')) {
                        this.loaderCat.setTexture('cat_idle_black');
                        this.loaderCat.x = this.centerX;
                        this.loaderCat.setScale(1.1);
                    } else if (this.textures.exists('cat_idle_black')) {
                        // fallback, если по какой-то причине спрайт ещё не создан
                        this.loaderCat = this.add.sprite(this.centerX, this.centerY, 'cat_idle_black')
                            .setOrigin(0.5);
                    }
                }
            });
        }, 600);
    }
}
