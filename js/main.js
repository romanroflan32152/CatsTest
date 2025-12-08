let game;
window.onload = function() {
    game = new Phaser.Game(phaserConfig);
}

let gameScene = () => {
    try {
        return game.scene.getScene('GameScene');
    } catch (error) {
        console.error(error);
    }
}