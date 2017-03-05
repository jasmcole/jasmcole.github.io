Chart.defaults.global.hover.mode = 'nearest';
Chart.defaults.global.legend.display = false;

var x = [], y = [], derived = {'ypos': 0, 'yneg': 0}, csum = [];

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
    displayContents(contents);
  };
  reader.readAsText(file);
}

function linspace(a,b,n) {
  dx = (b - a)/(n - 1);
  var ret = [];
  for(i=0;i<n;i++) {
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
  var data = contents.split(/\r\n|\n/);
  data.reverse();
  data = data.slice(300, data.length);


  csum[0] = 0;
  x[0] = 0;
  y[0] = data[0].split(',')[3];
  derived['ypos'] = [];
  derived['yneg'] = [];

  for (i = 1; i < data.length-1; i++) {
    var items = data[i].split(',');
    x[i] = i;
    y[i] = Number(items[3]);
    csum[i] = csum[i-1] + y[i];

    if (y[i] > 0) {
      derived['ypos'].push(y[i]);
    } else {
      derived['yneg'].push(y[i]);
    }

  }

  context = document.getElementById('cumulative').getContext('2d');
  makeLinePlot(x,csum,'Cumulative total',context);

  context = document.getElementById('transactions').getContext('2d');
  makeLinePlot(x,y,'Transactions',context);

  updateHistogramParams('pos');
  updateHistogramParams('neg');

}

function updateHistogramParams(identifier) {
  nbins = Number(document.getElementById("nbins" + identifier).value);
  ylo   = Number(document.getElementById("lower" + identifier).value);
  yhi   = Number(document.getElementById("upper" + identifier).value);
  context      = document.getElementById('hist'  + identifier).getContext('2d')
  thisy = derived['y' + identifier];
  console.log('Updating ' + identifier);
  console.log('Nbins ' + nbins);
  console.log('ylo ' + ylo);
  console.log('yhi ' + yhi);
  updateHistogram(thisy,nbins,ylo,yhi,context);
}

function updateHistogram(y,nbins,ylo,yhi,context) {
  nbins = Number(nbins);
  bins = linspace(ylo-0.01, yhi+0.01, nbins+1);
  histpos = histogram(y, bins);
  makeBarPlot(histpos[0],histpos[1],'',context);
}

function makeLinePlot(x,y,label,context) {
  var linedata = {datasets: [
                      {
                        data: y,
                        label: label,
                        fill: false,
                        lineTension: 0,
                        borderColor: "rgba(75,92,192,1)",
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

function makeBarPlot(x,y,label,context) {

  for (i = 0; i < x.length; i++) {
    x[i] = Math.round(x[i]*10)/10;
  }

  var linedata = {datasets: [
                      {
                        data: y,
                        labels: x,
                        fill: false,
                        lineTension: 0,
                        backgroundColor: "rgba(75,92,192,1)",
                        pointRadius: 0
                      }
                    ],
                  labels: x};



  var chart = new Chart(context , {
                        type: "bar",
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
                                labelString: "Transaction amount /" + "\u00A3"
                              },
                              }],
                            yAxes: [{
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

document.getElementById('file-input').addEventListener('change', readSingleFile, false);
