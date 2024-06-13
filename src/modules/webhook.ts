import dcBot, { baseURL } from '@/index';
import { TextColorFormat } from '@h/utils';

interface TelegramContent {
  title: string | null;
  text: string;
  photo: string[];
  date: string;
  url: string[];
}

let tg_template: TelegramContent = {
  title: null,
  text: "",
  photo: [],
  date: "",
  url: []
};

let tg_timeout: NodeJS.Timeout | undefined = undefined;
let tg_content: TelegramContent | undefined = undefined;

// Forward from Telegram
function tg_send(data: { action: string; text?: string; date: string; url: string; photo?: string; caption?: string; }) {
  if (tg_timeout === null) {
    tg_content = JSON.parse(JSON.stringify(tg_template));

    // set timeout 10 seconds:
    tg_timeout = setTimeout(() => {
      // perapian
      tg_content!.text = tg_content!.text.trim();
      let text_array = tg_content!.text.split("\n");
      for (let i in text_array) {
        let test_text = text_array[i].trim();
        if (/^\[.+\]$/.test(test_text)) {
          // Sudah ditemukaan judul
          tg_content!.title = test_text //.slice(1, -1)
          // hapus elemen yang ada title dari 'text' (yg akan menjadi descriptionnya)
          text_array.splice(Number(i), 1);

          // set kembali content descriptionnya
          tg_content!.text = text_array.join("\n").trim();

          // Limit ke 1024 karakter pertama:
          if (tg_content!.text.length > 1024) {
            tg_content!.text = tg_content!.text.substring(0, 990) + "...";
          }

          // console.log(tg_content.text.length)
          break;
        }
      }

      // If description is empty:
      if (!tg_content!.text.trim()) {
        tg_content!.text = "_(tidak ada konten)_";
      }

      // Persiapan fields
      let fields: { name: string; value: string }[] = [];
      let image: { url: string } | undefined = undefined;

      if (tg_content!.photo[0]) {
        // image: hanya boleh 1, jadi yaudah pilih foto pertama saja
        image = {
          url: tg_content!.photo[0] ?? ""
        };
      }

      if (tg_content!.photo.length > 0) {
        fields.push({
          name: "Lampiran tambahan",
          value: "Ada " + tg_content!.photo.length + " gambar di post ini."
        });
      }
      fields.push({
        name: "Post lengkap",
        value: tg_content!.url[0]
      });

      // Send embed
      dcBot.sendMsg(
        { embeds: [{
          color: 0x0088cc,
          title: tg_content!.title ?? "Update dari Telegram",
          author: {
            name: "Informatika UAJY",
            icon_url: `${baseURL}/public/images/logo-himaforka.png`,
            url: "https://t.me/+xvykVhBxecliOTg1"
          },
          description: tg_content!.text,
          fields: fields,
          image: image,
          timestamp: new Date().toJSON(),
          footer: {
            text: "JollyBOT Telegram Integration",
            icon_url: `${baseURL}/public/images/logo.jpg`
          }
        }] },
        // Telegram send to:
        [
          "346135882983538699",
          "955314117072277544",
          "861647849673981992" // pnc terpesona "-just-info-"
        ]
      ).then((res) => {
        console.log(TextColorFormat.GREEN, "[+] Update dari TELEGRAM berhasil dikirim!");
      });

      // console.log(embed)
      clearTimeout(tg_timeout);
      tg_timeout = undefined;
      tg_content = undefined;
    }, 10000);
  }

  if (data.action == "text") {
    tg_content!.text += data.text + "\n";
    tg_content!.date = data.date;
    tg_content!.url.push(data.url);
  } else if (data.action == "photo") {
    tg_content!.photo.push(data.photo!);
    tg_content!.date = data.date;
    tg_content!.url.push(data.url);
    if (data.caption!.trim()) {
      // if caption is not empty, append to 'text':
      tg_content!.text += data.caption + '\n';
    }
  }
}

function tw_send(data: { url: string }) {
  console.log(data);

  // Send embed
  // dcBot.sendMsg(
  //   "*@kuliah_ftiuajy* di Twitter: " + data.url,
  //   ["346135882983538699"]
  // ).then((res) => {
  //   console.log(TextColorFormat.GREEN, "[+] Update dari TWITTER berhasil dikirim!");
  // })
}

function tw_send_adv(data: { media: { type: string; media_url_https: string; }[]; url: string; text: string; user: string; date: string; }) {
  // data dari PipeDream, bukan IFTTT

  // Pra-embed
  let fields: { name: string; value: string }[] = [], image: { url: string } | undefined = undefined;
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
        };
        break;
      }
    }
  }
  fields.push({
    name: "Post lengkap",
    value: data.url
  });

  data.text = data.text.trim() ? data.text.trim() : "_(tidak ada konten)_";

  // Send embed
  dcBot.sendMsg(
    { embeds: [{
      color: 0x1DA1F2,
      title: undefined,
      url: undefined,
      author: {
        name: "Fakultas Teknologi Industri UAJY",
        icon_url: `${baseURL}/public/images/logo-fti.jpg`,
        url: `https://twitter.com/${data.user}`
      },
      description: data.text,
      fields: fields,
      image: image,
      timestamp: new Date(data.date).toJSON(),
      footer: {
        text: "JollyBOT X (formerly Twitter) Integration",
        icon_url: `${baseURL}/public/images/logo.jpg`
      }
    }] },
    // Twitter send to:
    [
      "346135882983538699",
      "955314117072277544",
      "861647849673981992" // pnc terpesona "-just-info-"
    ]
  ).then((res) => {
    console.log(TextColorFormat.GREEN, "[+] Update dari TWITTER [X] ADVANCED berhasil dikirim!");
  });
}

export default {
  tg_send, tw_send, tw_send_adv
};