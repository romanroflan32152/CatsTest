const GAME_WIDTH = 530;
const GAME_HEIGHT = 990;

const phaserConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [PreloadScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
};