import {CellState} from "./CellState";

export class Game {
    grid: CellState[][];

    constructor(private width: number) {
        this.grid = new Array(width);
        this.grid.forEach(row => {
            row = new Array(width);
            row.forEach(cell => cell = CellState.CHECK_NULL);
        });
    }

    cross(row: number, column: number, state: CellState): boolean {
        this.grid[row][column] = state;
        return this.findWon();
    }

    findWon(): boolean {
        let previousState: CellState;
        let won: boolean;

        for(let i = 0; i < this.width; i++) {
            previousState = this.grid[i][0];
            won = true;
            for(let j = 1; j < this.width; j++) {
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
        for(let i = 0; i < this.width; i++) {
            previousState = this.grid[0][i];
            won = true;
            for(let j = 1; j < this.width; j++) {
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
        for(let i = 1; i < this.width; i++) {
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
        previousState = this.grid[0][this.width - 1];
        won = true;
        for(let i = 1; i < this.width; i++) {
            if(this.grid[i][this.width - 1 - i] === CellState.CHECK_O) {
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