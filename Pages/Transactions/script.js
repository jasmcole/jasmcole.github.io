Chart.defaults.global.hover.mode = 'nearest';
Chart.defaults.global.legend.display = false;

var x = [], y = [], derived = {'pos': {'All': [0]}, 'neg': {'All': [0]}}, csum = [], data = [];
var indextosample = -1;
var headers = [], filename;
var linecolors = ["rgba(52,195,240,1)", "rgba(75,92,192,1)", "rgba(192,75,75,1)"];

var context = document.getElementById('cumulative').getContext('2d');
makeLinePlot(0,0,'Cumulative total',context);
context = document.getElementById('transactions').getContext('2d');
makeLinePlot(0,0,'Transactions',context);

updateHistogramParams('pos');
updateHistogramParams('neg');

function readSingleFile(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
    filename = document.getElementById('file-input').files[0].name;
    document.getElementById('filestatus').innerHTML = 'Uploaded ' + filename;
    document.getElementById('togglesummaryBtn').style.visbility = 'visible';
    displayContents(contents);
  };
  reader.readAsText(file);
}

function linspace(a,b,n) {
  dx = (b - a)/(n - 1);
  var ret = [];
  for (i = 0; i < n; i++) {
    ret[i] = a + i*dx;
  }
  return ret;
}

function histogram(y, bins) {
  var nbins = bins.length - 1;
  var hist = linspace(0, 0, nbins);

  var dx = bins[1] - bins[0];
  for (i = 1; i < y.length; i++) {
    var ind = Math.floor((y[i] - Math.min(...bins))/dx);
    hist[ind] += 1;
  }

  var bincentres = [];
  for (i = 0; i < bins.length-1; i++) {
    bincentres[i] = 0.5 * (bins[i] + bins[i+1]);
  }

  return [bincentres, hist]
}

function displayContents(contents) {
  data = contents.split(/\r\n|\n|\r/);
  headers = data[0].split(',');
  data.reverse();
  //data = data.slice(300, data.length);
  indextosample = updateTable(headers);
  if (indextosample > 0) {
    createPlots(indextosample);
  }
}

function createPlots(indextosample) {
  document.getElementById('filestatus').innerHTML =
    'Uploaded ' + filename + ', analysing column ' + headers[indextosample];
  for (i = 0; i < headers.length; i++) {
    if (i == indextosample) {
      document.getElementById('headerBtn' + i).className = "button-primary";
    } else {
      document.getElementById('headerBtn' + i).className = "button-dark";
    }
  }
  csum[0] = 0;
  x[0] = 0;
  y[0] = data[0].split(',')[indextosample];
  derived['pos']['All'] = [];
  derived['neg']['All'] = [];

  for (i = 1; i < data.length-1; i++) {
    var items = data[i].split(',');
    x[i] = i;
    y[i] = Number(items[indextosample]);
    csum[i] = csum[i-1] + y[i];

    if (y[i] > 0) {
      derived['pos']['All'].push(y[i]);
    } else {
      derived['neg']['All'].push(y[i]);
    }

  }

  context = document.getElementById('cumulative').getContext('2d');
  makeLinePlot(x,csum,'Cumulative total',context);

  context = document.getElementById('transactions').getContext('2d');
  makeLinePlot(x,y,'Transactions',context);

  updateHistogramParams('pos');
  updateHistogramParams('neg');
}

function updateTable(headers) {
  tdiv = document.getElementById('csvheadtable');
  nrows = 50;

  headerstr = '';
  for (i = 0; i < headers.length; i++) {
    if (headers[i] == 'Amount') {
      indextosample = i;
      buttonstr = '<th><button class="button-primary" id="headerBtn' + i + '" onclick="createPlots(' + i + ')">' + headers[i] + '</button></th>' + '\n';
      console.log(buttonstr);
      headerstr += buttonstr;
    } else {
      headerstr += '<th><button class="button-dark" id="headerBtn' + i + '" onclick="createPlots(' + i + ')">' + headers[i] + '</button></th>' + '\n';
    }
  }

  contentstr = [];
  for (i = 0; i < Math.min(nrows, data.length-1); i++) {// -1 to avoid headers row
    row = data[i].split(',');
    contentstr += '<tr>' + '\n';
    for (j = 0; j < row.length; j++) {
      contentstr += '<td>' + row[j] + '</td>' + '\n';
    }
    contentstr += '</tr>' + '\n';
  }


  newHTML = '<table class="">' + '\n' +
              '<thead>' + '\n' +
                '<tr>' + '\n' +
                  headerstr +
                '</tr>' + '\n' +
              '</thead>' + '\n' +
              '<tbody>' + '\n' +
                  contentstr +
              '</tbody>' + '\n' +
            '</table';
  tdiv.innerHTML = newHTML;
  tdiv.style.height = '400px';
  tdiv.style.overflow = 'auto';
  return indextosample;
}

function updateHistogramParams(identifier) {
  nbins = Number(document.getElementById("nbins" + identifier).value);
  ylo   = Number(document.getElementById("lower" + identifier).value);
  yhi   = Number(document.getElementById("upper" + identifier).value);
  context      = document.getElementById('hist'  + identifier).getContext('2d')
  thisy = derived[identifier];
  updateHistogram(thisy,nbins,ylo,yhi,context);
}

function updateHistogram(y,nbins,ylo,yhi,context) {
  nbins = Number(nbins);
  bins = linspace(ylo-0.01, yhi+0.01, nbins+1);

  bardata = {}; hist = [];
  Object.keys(y).forEach(function(key,index) {
    hist = histogram(y[key], bins);
    bardata[key] = hist[1];
  });

  makeBarPlot(hist[0], bardata, context);
}

function makeLinePlot(x,y,label,context) {
  var linedata = {datasets: [
                      {
                        data: y,
                        label: label,
                        fill: false,
                        lineTension: 0,
                        borderColor: linecolors[0],
                        pointRadius: 0
                      }
                    ],
                  labels: x};



  var chart = new Chart(context , {
                        type: "line",
                        data: linedata,
                        borderCapStyle: 'round',
                        options: {
                          scales: {
                            xAxes: [{
                              ticks: {
                                maxTicksLimit: 50
                              },
                              scaleLabel: {
                                display: true,
                                labelString: 'Transaction'
                              },
                              }],
                            yAxes: [{
                              scaleLabel: {
                                display: true,
                                labelString: 'Amount'
                              },
                              ticks: {
                                // Add pound sign to y-axis
                                callback: function(value, index, values) {
                                  return "\u00A3" + Math.round(Number(value)*100)/100
                                }
                              }
                            }]
                          },
                          title: {
                            display: false
                          }
                        }
                      });
}

// x is a 1D array of bin centres, y is a 2D array of stacked bars
function makeBarPlot(x,y,context) {

  for (i = 0; i < x.length; i++) {
    x[i] = Math.round(x[i]*10)/10;
  }

  datasets = [];

  Object.keys(y).forEach(function(key,index) {
    thisdataset = { //Default values for bar charts
      fill: false,
      lineTension: 0,
      backgroundColor: linecolors[index],
      pointRadius: 0,
      data: y[key],
      label: key
    };
    datasets.push(thisdataset);
  });

  var linedata = {datasets: datasets, labels: x};


  var chart = new Chart(context , {
                        type: "bar",
                        data: linedata,
                        borderCapStyle: 'round',
                        options: {
                          legend: {
                            display: true
                          },
                          scales: {
                            xAxes: [{
                              stacked: true,
                              ticks: {
                                maxTicksLimit: 50
                              },
                              scaleLabel: {
                                display: true,
                                labelString: "Transaction amount /" + "\u00A3"
                              },
                              }],
                            yAxes: [{
                              stacked: true,
                              scaleLabel: {
                                display: true,
                                labelString: 'Frequency'
                              },
                              ticks: {
                                // Add pound sign to y-axis
                                callback: function(value, index, values) {
                                  return Math.round(value)
                                }
                              }
                            }]
                          },
                          title: {
                            display: false
                          }
                        }
                      });
}

function minimiseTable() {
  if (headers.length > 0){ // Do nothing if no data
    div = document.getElementById('csvheadtable');

    if(div.style.overflow == 'hidden') {
      div.style.overflow = 'auto';
      div.style.height = '400px';
    } else {
      div.style.overflow = 'hidden';
      div.style.height = '60px';
      div.scrollTop = 0;
    }
  }

}

document.getElementById('file-input').addEventListener('change', readSingleFile, false);
