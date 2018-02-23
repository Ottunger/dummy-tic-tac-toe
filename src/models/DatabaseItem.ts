import {Db, MongoCallback, WriteOpResult} from "mongodb";

export abstract class DatabaseItem {
    _id: string;
    abstract collection: string;

    abstract getPersistableFields(): any;

    persistOn(dbClient: Db, callback: MongoCallback<WriteOpResult>) {
        this._id = this._id || Math.floor(Math.random() * 10000).toString();
        dbClient.collection(this.collection).update({_id: this._id}, this.getPersistableFields(), {upsert: true}, callback);
    }
}