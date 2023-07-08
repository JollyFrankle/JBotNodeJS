export const Format = {
  DATETIME: 0,
  DATE: 1,
  TIME: 2
}

export const TextColorFormat = {
  BLACK: "\x1b[30m%s\x1b[0m",
  RED: "\x1b[31m%s\x1b[0m",
  GREEN: "\x1b[32m%s\x1b[0m",
  YELLOW: "\x1b[33m%s\x1b[0m",
  BLUE: "\x1b[34m%s\x1b[0m",
  MAGENTA: "\x1b[35m%s\x1b[0m",
  CYAN: "\x1b[36m%s\x1b[0m",
  WHITE: "\x1b[37m%s\x1b[0m",
  RESET: "\x1b[0m%s\x1b[0m"
}

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

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
export function dateFormatIndo(date, convertUTC = false) {
  if(convertUTC) {
    date = convertFromUTC(date);
  }

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
 * Format date to Indonesian (WIB)
 * @param {Date} date
 * @returns {Date} Converted date
 */
export function convertFromUTC(date) {
  let offset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - offset);
  return date;
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

/**
 * Checks if any of the arguments is empty
 * @param  {...any} args
 * @returns {Boolean} True if any of the arguments is empty
 */
export function isAnyEmpty(...args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] == null || args[i] == '') {
      return true;
    }
  }
  return false;
}