let ROUND_TIME_SECONDS = 10;
let SUCCESS_SOUNDS = [1, 2, 3];

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.cameras.main.setBackgroundColor(0x94A857);
    }

    create() {
        game.sound.play('click');

        this.defaultCameraZoom = this.cameras.main.zoom || 1;

        this.day = 1;
        this.levelIndex = 0;

        this.aliveColors = ['black', 'orange', 'gray'];

        this.currentPhase = null;
        this.currentAssignments = {};
        this.currentAssignColor = null;
        this.assignedColorsInLevel = [];

        this.catsRuntime = {};
        this.roundTimerEvent = null;
        this.roundTimeLeft = 0;

        this.shelterOccupants = {};

        // ✦ новые структуры для спавнов
        this.spawnCandidatesByColor = {};     // какие спавны "видит" кот (для подсказок)
        this.spawnAssignedIndexByColor = {};  // конкретный спавн кота на этот день

        this.levelContainer = new LevelContainer(this);
        this.uiLevel = new UILevelContainer(this);
        this.uiLevel.setSubmitHandler(() => this.onLevelSubmitClicked());
        this.uiLevel.setVisible(false);

        this.currentSelectedTargetIndex = null;
        this.timerText = null;

        this._day1ExecOverlayShown = false;

        this.showIntroOverlay(() => {
            this.startNewLevelCycle();
        });
    }

    // ---------------- intro ----------------

    showIntroOverlay(onComplete) {
        const w = this.scale.width;
        const h = this.scale.height;

        const dim = this.add.rectangle(0, 0, w, h, 0x000000, 1)
            .setOrigin(0)
            .setDepth(200)
            .setInteractive();

        const text = this.add.text(
            w / 2,
            h / 2,
            'Night is coming,\nwe need to find shelter',
            {
                fontFamily: 'Arial',
                fontSize: '26px',
                color: '#FFFFFF',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(201);

        dim.alpha = 0;
        text.alpha = 0;

        this.tweens.add({
            targets: [dim, text],
            alpha: 1,
            duration: 400,
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: [dim, text],
                        alpha: 0,
                        duration: 2000,
                        onComplete: () => {
                            dim.destroy();
                            text.destroy();
                            if (onComplete) onComplete();
                        }
                    });
                });
            }
        });
    }

    // -------------- цикл дня/уровня --------------

    startNewLevelCycle() {
        if (this.aliveColors.length === 0) {
            this.showFinalGameOver();
            return;
        }

        this.currentAssignments = {};
        this.assignedColorsInLevel = [];
        this.currentAssignColor = null;
        this.currentSelectedTargetIndex = null;
        this.shelterOccupants = {};

        // ✦ новый флаг
        this._roundEnded = false;

        // сбрасываем спавн-данные
        this.spawnCandidatesByColor = {};
        this.spawnAssignedIndexByColor = {};

        this.levelIndex = (this.day - 1) % MAP_CONFIGS.length;
        if (this.levelIndex === 0) {
            LEVEL_SCALE_FACTOR = 1;
            LEVEL_SPEED_FACTOR = 1;
            ROUND_TIME_SECONDS = 10;
        } else if (this.levelIndex === 1) {
            LEVEL_SCALE_FACTOR = 0.5;
            LEVEL_SPEED_FACTOR = 0.75;
            ROUND_TIME_SECONDS = 9;
        } else if (this.levelIndex === 2) {
            LEVEL_SCALE_FACTOR = 0.4;
            LEVEL_SPEED_FACTOR = 0.45;
            ROUND_TIME_SECONDS = 8;
        }

        this.levelContainer.setupLevel(this.levelIndex);

        // ✦ заранее раскидываем котов по спавнам на этот день
        this.prepareSpawnAssignmentsForLevel();

        // ✦ Day 1 без "Day 1" до начала выполнения
        if (this.day === 1) {
            this.startCatAssignmentStep();
        } else {
            this.showDayOverlay(this.day, () => {
                this.startCatAssignmentStep();
            });
        }
    }

    // заранее выбираем спавнпоинты для всех живых котов
    prepareSpawnAssignmentsForLevel() {
        const spawns = this.levelContainer.currentSpawnPositions || [];
        const alive = this.aliveColors.slice();

        this.spawnCandidatesByColor = {};
        this.spawnAssignedIndexByColor = {};

        if (!spawns.length || !alive.length) return;

        let remainingSpawnIndices = spawns.map((_, i) => i);

        alive.forEach(color => {
            let candidates = remainingSpawnIndices.slice();

            // --- способность серого: видит только 2 точки ---
            if (color === 'gray') {
                const forbidden = this.levelContainer.grayForbiddenSpawnIndex;
                if (typeof forbidden === 'number') {
                    candidates = candidates.filter(i => i !== forbidden);
                }

                if (candidates.length >= 2) {
                    Phaser.Utils.Array.Shuffle(candidates);
                    candidates = candidates.slice(0, 2); // две видимые точки
                } else if (candidates.length === 0) {
                    // fallback – берём всё, что ещё осталось
                    candidates = remainingSpawnIndices.slice();
                }
            }

            // подстраховка, если кандидатов нет
            if (!candidates.length) {
                candidates = spawns.map((_, i) => i);
            }

            const spawnIndex = Phaser.Utils.Array.GetRandom(candidates);
            this.spawnAssignedIndexByColor[color] = spawnIndex;

            // что показываем игроку:
            if (color === 'gray') {
                // серый "видит" все кандидаты (обычно 2)
                this.spawnCandidatesByColor[color] = candidates.slice();
            } else {
                // обычный кот "видит" только свой спавн
                this.spawnCandidatesByColor[color] = [spawnIndex];
            }

            const idx = remainingSpawnIndices.indexOf(spawnIndex);
            if (idx !== -1) remainingSpawnIndices.splice(idx, 1);
        });
    }

    showDayOverlay(day, onComplete) {
        const w = this.scale.width;
        const h = this.scale.height;

        const dim = this.add.rectangle(0, 0, w, h, 0x000000, 0.6)
            .setOrigin(0)
            .setDepth(100)
            .setInteractive();

        const text = this.add.text(w / 2, h / 2, `Day ${day}`, {
            fontFamily: 'Arial',
            fontSize: '40px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(101);

        dim.alpha = 0;
        text.alpha = 0;

        this.tweens.add({
            targets: [dim, text],
            alpha: 1,
            duration: 500,
            onComplete: () => {
                this.time.delayedCall(1200, () => {
                    this.tweens.add({
                        targets: [dim, text],
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            dim.destroy();
                            text.destroy();
                            if (onComplete) onComplete();
                        }
                    });
                });
            }
        });
    }

    // -------------- выбор кота / убежищ --------------

    startCatAssignmentStep() {
        const unassigned = this.aliveColors.filter(
            color => !(color in this.currentAssignments)
        );

        if (unassigned.length === 0) {
            this.startExecutionPhase();
            return;
        }

        this.uiLevel.setVisible(false);
        if (this.timerText) this.timerText.setVisible(false);

        if (this.day === 1) {
            this.currentPhase = 'catSelection';

            const overlay = new CatSelectOverlay(this, (color) => {
                overlay.close();

                this.currentAssignColor = color;
                this.assignedColorsInLevel.push(color);

                this.prepareTargetsForNewCat();
                this.setupTopPanelForCat(color);

                // ✦ подсказки спавнов с учётом заранее выбранных кандидатов
                this.levelContainer.showSpawnHintsForColor(
                    color,
                    this.spawnCandidatesByColor[color] || null
                );

                this.currentPhase = 'assignShelter';
            });

            const allowed = new Set(unassigned);
            ['black', 'orange', 'gray'].forEach(color => {
                if (!allowed.has(color) || !this.aliveColors.includes(color)) {
                    overlay.setCatEnabled(color, false);
                }
            });

            return;
        }

        this.currentAssignColor = unassigned[0];
        this.assignedColorsInLevel.push(this.currentAssignColor);

        this.prepareTargetsForNewCat();
        this.setupTopPanelForCat(this.currentAssignColor);

        // ✦ то же самое для последующих дней
        this.levelContainer.showSpawnHintsForColor(
            this.currentAssignColor,
            this.spawnCandidatesByColor[this.currentAssignColor] || null
        );

        this.currentPhase = 'assignShelter';
    }

    prepareTargetsForNewCat() {
        this.currentSelectedTargetIndex = null;

        this.levelContainer.targets.forEach(t => {
            const sprite = t.sprite;
            if (sprite.removeAllListeners) sprite.removeAllListeners();

            sprite.disableInteractive();
            sprite.setTexture('crosshair2');
            sprite.setVisible(true);          // ✦ показываем только тут
            sprite.setInteractive();
            sprite.on('pointerup', () => this.onTargetClicked(t.index));
        });
    }

    setupTopPanelForCat(color) {
        this.uiLevel.showChooseShelter(color);
    }

    onTargetClicked(index) {
        if (this.currentPhase !== 'assignShelter') return;
        this.currentSelectedTargetIndex = index;

        this.levelContainer.targets.forEach((t, i) => {
            t.sprite.setTexture(i === index ? 'crosshair1' : 'crosshair2');
        });
    }

    onLevelSubmitClicked() {
        if (this.currentPhase === 'assignShelter') {
            if (this.currentSelectedTargetIndex == null) return;

            const color = this.currentAssignColor;
            const targetIndex = this.currentSelectedTargetIndex;

            this.currentAssignments[color] = targetIndex;
            this.currentSelectedTargetIndex = null;

            this.levelContainer.targets.forEach(t => {
                t.sprite.setVisible(false);
                t.sprite.disableInteractive();
            });
            this.levelContainer.hideSpawnHints();

            this.startCatAssignmentStep();
        }
    }

    // -------------- фаза выполнения --------------

    startExecutionPhase() {
        // ✦ Для первого дня "Day 1" показываем только сейчас
        if (this.day === 1 && !this._day1ExecOverlayShown) {
            this._day1ExecOverlayShown = true;
            this.showDayOverlay(1, () => {
                this._doExecutionPhase();
            });
        } else {
            this._doExecutionPhase();
        }
    }

    _doExecutionPhase() {
        this.currentPhase = 'execution';

        // ✦ начинается новый раунд
        this._roundEnded = false;

        this.uiLevel.setVisible(false);
        this.levelContainer.hideSpawnHints();

        this.levelContainer.targets.forEach(t => {
            t.sprite.disableInteractive();
            t.sprite.setVisible(false); // ✦ скрываем таргеты вне выбора
        });

        if (!this.timerText) {
            this.timerText = this.add.text(
                this.scale.width / 2,
                40,
                '',
                {
                    fontFamily: 'Arial',
                    fontSize: '22px',
                    color: '#FFFFFF'
                }
            ).setOrigin(0.5).setDepth(10);
        }
        this.roundTimeLeft = ROUND_TIME_SECONDS;
        this.timerText.setVisible(true);
        this.timerText.setText(`Time left: ${this.roundTimeLeft}`);

        this.spawnCatsForExecution();

        this.time.delayedCall(1000, () => game.sound.play('timer'));
        this.roundTimerEvent = this.time.addEvent({
            delay: 1000,
            repeat: this.roundTimeLeft - 1,
            callback: () => {
                this.roundTimeLeft--;
                if (this.timerText) {
                    this.timerText.setText(`Time left: ${this.roundTimeLeft}`);
                }
                if (this.roundTimeLeft === 0) {
                    this.onRoundTimeOut();
                }
            },
            callbackScope: this
        });
    }

    // ✦ теперь спавним котов исходя из заранее выбранных спавнпоинтов
    spawnCatsForExecution() {
        this.catsRuntime = {};
        this.shelterOccupants = {};

        const spawns   = this.levelContainer.currentSpawnPositions || [];
        const shelters = this.levelContainer.currentShelterPositions || [];

        this.aliveColors.forEach(color => {
            let spawnIndex = this.spawnAssignedIndexByColor && this.spawnAssignedIndexByColor[color];

            // подстраховка, если по какой-то причине не назначили
            if (typeof spawnIndex !== 'number') {
                const allIndices = spawns.map((_, i) => i);
                if (!allIndices.length) return;
                spawnIndex = Phaser.Utils.Array.GetRandom(allIndices);
            }

            const spawnPos = spawns[spawnIndex];
            if (!spawnPos) return;

            // создаём кота в заранее выбранной точке
            const cat = new Cat(this, spawnPos.x, spawnPos.y, color);

            if (typeof spawnPos.z === 'number') {
                cat.setZ(spawnPos.z);
            }

            this.catsRuntime[color] = { cat, reached: false, finished: false };

            // idle 1 секунду
            cat.toIdle();
            cat._updateZVisual();

            const shelterIndex = this.currentAssignments[color];
            if (shelterIndex === undefined) {
                return;
            }

            this.time.delayedCall(1000, () => {
                if (!cat.active) return;

                this.playCatPath(cat, spawnIndex, shelterIndex, () => {
                    const first = (this.shelterOccupants[shelterIndex] == null);

                    if (first) {
                        // ✦ ставим кота в финальную позу, если она задана в конфиге
                        const cfg = MAP_CONFIGS[this.levelIndex];
                        const shelterCfg = cfg && cfg.shelters && cfg.shelters[shelterIndex];
                        const finalPose = shelterCfg && shelterCfg.finalPose;

                        if (finalPose) {
                            cat.x = finalPose.x;
                            cat.y = finalPose.y;

                            if (typeof finalPose.z === 'number' && cat.setZ) {
                                cat.setZ(finalPose.z);
                            }
                            if (typeof finalPose.scale === 'number') {
                                cat.setScale(finalPose.scale);
                            }
                            if (cat.toIdle) {
                                cat.toIdle(); // "улёгся" в домике
                            }
                        }

                        let soundNum = Phaser.Utils.Array.GetRandom(SUCCESS_SOUNDS);

                        const idx = SUCCESS_SOUNDS.indexOf(soundNum);
                        if (idx !== -1) {
                            SUCCESS_SOUNDS.splice(idx, 1);
                        }
                        if (SUCCESS_SOUNDS.length === 0) {
                            SUCCESS_SOUNDS = [1, 2, 3];
                        }

                        game.sound.play('success' + (soundNum || 1));
                        this.shelterOccupants[shelterIndex] = color;
                        this.catsRuntime[color].reached = true;
                    } else {
                        game.sound.play('meow' + Phaser.Utils.Array.GetRandom([1, 2]));
                        this.catsRuntime[color].reached = false;
                        cat.scareFor(2000);

                        this.tweens.add({
                            targets: cat,
                            alpha: 0.3,
                            yoyo: true,
                            repeat: 8,
                            duration: 120,
                            onComplete: () => {
                                cat.setAlpha(1);
                                cat.setVisible(false);
                            }
                        });
                    }

                    // ✦ кот закончил свой маршрут (успех/фейл — неважно)
                    this.catsRuntime[color].finished = true;
                    this._checkRoundAutoSkip();
                });
            });
        });
    }

    playCatPath(cat, spawnIndex, shelterIndex, onComplete) {
        const cfg = MAP_CONFIGS[this.levelIndex];
        const shelters = this.levelContainer.currentShelterPositions;
        const paths = cfg && cfg.paths;

        const dest = shelters && shelters[shelterIndex];

        // если путь не задан — просто бежим напрямую к убежищу
        if (
            !paths ||
            !Array.isArray(paths) ||
            !paths[spawnIndex] ||
            !Array.isArray(paths[spawnIndex]) ||
            !paths[spawnIndex][shelterIndex] ||
            !Array.isArray(paths[spawnIndex][shelterIndex]) ||
            paths[spawnIndex][shelterIndex].length === 0
        ) {
            if (dest) {
                const z = (typeof dest.z === 'number') ? dest.z : undefined;
                cat.runTo(dest.x, dest.y, z, onComplete);
            } else if (typeof onComplete === 'function') {
                onComplete();
            }
            return;
        }

        const steps = paths[spawnIndex][shelterIndex];

        const runStep = (index) => {
            if (index >= steps.length) {
                if (typeof onComplete === 'function') {
                    onComplete();
                }
                return;
            }

            const step = steps[index] || {};
            const action = step.action || step.type || 'run';

            let x, y, z;

            if (typeof step.shelterIndex === 'number') {
                const s = shelters[step.shelterIndex];
                if (!s) {
                    runStep(index + 1);
                    return;
                }
                x = s.x;
                y = s.y;
                z = (typeof step.z === 'number') ? step.z : s.z;
            } else {
                x = step.x;
                y = step.y;
                z = step.z;
            }

            let moveFn;
            switch (action) {
                case 'jump':
                case 'jumpTo':
                    moveFn = cat.jumpTo.bind(cat);
                    break;
                case 'climb':
                case 'climbTo':
                    moveFn = cat.climbTo.bind(cat);
                    break;
                case 'run':
                case 'runTo':
                default:
                    moveFn = cat.runTo.bind(cat);
                    break;
            }

            moveFn(x, y, z, () => runStep(index + 1));
        };

        runStep(0);
    }

    onRoundTimeOut() {
        // ✦ защита от повторного вызова
        if (this._roundEnded) return;
        this._roundEnded = true;

        if (this.roundTimerEvent) {
            game.sound.stopAll();
            this.roundTimerEvent.remove(false);
            this.roundTimerEvent = null;
        }

        if (this.timerText) this.timerText.setVisible(false);

        Object.values(this.catsRuntime).forEach(data => {
            if (data.cat && data.cat.pauseActions) {
                data.cat.pauseActions();
            }
        });

        const survivors = this.aliveColors.filter(color =>
            this.catsRuntime[color] && this.catsRuntime[color].reached
        );

        const losers = this.aliveColors.filter(color => !survivors.includes(color));

        Object.values(this.catsRuntime).forEach(data => {
            if (data.cat) data.cat.destroy();
        });
        this.catsRuntime = {};

        this.aliveColors = survivors;

        this.levelContainer.destroyTargets();
        this.currentAssignments = {};
        this.assignedColorsInLevel = [];
        this.currentAssignColor = null;

        this.showRoundEndOverlay(survivors, losers);
    }

    _checkRoundAutoSkip() {
        // если раунд уже завершён или таймера нет – нечего делать
        if (this._roundEnded || !this.roundTimerEvent) return;
        if (!this.catsRuntime) return;

        const allFinished = this.aliveColors.every(color => {
            const data = this.catsRuntime[color];
            return data && data.finished;
        });

        if (allFinished) {
            // ✦ все текущие коты уже дошли до своих исходов
            this.time.delayedCall(3000, () => this.onRoundTimeOut());
        }
    }

    // -------------- результат --------------

    showRoundEndOverlay(survivors, losers) {
        let mode;
        if (survivors.length === 0) {
            mode = 'gameOver';
        } else if (survivors.length === 1) {
            mode = 'lastSurvivor';
        } else {
            mode = 'timeout';
        }

        new ResultContainer(
            this,
            survivors,
            mode,
            mode === 'timeout'
                ? () => {
                    this.day += 1;
                    this.startNewLevelCycle();
                }
                : null,
            () => {
                this.scene.restart();
            }
        );
    }

    showFinalGameOver() {
        new ResultContainer(
            this,
            [],
            'gameOver',
            null,
            () => this.scene.restart()
        );
    }

    _updateCatFightCollisions() {
        const runtimeEntries = Object.values(this.catsRuntime || {});
        const cats = runtimeEntries
            .map(d => d && d.cat)
            .filter(cat => cat && cat.active);

        if (cats.length < 2) return;

        // обновляем дебажные круги-коллайдеры
        cats.forEach(cat => {
            if (cat.updateColliderDebug) {
                cat.updateColliderDebug();
            }
        });

        const fightDuration = 2000;

        for (let i = 0; i < cats.length; i++) {
            const a = cats[i];

            for (let j = i + 1; j < cats.length; j++) {
                const b = cats[j];

                if (!a.state || !b.state) continue;

                // драка запускается, если оба НЕ idle (и не уже в драке)
                if (a.state === 'idle' || b.state === 'idle') continue;
                if (a.state === 'fight' || b.state === 'fight') continue;
                if (a.state === 'scared' || b.state === 'scared') continue;

                const centerA = a.getCollisionCenter ? a.getCollisionCenter() : { x: a.x, y: a.y };
                const centerB = b.getCollisionCenter ? b.getCollisionCenter() : { x: b.x, y: b.y };

                const dx = centerA.x - centerB.x;
                const dy = centerA.y - centerB.y;
                const distSq = dx * dx + dy * dy;

                const r = a.getCollisionRadius() + b.getCollisionRadius();

                if (distSq <= r * r) {
                    // запрет на драку, если кулдаун у любого
                    if (a.scene.time.now < a._fightCooldownUntil) continue;
                    if (b.scene.time.now < b._fightCooldownUntil) continue;

                    if (Math.abs(a.z - b.z) > 0.9) continue;

                    a.fightFor(fightDuration, b.color);
                    b.fightFor(fightDuration, a.color);
                }
            }
        }
    }

    _updateObjectCollisions() {
        const runtimeEntries = Object.values(this.catsRuntime || {});
        const cats = runtimeEntries
            .map(d => d && d.cat)
            .filter(cat => cat && cat.active);

        const objects = (this.levelContainer && this.levelContainer.objects) || [];
        if (!cats.length || !objects.length) return;

        // --- сначала обновляем / рисуем дебажные круги под объекты ---
        objects.forEach(obj => {
            if (!obj || !obj.sprite) return;

            const sprite = obj.sprite;

            // радиус такой же, как в коллизии
            const rObj = Math.max(sprite.displayWidth, sprite.displayHeight) * 0.25;
            obj.debugRadius = rObj;

            // создаём Graphics один раз
            if (!obj.debugCollider) {
                obj.debugCollider = this.add.graphics()
                    .setDepth(sprite.depth + 1);
            }

            const g = obj.debugCollider;
            g.clear();

            if (!obj.used && sprite.visible) {
                g.lineStyle(1, 0x00ff00, 0.6); // зелёный полупрозрачный круг
                g.strokeCircle(sprite.x, sprite.y, rObj);
                g.setVisible(SHOW_CAT_COLLIDERS && true);
            } else {
                g.setVisible(false);
            }
        });

        // --- затем считаем реальные коллизии котов с объектами ---
        cats.forEach(cat => {
            const centerCat = cat.getCollisionCenter ? cat.getCollisionCenter() : { x: cat.x, y: cat.y };
            const rCat = cat.getCollisionRadius ? cat.getCollisionRadius() : 30;

            objects.forEach(obj => {
                if (!obj || !obj.sprite || obj.used) return;

                const sprite = obj.sprite;
                const centerObj = { x: sprite.x, y: sprite.y };
                const rObj = obj.debugRadius || Math.max(sprite.displayWidth, sprite.displayHeight) * 0.25;

                const dx = centerCat.x - centerObj.x;
                const dy = centerCat.y - centerObj.y;
                const distSq = dx * dx + dy * dy;
                const sumR = rCat + rObj;

                if (distSq <= sumR * sumR) {
                    obj.used = true;
                    this._applyObjectCollisionEffect(cat, obj);

                    // сразу отключаем визуальный коллайдер
                    if (obj.debugCollider) {
                        obj.debugCollider.setVisible(false);
                    }
                }
            });
        });
    }

    _applyObjectCollisionEffect(cat, obj) {
        const cfg = obj.config || {};
        const onCollision = cfg.onCollision;
        if (!onCollision) return;

        const action = onCollision.action;
        const params = onCollision.parameters || [];

        switch (action) {
            case 'scare': {
                const duration = params[0] || 1000;
                if (cat.scareFor) {
                    cat.scareFor(duration);
                }
                break;
            }
            // сюда можно добавлять другие action'ы
        }

        if (obj.sprite) {
            obj.sprite.setVisible(false);
        }
        if (obj.debugCollider) {
            obj.debugCollider.setVisible(false); // ✦ прячем круг
        }
    }

    update(time, delta) {
        if (this.currentPhase !== 'execution') return;
        if (!this.catsRuntime) return;

        this._updateCatFightCollisions();
        this._updateObjectCollisions();
    }
}
