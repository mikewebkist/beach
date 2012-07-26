$(document).ready(function() {
    var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var vpW = $(window).width();
    var vpH = $(window).height();
    if(vpW > 800) {
        $("#webkist-chart").width(vpH / 2 * 1.5);
        $("#webkist-chart").height(vpH / 2);
    } else {
        $("#webkist-chart").width(vpW - 10);
        $("#webkist-chart").height(vpW * 0.66);
    }

    if(window.location.hash.substr(0,1) == "#") $("#bouy").val(window.location.hash.substr(1));

    var c_to_f = function(c) { return c * 1.8 + 32.0; };
    var median = function(a) {
      var t = 0;
      for(var i=0; i<a.length; i++) t += a[i];
      return t / a.length
    };

    var update = function() {
        var bouy = $("#bouy").val();
        $.get(bouy + '.txt', function(data) {
            // alert('Load was performed.');
            // #YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
            // #yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
            // 2012 07 25 12 36  20 10.8 13.4    MM    MM    MM  MM     MM  26.2  25.2    MM   MM   MM    MM
            // 2012 07 25 12 30  20 10.8 12.9    MM    MM    MM  MM     MM  26.2  25.2    MM   MM   MM    MM
            var rows = data.split("\n").reverse();
            var dPast = new Date((new Date).getTime() - 7 * 24 * 60 * 60 * 1000);
            var today = (new Date).getDate();

            var maxDayAir = 0;
            var minDayAir = 150;
            var maxWeekAir = 0;
            var minWeekAir = 150;
            var maxDayWater = 0;
            var minDayWater = 150;
            var maxWeekWater = 0;
            var minWeekWater = 150;

            var lastHour;
            var data = [];
            var idx = 0;
            var waterSamples = [];
            var airSamples = [];
            var waterData = [];
            var airData = [];
            var ticks = [];
            var tickLabels = [];
            var currAir, currWater, currTime;

            for(var i=0; i<rows.length; i++) {
              if(rows[i].substr(0,1) == "#") continue;
              var cols = rows[i].split(/\s+/);
              var d=new Date(Date.UTC(cols[0], cols[1] - 1, cols[2], cols[3], cols[4]));
              if(d.getTime() < dPast.getTime()) continue;
              var WTMP, ATMP;

              if(!lastHour) lastHour = DOW[d.getDay()] + " " + d.getHours();
              var currHour = DOW[d.getDay()] + " " + d.getHours();
              if(currHour != lastHour) {
                  waterData.push([ idx, median(waterSamples) ]);
                  waterSamples = [];
                  airData.push([ idx, median(airSamples) ]);
                  airSamples = [];
                  lastHour = currHour;
                  tickLabels.push(lastHour);
                   if(lastHour.match(/ 0/)) {
                       ticks.push(tickLabels.length - 1);
                   }
                   idx++;
              }

              var niceHour;
              if(d.getHours() == 0) {
                  niceHour = "midnight";
              } else if(d.getHours() == 24) {
                  niceHour = "noon";
              } else if (d.getHours() <= 12) {
                  niceHour = d.getHours() + "AM";
              } else {
                  niceHour = d.getHours() - 12 + "PM";
              }

              currTime = DOW[d.getDay()] + " " + niceHour;

              if(cols[13] != "MM") {
                  ATMP = c_to_f(cols[13]);
                  airSamples.push(ATMP);
                  if(d.getDate() == today) {
                      if(ATMP > maxDayAir) maxDayAir = ATMP;
                      if(ATMP < minDayAir) minDayAir = ATMP;
                  }
                  if(ATMP > maxWeekAir) maxWeekAir = ATMP;
                  if(ATMP < minWeekAir) minWeekAir = ATMP;
                  currAir = ATMP;
              }

              if(cols[14] != "MM") {
                  WTMP = c_to_f(cols[14]);
                  waterSamples.push(WTMP);
                  if(d.getDate() == today) {
                      if(WTMP > maxDayWater) maxDayWater = WTMP;
                      if(WTMP < minDayWater) minDayWater = WTMP;
                  }

                  if(WTMP > maxWeekWater) maxWeekWater = WTMP;
                  if(WTMP < minWeekWater) minWeekWater = WTMP;
                  currWater = WTMP;
              }

            }

            var tickFmt = function(val, axis) {
                if(tickLabels[val]) {
                    return tickLabels[val].substring(0,3);
                } else {
                    return "";
                }
            };
            var chartMax = Math.ceil(maxWeekWater > maxWeekAir ? maxWeekWater : maxWeekAir);
            chartMax = chartMax - (chartMax % 5) + 5;
            var chartMin = Math.floor(minWeekAir < minWeekWater ? minWeekAir : minWeekWater);
            chartMin = chartMin - (chartMin % 5);

            $.plot($('#webkist-chart'), [ { data: waterData, color: 'rgb(0,0,255)' },
                    { data: airData, color: 'rgb(0,255,0)' } ], { yaxis: { max: chartMax, min: chartMin }, xaxis: { tickFormatter: tickFmt, ticks: ticks } });

            $('#webkist-max-day.air .text').html(maxDayAir.toFixed(1));
            $('#webkist-max-day.water .text').html(maxDayWater.toFixed(1));

            $('#webkist-min-day.air .text').html(minDayAir.toFixed(1));
            $('#webkist-min-day.water .text').html(minDayWater.toFixed(1));

            $('#webkist-max-week.air .text').html(maxWeekAir.toFixed(1));
            $('#webkist-max-week.water .text').html(maxWeekWater.toFixed(1));

            $('#webkist-min-week.air .text').html(minWeekAir.toFixed(1));
            $('#webkist-min-week.water .text').html(minWeekWater.toFixed(1));

            $('#webkist-current-label').html(currTime);
            $('#webkist-current.air .text').html(currAir.toFixed(1));
            $('#webkist-current.water .text').html(currWater.toFixed(1));
        });
    };
    update();
    $('#webkist-chart').click(function() { update(); });
    $('#bouy').change(function() {
            window.location.hash = "#" + $('#bouy').val();
            update();
        });
});
