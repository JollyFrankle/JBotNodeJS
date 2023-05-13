// Functions: set, get, delete, list (all), list (with prefix)
import { ref, set, remove, get, push, onValue } from "@firebase/database";
import { db as fbDb } from "./firebase.js";

export async function _set(key, value) {
    await set(ref(fbDb, key), value);
    return true;
}

export async function _get(key) {
    let snapshot = await get(ref(fbDb, key));
    return snapshot.val();
}

export async function _deleteKey(key) {
    await remove(ref(fbDb, key));
    return true;
}

export async function _list() {
    let snapshot = await get(ref(fbDb));
    return snapshot.val();
}

export async function _getAsLiveData(key) {
    let snapshot = await get(ref(fbDb, key));
    return snapshot;
}

export function _push(key, value) {
    return push(ref(fbDb, key), value);
}

export default {
    set: _set,
    get: _get,
    delete: _deleteKey,
    list: _list,
    getLD: _getAsLiveData,
    push: _push
}