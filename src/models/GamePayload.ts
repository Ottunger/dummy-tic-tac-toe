import {Data} from "ws";
import {CellState} from "./CellState";

export enum GamePayloadAction {
    AUTH,
    PLAY
}

export enum GameResponseType {
    GAMES,
    RESULT
}

export interface GamePayloadRaw {
    action?: GamePayloadAction,
    playerId?: string,
    playerPassword?: string,
    gameId?: string,
    move?: {
        row: number,
        column: number,
        state: CellState
    }
}

export class GamePayload {
    raw: GamePayloadRaw;
    private valid = true;

    constructor(msg: Data) {
        this.raw = JSON.parse(msg.toString());
        // TODO: Better validation of incoming messages
        if(!this.raw.playerId || !this.raw.playerPassword)
            this.valid = false;
    }

    isValid() {
        return this.valid;
    }
}