// import Database from '@replit/database';
import db from '../helpers/database.js';
// const db = new Database();
import Moment from 'moment-timezone';

async function getEvent() {
  var time = Moment().tz('Asia/Makassar');
  let event = await db.get("rri");
  event = event[time.format("e")];
  let hours = Object.keys(event);
  let hLen = hours.length, currH = time.format("HH:mm");
  hours.push("24:00"); // tambahkan jam 24:00 sebagai penanda akhir hari

  var nextRefr = null, eventName = null;
  for(let i=0; i<hLen-1; i++) {
    if(hours[i] <= currH && currH < hours[i+1]) {
      nextRefr = new Date(time.format("YYYY-MM-DD ") + hours[i+1] + ":00Z+8");
      eventName = event[hours[i]];
    }
  }

  return {
    eventName: eventName,
    nextRefr: nextRefr
  };
}

export {
  getEvent as get
};