import {Server} from "http";
import {Express} from "express";
import * as WebSocket from "ws";
import {Db} from "mongodb";
import {GamePayload, GamePayloadAction} from "../models/GamePayload";
import {Game} from "../models/Game";
import {User} from "../models/User";

export class GameController {
    private sessions: {playerId: string, ws: WebSocket}[] = [];

    constructor(private app: Express, private server: Server, private dbClient: Db) {
        const wss = new WebSocket.Server({
            server: server
        });

        wss.on('connection', (ws, req) => {
            ws.on('close', () => {
               const sessionIndex = this.sessions.findIndex(session => session.ws === ws);
               if(sessionIndex !== -1) {
                   this.sessions.splice(sessionIndex, 1);
               }
            });
            ws.on('message', msg => {
                const payload = new GamePayload(msg);
                if(!payload.isValid())
                    ws.send(this.generateError(1, 'Wrong message'));
                switch(payload.raw.action) {
                    case GamePayloadAction.AUTH:
                        dbClient.collection('users').findOne({_id: payload.raw.playerId}, (err, user: User) => {
                            if (err) {
                                ws.send(this.generateError(1, 'Cannot find the user'));
                                return;
                            }
                            if(user.password !== payload.raw.playerPassword) {
                                ws.send(this.generateError(1, 'Wrong auth'));
                                return;
                            }
                            dbClient.collection('games').find({playerIds: payload.raw.playerId, completed: false}).toArray((err, games: Game[]) => {
                                if (err) {
                                    ws.send(this.generateError(1, 'Cannot find the game'));
                                    return;
                                }
                                let session = this.sessions.find(session => session.ws === ws);
                                if(session) {
                                    session.playerId = user._id
                                } else {
                                    this.sessions.push({
                                        playerId: user._id,
                                        ws: ws
                                    });
                                }
                                ws.send(this.generateResponse(0, games.map(game => game._id)));
                            });
                        });
                        break;
                    case GamePayloadAction.PLAY:
                        dbClient.collection('users').findOne({_id: payload.raw.playerId}, (err, user: User) => {
                            if (err) {
                                ws.send(this.generateError(1, 'Cannot find the user'));
                                return;
                            }
                            if(user.password !== payload.raw.playerPassword) {
                                ws.send(this.generateError(1, 'Wrong auth'));
                                return;
                            }
                            if(this.sessions.findIndex(session => session.playerId === user._id) === -1 ||
                                    this.sessions.findIndex(session => session.ws === ws) === -1) {
                                ws.send(this.generateError(1, 'Not yet authenticated'));
                                return;
                            }
                            dbClient.collection('games').findOne({_id: payload.raw.gameId}, (err, game: Game) => {
                                if (err) {
                                    ws.send(this.generateError(1, 'Cannot find the game'));
                                    return;
                                }
                                if(game.playerIds.indexOf(user._id) === -1) {
                                    ws.send(this.generateError(1, 'You are not part of this game'));
                                    return;
                                }
                                if(game.nextPlayerId !== user._id) {
                                    ws.send(this.generateError(1, 'You are not the next person to play'));
                                    return;
                                }
                                game = Game.fromInteface(game);
                                game.cross(payload.raw.move.row, payload.raw.move.column, payload.raw.move.state);
                                game.toNextPlayer();
                                this.sessions.filter(session => game.playerIds.indexOf(session.playerId) !== -1).forEach(session => {
                                    session.ws.send(this.generateResponse(0, {
                                        gameId: game._id,
                                        completed: game.completed,
                                        lastPlayerId: user._id,
                                        nextPlayerId: game.nextPlayerId
                                    }));
                                });
                                game.persistOn(dbClient, (err, res) => {
                                    if(err)
                                        console.error(err);
                                });
                            });
                        });
                        break;
                }
            });
        });

        server.listen(process.env.TTT_WS_PORT || 8101);
    }

    private generateError(code: number, msg: string) {
        return JSON.stringify({
            code: code,
            message: msg
        });
    }

    private generateResponse(code: number, payload: any) {
        return JSON.stringify({
            code: code,
            message: payload
        });
    }
}