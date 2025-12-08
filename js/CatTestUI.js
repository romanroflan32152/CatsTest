// CatTestUI.js (или testUI.js — как тебе удобнее)
/**
 * Тестовый UI для управления котом.
 * Подключается к сцене и экземпляру Cat.
 */
class CatTestUI {
    /**
     * @param {Phaser.Scene} scene
     * @param {Cat} cat
     */
    constructor(scene, cat) {
        this.scene = scene;
        this.cat   = cat;

        // режим действия: 'idle' | 'runTo' | 'jumpTo' | 'climbTo'
        this.actionMode = 'idle';

        // z крестика (и z для действий кота)
        this.cursorZ = 5;

        // внутренние ссылки
        this.cursorCross = null;
        this.infoText    = null;
        this.keys        = null;

        this._wheelHandler   = null;
        this._pointerHandler = null;

        this._createCursorCross();
        this._createInfoText();
        this._setupWheelControl();
        this._setupKeyboard();
        this._setupPointerClick();

        // обновляемся каждый кадр
        this.scene.events.on('update', this.update, this);
    }

    // --------------------------
    //   КРЕСТИК / КУРСОР
    // --------------------------

    _createCursorCross() {
        const size = 10;
        this.cursorCross = this.scene.add.graphics();
        this.cursorCross.lineStyle(2, 0x00ff00, 1);

        this.cursorCross.beginPath();
        this.cursorCross.moveTo(-size, 0);
        this.cursorCross.lineTo(size, 0);
        this.cursorCross.moveTo(0, -size);
        this.cursorCross.lineTo(0, size);
        this.cursorCross.strokePath();

        this._updateCursorZVisual();
    }

    _updateCursorZVisual() {
        const rawZ = this.cursorZ;
        const depth = Math.round(rawZ);
        this.cursorCross.setDepth(depth);

        // такая же формула, как у кота (для наглядности)
        const scale = 0.7 + rawZ * 0.05;
        this.cursorCross.setScale(scale);
    }

    // --------------------------
    //       ИНФО-ТЕКСТ
    // --------------------------

    _createInfoText() {
        const h = this.scene.scale.height;
        this.infoText = this.scene.add.text(10, h - 40, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#ffffff'
        });
        this.infoText.setDepth(9999);
    }

    _updateInfoText() {
        const p  = this.scene.input.activePointer;
        const px = p.worldX || p.x;
        const py = p.worldY || p.y;

        const catX = this.cat.x.toFixed(1);
        const catY = this.cat.y.toFixed(1);
        const catZ = this.cat.z.toFixed(2);

        const cursorX = px.toFixed(1);
        const cursorY = py.toFixed(1);
        const cursorZ = this.cursorZ;

        this.infoText.setText(
            `Cat:    x=${catX}, y=${catY}, z=${catZ}, state=${this.cat.state}\n` +
            `Cursor: x=${cursorX}, y=${cursorY}, z=${cursorZ}, mode=${this.actionMode}`
        );
    }

    // --------------------------
    //      УПРАВЛЕНИЕ Z (WHEEL)
    // --------------------------

    _setupWheelControl() {
        this._wheelHandler = (pointer, gameObjects, deltaX, deltaY) => {
            if (deltaY > 0) {
                this.cursorZ = Phaser.Math.Clamp(this.cursorZ - 1, 1, 10);
            } else if (deltaY < 0) {
                this.cursorZ = Phaser.Math.Clamp(this.cursorZ + 1, 1, 10);
            }
            this._updateCursorZVisual();
        };

        this.scene.input.on('wheel', this._wheelHandler);
    }

    // --------------------------
    //      КЛАВИАТУРА
    // --------------------------

    _setupKeyboard() {
        this.keys = this.scene.input.keyboard.addKeys({
            I: Phaser.Input.Keyboard.KeyCodes.I,
            R: Phaser.Input.Keyboard.KeyCodes.R,
            J: Phaser.Input.Keyboard.KeyCodes.J,
            C: Phaser.Input.Keyboard.KeyCodes.C,
            S: Phaser.Input.Keyboard.KeyCodes.S
        });

        this.keys.I.on('down', () => {
            this.actionMode = 'idle';
            this.cat.toIdle();
        });

        this.keys.R.on('down', () => {
            this.actionMode = 'runTo';
        });

        this.keys.J.on('down', () => {
            this.actionMode = 'jumpTo';
        });

        this.keys.C.on('down', () => {
            this.actionMode = 'climbTo';
        });

        this.keys.S.on('down', () => {
            // испуг — мгновенное действие, режим не меняем
            this.cat.scareFor(1000);
        });
    }

    // --------------------------
    //      МЫШКА / КЛИК
    // --------------------------

    _setupPointerClick() {
        this._pointerHandler = (pointer) => {
            if (pointer.button !== 0) return; // только ЛКМ

            const x = pointer.worldX;
            const y = pointer.worldY;
            const z = this.cursorZ;

            switch (this.actionMode) {
                case 'runTo':
                    this.cat.runTo(x, y, z);
                    break;
                case 'jumpTo':
                    this.cat.jumpTo(x, y, z);
                    break;
                case 'climbTo':
                    this.cat.climbTo(x, y, z);
                    break;
                case 'idle':
                default:
                    // в idle по клику ничего не делаем
                    break;
            }
        };

        this.scene.input.on('pointerdown', this._pointerHandler);
    }

    // --------------------------
    //          UPDATE
    // --------------------------

    update() {
        if (!this.cursorCross) return;

        const p  = this.scene.input.activePointer;
        const px = p.worldX || p.x;
        const py = p.worldY || p.y;

        // крестик следует за курсором
        this.cursorCross.setPosition(px, py);

        // обновляем инфо-текст
        this._updateInfoText();
    }

    // --------------------------
    //         DESTROY
    // --------------------------

    destroy() {
        // отписываемся от событий сцены
        this.scene.events.off('update', this.update, this);

        if (this._wheelHandler) {
            this.scene.input.off('wheel', this._wheelHandler);
            this._wheelHandler = null;
        }

        if (this._pointerHandler) {
            this.scene.input.off('pointerdown', this._pointerHandler);
            this._pointerHandler = null;
        }

        if (this.keys) {
            this.keys.I.removeAllListeners();
            this.keys.R.removeAllListeners();
            this.keys.J.removeAllListeners();
            this.keys.C.removeAllListeners();
            this.keys.S.removeAllListeners();
            this.keys = null;
        }

        if (this.cursorCross) {
            this.cursorCross.destroy();
            this.cursorCross = null;
        }

        if (this.infoText) {
            this.infoText.destroy();
            this.infoText = null;
        }
    }
}
