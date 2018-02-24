import {Server} from "http";
import {Express} from "express";
import * as WebSocket from "ws";
import {Db} from "mongodb";
import {GamePayload, GamePayloadAction, GamePayloadRaw, GameResponseType} from "../models/GamePayload";
import {Game} from "../models/Game";
import {User} from "../models/User";

interface Session {
    playerId: string;
    ws?: WebSocket;
}

function generateError(code: number, msg: string) {
    return JSON.stringify({
        code: code,
        message: msg
    });
}

function generateResponse(code: GameResponseType, payload: any) {
    return JSON.stringify({
        code: code,
        message: payload
    });
}

function authUser(payload: GamePayloadRaw, dbClient: Db, ws: WebSocket, sessions: Session[], callback: ((err: any, payload: string) => void)) {
    dbClient.collection('users').findOne({_id: payload.playerId}, (err, user: User) => {
        if (err || !user) {
            callback(err, generateError(1, 'Cannot find the user'));
            return;
        }
        if(user.password !== payload.playerPassword) {
            callback(true, generateError(1, 'Wrong auth'));
            return;
        }
        dbClient.collection('games').find({playerIds: payload.playerId, completed: false}).toArray((err, games: Game[]) => {
            if (err) {
                callback(err, generateError(1, 'Cannot find the game'));
                return;
            }
            let session = sessions.find(session => session.ws === ws);
            if(session) {
                session.playerId = user._id
            } else {
                sessions.push({
                    playerId: user._id,
                    ws: ws
                });
            }
            callback(undefined, generateResponse(GameResponseType.GAMES, games));
        });
    });
}

function playUser(payload: GamePayloadRaw, dbClient: Db, ws: WebSocket, sessions: Session[], callback: ((err: any, payload: string, target: WebSocket) => void)) {
    dbClient.collection('users').findOne({_id: payload.playerId}, (err, user: User) => {
        if (err || !user) {
            callback(undefined, generateError(1, 'Cannot find the user'), ws);
            return;
        }
        if(user.password !== payload.playerPassword) {
            callback(true, generateError(1, 'Wrong auth'), ws);
            return;
        }
        if(sessions.findIndex(session => session.playerId === user._id) === -1 ||
            sessions.findIndex(session => session.ws === ws) === -1) {
            callback(true, generateError(1, 'Not yet authenticated'), ws);
            return;
        }
        dbClient.collection('games').findOne({_id: payload.gameId}, (err, game: Game) => {
            if (err || !game) {
                callback(err, generateError(1, 'Cannot find the game'), ws);
                return;
            }
            if(game.playerIds.indexOf(user._id) === -1) {
                callback(true, generateError(1, 'You are not part of this game'), ws);
                return;
            }
            if(game.nextPlayerId !== user._id) {
                callback(true, generateError(1, 'You are not the next person to play'), ws);
                return;
            }
            game = Game.fromInteface(game);
            game.cross(payload.move.row, payload.move.column, payload.move.state);
            game.toNextPlayer();
            const response = generateResponse(GameResponseType.RESULT, game.getPersistableFields());
            sessions.filter(session => game.playerIds.indexOf(session.playerId) !== -1).forEach(session => {
                callback(undefined, response, session.ws);
            });
            game.persistOn(dbClient, (err, res) => {
                if(err)
                    console.error(err);
            });
        });
    });
}

function sendResponse(cli: any, cb: (() => void), err: any, res: string, ws: WebSocket) {
    if(ws)
        ws.send(res);
    else
        cli.log(res);
    if(cb)
        cb();
}

export class GameController {
    private sessions: Session[] = [];

    constructor(private app: Express, private server: Server, private dbClient: Db, private cli: any) {
        const wss = new WebSocket.Server({
            server: server
        });

        cli.command('login <username> <password>', 'Login a user.')
            .action((args: {[id: string]: string}, cb: (() => void)) => {
                authUser({
                    playerId: args.username,
                    playerPassword: args.password
                }, dbClient, undefined, this.sessions, (err, res) => {
                   cli.log(res);
                   cb();
                });
            });
        cli.command('play <username> <password> <row> <column> <marker>', 'Play a row/column as a user.')
            .action((args: {[id: string]: string}, cb: (() => void)) => {
                playUser({
                    playerId: args.username,
                    playerPassword: args.password
                }, dbClient, undefined, this.sessions, sendResponse.bind(undefined, cli, cb));
            });
        cli.command('add-user <username> <password>', 'Create a user.')
            .action((args: {[id: string]: string}, cb: (() => void)) => {
                dbClient.collection('users').update({_id: args.username}, {
                    _id: args.username,
                    password: args.password
                }, {upsert: true}, (err, res) => cb());
            });
        cli.command('add-game <width> <player-ids>', 'Create a game for player ids with desired width.')
            .action((args: {[id: string]: string}, cb: (() => void)) => {
                // TODO: check consistency of options
                const game = new Game(parseInt(args.width), args['player-ids'].split('-'));
                game.persistOn(dbClient, (err, res) => {cli.log(err); cb();});
            });

        wss.on('connection', (ws, req) => {
            ws.on('close', () => {
               const sessionIndex = this.sessions.findIndex(session => session.ws === ws);
               if(sessionIndex !== -1) {
                   this.sessions.splice(sessionIndex, 1);
               }
            });
            ws.on('error', () => {
                const sessionIndex = this.sessions.findIndex(session => session.ws === ws);
                if(sessionIndex !== -1) {
                    this.sessions.splice(sessionIndex, 1);
                }
            });
            ws.on('message', msg => {
                const payload = new GamePayload(msg);
                if(!payload.isValid())
                    ws.send(generateError(1, 'Wrong message'));
                switch(payload.raw.action) {
                    case GamePayloadAction.AUTH:
                        authUser(payload.raw, dbClient, ws, this.sessions, (err, res) => ws.send(res));
                        break;
                    case GamePayloadAction.PLAY:
                        playUser(payload.raw, dbClient, ws, this.sessions, sendResponse.bind(undefined, cli, undefined));
                        break;
                }
            });
        });
    }
}