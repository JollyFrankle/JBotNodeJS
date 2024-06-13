import https, { RequestOptions } from 'https';
import http from 'http';

interface Timings {
  startAt: [number, number];
  dnsLookupAt?: [number, number];
  tcpConnectionAt?: [number, number];
  tlsHandshakeAt?: [number, number];
  firstByteAt?: [number, number];
  endAt?: [number, number];
}

/**
 * Get connection time in milliseconds
 * @param {import('http').ClientRequest|null} reqObj Request object
 * @returns {number|null} Connection time in milliseconds
 */
function getConnTime(reqObj: http.ClientRequest | null, timings: Timings): number | null {
  reqObj?.destroy(); // destroy the socket
  try {
    // connection time = firstByteAt - startAt
    let connEst = timings.tlsHandshakeAt || timings.tcpConnectionAt;
    let connectionTime = (connEst!![0] - timings.startAt[0]) * 1e3;
    connectionTime += (connEst!![1] - timings.startAt[1]) / 1e6;
    return connectionTime;
  } catch (e) {
    return null;
  }
}

export function checkConnectionTime(url: string): Promise<number | null> {
  return new Promise(async (resolve, reject) => {
    var timings: Timings = {
      startAt: process.hrtime(),
      dnsLookupAt: undefined,
      tcpConnectionAt: undefined,
      tlsHandshakeAt: undefined,
      firstByteAt: undefined,
      endAt: undefined
    };

    let urlAsURL = new URL(url);
    let path = urlAsURL.pathname + urlAsURL.search;

    const req = https.request({
      hostname: urlAsURL.hostname,
      method: 'HEAD',
      path: path || '/',
      rejectUnauthorized: false,
    } as RequestOptions, function (res) {
      res.once('readable', function () {
        timings.firstByteAt = process.hrtime();
      });
      res.on('end', function () {
        timings.endAt = process.hrtime();
        let connectionTime = getConnTime(null, timings);

        resolve(connectionTime);
      });
    });
    req.on('socket', function (socket) {
      socket.on('lookup', function () {
        timings.dnsLookupAt = process.hrtime();
      });
      socket.on('connect', function () {
        timings.tcpConnectionAt = process.hrtime();
        if (timings.tlsHandshakeAt && timings.tcpConnectionAt) {
          resolve(getConnTime(req, timings));
        }
      });
      socket.on('secureConnect', function () {
        timings.tlsHandshakeAt = process.hrtime();
        if (timings.tlsHandshakeAt && timings.tcpConnectionAt) {
          resolve(getConnTime(req, timings));
        }
      });
    });

    req.on('error', function (err) {
      req?.destroy(); // destroy the socket
      reject(err);
    });
  })
}

async function checkWebsite(url: string): Promise<{ url: string, durations: number[], average: number | null }> {
  let connTimes: number[] = [];
  try {
    for (let i = 0; i <= 3; i++) {
      let connectionTime = await checkConnectionTime(url);
      if (i > 0 && connectionTime != null) {
        connTimes.push(connectionTime);
      }
    }
    return {
      url,
      durations: connTimes,
      average: Math.ceil(connTimes.reduce((a, b) => a + b, 0) / connTimes.length)
    }
  } catch (error) {
    return {
      url,
      durations: [],
      average: null
    }
  }
}

export async function resolveForYogyakarta(): Promise<{ average: number, results: { url: string, durations: number[], average: number | null }[] }> {
  let websites: string[] = [
    'https://undip.ac.id/', // Jakarta (Google)
    'https://unpad.ac.id/', // Bandung
    'https://lib.ui.ac.id/', // Yogyakarta
    'https://uny.ac.id/', // Yogyakarta
    'https://itb.ac.id/', // Bandung
    'https://ub.ac.id/', // Malang
    // 'https://unpar.ac.id/', // Jakarta (Dewaweb) --> swapped, unreliable
    'https://ugm.ac.id/', // Jakarta (Bekasi)
    // 'https://unair.ac.id/', // Surabaya --> swapped, unreliable
    'https://blog.its.ac.id/', // Surabaya
    'https://kemdikbud.go.id/', // Jakarta (Tangerang)
    'https://kemenag.go.id/', // Jayapura
    'https://kemenkeu.go.id/', // Jakarta
    'https://kemkes.go.id/', // Jakarta
    'https://kemenperin.go.id/', // Jakarta
  ];

  let promises: Promise<{ url: string, durations: number[], average: number | null }>[] = [];
  for (let website of websites) {
    promises.push(checkWebsite(website));
  }

  let results = await Promise.all(promises);
  let resultsArr: { url: string, durations: number[], average: number | null }[] = [];
  for (let i = 0; i < websites.length; i++) {
    resultsArr.push(results[i]);
  }

  // return average of all
  let allDurations: number[] = [];
  for (let result of results) {
    if (result.average != null) {
      allDurations.push(...result.durations);
    }
  }
  let average = Math.ceil(allDurations.reduce((a, b) => a + b, 0) / allDurations.length);
  average += Math.ceil(25 + 0.1 * average)
  return {
    average,
    results: resultsArr
  };
}

export default {
  checkConnectionTime,
  resolveForYogyakarta
};