import * as express from "express";
import {Db, MongoClient} from "mongodb";
import * as http from "http";
import {GameController} from "./controllers/GameController";
import * as Vorpal from "vorpal";
let dbClient: Db, dbServer: MongoClient;

function connect(callback: ((res: any) => void)) {
    MongoClient.connect(process.env.TTT_DATABASE_URL || 'mongodb://localhost:27017', (err, d) => {
        if(!err) {
            dbServer = d;
            dbClient = d.db('ttt');
            callback(undefined);
        } else {
            callback(err);
        }
    });
}

function close() {
    if(dbServer !== undefined) {
        dbServer.close();
    }
    process.exit(0);
}

//Now connect to DB then start serving requests
connect(e => {
    if(e) {
        console.error(e);
        console.error('Bootstrap could not be completed.');
        process.exit();
    }

    //Create the express application
    const app = express();
    app.use((req, res, next) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
        next();
    });
    app.use(express.static(__dirname + 'public'));

    //Error route
    app.use((req, res) => {
        res.type('application/json').status(404).json({error: 'client.notFound'});
    });

    process.on('SIGTERM', close);
    process.on('SIGINT', close);

    const server = http.createServer(app);
    server.listen(process.env.TTT_PORT || 8100);

    const cli = new Vorpal();
    cli.delimiter("ttt-cli:").show();

    new GameController(app, server, dbClient, cli);
    cli.log("App started. Open your browser on port 8100.");
});