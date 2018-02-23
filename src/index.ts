import * as express from "express";
import {MongoClient} from "mongodb";
import * as http from "http";
let dbClient: MongoClient;

function connect(callback: ((res: boolean) => void)) {
    MongoClient.connect(process.env.TTT_DATABASE_URL || 'mongodb://localhost:27017/ttt', (err, d) => {
        if(!err) {
            dbClient = d;
            callback(false);
        } else {
            callback(true);
        }
    });
}

function close() {
    if(dbClient !== undefined) {
        dbClient.close();
    }
    process.exit(0);
}

//Now connect to DB then start serving requests
connect(e => {
    if(e) {
        console.log('Bootstrap could not be completed.');
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
    console.log('Booststrap finished.');
});