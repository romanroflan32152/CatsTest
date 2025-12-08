class ResultContainer {
    /**
     * @param {Phaser.Scene} scene
     * @param {string[]} survivors
     * @param {'timeout'|'gameOver'|'lastSurvivor'} mode
     * @param {() => void|null} onContinue
     * @param {() => void} onRestart
     */
    constructor(scene, survivors, mode, onContinue, onRestart) {
        this.scene = scene;
        this.survivors = survivors;
        this.mode = mode;
        this.onContinue = onContinue;
        this.onRestart = onRestart;

        this.objects = [];

        const w = scene.scale.width;
        const h = scene.scale.height;

        const dim = scene.add.rectangle(0, 0, w, h, 0x000000, 0.7)
            .setOrigin(0)
            .setDepth(100)
            .setInteractive();
        this.objects.push(dim);

        const panelW = 360;
        const panelH = mode === 'gameOver'     ? 300 :
            mode === 'lastSurvivor' ? 320 : 360;

        const panel = scene.add.graphics().setDepth(101);
        panel.fillStyle(0xD0D6B2, 1);
        panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 18);
        panel.setPosition(w / 2, h / 2);
        this.objects.push(panel);

        let titleStr;
        if (mode === 'gameOver')       titleStr = 'Game Over';
        else if (mode === 'lastSurvivor') titleStr = 'This cat';
        else                            titleStr = 'Success!';

        const title = scene.add.text(w / 2, h / 2 - panelH / 2 + 40, titleStr, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#94A857'
        }).setOrigin(0.5).setDepth(102);
        this.objects.push(title);

        let y = h / 2 - panelH / 2 + 130;

        if (mode === 'timeout' && survivors.length > 0) {
            const total = survivors.length;
            const spacing = 90;
            const rowWidth = spacing * (total - 1);
            const startX = w / 2 - rowWidth / 2;

            survivors.forEach((color, idx) => {
                const x = startX + idx * spacing;
                const s = scene.add.sprite(x, y, `cat_idle_${color}`)
                    .setOrigin(0.5)
                    .setScale(0.8)
                    .setDepth(102);
                this.objects.push(s);
                this.scene.time.delayedCall(300 * idx, () => game.sound.play('meow' + Phaser.Utils.Array.GetRandom([1,2])));
            });

            y += 60;

            const info = scene.add.text(w / 2, y, 'found shelter for this night', {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#94A857'
            }).setOrigin(0.5).setDepth(102);
            this.objects.push(info);

            y += 40;

        } else if (mode === 'lastSurvivor' && survivors.length === 1) {
            game.sound.play('meow' + Phaser.Utils.Array.GetRandom([1,2]));
            this.scene.time.delayedCall(100, () => game.sound.play('end'));
            const color = survivors[0];

            const s = scene.add.sprite(w / 2, y, `cat_idle_${color}`)
                .setOrigin(0.5)
                .setScale(0.9)
                .setDepth(102);
            this.objects.push(s);

            y += 60;

            const info = scene.add.text(w / 2, y, 'is only one left...', {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#94A857'
            }).setOrigin(0.5).setDepth(102);
            this.objects.push(info);

            y += 30;

        } else if (mode === 'gameOver') {
            game.sound.play('end');
            const info = scene.add.text(w / 2, y, 'No one found shelter...', {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#94A857'
            }).setOrigin(0.5).setDepth(102);
            this.objects.push(info);
            y += 40;
        }

        if (mode === 'timeout') {
            this._createButton(w / 2, h / 2 + panelH / 2 - 80, 'Continue', () => {
                this.destroy();
                if (this.onContinue) {
                    game.sound.stopAll();
                    game.sound.play('click');
                    this.onContinue();
                }
            });

            this._createButton(w / 2, h / 2 + panelH / 2 - 40, 'Restart game', () => {
                this.destroy();
                if (this.onRestart) this.onRestart();
            });
        } else {
            this._createButton(w / 2, h / 2 + panelH / 2 - 40, 'Restart game', () => {
                this.destroy();
                if (this.onRestart) {
                    game.sound.stopAll();
                    game.sound.play('click');
                    this.onRestart();
                }
            });
        }
    }

    _createButton(x, y, text, onClick) {
        const scene = this.scene;
        const btnW = 200;
        const btnH = 50;

        const gfx = scene.add.graphics().setDepth(102);
        gfx.fillStyle(0xD0D6B2, 1);
        gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
        gfx.setPosition(x, y);
        gfx.setInteractive(
            new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
            Phaser.Geom.Rectangle.Contains
        );

        const txt = scene.add.text(x, y, text, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#94A857'
        }).setOrigin(0.5).setDepth(103);
        txt.setInteractive();

        gfx.on('pointerup', onClick);
        txt.on('pointerup', onClick);

        this.objects.push(gfx, txt);
    }

    destroy() {
        this.objects.forEach(o => o.destroy());
        this.objects = [];
    }
}
