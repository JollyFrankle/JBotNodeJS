// import { ref, set, remove, get, push, onValue, DatabaseReference, DataSnapshot } from "@firebase/database";
// import { db as fbDb } from "@h/firebaseClient";

// export async function _set(key: string, value: any) {
//     await set(ref(fbDb, key), value);
//     return true;
// }

// export async function _get(key: string) {
//     let snapshot: DataSnapshot = await get(ref(fbDb, key));
//     return snapshot.val();
// }

// export async function _deleteKey(key: string) {
//     await remove(ref(fbDb, key));
//     return true;
// }

// export async function _list() {
//     let snapshot: DataSnapshot = await get(ref(fbDb));
//     return snapshot.val();
// }

// export async function _getAsLiveData(key: string) {
//     let snapshot: DataSnapshot = await get(ref(fbDb, key));
//     return snapshot;
// }

// export function _push(key: string, value: any) {
//     return push(ref(fbDb, key), value);
// }

// export default {
//     set: _set,
//     get: _get,
//     delete: _deleteKey,
//     list: _list,
//     getLD: _getAsLiveData,
//     push: _push
// }