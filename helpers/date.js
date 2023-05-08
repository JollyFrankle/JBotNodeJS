export const Format = {
  DATETIME: 0,
  DATE: 1,
  TIME: 2
}


export function currentLocalDate() {
  let date = new Date();
  date.setHours(date.getHours() + 7);
  return date;
}

export function sqlDate(dateObj = new Date(), format = Format.DATETIME) {
  let isoDate = dateObj.toISOString().match(/(\d{4}\-\d{2}\-\d{2})T(\d{2}:\d{2}:\d{2})/)
  if(format == Format.DATETIME) {
    return isoDate[1] + ' ' + isoDate[2]
  } else if (format == Format.DATE) {
    return isoDate[1]
  } else if (format == Format.TIME) {
    return isoDate[2]
  } else {
    return isoDate[1] + ' ' + isoDate[2]
  }
}
export function dateFormatIndo(date) {
  // set time zone to Asia/Jakarta
  let newDate = new Date(date);
  newDate.setHours(newDate.getHours() + 7);

  var monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  var day = newDate.getDate();
  var monthIndex = newDate.getMonth();
  var year = newDate.getFullYear();
  // hours, minutes, seconds --> harus 2 digit
  var hours = newDate.getHours().toString().padStart(2, '0');
  var minutes = newDate.getMinutes().toString().padStart(2, '0');
  var seconds = newDate.getSeconds().toString().padStart(2, '0');

  // 3 karakter pertama dari nama bulan
  let monthShort = monthNames[monthIndex].substring(0, 3);

  return day + ' ' + monthShort + ' ' + year + ', pkl. ' + hours + '.' + minutes + '.' + seconds + ' WIB';
}