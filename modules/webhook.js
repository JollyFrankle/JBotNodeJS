import { url } from '../server.js';
import * as dcBot from '../index.js';
import { TextColorFormat } from '../helpers/utils.js';

let tg_template = {
  title: null,
  text: "",
  photo: [],
  date: "",
  url: []
}, tg_timeout = null, tg_content = null;

// Forward from Telegram
function tg_send(data) {
  if (tg_timeout === null) {
    tg_content = JSON.parse(JSON.stringify(tg_template))

    // set timeout 10 seconds:
    tg_timeout = setTimeout(() => {
      // perapian
      tg_content.text = tg_content.text.trim()
      let text_array = tg_content.text.split("\n");
      for (let i in text_array) {
        let test_text = text_array[i].trim();
        if (/^\[.+\]$/.test(test_text)) {
          // Sudah ditemukaan judul
          tg_content.title = test_text //.slice(1, -1)
          // hapus elemen yang ada title dari 'text' (yg akan menjadi descriptionnya)
          text_array.splice(i, 1)

          // set kembali content descriptionnya
          tg_content.text = text_array.join("\n").trim();

          // Limit ke 1024 karakter pertama:
          if (tg_content.text.length > 1024) {
            tg_content.text = tg_content.text.substring(0, 990) + "...";
          }

          // console.log(tg_content.text.length)
          break;
        }
      }

      // If description is empty:
      if (!tg_content.text.trim()) {
        tg_content.text = "_(tidak ada konten)_"
      }

      // Persiapan fields
      let fields = [];
      let image = null;

      if (tg_content.photo[0]) {
        // image: hanya boleh 1, jadi yaudah pilih foto pertama saja
        image = {
          url: tg_content.photo[0]
        }
      }

      if (tg_content.photo.length > 0) {
        fields.push({
          name: "Lampiran tambahan",
          value: "Ada " + tg_content.photo.length + " gambar di post ini."
        })
      }
      fields.push({
        name: "Post lengkap",
        value: tg_content.url[0]
      })

      // Persiapan embed
      let embed = {
        color: 0x0088cc,
        title: tg_content.title,
        url: null,
        author: {
          name: "Informatika UAJY",
          icon_url: `${url}/public/images/logo-himaforka.png`,
          url: "https://t.me/+xvykVhBxecliOTg1"
        },
        description: tg_content.text,
        fields: fields,
        image: image,
        timestamp: new Date(),
        footer: {
          text: "JollyBOT Telegram Integration",
          icon_url: `${url}/public/images/logo.jpg`
        }
      }

      // Send embed
      dcBot.sendMsg(
        { embeds: [embed] },
        // Telegram send to:
        [
          "346135882983538699",
          "955314117072277544",
          "861647849673981992" // pnc terpesona "-just-info-"
        ]
      ).then((res) => {
        console.log(TextColorFormat.GREEN, "[+] Update dari TELEGRAM berhasil dikirim!");
      })

      // console.log(embed)
      clearTimeout(tg_timeout)
      tg_timeout = null;
      tg_content = null;
    }, 10000)
  }

  if (data.action == "text") {
    tg_content.text += data.text + "\n";
    tg_content.date = data.date;
    tg_content.url.push(data.url);
  } else if (data.action == "photo") {
    tg_content.photo.push(data.photo);
    tg_content.date = data.date;
    tg_content.url.push(data.url);
    if (data.caption.trim()) {
      // if caption is not empty, append to 'text':
      tg_content.text += data.caption + '\n';
    }
  }
}

function tw_send(data) {
  console.log(data);

  // Send embed
  // dcBot.sendMsg(
  //   "*@kuliah_ftiuajy* di Twitter: " + data.url,
  //   ["346135882983538699"]
  // ).then((res) => {
  //   console.log(TextColorFormat.GREEN, "[+] Update dari TWITTER berhasil dikirim!");
  // })
}

function tw_send_adv(data) {
  // data dari PipeDream, bukan IFTTT

  // Pra-embed
  let fields = [], image = null;
  if (Array.isArray(data.media) && data.media.length > 0) {
    // fields.push({
    //   name: "Lampiran tambahan",
    //   value: "Ada " + data.media.length + " gambar/video di post ini."
    // })

    // set image:
    for (let i in data.media) {
      if (data.media[i].type == 'photo') {
        image = {
          url: data.media[i].media_url_https
        }
        break;
      }
    }
  }
  fields.push({
    name: "Post lengkap",
    value: data.url
  })

  data.text = data.text.trim() ? data.text.trim() : "_(tidak ada konten)_";

  // Persiapan embed
  let embed = {
    color: 0x1DA1F2,
    title: null,
    url: null,
    author: {
      name: "Fakultas Teknologi Industri UAJY",
      icon_url: `${url}/public/images/logo-fti.jpg`,
      url: `https://twitter.com/${data.user}`
    },
    description: data.text,
    fields: fields,
    image: image,
    timestamp: new Date(data.date),
    footer: {
      text: "JollyBOT Twitter Integration",
      icon_url: `${url}/public/images/logo.jpg`
    }
  }

  // Send embed
  dcBot.sendMsg(
    { embeds: [embed] },
    // Twitter send to:
    [
      "346135882983538699",
      "955314117072277544",
      "861647849673981992" // pnc terpesona "-just-info-"
    ]
  ).then((res) => {
    console.log(TextColorFormat.GREEN, "[+] Update dari TWITTER ADVANCED berhasil dikirim!");
  })
}

export {
  tg_send, tw_send, tw_send_adv
};