// import Database from '@replit/database';
import db from '../helpers/database.js';
// const db = new Database()

async function checkChannel(channel, listName) {
  let list = await db.get("notify");
  list = list[listName];
  if (typeof (list) === "undefined" || !Array.isArray(list)) {
    // kalau belum ada list/kosong, return belum ditemukan (0)
    return false;
  } else {
    return list.includes(channel);
  }
}



async function getChannels(listName) {
  let list = await db.get("notify");
  list = list[listName];
  if (typeof (list) === "undefined" || !Array.isArray(list)) {
    // kalau belum ada list/kosong, return belum ditemukan (0)
    return [];
  } else {
    return list;
  }
}



async function addToList(channel, listName) {
  let listAll = await db.get("notify");
  // first time init:
  if (typeof (listAll) === "undefined" || listAll === null) {
    await db.set("notify", {});
  }
  let listThis = listAll[listName];
  if (typeof (listThis) === "undefined" || !Array.isArray(listThis)) {
    // kalau empty list atau list belum ada, maka init sekaligus insert
    listAll[listName] = [channel];
    await db.set("notify", listAll);
    console.log(listAll);
    return [true, "Berhasil menambahkan ke daftar notifikasi aktif.\r\n_Jalankan perintah `!jb notify status` untuk memeriksa status notifikasi._"];
  } else {
    // kalau list sudah ada, append kalau memang belum ada:
    if ((await checkChannel(channel, listName)) === false) {
      // Belum ada, append:
      listThis.push(channel);
      listAll[listName] = listThis;
      await db.set("notify", listAll);
      console.log(listAll);
      return [true, "Berhasil menambahkan ke daftar notifikasi aktif.\r\n_Jalankan perintah `!jb notify status` untuk memeriksa status notifikasi._"];
    } else {
      // Sudah ada:
      return [false, "Channel ini sudah pernah ditambahkan!\r\n_Jalankan perintah `!jb notify status` untuk memeriksa status notifikasi._"];
    }
  }
}



async function removeFromList(channel, listName) {
  let listAll = await db.get("notify");
  let listThis = listAll[listName];
  if (typeof (listThis) === "undefined" || !Array.isArray(listThis)) {
    // kalau empty list atau list belum ada, maka init sekaligus insert
    listAll[listName] = [channel];
    await db.set("notify", listAll);
    return [false, "Channel ini belum terdaftar sebagai penerima notifikasi aktif.\r\n_Jalankan perintah `!jb notify status` untuk memeriksa status notifikasi._"];
  } else {
    // kalau list sudah ada, delete kalau memang belum ada:
    if ((await checkChannel(channel, listName)) === true) {
      // Sudah ada, hapus:
      listThis = listThis.filter((value) => {
        return value != channel;
      });
      listAll[listName] = listThis;
      await db.set("notify", listAll);
      return [true, "Channel ini berhasil dihapus dari daftar penerima notifikasi aktif.\r\n_Jalankan perintah `!jb notify status` untuk memeriksa status notifikasi._"];
    } else {
      return [false, "Channel ini belum terdaftar sebagai penerima notifikasi aktif.\r\n_Jalankan perintah `!jb notify status` untuk memeriksa status notifikasi._"];
    }
  }
}



export {
  checkChannel as check,
  addToList as add,
  removeFromList as remove,
  getChannels
};