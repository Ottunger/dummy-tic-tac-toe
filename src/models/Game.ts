import {CellState} from "./CellState";
import {DatabaseItem} from "./DatabaseItem";

export class Game extends DatabaseItem {
    collection = 'games';
    grid: CellState[][];
    completed = false;
    nextPlayerId: string;

    constructor(width: number, public playerIds: string[]) {
        super();
        this.grid = new Array(width);
        for(let i = 0; i < width; i++) {
            this.grid[i] = new Array(width);
            this.grid[i].fill(CellState.CHECK_NULL);
        }
        this.nextPlayerId = this.playerIds[0];
    }

    static fromInteface(origin: Game): Game {
        const game = new Game(origin.grid.length, origin.playerIds);
        game._id = origin._id;
        game.grid = origin.grid;
        game.completed = origin.completed;
        game.nextPlayerId = origin.nextPlayerId;
        return game;
    }

    getPersistableFields(): any {
        return {
            _id: this._id,
            grid: this.grid,
            playerIds: this.playerIds,
            nextPlayerId: this.nextPlayerId,
            completed: this.completed
        };
    }

    toNextPlayer() {
        let index = this.playerIds.indexOf(this.nextPlayerId);
        index = (index + 1) % this.playerIds.length;
        this.nextPlayerId = this.playerIds[index];
    }

    cross(row: number, column: number, state: CellState) {
        this.grid[row][column] = state;
        this.completed = this.findWon();
    }

    findWon(): boolean {
        let previousState: CellState;
        let won: boolean;

        for(let i = 0; i < this.grid.length; i++) {
            previousState = this.grid[i][0];
            won = true;
            for(let j = 1; j < this.grid.length; j++) {
                if(this.grid[i][j] === CellState.CHECK_O) {
                    if(previousState === CellState.CHECK_X) {
                        previousState = CellState.CHECK_O;
                    } else {
                        won = false;
                        break;
                    }
                } else if(this.grid[i][j] === CellState.CHECK_X) {
                    if(previousState === CellState.CHECK_O) {
                        previousState = CellState.CHECK_X;
                    } else {
                        won = false;
                        break;
                    }
                } else {
                    won = false;
                    break;
                }
            }
            if(won)
                return true;
        }
        for(let i = 0; i < this.grid.length; i++) {
            previousState = this.grid[0][i];
            won = true;
            for(let j = 1; j < this.grid.length; j++) {
                if(this.grid[j][i] === CellState.CHECK_O) {
                    if(previousState === CellState.CHECK_X) {
                        previousState = CellState.CHECK_O;
                    } else {
                        won = false;
                        break;
                    }
                } else if(this.grid[j][i] === CellState.CHECK_X) {
                    if(previousState === CellState.CHECK_O) {
                        previousState = CellState.CHECK_X;
                    } else {
                        won = false;
                        break;
                    }
                } else {
                    won = false;
                    break;
                }
            }
            if(won)
                return true;
        }
        previousState = this.grid[0][0];
        won = true;
        for(let i = 1; i < this.grid.length; i++) {
            if(this.grid[i][i] === CellState.CHECK_O) {
                if(previousState === CellState.CHECK_X) {
                    previousState = CellState.CHECK_O;
                } else {
                    won = false;
                    break;
                }
            } else if(this.grid[i][i] === CellState.CHECK_X) {
                if(previousState === CellState.CHECK_O) {
                    previousState = CellState.CHECK_X;
                } else {
                    won = false;
                    break;
                }
            } else {
                won = false;
                break;
            }
        }
        if(won)
            return true;
        previousState = this.grid[0][this.grid.length - 1];
        won = true;
        for(let i = 1; i < this.grid.length; i++) {
            if(this.grid[i][this.grid.length - 1 - i] === CellState.CHECK_O) {
                if(previousState === CellState.CHECK_X) {
                    previousState = CellState.CHECK_O;
                } else {
                    won = false;
                    break;
                }
            } else if(this.grid[i][i] === CellState.CHECK_X) {
                if(previousState === CellState.CHECK_O) {
                    previousState = CellState.CHECK_X;
                } else {
                    won = false;
                    break;
                }
            } else {
                won = false;
                break;
            }
        }
        return won;

    }
}