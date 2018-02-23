import {Db, MongoCallback, WriteOpResult} from "mongodb";

export abstract class DatabaseItem {
    _id: string;
    protected abstract collection: string;

    abstract getPersistableFields(): any;

    persistOn(dbClient: Db, callback: MongoCallback<WriteOpResult>) {
        dbClient.collection(this.collection).update(this._id, this.getPersistableFields(), {upsert: true}, callback);
    }
}