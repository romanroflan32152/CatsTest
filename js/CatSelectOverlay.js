class CatSelectOverlay extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {(color: string) => void} onSubmit
     */
    constructor(scene, onSubmit) {
        super(scene, 0, 0);
        this.scene = scene;
        this.onSubmit = onSubmit;

        this.setDepth(1000);

        const w = scene.scale.width;
        const h = scene.scale.height;

        this.setSize(w, h);

        const blocker = scene.add.rectangle(0, 0, w, h, 0x94A857, 1)
            .setOrigin(0)
            .setInteractive();
        this.add(blocker);

        scene.add.existing(this);

        this.cats = [
            { color: 'black',  key: 'cat_idle_black'  },
            { color: 'orange', key: 'cat_idle_orange' },
            { color: 'gray',   key: 'cat_idle_gray'   }
        ];

        this.selectedIndex   = 0;
        this.disabledColors  = new Set();
        this.catItems        = [];
        this._submitted      = false;

        this._createUI();
        this._updateSelectionVisual();
    }

    setCatEnabled(color, enabled) {
        const idx = this.cats.findIndex(c => c.color === color);
        if (idx === -1) return;

        const item = this.catItems[idx];
        if (!item) return;

        const list = [item.sprite, item.square, item.check];

        if (!enabled) {
            this.disabledColors.add(color);
            list.forEach(o => {
                o.alpha = 0.4;
                o.disableInteractive();
            });

            if (this.selectedIndex === idx) {
                const newIdx = this.cats.findIndex(
                    c => !this.disabledColors.has(c.color)
                );
                if (newIdx !== -1) {
                    this.selectedIndex = newIdx;
                }
            }
        } else {
            this.disabledColors.delete(color);
            list.forEach(o => {
                o.alpha = 1;
                o.setInteractive();
            });
        }

        this._updateSelectionVisual();
    }

    getSelectedColor() {
        return this.cats[this.selectedIndex].color;
    }

    close() {
        this.destroy(true);
    }

    _createUI() {
        const w  = this.scene.scale.width;
        const h  = this.scene.scale.height;
        const cx = w / 2;

        const headerW = Math.min(400, w * 0.8);
        const headerH = 60;
        const headerY = h * 0.2;

        const header = this._createPanel(cx, headerY, headerW, headerH);
        this.add(header);

        const title = this.scene.add.text(cx, headerY, 'Choose your cat', {
            fontFamily: 'DynaPuff',
            fontSize: '24px',
            color: '#94A857'
        }).setOrigin(0.5);
        this.add(title);

        const rowY     = h * 0.45;
        const rowWidth = Math.min(500, w * 0.9);
        const spacing  = rowWidth / (this.cats.length + 1);

        const bubbleTexts = {
            black:  'Fastest runner',
            orange: 'Brave acrobat',
            gray:   'Sixth sense owner'
        };

        this.cats.forEach((cfg, i) => {
            const x = cx - rowWidth / 2 + spacing * (i + 1);

            const sprite = this.scene.add.sprite(x, rowY, cfg.key)
                .setOrigin(0.5)
                .setScale(0.8);

            const sh = sprite.displayHeight || sprite.height || 64;

            const sqSize   = 42;
            const squareY  = rowY + sh * 0.6 + 12;
            const square   = this._createSquare(sqSize, 0xD0D6B2);
            square.setPosition(x - sqSize / 2, squareY - sqSize / 2);

            const check = this._createCheck(0x94A857);
            const checkX = x;
            const checkY = squareY;
            check.setPosition(checkX, checkY);
            check.setVisible(false);

            this.add(sprite);
            this.add(square);
            this.add(check);

            const bubbleWidth  = 180;
            const bubbleHeight = 50;

            const bubbleCenterY = rowY - sh * 0.8;
            const bubbleCenterX = x;

            const bubbleGfx = this.scene.add.graphics();
            bubbleGfx.lineStyle(2, 0x94A857, 1);
            bubbleGfx.fillStyle(0xD0D6B2, 1);

            const catTopX = x;
            const catTopY = rowY - sh / 2 + 5;

            const bubbleRectX = bubbleCenterX - bubbleWidth / 2;
            const bubbleRectY = bubbleCenterY - bubbleHeight / 2;

            bubbleGfx.beginPath();
            bubbleGfx.moveTo(catTopX, catTopY);
            bubbleGfx.lineTo(bubbleCenterX, bubbleRectY + bubbleHeight);
            bubbleGfx.strokePath();

            bubbleGfx.fillRoundedRect(
                bubbleRectX,
                bubbleRectY,
                bubbleWidth,
                bubbleHeight,
                12
            );
            bubbleGfx.strokeRoundedRect(
                bubbleRectX,
                bubbleRectY,
                bubbleWidth,
                bubbleHeight,
                12
            );

            bubbleGfx.setVisible(false);
            this.add(bubbleGfx);

            const bubbleText = this.scene.add.text(
                bubbleCenterX,
                bubbleCenterY,
                bubbleTexts[cfg.color] || '',
                {
                    fontFamily: 'DynaPuff',
                    fontSize: '16px',
                    color: '#94A857',
                    align: 'center',
                    wordWrap: { width: bubbleWidth - 16 }
                }
            ).setOrigin(0.5);
            bubbleText.setVisible(false);
            this.add(bubbleText);

            const selectFn = () => {
                if (this.disabledColors.has(cfg.color)) return;
                game.sound.play('click');
                this.selectedIndex = i;
                this._updateSelectionVisual();
            };

            sprite.setInteractive();
            square.setInteractive(
                new Phaser.Geom.Rectangle(0, 0, sqSize, sqSize),
                Phaser.Geom.Rectangle.Contains
            );
            check.setInteractive(
                new Phaser.Geom.Rectangle(-16, -16, 32, 32),
                Phaser.Geom.Rectangle.Contains
            );

            sprite.on('pointerup', selectFn);
            square.on('pointerup', selectFn);
            check.on('pointerup', selectFn);

            this.catItems[i] = { sprite, square, check, bubbleGfx, bubbleText };
        });

        const submitW = 200;
        const submitH = 60;
        const submitY = h * 0.75;

        const submitPanel = this._createPanel(cx, submitY, submitW, submitH);
        const submitText  = this.scene.add.text(cx, submitY, 'Submit', {
            fontFamily: 'DynaPuff',
            fontSize: '22px',
            color: '#94A857'
        }).setOrigin(0.5);

        this.add(submitPanel);
        this.add(submitText);

        const submitFn = () => {
            if (this._submitted) return;
            game.sound.play('click');
            this._submitted = true;

            const color = this.getSelectedColor();
            if (this.onSubmit) this.onSubmit(color);
        };

        submitPanel.on('pointerup', submitFn);
        submitText.setInteractive();
        submitText.on('pointerup', submitFn);
    }

    _createPanel(cx, cy, w, h) {
        const g = this.scene.add.graphics();
        g.fillStyle(0xD0D6B2, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
        g.setPosition(cx, cy);

        g.setInteractive(
            new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
            Phaser.Geom.Rectangle.Contains
        );

        return g;
    }

    _createSquare(size, color) {
        const g = this.scene.add.graphics();
        g.fillStyle(color, 1);
        g.fillRoundedRect(0, 0, size, size, 8);
        return g;
    }

    _createCheck(color) {
        const g = this.scene.add.graphics();
        g.lineStyle(4, color, 1);
        g.beginPath();
        g.moveTo(-10, 0);
        g.lineTo(-2, 10);
        g.lineTo(12, -8);
        g.strokePath();
        return g;
    }

    _updateSelectionVisual() {
        this.catItems.forEach((item, i) => {
            const selected = i === this.selectedIndex;
            item.check.setVisible(selected);
            if (item.bubbleGfx)  item.bubbleGfx.setVisible(selected);
            if (item.bubbleText) item.bubbleText.setVisible(selected);
        });
    }
}
