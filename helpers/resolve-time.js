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

    function getConnTime() {
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

    let urlWithoutHttp = url.replace('http://', '').replace('https://', '');
    let path = urlWithoutHttp.substring(urlWithoutHttp.indexOf('/'));
    urlWithoutHttp = urlWithoutHttp.substring(0, urlWithoutHttp.indexOf('/'));

    let protocol = url.split(':')[0];
    const http = await import(protocol);

    let req = http.request({
      hostname: urlWithoutHttp,
      method: 'GET',
      path: path || '/',
      rejectUnauthorized: false,
    }, function(res) {
      res.once('readable', function() {
        timings.firstByteAt = process.hrtime();
      });
      // res.on('data', function(chunk) {
      //   // responseBody += chunk;
      // });
      res.on('end', function() {
        timings.endAt = process.hrtime();
        let connectionTime = getConnTime();

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
          resolve(getConnTime());
        }
      });
      socket.on('secureConnect', function() {
        timings.tlsHandshakeAt = process.hrtime();
        if (timings.tlsHandshakeAt && timings.tcpConnectionAt) {
          resolve(getConnTime());
        }
      });
    });

    req.on('error', function(err) {
      reject(err);
    });

    req.end();
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
    console.log(error);
    return {
      url,
      durations: [],
      average: null
    }
  }
}

export async function resolveForYogyakarta() {
  let websites = [
    'https://uad.ac.id/', // Yogyakarta
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