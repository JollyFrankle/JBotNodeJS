// Global variable:
// Current date
let currDate = Date.now();
let dateJkt = new Date(currDate + (7 * 60 * 60 * 1000))
console.log(dateJkt)
let isoDate = dateJkt.toISOString().match(/(\d{4}\-\d{2}\-\d{2})T(\d{2}:\d{2}:\d{2})/)

// do POST request to get data
const getData = async () => {
  // GET query string
  const urlParams = new URLSearchParams(window.location.search);

  // data
  let date = urlParams.get("date") || isoDate[1];
  // if (urlParams.get("id").trim()) {
  //   date = urlParams.get("id").trim()
  // } else {
  //   date = isoDate[1]
  // }

  let data = {
    tanggal: date,
    id_host: urlParams.get("id"),
    secret: "123"
  };
  console.log(data)
  // use Fetch API
  const response = await fetch("/api/sla-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  let result = await response.json();
  // console.log(result);
  // try {
  // console.log(result);
  return result;
  // } catch (error) {
  //     return {
  //         "status": "error",
  //         "message": "API error"
  //     };
  // }
}

function displayData(data, meta) {
  // Meta data
  document.getElementById("iden_name").innerText = meta.detail_host.nama;
  document.getElementById("iden_url").innerText = meta.detail_host.display_url;
  document.getElementById("iden_url").href = meta.detail_host.display_url;
  document.getElementById("iden_interval").innerText = meta.detail_host.interval_sec;

  document.getElementById("tanggal").value = meta.tanggal;
  document.getElementById("tanggal").setAttribute("max", isoDate[1]);

  // angka total samples
  let top = 600 / meta.detail_host.interval_sec;
  let mid = top * 0.9;
  let bot = top * 0.7;

  document.getElementById("legend-sample-a1").innerText = mid;
  document.getElementById("legend-sample-b1").innerText = bot;
  document.getElementById("legend-sample-b2").innerText = mid;
  document.getElementById("legend-sample-c1").innerText = bot;

  // Chart dan tabel
  let time = new Date(meta.tanggal + "T00:00+0000");
  let timeEnd = new Date(meta.tanggal + "T23:59:59+0000");
  let timeArr = [];
  while (time <= timeEnd) {
    // check if there is data for this time
    let dataTime = data.find(x => x.time.slice(11, 16) == time.toISOString().slice(11, 16));
    if (dataTime) {
      // if there is data, push it to timeArr
      dataTime.time = time.toISOString().slice(11, 16);
      dataTime.avg_resp_time = dataTime.avg_resp_time !== null ? Number(Number(dataTime.avg_resp_time).toFixed(3)) : null;
      dataTime.down_count = Number(dataTime.down_count);
      dataTime.sla = Number(Number(dataTime.sla).toFixed(2));
      timeArr.push(dataTime);
    } else {
      // if there is no data, push a dummy data to timeArr
      timeArr.push({
        time: time.toISOString().slice(11, 16),
        samples: (time > new Date()) ? null : 0,
        avg_resp_time: null,
        down_count: null,
        sla: null
      });
    }
    time.setMinutes(time.getMinutes() + 10);
  }
  // console.log(timeArr);
  // document.getElementById("json").innerHTML = JSON.stringify(timeArr, null, 4);

  // set global font family
  Chart.defaults.font.family = "'Roboto Mono', monospace";
  // set global font color
  Chart.defaults.color = "#fff";
  // set global font size
  Chart.defaults.font.size = 14;

  // chartjs
  var ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeArr.map(x => x.time),
      datasets: [{
        label: 'Samples',
        data: timeArr.map(x => x.samples),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }, {
        label: 'Average Response Time',
        data: timeArr.map(x => x.avg_resp_time !== null ? x.avg_resp_time / 1000 : null),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }, {
        label: 'Down Count',
        data: timeArr.map(x => x.down_count),
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1
      }, {
        label: 'SLA',
        data: timeArr.map(x => x.sla),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      maintainAspectRatio: false,
      aspectRatio: 1.5
    }
  });

  // options for individual chart
  let chartOpt = {
    scales: {
      y: {
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    maintainAspectRatio: false,
    aspectRatio: 1.5,
    // disable legend
    plugins: {
      legend: {
        display: false
      }
    }
  }

  // chart SLA
  var ctx = document.getElementById('chart-sla').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeArr.map(x => x.time),
      datasets: [{
        label: 'SLA',
        data: timeArr.map(x => x.sla),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    // option: maintainAspectRatio: false, aspectRatio: 1.5, interaction mode: index
    options: chartOpt
  });

  // chart Response Time
  var ctx = document.getElementById('chart-resp').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeArr.map(x => x.time),
      datasets: [{
        label: 'Average Response Time',
        data: timeArr.map(x => x.avg_resp_time !== null ? x.avg_resp_time.toFixed(0) : null),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    // option: maintainAspectRatio: false, aspectRatio: 1.5, interaction mode: index
    options: chartOpt
  });

  // chart Down Count
  var ctx = document.getElementById('chart-down').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeArr.map(x => x.time),
      datasets: [{
        label: 'Down Count',
        data: timeArr.map(x => x.down_count),
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1
      }]
    },
    // option: maintainAspectRatio: false, aspectRatio: 1.5, interaction mode: index
    options: chartOpt
  });

  // chart Samples
  var ctx = document.getElementById('chart-samples').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeArr.map(x => x.time),
      datasets: [{
        label: 'Samples',
        data: timeArr.map(x => x.samples),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    // option: maintainAspectRatio: false, aspectRatio: 1.5, interaction mode: index
    options: chartOpt
  });

  // average SLA, ignore if there is no data
  let avgSla = timeArr.filter(x => x.sla != null).reduce((a, b) => a + b.sla, 0) / timeArr.filter(x => x.sla != null).length;
  let avgSlaContainer = document.getElementById('avg-sla');
  if (avgSla < 94) {
    avgSlaContainer.classList.add("text-bg-danger");
  } else if (avgSla < 98) {
    avgSlaContainer.classList.add("text-bg-warning");
  } else {
    avgSlaContainer.classList.add("text-bg-success");
  }
  avgSlaContainer.innerHTML = avgSla.toFixed(2) + "%";

  // average Response Time, ignore if there is no data
  let avgResp = timeArr.filter(x => x.avg_resp_time != null).reduce((a, b) => a + b.avg_resp_time, 0) / timeArr.filter(x => x.avg_resp_time != null).length;
  let avgRespContainer = document.getElementById('avg-resp');
  if (avgResp > 1000) {
    avgRespContainer.classList.add("text-bg-danger");
  } else if (avgResp > 500) {
    avgRespContainer.classList.add("text-bg-warning");
  } else {
    avgRespContainer.classList.add("text-bg-success");
  }
  avgRespContainer.innerHTML = (avgResp).toFixed(0) + " ms";

  // average Down Count, ignore if there is no data
  let avgDown = timeArr.filter(x => x.down_count != null).reduce((a, b) => a + b.down_count, 0) / timeArr.filter(x => x.down_count != null).length;
  let avgDownContainer = document.getElementById('avg-down');
  if (avgDown > 1) {
    avgDownContainer.classList.add("text-bg-danger");
  } else if (avgDown > 0.5) {
    avgDownContainer.classList.add("text-bg-warning");
  } else {
    avgDownContainer.classList.add("text-bg-success");
  }
  avgDownContainer.innerHTML = avgDown.toFixed(2);

  // average Samples, ignore if there is no data
  let avgSamples = timeArr.filter(x => x.samples != null).reduce((a, b) => a + b.samples, 0) / timeArr.filter(x => x.samples != null).length;
  let avgSamplesContainer = document.getElementById('avg-samples');
  if (avgSamples < bot) {
    avgSamplesContainer.classList.add("text-bg-danger");
  } else if (avgSamples < mid) {
    avgSamplesContainer.classList.add("text-bg-warning");
  } else {
    avgSamplesContainer.classList.add("text-bg-success");
  }
  avgSamplesContainer.innerHTML = avgSamples.toFixed(2);

  // show data to table
  let table = document.getElementById("table-data");
  table.querySelector("tbody").innerHTML = "";
  for (let i = 0; i < timeArr.length; i++) {
    let row = document.createElement("tr");
    let cell1 = document.createElement("td");
    let cell2 = document.createElement("td");
    let cell3 = document.createElement("td");
    let cell4 = document.createElement("td");
    let cell5 = document.createElement("td");
    cell1.innerHTML = timeArr[i].time === null ? '<em class="text-muted">NULL</em>' : timeArr[i].time;
    cell2.innerHTML = timeArr[i].samples === null ? '<em class="text-muted">NULL</em>' : timeArr[i].samples;
    cell3.innerHTML = timeArr[i].avg_resp_time === null ? '<em class="text-muted">NULL</em>' : Number(timeArr[i].avg_resp_time).toFixed(0) + " ms";
    cell4.innerHTML = timeArr[i].down_count === null ? '<em class="text-muted">NULL</em>' : timeArr[i].down_count;
    cell5.innerHTML = timeArr[i].sla === null ? '<em class="text-muted">NULL</em>' : timeArr[i].sla + "%";
    row.appendChild(cell1);
    row.appendChild(cell2);
    row.appendChild(cell3);
    row.appendChild(cell4);
    row.appendChild(cell5);

    table.querySelector("tbody").appendChild(row);
  }
}