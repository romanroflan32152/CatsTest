// базовая скорость (пикс/кадр или пикс/тик — зависит от твоего FPS/ожиданий)
// здесь используем как пикс/сек для твина
const CATSPEED = 100;
const SHOW_CAT_COLLIDERS = true;

class Cat extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {string} color - 'black' | 'gray' | 'orange'
     */
    constructor(scene, x, y, color = 'black') {
        super(scene, x, y);

        this.scene = scene;
        this.color = color;

        // факторы действий
        this.runFactor   = 1;
        this.jumpFactor  = 1.75;
        this.climbFactor = 0.5;
        this.scareFactor = 1;

        if (color === 'black') {
            this.runFactor = 1.5
        }
        if (color === 'orange') {
            this.scareFactor = 0.5;
            this.climbFactor = 0.25;
            this.jumpFactor  = 2.5;
        }

        this.state = null;

        // "глубина" и масштаб по z (1..10)
        this._z = 1;
        this._currentDepth = null; // чтобы не дёргать setDepth каждый тик
        this._updateZVisual();     // выставим depth и scale

        // внутренние ссылки на таймеры/твины
        this._runTimer        = null; // переключение run1/run2
        this._scaredTween     = null; // подпрыгивание при scared
        this._moveTween       = null; // движение run/jump/climb (+z)
        this._climbDelayEvent = null; // задержка висения при climb
        this._scareTimer      = null; // таймер scareFor
        this._preActionDelayEvent = null; // короткая idle-пауза перед прыжком/карабканьем

        // для scareFor
        this._hadActionBeforeScare = false;
        this._stateBeforeScare     = null;

        this._fightTimer          = null; // таймер fightFor
        this._fightCooldownUntil  = 0;    // время (ms), до которого кот не может снова драться
        this._fightTween          = null; // твины драки
        this._fightOpponentColor  = null; // цвет второго кота в драке
        this._hadActionBeforeFight = false;
        this._stateBeforeFight     = null;

        // пауза логики (движение и т.п.)
        this._movementPaused = false;

        // коллайдер (круг) для столкновений
        this.colliderGraphics = null;
        if (SHOW_CAT_COLLIDERS) {
            this.colliderGraphics = scene.add.graphics()
                .setDepth(999)
                .setScrollFactor(1);
        }

        // спрайт
        this.sprite = scene.add.sprite(0, 0, `cat_idle_${this.color}`);
        this.sprite.setOrigin(0.5, 0.5);
        this.add(this.sprite);

        scene.add.existing(this);

        this.setState('idle');
    }

    // z как свойство + автоприменение визуала
    get z() {
        return this._z;
    }

    set z(value) {
        this._z = Phaser.Math.Clamp(value, 1, 10);
        this._updateZVisual();
    }

    // ===========================
    //    ПУБЛИЧНОЕ API СОСТОЯНИЙ
    // ===========================

    setColor(color) {
        if (this.color === color) return;
        this.color = color;
        this._applyState();
    }

    /**
     * state: 'idle' | 'run' | 'jump' | 'scared' | 'climb' | 'fight'
     */
    setState(state) {
        if (this.state === state) return;
        this.state = state;
        this._applyState();
    }

    // z от 1 до 10, влияет на depth и scale контейнера (мгновенно)
    setZ(z) {
        this.z = z; // пролетает через сеттер
    }

    // ===========================
    //    ВЫСОКОУРОВНЕВЫЕ ДЕЙСТВИЯ
    // ===========================

    // остановка всех действий, переход в idle
    toIdle() {
        this._stopAllActions();
        this.setState('idle');
    }

    /**
     * Прямолинейный бег к точке (x,y,z)
     * скорость: CATSPEED * this.runFactor
     */
    runTo(x, y, z, onComplete) {
        if (typeof z === 'function') { // runTo(x,y,cb)
            onComplete = z;
            z = undefined;
        }

        this._stopAllActions();
        this.setState('run');

        // разворот спрайта по X в сторону движения
        if (x > this.x) {
            this.sprite.setFlipX(true);
        } else {
            this.sprite.setFlipX(false);
        }

        const targetZ = (typeof z === 'number')
            ? Phaser.Math.Clamp(z, 1, 10)
            : this.z;

        const speed    = CATSPEED * this.runFactor;   // px/sec
        const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
        const duration = (distance / Math.max(speed, 0.0001)) * 1000; // ms

        this._moveTween = this.scene.tweens.add({
            targets: this,
            x,
            y,
            z: targetZ,       // плавно меняем z → меняется scale/depth
            duration,
            onComplete: () => {
                this._moveTween = null;
                this.setState('idle');
                if (typeof onComplete === 'function') {
                    onComplete();
                }
            }
        });
    }

    /**
     * Прыжок к точке (x,y,z)
     * скорость: CATSPEED * this.jumpFactor
     * + 200мс idle перед началом прыжка
     */
    jumpTo(x, y, z, onComplete) {
        if (typeof z === 'function') {
            onComplete = z;
            z = undefined;
        }

        this._stopAllActions();

        // короткая пауза в idle перед прыжком
        this.setState('idle');

        const delayBeforeJump = 200;

        this._preActionDelayEvent = this.scene.time.addEvent({
            delay: delayBeforeJump,
            callback: () => {
                this._preActionDelayEvent = null;

                // могли успеть уничтожить кота
                if (!this.scene || !this.active) {
                    if (typeof onComplete === 'function') onComplete();
                    return;
                }

                this.setState('jump');

                // разворот спрайта по X в сторону движения
                if (x > this.x) {
                    this.sprite.setFlipX(true);
                } else {
                    this.sprite.setFlipX(false);
                }

                if (y > this.y) {
                    game.sound.play('jumpdown');
                } else {
                    game.sound.play('jump');
                }

                const targetZ = (typeof z === 'number')
                    ? Phaser.Math.Clamp(z, 1, 10)
                    : this.z;

                const speed    = CATSPEED * this.jumpFactor;
                const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
                const duration = (distance / Math.max(speed, 0.0001)) * 1000;

                this._moveTween = this.scene.tweens.add({
                    targets: this,
                    x,
                    y,
                    z: targetZ,   // тоже твиним
                    duration,
                    onComplete: () => {
                        this._moveTween = null;
                        this.setState('idle');
                        if (typeof onComplete === 'function') {
                            onComplete();
                        }
                    }
                });
            }
        });
    }


    /**
     * Лезет к точке (x,y,z), висит, потом idle
     * движение: скорость CATSPEED * this.jumpFactor
     * висит: 1000мс * this.climbFactor
     * + 200мс idle перед началом карабканья
     */
    climbTo(x, y, z, onComplete) {
        if (typeof z === 'function') {
            onComplete = z;
            z = undefined;
        }

        this._stopAllActions();

        // короткий idle перед стартом карабканья
        this.setState('idle');

        const delayBeforeClimb = 200;

        this._preActionDelayEvent = this.scene.time.addEvent({
            delay: delayBeforeClimb,
            callback: () => {
                this._preActionDelayEvent = null;

                if (!this.scene || !this.active) {
                    if (typeof onComplete === 'function') onComplete();
                    return;
                }

                this.setState('climb');

                const targetZ = (typeof z === 'number')
                    ? Phaser.Math.Clamp(z, 1, 10)
                    : this.z;

                const speed    = CATSPEED * this.jumpFactor;
                const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
                const duration = (distance / Math.max(speed, 0.0001)) * 1000;

                this._moveTween = this.scene.tweens.add({
                    targets: this,
                    x,
                    y,
                    z: targetZ,   // тоже твиним
                    duration,
                    onComplete: () => {
                        this._moveTween = null;

                        // пауза "висения"
                        const delay = 1000 * this.climbFactor;
                        this._climbDelayEvent = this.scene.time.addEvent({
                            delay,
                            callback: () => {
                                this._climbDelayEvent = null;
                                this.setState('idle');
                                if (typeof onComplete === 'function') {
                                    onComplete();
                                }
                            }
                        });
                    }
                });
            }
        });
    }


    /**
     * Испугать на время (time ms).
     * - ставит scared на time * scareFactor
     * - паузит движение (run/jump/climb)
     * - после страха продолжает предыдущее действие;
     *   если его не было — просто idle().
     */
    scareFor(time) {
        const duration = (time || 1000) * this.scareFactor;

        // уже под страхом – просто обновим таймер
        if (this._scareTimer) {
            this._scareTimer.remove(false);
            this._scareTimer = null;
        }

        // было ли действие до страха?
        this._hadActionBeforeScare = !!(this._moveTween || this._climbDelayEvent);
        this._stateBeforeScare     = this.state;

        // пауза движения
        this._setMovementPaused(true);

        // перейти в scared
        this.setState('scared');

        game.sound.play('fall');
        this._scareTimer = this.scene.time.addEvent({
            delay: duration,
            callback: () => {
                this._scareTimer = null;

                if (this._hadActionBeforeScare) {
                    // возвращаем предыдущее состояние и продолжаем движение
                    this.setState(this._stateBeforeScare || 'idle');
                    this._setMovementPaused(false);
                } else {
                    // ничего не делали – просто в idle
                    this._setMovementPaused(false);
                    this.toIdle();
                }
            }
        });
    }

    /**
     * Драка на время (time ms).
     * - ставит state 'fight'
     * - паузит движение (run/jump/climb)
     * - по окончании возвращает предыдущее действие или idle.
     * opponentColor — цвет второго кота (для выбора спрайта).
     */
    fightFor(time, opponentColor) {
        const now = this.scene.time.now;    // время сцены в ms
        const cooldownMs = 5000;           // кулдаун драки
        const duration   = time || 2000;   // длительность драки

        // кулдаун
        if (now < this._fightCooldownUntil) {
            return;
        }
        this._fightCooldownUntil = now + cooldownMs;

        // уже дерёмся — не перезапускаем
        if (this._fightTimer) {
            return;
        }
        game.sound.play('catfight');

        this._fightOpponentColor = opponentColor || this._fightOpponentColor;

        // запоминаем, было ли движение
        this._hadActionBeforeFight = !!(this._moveTween || this._climbDelayEvent);
        this._stateBeforeFight     = this.state;

        // пауза движения
        this._setMovementPaused(true);

        // переходим в fight → _applyState выставит спрайт и твины
        this.setState('fight');

        this._fightTimer = this.scene.time.addEvent({
            delay: duration,
            callback: () => {
                this._fightTimer = null;

                // снимаем паузу
                this._setMovementPaused(false);

                if (this._hadActionBeforeFight) {
                    this.setState(this._stateBeforeFight || 'idle');
                } else {
                    this.toIdle();
                }
            }
        });
    }

    // ===========================
    //        PAUSE / RESUME
    // ===========================

    pauseActions() {
        this._setMovementPaused(true);
        // при желании можно паузить и сам страх:
        // if (this._scareTimer) this._scareTimer.paused = true;
        // if (this._scaredTween) this._scaredTween.paused = true;
    }

    resumeActions() {
        this._setMovementPaused(false);
        // if (this._scareTimer) this._scareTimer.paused = false;
        // if (this._scaredTween) this._scaredTween.paused = false;
    }

    // простенький билдер последовательностей
    sequence() {
        return new CatSequence(this);
    }

    // ===========================
    //      ВНУТРЕННЯЯ ЛОГИКА
    // ===========================

    _updateZVisual() {
        const rawZ = this._z;

        // depth по округлённому z
        const depth = Math.round(rawZ);
        if (depth !== this._currentDepth) {
            this._currentDepth = depth;
            this.setDepth(depth);
        }

        // scale по сырому z (float) — плавно
        const scale = 0.5 + rawZ * 0.08;
        this.setScale(scale);
    }

    // радиус кругового коллайдера: ~0.5 ширины спрайта (диаметр)
    getCollisionRadius() {
        if (!this.sprite) return 0;

        const baseWidth = (this.sprite.width || 0) * Math.abs(this.sprite.scaleX || 1);
        const worldScale = Math.abs(this.scaleX || 1); // масштаб контейнера по z

        return baseWidth * worldScale * 0.25; // 0.5 от ширины → радиус = 0.25
    }

    // мировой центр коллайдера = центр текстуры (0.5, 0.5), независимо от origin
    getCollisionCenter() {
        if (!this.sprite) {
            return { x: this.x, y: this.y };
        }

        const originX = this.sprite.originX;
        const originY = this.sprite.originY;

        const texW = this.sprite.width  || 0;
        const texH = this.sprite.height || 0;

        // локальный масштаб спрайта
        const spriteScaleX = this.sprite.scaleX || 1;
        const spriteScaleY = this.sprite.scaleY || 1;

        // масштаб контейнера по z
        const containerScaleX = this.scaleX || 1;
        const containerScaleY = this.scaleY || 1;

        // итоговый масштаб по осям
        const worldScaleX = spriteScaleX * containerScaleX;
        const worldScaleY = spriteScaleY * containerScaleY;

        // центр текстуры (0.5,0.5) относительно origin в координатах КОНТЕЙНЕРА
        const offsetX = this.sprite.x + (0.5 - originX) * texW * worldScaleX;
        const offsetY = this.sprite.y + (0.5 - originY) * texH * worldScaleY;

        return {
            x: this.x + offsetX,
            y: this.y + offsetY
        };
    }

    // обновление отладочного круга-коллайдера
    updateColliderDebug() {
        if (!SHOW_CAT_COLLIDERS || !this.colliderGraphics || !this.sprite) return;

        const r = this.getCollisionRadius();
        const center = this.getCollisionCenter();

        this.colliderGraphics.clear();
        this.colliderGraphics.lineStyle(1, 0xff0000, 0.6);
        this.colliderGraphics.strokeCircle(center.x, center.y, r);
    }

    _setMovementPaused(paused) {
        this._movementPaused = paused;

        if (this._moveTween) {
            this._moveTween.paused = paused;
        }
        if (this._climbDelayEvent) {
            this._climbDelayEvent.paused = paused;
        }
        if (this._runTimer) {
            this._runTimer.paused = paused;
        }
    }

    _stopAllActions() {
        // движение
        if (this._moveTween) {
            this._moveTween.remove(false);
            this._moveTween = null;
        }
        if (this._climbDelayEvent) {
            this._climbDelayEvent.remove(false);
            this._climbDelayEvent = null;
        }
        if (this._preActionDelayEvent) {
            this._preActionDelayEvent.remove(false);
            this._preActionDelayEvent = null;
        }

        // страх
        if (this._scareTimer) {
            this._scareTimer.remove(false);
            this._scareTimer = null;
        }

        // драка
        if (this._fightTimer) {
            this._fightTimer.remove(false);
            this._fightTimer = null;
        }

        // состояние (таймеры и твины внутри)
        this._stopStateInner();
    }

    _stopStateInner() {
        if (this._runTimer) {
            this._runTimer.remove(false);
            this._runTimer = null;
        }
        if (this._scaredTween) {
            this._scaredTween.stop();
            this._scaredTween.remove();
            this._scaredTween = null;
        }
        if (this._runTimer) {
            this._runTimer.remove(false);
            this._runTimer = null;
        }
        if (this._scaredTween) {
            this._scaredTween.stop();
            this._scaredTween.remove();
            this._scaredTween = null;
        }
        if (this._fightTween) {
            this._fightTween.stop();
            this._fightTween.remove();
            this._fightTween = null;
        }

        if (this.sprite) {
            this.scene.tweens.killTweensOf(this.sprite);

            this.sprite.setAngle(0);
            this.sprite.setScale(1);
            this.sprite.setPosition(0, 0);
        }
    }

    _setTextureSafe(key) {
        if (this.scene.textures.exists(key)) {
            this.sprite.setTexture(key);
        } else if (this.scene.textures.exists('cat_unknown')) {
            this.sprite.setTexture('cat_unknown');
        }
    }

    _applyState() {
        if (!this.sprite) return;

        this._stopStateInner();

        const c = this.color;

        switch (this.state) {
            // -------- idle --------
            case 'idle': {
                this.sprite.setOrigin(0.5, 1);
                this._setTextureSafe(`cat_idle_${c}`);
                this.sprite.setScale(0.8); // 0.8 от объекта
                this.sprite.setPosition(0, 0);
                break;
            }

            // -------- run --------
            case 'run': {
                this.sprite.setOrigin(0.5, 1);
                this._setTextureSafe(`cat_run1_${c}`);
                this.sprite.setScale(1);

                // const offsetX = (this.sprite.displayWidth || this.sprite.width) * 0.25;
                const offsetX = 0;
                this.sprite.setPosition(offsetX, 0);

                let showFirst = true;
                this._runTimer = this.scene.time.addEvent({
                    delay: 300, // по умолчанию 0.3с; можно связать с runFactor
                    loop: true,
                    callback: () => {
                        if (!this.sprite) return;
                        showFirst = !showFirst;
                        const key = showFirst
                            ? `cat_run1_${c}`
                            : `cat_run2_${c}`;
                        this._setTextureSafe(key);
                    }
                });

                this._runTimer.paused = this._movementPaused;
                break;
            }

            // -------- jump --------
            case 'jump': {
                this.sprite.setOrigin(0.5, 1);
                this._setTextureSafe(`cat_jump_${c}`);
                this.sprite.setScale(0.5);

                // const offsetX = (this.sprite.displayWidth || this.sprite.width) * 0.25;
                const offsetX = 0;
                this.sprite.setPosition(offsetX, 0);
                break;
            }

            // -------- scared --------
            case 'scared': {
                this.sprite.setOrigin(0.5, 1);
                this._setTextureSafe(`cat_scared_${c}`);
                this.sprite.setScale(1.1);
                this.sprite.setPosition(0, 0);

                this._scaredTween = this.scene.tweens.add({
                    targets: this.sprite,
                    y: '-=8',
                    scaleX: 0.9,
                    duration: 150,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut'
                });
                break;
            }

            // -------- climb --------
            case 'climb': {
                this.sprite.setOrigin(0.5, 0.0); // верхняя часть
                this._setTextureSafe(`cat_climb_${c}`);
                this.sprite.setScale(1.1);
                this.sprite.setPosition(0, 0);
                break;
            }

            // -------- fight --------
            case 'fight': {
                this.sprite.setOrigin(0.5, 0.5);

                const a = this.color;
                const b = this._fightOpponentColor || this.color;
                let fightKey = null;

                // подбираем нужный атлас под пару цветов
                if (a === 'black' && b === 'gray') {
                    fightKey = 'cat_fight_black_gray';
                } else if (a === 'gray' && b === 'black') {
                    fightKey = 'cat_fight_gray_black';
                } else if (a === 'black' && b === 'orange') {
                    fightKey = 'cat_fight_black_orange';
                } else if (a === 'orange' && b === 'black') {
                    fightKey = 'cat_fight_orange_black';
                } else if (a === 'gray' && b === 'orange') {
                    fightKey = 'cat_fight_gray_orange';
                } else if (a === 'orange' && b === 'gray') {
                    fightKey = 'cat_fight_orange_gray';
                }

                if (!fightKey) {
                    // запасной вариант – испуганный спрайт
                    fightKey = `cat_scared_${a}`;
                }

                this._setTextureSafe(fightKey);
                this.sprite.setScale(1.1);
                this.sprite.setPosition(0, 0);

                // хаотичная драка — быстрые вращения и сквош/стретч
                this._fightTween = this.scene.tweens.add({
                    targets: this.sprite,
                    angle: { from: -180, to: 180 },
                    scaleX: { from: 0.8, to: 1.2 },
                    scaleY: { from: 1.2, to: 0.8 },
                    duration: 70,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut'
                });
                break;
            }

            default: {
                this.state = 'idle';
                this._applyState();
                break;
            }
        }
    }

    destroy(fromScene) {
        this._stopAllActions();

        if (this.colliderGraphics) {
            this.colliderGraphics.destroy();
            this.colliderGraphics = null;
        }

        super.destroy(fromScene);
    }
}

// ==========================================
//      ПРОСТАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ ДЕЙСТВИЙ
// ==========================================

class CatSequence {
    constructor(cat) {
        this.cat = cat;
        this.queue = [];
        this._started = false;
    }

    runTo(x, y, z) {
        this.queue.push({ type: 'runTo', args: [x, y, z] });
        return this;
    }

    jumpTo(x, y, z) {
        this.queue.push({ type: 'jumpTo', args: [x, y, z] });
        return this;
    }

    climbTo(x, y, z) {
        this.queue.push({ type: 'climbTo', args: [x, y, z] });
        return this;
    }

    idle() {
        this.queue.push({ type: 'idle', args: [] });
        return this;
    }

    // уникальный scareFor – тоже можно вставлять в цепочку
    scareFor(time) {
        this.queue.push({ type: 'scareFor', args: [time] });
        return this;
    }

    start() {
        if (this._started) return this;
        this._started = true;
        this._next();
        return this;
    }

    _next() {
        if (!this.queue.length) return;

        const step = this.queue.shift();

        const done = () => this._next();

        switch (step.type) {
            case 'runTo':
                this.cat.runTo(step.args[0], step.args[1], step.args[2], done);
                break;

            case 'jumpTo':
                this.cat.jumpTo(step.args[0], step.args[1], step.args[2], done);
                break;

            case 'climbTo':
                this.cat.climbTo(step.args[0], step.args[1], step.args[2], done);
                break;

            case 'idle':
                this.cat.toIdle();
                done();
                break;

            case 'scareFor':
                this.cat.scareFor(step.args[0]);
                // страх сам продолжит предыдущее действие,
                // поэтому просто ставим таймер и дергаем next после
                this.cat.scene.time.addEvent({
                    delay: (step.args[0] || 1000) * this.cat.scareFactor,
                    callback: done
                });
                break;
        }
    }
}
