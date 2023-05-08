import axios from 'axios';
import * as dcEmbed from './embed.js';
// import Database from '@replit/database';
// import db from '../helpers/database.js';
// const db = new Database()

const NamaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const NamaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const numFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
function dateID(d, mode = 1) {
  var t = new Date(d), o = '', pad = new Intl.NumberFormat('id-ID', { minimumIntegerDigits: 2 });
  o += mode == 2 ? NamaHari[t.getDay()] + ", " : "";
  o += t.getDate() + " " + NamaBulan[t.getMonth()] + " " + t.getFullYear();
  o += mode == 3 ? ", " + pad.format(t.getHours()) + "." + pad.format(t.getMinutes()) + "." + pad.format(t.getSeconds()) + " WIB" : "";
  return o;
}

async function getNextBirthday(type = "", params) {
  var opt = null;
  let result = await axios.get("https://v3.himaforka-uajy.org/api/calendar.php", {
    params: {
      secret: process.env["V3_SECRET"],
      action: "get_next_birthday",
      type: type,
      offset: params.offset
    }
  }).catch((res) => {
    console.log(res);
    opt = {
      embeds: [dcEmbed.sendAPIexception(res.status, res.statusText)]
    }
  });
  if (result.data.success) {
    var dt = result.data.data, desc = "", fields = [];
    var title = "Ulang Tahun Pengurus Selanjutnya" + (dt.offset == 0 ? "" : " (halaman " + (Number(dt.offset) + 1) + ")");
    desc += 'Sesuai yang ada di database website Himaforka v3, maka ulang tahun selanjutnya bagi pengurus HIMAFORKA ' + dt.angkatan + ' adalah'
    fields = [
      {
        name: dt.nama,
        value: dt.jabatan
      },
      {
        name: 'Tanggal ulang tahun',
        value: dateID(dt.tgl_lahir, 2),
        inline: true,
      },
      {
        name: 'Usia',
        value: dt.usia + " tahun",
        inline: true,
      },
      {
        name: 'Reminder:',
        value: '_Jangan lupa beri ucapan selamat ya!_'
      }
    ];
    opt = {
      embeds: [dcEmbed.create(0x28a745, title, null, desc, null, fields, { url: dt.image }, { text: "Fetched from Himaforka v3 API" })]
    }
  } else {
    opt = {
      embeds: [sendAPIexception(result.status, result.statusText)]
    }
    console.log(result);
  }

  return opt;
}

async function getBirthdayByField(field, value) {
  var opt = null;
  let result = await axios.get("https://v3.himaforka-uajy.org/api/calendar.php", {
    params: {
      secret: process.env["V3_SECRET"],
      action: "get_birthday_by_field",
      field: field,
      value: value
    }
  }).catch((res) => {
    console.log(res);
    opt = {
      embeds: [dcEmbed.sendAPIexception(res.status, res.statusText)]
    }
  });
  if (result.data.success) {
    var dt = result.data.data, desc = "???", fields = [];
    switch (field) {
      case "npm":
        desc = 'Sesuai yang ada di database website Himaforka v3, maka ulang tahun pengurus dengan NPM `' + value + '` adalah'
        break;
      case "nama":
        desc = 'Sesuai yang ada di database website Himaforka v3, maka ulang tahun pengurus dengan nama `' + value + '` adalah'
        break;
    }

    fields = [
      {
        name: dt.nama,
        value: dt.jabatan
      },
      {
        name: 'Tanggal ulang tahun',
        value: dateID(dt.tgl_lahir, 2),
        inline: true,
      },
      {
        name: 'Usia',
        value: dt.usia + " tahun",
        inline: true,
      },
      {
        name: 'Masa bakti',
        value: dt.angkatan
      }
    ];
    opt = {
      embeds: [dcEmbed.create(0x28a745, "Ulang Tahun Pengurus", null, desc, null, fields, { url: dt.image }, { text: "Fetched from Himaforka v3 API" })]
    }
  } else {
    opt = {
      embeds: [dcEmbed.sendAPIexception("Client error", result.data.text)]
    }
  }

  return opt;
}

function getAllByMonth(month, year) {

}

function getCurrentHourAlert(perm_level) {

}

export {
  getNextBirthday,
  getBirthdayByField,
  dateID
};