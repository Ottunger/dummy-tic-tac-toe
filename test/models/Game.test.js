const Game = require('../../dist/models/Game');
const assert = require('assert');

let game;
beforeEach(() => {
   game = new Game.Game(3, ['1', '2', '3', '4']);
});

describe('Game', () => {
    describe('findWon()', () => {
        it('should return false for empty grid', () => {
            assert.equal(game.findWon(), false);
        });
    });
    describe('toNextPlayer()', () => {
        it('should move several times', () => {
            game.toNextPlayer();
            game.toNextPlayer();
            assert.equal(game.nextPlayerId, '3');
        });
        it('should rotate', () => {
            game.toNextPlayer();
            game.toNextPlayer();
            game.toNextPlayer();
            game.toNextPlayer();
            assert.equal(game.nextPlayerId, '1');
        });
    });
});
