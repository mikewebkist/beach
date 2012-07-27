$(document).ready(function() {
    var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var vpW = $(window).width();
    var vpH = $(window).height();
    var chH = vpH - $("#webkist-table").height() - $("#header").height() - 50;
    if(chH < 200) chH = 200;

    var chW = (vpW / chH > 2.0) ? chH * 2.0 - 20 : vpW - 20;

    $("#webkist-chart").height(chH);
    $("#webkist-chart").width(chW);

    if(window.location.hash.substr(0,1) == "#") $("#buoy").val(window.location.hash.substr(1));

    var c_to_f = function(c) { return c * 1.8 + 32.0; };
    var median = function(a) {
      var t = 0;
      for(var i=0; i<a.length; i++) t += a[i];
      return t / a.length
    };

    var update = function() {
        $("#webkist-chart").addClass("loading");
        $("#webkist-chart").removeClass("finished");
        var buoy = $("#buoy").val();
        $.get(buoy + '.txt', function(data) {
            // alert('Load was performed.');
            // #YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
            // #yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
            // 2012 07 25 12 36  20 10.8 13.4    MM    MM    MM  MM     MM  26.2  25.2    MM   MM   MM    MM
            // 2012 07 25 12 30  20 10.8 12.9    MM    MM    MM  MM     MM  26.2  25.2    MM   MM   MM    MM
            var rows = data.split("\n").reverse();

            var maxDayAir = 0;
            var minDayAir;
            var maxWeekAir = 0;
            var minWeekAir = 150;
            var maxDayWater = 0;
            var minDayWater;
            var maxWeekWater = 0;
            var minWeekWater = 150;

            var lastHour;
            var data = [];
            var waterData = [];
            var airData = [];
            var ticks = [];
            var currAir, currWater, currTime;

            var dPast = new Date((new Date).getTime() - 7 * 24 * 60 * 60 * 1000);
            var today = (new Date).getDate();
            var midnight = new Date(dPast.setHours(0));

            for(var i=0; i<8; i++) {
              ticks.push(midnight.getTime() + i * (24 * 60 * 60 * 1000));
            }

            for(var i=0; i<rows.length; i++) {
              if(rows[i].substr(0,1) == "#") continue;
              var cols = rows[i].split(/\s+/);
              var d=new Date(Date.UTC(cols[0], cols[1] - 1, cols[2], cols[3], cols[4]));
              if(d.getTime() < dPast.getTime()) continue;
              var WTMP, ATMP;

              if(!lastHour) lastHour = DOW[d.getDay()] + " " + d.getHours();

              var niceTime = d.toLocaleTimeString().substr(0, 5) + (d.getHours() >= 12 ? " pm" : " am");

              currTime = DOW[d.getDay()] + " " + niceTime;

              if(cols[13] != "MM") {
                  ATMP = c_to_f(cols[13]);
                  airData.push([ d.getTime(), ATMP ]);
                  if(d.getDate() == today) {
                      if(ATMP > maxDayAir) maxDayAir = ATMP;
                      if(!minDayAir || ATMP < minDayAir) minDayAir = ATMP;
                  }
                  if(ATMP > maxWeekAir) maxWeekAir = ATMP;
                  if(!minWeekAir || ATMP < minWeekAir) minWeekAir = ATMP;
                  currAir = ATMP;
              }

              if(cols[14] != "MM") {
                  WTMP = c_to_f(cols[14]);
                  waterData.push([ d.getTime(), WTMP ]);
                  if(d.getDate() == today) {
                      if(WTMP > maxDayWater) maxDayWater = WTMP;
                      if(!minDayWater || WTMP < minDayWater) minDayWater = WTMP;
                  }

                  if(WTMP > maxWeekWater) maxWeekWater = WTMP;
                  if(!minWeekWater || WTMP < minWeekWater) minWeekWater = WTMP;
                  currWater = WTMP;
              }

            }

            var tickFmt = function(val, axis) {
                return DOW[(new Date(val)).getDay()];
            };

            var chartMax = Math.ceil(maxWeekWater > maxWeekAir ? maxWeekWater : maxWeekAir);
            chartMax = chartMax - (chartMax % 5) + 5;
            var chartMin = Math.floor(minWeekAir < minWeekWater ? minWeekAir : minWeekWater);
            chartMin = chartMin - (chartMin % 5);

            $.plot($('#webkist-chart'), [ { data: airData, color: 'rgb(0,255,0)' }, { data: waterData, color: 'rgb(0,0,255)' } ],
                    { yaxis: { max: chartMax, min: chartMin }, xaxis: { tickFormatter: tickFmt, ticks: ticks } });

            $('#webkist-chart').addClass("finished");
            $('#webkist-chart').removeClass("loading");

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
    $('#buoy').change(function() {
            window.location.hash = "#" + $('#buoy').val();
            update();
        });
});
