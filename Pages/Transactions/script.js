Chart.defaults.global.hover.mode = 'nearest';
Chart.defaults.global.legend.display = false;
Chart.defaults.global.animation.duration = 0;
Chart.defaults.global.responsive = true;

var x = [], y = [], derived = {'pos': {'Uncategorised': [0]}, 'neg': {'Uncategorised': [0]}}, csum = [], data = [];
var indextosample = -1, indexofdescription = -1;
var headers = [], filename;
var linecolors = ["rgba(52,195,240,1)", // python Vega10 colormap
                  "#1f77b4",
                  "#ff7f0e",
                  "#2ca02c",
                  "#d62728",
                  "#9467bd",
                  "#8c564b",
                  "#e377c2",
                  "#7f7f7f",
                  "#bcbd22",
                  "#17becf"];
var categories = ['Cash withdrawal', 'Travel', 'Bills', 'Work', 'Leisure', 'Food', 'Drink', 'Gifts', 'Salary', 'Other income', 'Other'];
var catindex = 1, datacats = []; //catindex at 1 to avoid first row
var charts = {};


// Do initial page setup
var context = document.getElementById('cumulative').getContext('2d');
charts['cumulative'] = makeLinePlot(0,0,'Cumulative total',context);
context = document.getElementById('transactions').getContext('2d');
charts['transactions'] = makeLinePlot(0,0,'Transactions',context);

charts['pos'] = updateHistogramParams('pos');
charts['neg'] = updateHistogramParams('neg');

updateCategorySelect(categories);
resetCategory();

document.getElementById('file-input').addEventListener('change', readSingleFile, false);
document.getElementById('categoryInput').addEventListener('change', assignCategory, false);
document.getElementById('categoryInput').addEventListener('focus', resetCategory, false);

document.getElementById('transactionColumnInput').addEventListener('change', updateIndexToSample, false);
document.getElementById('descriptionColumnInput').addEventListener('change', updateIndexOfDescription, false);

// End initial page setup


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
  var indextosample = -1, indexofdescription = -1;
  data = contents.split(/\r\n|\n|\r/);
  headers = data[0].split(',');
  data.reverse();
  updateColumnSelects(headers);
  datacats = [];
  updateTransactionDescription(catindex);
  indextosample = updateTable(headers);
  if (indextosample > 0) {
    createPlots(indextosample);
  }
}

function createPlots(indextosample) {
  document.getElementById('filestatus').innerHTML =
    'Uploaded ' + filename + ', analysing column ' + headers[indextosample];

  // Reset everything
  derived = {'pos': {'Uncategorised': [0]}, 'neg': {'Uncategorised': [0]}}, csum = []

  csum[0] = 0;
  x[0] = 0;
  y[0] = data[0].split(',')[indextosample];

  for (i = 1; i < data.length-1; i++) {
    var items = data[i].split(',');
    x[i] = i;
    y[i] = Number(items[indextosample]);
    csum[i] = csum[i-1] + y[i];

    if(typeof datacats[i] === 'undefined') {
      histkey = 'Uncategorised';
      datacats[i] = 'Uncategorised';
    } else {
      histkey = datacats[i];
    }

    if (!(histkey in derived['pos'])) {
      derived['pos'][histkey] = [];
    }

    if (!(histkey in derived['neg'])) {
      derived['neg'][histkey] = [];
    }

    if (y[i] > 0) {
      derived['pos'][histkey].push(y[i]);
    } else {
      derived['neg'][histkey].push(y[i]);
    }

  }

  for (chart in charts) {
    charts[chart].destroy();
  }

  context = document.getElementById('cumulative').getContext('2d');
  charts['cumulative'] = makeLinePlot(x,csum,'Cumulative total',context);

  context = document.getElementById('transactions').getContext('2d');
  charts['transactions'] = makeLinePlot(x,y,'Transactions',context);

  charts['pos'] = updateHistogramParams('pos');
  charts['neg'] = updateHistogramParams('neg');
}

function updateTable(headers) {
  tdiv = document.getElementById('csvheadtable');
  nrows = 50;

  headerstr = '';
  for (i = 0; i < headers.length; i++) {
    if (headers[i] == 'Amount') {
      indextosample = i;
      headerstr += '<th>' + headers[i] + '</th>' + '\n';
    } else {
      headerstr += '<th>' + headers[i] + '</th>' + '\n';
    }
  }

  contentstr = [];
  for (i = 1; i < Math.min(nrows, data.length-1); i++) {// -1 to avoid headers row
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
  thisy = derived[identifier];
  if (identifier in charts) {
    console.log('Destroyed chart ' + identifier)
    charts[identifier].destroy();
    document.getElementById('hist'  + identifier + 'div').innerHTML = '';
    var canvas = document.createElement('canvas');
    div = document.getElementById('hist'  + identifier + 'div')
    canvas.id     = 'hist'  + identifier;
    div.appendChild(canvas)
  }
  context = document.getElementById('hist'  + identifier).getContext('2d')
  return updateHistogram(thisy,nbins,ylo,yhi,context);
}

function updateHistogram(y,nbins,ylo,yhi,context) {
  nbins = Number(nbins);
  bins = linspace(ylo-0.01, yhi+0.01, nbins+1);

  bardata = {}; hist = [];
  Object.keys(y).forEach(function(key,index) {
    hist = histogram(y[key], bins);
    bardata[key] = hist[1];
  });

  chart = makeBarPlot(hist[0], bardata, context);
  return chart;
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
                                maxTicksLimit: 20
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
  return chart;
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
      backgroundColor: linecolors[index % linecolors.length],
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
                                maxTicksLimit: 20
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
  return chart;
}

function minimiseTable() {
  if (headers.length > 0){ // Do nothing if no data
    div = document.getElementById('csvheadtable');

    if(div.style.overflow == 'hidden') {
      div.style.overflow = 'auto';
      div.style.height = '400px';
    } else {
      div.style.overflow = 'hidden';
      div.style.height = '0px';
      div.scrollTop = 0;
    }
  }

}

function updateCategorySelect(categories) {
  el = document.getElementById('categoryInput');
  for (i = 0; i < categories.length; i++) {
    el.innerHTML += '<option>' + categories[i] + '</option>';
  }
}


function assignCategory() {
  if (indexofdescription > -1) {
    category = document.getElementById('categoryInput').value;

    row = data[catindex];
    row = row.split(',');
    description = row[indexofdescription];
    description = description.split('  ')[0];
    console.log('Categorising ' + description + ' as ' + category)

    var totalchanged = 0;
    for (i = 1; i < data.length; i++){
      row = data[i];
      row = row.split(',');
      thisdescription = row[indexofdescription];
      thisdescription = thisdescription.split('  ')[0];
      if (thisdescription == description) {
        datacats[i] = category;
        totalchanged += 1;
      }
    }

    console.log('Updated ' + totalchanged + ' entries');

    catindex = datacats.indexOf('Uncategorised');
    console.log(catindex)
    if (catindex > -1) {
      updateTransactionDescription(catindex);
      createPlots(indextosample);
    } else {
      document.getElementById('transactionDescription').value = 'All transactions categorised.'
    }
  } else {
    alert('Select the correct description column first.')
  }
  resetCategory();
}

function updateTransactionDescription(catindex) {
  var el = document.getElementById('transactionDescription');
  if (indexofdescription > -1) {
    row = data[catindex];
    row = row.split(',');
    description = row[indexofdescription];
    el.value = description;
  } else {
    el.value = 'Select description column.'
  }
}

function resetCategory() {
  var catinput = document.getElementById('categoryInput');
  catinput.selectedIndex = -1;
  console.log('Reset category index')
}

function updateColumnSelects(headers) {
  var transselect = document.getElementById('transactionColumnInput');
  var descselect = document.getElementById('descriptionColumnInput');

  transselect.options.length = 0;
  descselect.options.length = 0;

  for (h in headers) {
    var opt = document.createElement('option');
    var opt2 = document.createElement('option');
    opt.value = headers[h]; opt.innerHTML = headers[h];
    opt2.value = headers[h]; opt2.innerHTML = headers[h];
    descselect.appendChild(opt);
    transselect.appendChild(opt2);
  }
}

function updateIndexToSample() {
  var transselect = document.getElementById('transactionColumnInput');
  indextosample = headers.indexOf(transselect.value);
  createPlots(indextosample);
}

function updateIndexOfDescription() {
  var descselect = document.getElementById('descriptionColumnInput');
  indexofdescription = headers.indexOf(descselect.value);
  updateTransactionDescription(catindex)
}
