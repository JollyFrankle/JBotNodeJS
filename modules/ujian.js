import * as dcEmbed from './embed.js';
// import Database from '@replit/database';
import db from '../helpers/database.js';
// const db = new Database();
import Moment from 'moment-timezone';

import * as dcCal from './calendar.js';

function checkNull(input) {
  return input === null || typeof (input) === "undefined";
}

let sesiUjian = {
  "1": "08.00",
  "2": "10.30",
  "3": "13.30",
  "4": "16.00"
};

function sortObjUjian(input) {
  let sorted = Object.fromEntries(
    Object.entries(input).sort(([,a],[,b]) => (a.tanggal > b.tanggal) ? 1 :
      (a.tanggal === b.tanggal) ? ((a.sesi > b.sesi) ? 1 : -1)
    : -1)
    );

  return sorted;
}

async function addMK(kodeMK, namaMK, tanggalUjian, sesiUjian, tipeUjian) {
  var ujian = await db.get("ujian");
  if (typeof (ujian) !== "object") {
    // belum pernah dibuat, berarti diinit dulu
    ujian = {};
  }
  if (kodeMK in ujian) {
    // sudah ada, return false
    return [false, "Kode MK sudah terdaftar dengan nama " + ujian[kodeMK].nama];
  }
  if (
    checkNull(kodeMK) ||
    checkNull(namaMK) ||
    checkNull(tanggalUjian) ||
    checkNull(sesiUjian) ||
    !(Moment(tanggalUjian, "YYYY-MM-DD", true).isValid()) ||
    (Number(sesiUjian) < 1 || Number(sesiUjian > 4)) ||
    checkNull(tipeUjian)
  ) {
    return [false, "Ada input tidak valid!"];
  }

  // otherwise:
  // var tipe: tipe ujian -- default: daring, jadi kalau luring, berarti true
  var tipeU_filtered = false;
  switch(tipeUjian) {
    case "luring": case "offline":
      tipeU_filtered = "Ujian Luring";
      break;
    case "daring": case "online":
      tipeU_filtered = "Ujian Daring";
      break;
    case "tugas":
      tipeU_filtered = "Kumpul Tugas";
      break;
    default:
      tipeU_filtered = tipeUjian;
      break;
  }
  ujian[kodeMK] = {
    nama: namaMK,
    tanggal: tanggalUjian,
    sesi: Number(sesiUjian),
    sifat: tipeU_filtered,
    note: []
  };
  await db.set("ujian", ujian);
  return [true, "Berhasil menambahkan MK " + namaMK + "!"];
  // return true/false
}

// DARI SINI KE BAWAH: Asumsi sudah ada objectnya!
async function removeMK(kodeMK) {
  var ujian = await db.get("ujian");
  if (!(kodeMK in ujian)) {
    // belum ada, return false
    return [false, "Kode MK belum terdaftar!"];
  }

  // otherwise: remove
  let namaMK = ujian[kodeMK].nama;
  delete ujian[kodeMK];
  await db.set("ujian", ujian);
  return [true, "Berhasil menghapus MK " + namaMK + "!"];
}

async function setJadwal(kodeMK, tglUjian, sesiUjian) {
  var ujian = await db.get("ujian");
  if (!(kodeMK in ujian)) {
    // belum ada, return false
    return [false, "Kode MK belum terdaftar!"];
  }

  if (!(Moment(tanggalUjian, "YYYY-MM-DD", true).isValid()) || (Number(sesiUjian) < 1 || Number(sesiUjian > 4))) {
    return [false, "Ada input tidak valid!"];
  }

  // otherwise:
  ujian[kodeMK].tanggal = tanggalUjian;
  ujian[kodeMK].sesi = Number(sesiUjian);

  return [true, "Berhasil mengubah jadwal ujian untuk MK " + ujian[kodeMK].nama + "!"];
}

async function getAll() {
  var ujian = await db.get("ujian");

  var color = 0x0099ff,
    title = "Daftar Mata Kuliah Ujian",
    url = null,
    desc = "Ada **" + Object.keys(ujian).length + " mata kuliah** yang tersimpan di sistem.",
    thumbnail = null,
    fields = [],
    image = null,
    footer = {
      text: "JBot / Info Ujian"
    };

  if (Object.keys(ujian).length > 0) {
    desc += " Berikut rinciannya:";
    // Sort:
    ujian = sortObjUjian(ujian);
  }

  for (kode in ujian) {
    var detil = ujian[kode];
    fields.push({
      name: detil.nama,
      value: dcCal.dateID(detil.tanggal, 2) + " – sesi " + detil.sesi + " – " + detil.sifat + (detil.note.length > 0 ? " – " + detil.note.length + " catatan" : "") + "\r\nUntuk melihat detil lengkap, ketik: `!jb ujian getByKode " + kode + "`"
    });
  }
  return [
    true,
    {
      embeds: [
        dcEmbed.create(color, title, url, desc, thumbnail, fields, image, footer)
      ]
    }
  ];
}

async function getJadwal(kodeMK) {
  // return [tanggal, sesi];
}

async function getByKode(kodeMK) {
  var ujian = await db.get("ujian");
  if (!(kodeMK in ujian)) {
    // belum ada, return false
    return [false, "Kode MK belum terdaftar!"];
  }

  // otherwise:
  let detil = ujian[kodeMK];

  var color = 0x0099ff,
    title = "Keterangan Ujian: " + detil.nama,
    url = null,
    desc = "Mata Kuliah " + detil.nama + " (kode: " + kodeMK + ") akan dilaksanakan pada **" + dcCal.dateID(detil.tanggal, 2) + " sesi " + detil.sesi + " (" + sesiUjian[detil.sesi] + " WIB)**, bersifat **" + detil.sifat + "**.",
    thumbnail = null,
    fields = [],
    image = null,
    footer = {
      text: "JBot / Info Ujian"
    };

  if (detil.note.length > 0) {
    desc += " Beberapa catatan untuk ujian ini:";
  }

  for (i in detil.note) {
    // console.log(detil.note[i][2]);
    fields.push({
      name: "Note #" + (Number(i) + 1) + " – " + detil.note[i][1] + ":",
      value: detil.note[i][2]
    });
  }

  let embedGen = dcEmbed.create(color, title, url, desc, thumbnail, fields, image, footer);
  return [
    true,
    {
      embeds: [
        embedGen
      ]
    },
    embedGen // hanya embed, khusus digunakan di pemanggilan genSummary(...)
  ];
}

async function addNote(kodeMK, note, author) {
  var ujian = await db.get("ujian");
  if (!(kodeMK in ujian)) {
    // belum ada, return false
    return [false, "Kode MK belum terdaftar!"];
  }

  if (!note.trim()) {
    // note tiada isi
    return [false, "Note tidak ada isinya!"];
  }

  if (ujian[kodeMK].note.length >= 10) {
    // overflow
    return [false, "Jumlah note tidak boleh melebihi 10!"];
  }

  if (note.trim().length > 200) {
    // string length overflow
    return [false, "Jumlah karakter note tidak boleh lebih dari 200!"];
  }
  // otherwise: add note, get author
  ujian[kodeMK].note.push(
    [new Date(), author, note.trim()]
  );

  // console.log(ujian[kodeMK].note);
  await db.set("ujian", ujian);
  return [true, "Note berhasil ditambahkan!"];
  // return true/false
}

async function removeNote(kodeMK, nomorNote) {
  var ujian = await db.get("ujian");
  if (!(kodeMK in ujian)) {
    // belum ada, return false
    return [false, "Kode MK belum terdaftar!"];
  }

  // cek nomorNote-nya apakah ada atau tidak?
  let noteLength = ujian[kodeMK].note.length;
  // console.log(noteLength);
  // nomor note dikurangi 1 (agar menjadi index note):
  if (checkNull(nomorNote) || nomorNote < 1 || nomorNote > noteLength) {
    // nomor yg diinput tidak valid
    return [false, "Nomor note tidak valid! Ada " + noteLength + " note!"];
  }
  nomorNote = Number(nomorNote) - 1;

  // otherwise, delete
  ujian[kodeMK].note.splice(nomorNote, 1);
  await db.set("ujian", ujian);
  return [true, "Berhasil remove note!"];
  // return true/false
}

async function genSummary(tanggal="") {
  var ujian = await db.get("ujian");

  if (!(Moment(tanggal, "YYYY-MM-DD", true).isValid())) {
    // tanggal invalid, return jadwal ujian untuk besok
    tanggal = Moment().add(1, 'd').format("YYYY-MM-DD");
  }

  var arrKode = [];
  ujianFiltered = {};
  for (kode in ujian) {
    var detil = ujian[kode];
    if (detil.tanggal == tanggal) {
      ujianFiltered[kode] = ujian[kode];
    }
  }

  // console.log(arrKode);
  if (Object.keys(ujianFiltered).length == 0) {
    // tidak ada ujian di tanggal ini, return false
    return [false, "Tidak ada ujian!"];
  }
  // Sudah pasti ada ujian
  ujian = sortObjUjian(ujianFiltered);

  // generate embed pengantar:
  var color = 0x20c997,
    title = "Reminder Ujian: " + dcCal.dateID(tanggal, 2),
    url = null,
    desc = "Ada " + Object.keys(ujian).length + " MK yang akan diujikan pada " + dcCal.dateID(tanggal, 2) + " dengan rincian:",
    thumbnail = null,
    fields = [],
    image = null,
    footer = {
      text: "JBot / Info Ujian"
    };

  opt_embed = [], fields_value = "";
  // console.log(arrKode);
  for (kode in ujian) {
    let resByKode = await getByKode(kode);
    opt_embed.push(resByKode[2]);

    fields_value += "Sesi " + ujian[kode].sesi + " - " + sesiUjian[ujian[kode].sesi] + " WIB: **" + ujian[kode].nama + "**\r\n";
  }
  // console.log("HER2E OK");

  fields.push({
    name: "Jadwal Ujian",
    value: fields_value
  });

  opt_embed.unshift(
    dcEmbed.create(color, title, url, desc, thumbnail, fields, image, footer)
  );

  return [
    true,
    {
      embeds: opt_embed
    }
  ]
}

export {
  addMK, removeMK, setJadwal, getAll, getJadwal, addNote, removeNote, getByKode, genSummary
};