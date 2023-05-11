import { url } from '../server.js';

function createEmbed(
  color = 0x0099ff,
  title = "Title card ini",
  urlDest = "https://v3.himaforka-uajy.org/",
  desc = "Deskripsi card ini",
  thumbnail = "https://ifest.uajy.ac.id/assets/images/branding/ev-me.png",
  fields = [],
  image = "https://ifest.uajy.ac.id/assets/images/twibbon.png",
  footer = {
    text: "Card footer",
    icon_url: "https://ifest.uajy.ac.id/assets/images/medal-1.png"
  },
  displayAuthor = true,
) {
  let author = null;
  if(displayAuthor === true) {
    author = {
      name: "JollyBOT automated",
      icon_url: `${url}/public/images/logo.jpg`,
      url: null
    }
  }

  // replace semua {WEBSERVER_URL} dengan `url`
  urlDest = urlDest === null ? null : urlDest.replace("{WEBSERVER_URL}", url);
  image = image === null ? null : image.replace("{WEBSERVER_URL}", url);
  thumbnail = thumbnail === null ? null : thumbnail.replace("{WEBSERVER_URL}", url);

  return {
    color: color,
    title: title,
    url: urlDest,
    author: author,
    description: desc,
    thumbnail: {
      url: thumbnail
    },
    fields: fields,
    image: {
      url: image
    },
    timestamp: new Date(),
    footer: footer,
  };
}

function rNoIU(input) {
  // return null on input undefined
  return (input === undefined || input == "") ? null : input;
}

function genEmbedFromQ(data) {
  do {
    // Validate data: wajib ada itu title dan desc
    if (!data.title || !data.desc) {
      return "ERR: Field title dan/atau desc tidak ada!";
    }

    let embed = createEmbed(
      Number(rNoIU(data.color)),
      data.title,
      rNoIU(data.url),
      data.desc,
      rNoIU(data.thumbnail),
      rNoIU(data.fields),
      rNoIU(data.image),
      rNoIU(data.footer)
    );

    console.log(new Date().toUTCString() + ": Embed Generation [OK]")
    return embed;
  } while (0);
}

function apiException(status, statusText) {
  var sttxt = status == 200 ? "200: JSON parse error/query string not satisfied" : status + ": " + statusText;
  return createEmbed(
    0xdc3545,
    "API Error!",
    null,
    "Terjadi kesalahan saat mencoba menghubungkan ke API HIMAFORKA v3.",
    null,
    [
      {
        name: "Status text",
        value: sttxt
      }
    ],
    null,
    {
      text: "Fetched from Himaforka v3 API"
    }
  )
}

function commandError(prefix, fields=[]) {
  var desc = "Command yang dituju (`" + prefix + "`) tidak tersedia di bot ini."
  if(fields.length > 0) {
    desc+= " Mungkin maksud Anda:";
  }
  return createEmbed(
    0xffc107,
    "Command Error!",
    null,
    desc,
    null,
    fields,
    null,
    {
      text: "JBOTnode/commandErrorExceptionHandler"
    }
  )
}

function customException(desc_field, fields=[]) {
  var desc = desc_field;
  return createEmbed(
    0xffc107,
    "Command Error!",
    null,
    desc,
    null,
    fields,
    null,
    {
      text: "JBOTnode/customExceptionHandler"
    }
  )
}

export {
  createEmbed as create,
  genEmbedFromQ as fromQ,
  apiException as sendAPIexception,
  commandError as sendCmdErrException,
  customException as sendCustomException
};