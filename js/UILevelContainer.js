class UILevelContainer {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;

        const w = scene.scale.width;
        const h = scene.scale.height;

        const panelW = Math.min(420, w * 0.85);
        const panelH = 80;

        this.topPanel = scene.add.graphics().setDepth(10);
        this.topPanel.fillStyle(0xD0D6B2, 1);
        this.topPanel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);
        this.topPanel.setPosition(w / 2, 70);

        this.topCatSprite = scene.add.sprite(
            w / 2 - panelW / 2 + 40,
            70,
            'cat_idle_black'
        )
            .setOrigin(0.5)
            .setScale(0.7)
            .setDepth(11);

        this.topLabel = scene.add.text(w / 2, 70, '', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#94A857',
            align: 'center'
        }).setOrigin(0.5).setDepth(11);

        const btnW = 220;
        const btnH = 60;
        const btnY = h - 80;

        this.submitPanel = scene.add.graphics().setDepth(10);
        this.submitPanel.fillStyle(0xD0D6B2, 1);
        this.submitPanel.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
        this.submitPanel.setPosition(w / 2, btnY);
        this.submitPanel.setInteractive(
            new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
            Phaser.Geom.Rectangle.Contains
        );

        this.submitText = scene.add.text(w / 2, btnY, 'Submit', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#94A857'
        }).setOrigin(0.5).setDepth(11);
        this.submitText.setInteractive();

        this._submitHandler = null;

        const handler = () => {
            if (this._submitHandler) {
                game.sound.play('click');
                this._submitHandler();
            }
        };

        this.submitPanel.on('pointerup', handler);
        this.submitText.on('pointerup', handler);

        this.setVisible(false);
    }

    setSubmitHandler(fn) {
        this._submitHandler = fn;
    }

    setVisible(visible) {
        this.topPanel.setVisible(visible);
        this.topCatSprite.setVisible(visible);
        this.topLabel.setVisible(visible);
        this.submitPanel.setVisible(visible);
        this.submitText.setVisible(visible);
    }

    showChooseShelter(color) {
        this.setVisible(true);
        this.topCatSprite.setTexture(`cat_idle_${color}`);
        this.topLabel.setText('Choose your shelter');
        this.submitText.setText('Submit');
    }
}
