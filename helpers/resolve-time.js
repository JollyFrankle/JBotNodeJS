import https from 'https';

export function checkConnectionTime(url) {
  return new Promise(async (resolve, reject) => {
    var timings = {
      startAt: process.hrtime(),
      dnsLookupAt: undefined,
      tcpConnectionAt: undefined,
      tlsHandshakeAt: undefined,
      firstByteAt: undefined,
      endAt: undefined
    };

    /**
     * Get connection time in milliseconds
     * @param {import('http').ClientRequest|null} reqObj Request object
     * @returns {number|null} Connection time in milliseconds
     */
    function getConnTime(reqObj) {
      reqObj?.destroy(); // destroy the socket
      try {
        // connection time = firstByteAt - startAt
        let connEst = timings.tlsHandshakeAt || timings.tcpConnectionAt;
        let connectionTime = (connEst[0] - timings.startAt[0]) * 1e3;
        connectionTime += (connEst[1] - timings.startAt[1]) / 1e6;
        return connectionTime;
      } catch(e) {
        return null;
      }
    }

    let urlAsURL = new URL(url);
    let path = urlAsURL.pathname + urlAsURL.search;

    const req = https.request({
      hostname: urlAsURL.hostname,
      method: 'HEAD',
      path: path || '/',
      rejectUnauthorized: false,
    }, function(res) {
      res.once('readable', function() {
        timings.firstByteAt = process.hrtime();
      });
      res.on('end', function() {
        timings.endAt = process.hrtime();
        let connectionTime = getConnTime(null);

        resolve(connectionTime);
      });
    });
    req.on('socket', function(socket) {
      socket.on('lookup', function() {
        timings.dnsLookupAt = process.hrtime();
      });
      socket.on('connect', function() {
        timings.tcpConnectionAt = process.hrtime();
        if (timings.tlsHandshakeAt && timings.tcpConnectionAt) {
          resolve(getConnTime(req));
        }
      });
      socket.on('secureConnect', function() {
        timings.tlsHandshakeAt = process.hrtime();
        if (timings.tlsHandshakeAt && timings.tcpConnectionAt) {
          resolve(getConnTime(req));
        }
      });
    });

    req.on('error', function(err) {
      req?.destroy(); // destroy the socket
      reject(err);
    });
  })
}

async function checkWebsite(url) {
  let connTimes = [];
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

export async function resolveForYogyakarta() {
  let websites = [
    'https://undip.ac.id/', // Jakarta (Google)
    'https://unpad.ac.id/', // Bandung
    'https://lib.ui.ac.id/', // Yogyakarta
    'https://uny.ac.id/', // Yogyakarta
    'https://itb.ac.id/', // Bandung
    'https://ub.ac.id/', // Malang
    'https://unpar.ac.id/', // Jakarta (Dewaweb)
    'https://ugm.ac.id/', // Jakarta (Bekasi)
    'https://unair.ac.id/', // Surabaya
    'https://blog.its.ac.id/', // Surabaya
  ];

  let promises = [];
  for (let website of websites) {
    promises.push(checkWebsite(website));
  }

  let results = await Promise.all(promises);
  let resultsArr = [];
  for (let i = 0; i < websites.length; i++) {
    resultsArr.push(results[i]);
  }

  // return average of all
  let allDurations = [];
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