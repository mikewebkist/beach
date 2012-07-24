$(document).ready(function() {
    var vpW = $(window).width();
    var vpH = $(window).height();
    if(vpW > 800) {
        $("#webkist-chart").width(vpH / 2 * 1.5);
        $("#webkist-chart").height(vpH / 2);
    } else {
        $("#webkist-chart").width(vpW - 10);
        $("#webkist-chart").height(vpW * 0.66);
    }

    var update = function() {
        $.getJSON("DUKN7.js", null, function(json) {
            var data = json.data;
            var summary = json.summary;
            // console.log(data);
            var waterMedian = new Array();
            var airMedian = new Array();
            var ticks = new Array();

            for(var i=0; i<data.length; i++) {
                // console.log(data[i].water.median);
                waterMedian.push([ i, data[i].water.median ]);
                airMedian.push([ i, data[i].air.median ]);
                if(data[i].hour.match(/12AM/)) ticks.push(i);
            }

            var tickFmt = function(val, axis) {
                if(data[val]) {
                    return data[val].hour.substring(0,3);
                } else {
                    return "";
                }
            };
            var chartMax = Math.ceil(summary.air.max_week > summary.water.max_week ? summary.air.max_week : summary.water.max_week);
            chartMax = chartMax - (chartMax % 5) + 5;
            var chartMin = Math.floor(summary.air.min_week < summary.water.min_week ? summary.air.min_week : summary.water.min_week);
            chartMin = chartMin - (chartMin % 5);

            $.plot($('#webkist-chart'), [ { data: waterMedian, color: 'rgb(0,0,255)' },
                    { data: airMedian, color: 'rgb(0,255,0)' } ], { yaxis: { max: chartMax, min: chartMin }, xaxis: { tickFormatter: tickFmt, ticks: ticks } });

            $('#webkist-max-day.air .text').html((summary.air.max_day).toFixed(1));
            $('#webkist-max-day.water .text').html((summary.water.max_day).toFixed(1));

            $('#webkist-min-day.air .text').html((summary.air.min_day).toFixed(1));
            $('#webkist-min-day.water .text').html((summary.water.min_day).toFixed(1));

            $('#webkist-max-week.air .text').html((summary.air.max_week).toFixed(1));
            $('#webkist-max-week.water .text').html((summary.water.max_week).toFixed(1));

            $('#webkist-min-week.air .text').html((summary.air.min_week).toFixed(1));
            $('#webkist-min-week.water .text').html((summary.water.min_week).toFixed(1));

            $('#webkist-current-label').html(summary.current_time);
            $('#webkist-current.air .text').html((summary.air.current).toFixed(1));
            $('#webkist-current.water .text').html((summary.water.current).toFixed(1));
        });
    };
    update();
    $('#webkist-chart').click(function() { update(); });
});
