export const Format = {
  DATETIME: 0,
  DATE: 1,
  TIME: 2
}

/**
 * Format date to SQL-compatible format
 * @param {Date} dateObj
 * @param {Format} format
 * @returns {String} Formatted date
 */
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

/**
 * Format date to Indonesian (WIB)
 * @param {Date} date
 * @returns {String} Formatted date
 */
export function dateFormatIndo(date) {
  // plus 7 hours
  date.setHours(date.getHours() + 7);

  var monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  // hours, minutes, seconds --> harus 2 digit
  var hours = date.getHours().toString().padStart(2, '0');
  var minutes = date.getMinutes().toString().padStart(2, '0');
  var seconds = date.getSeconds().toString().padStart(2, '0');

  // 3 karakter pertama dari nama bulan
  let monthShort = monthNames[monthIndex].substring(0, 3);

  return day + ' ' + monthShort + ' ' + year + ', pkl. ' + hours + '.' + minutes + '.' + seconds + ' WIB';
}

/**
 * Truncate string
 * @param {String} str
 * @param {Number} len
 * @returns {String} Truncated string
 */
export function truncate(str, len) {
  if (str.length > len) {
    return str.substring(0, len - 3) + '...';
  } else {
    return str;
  }
}