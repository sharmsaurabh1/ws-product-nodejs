//-------------------------
// let daily_events;
let hourly_events;
const url = "http://localhost:5555/events/hourly";
fetch(url)
  .then(res => res.json())
  .then(res => {
    // hourly_events = res //all 168 results

    hourly_events = res;
    let eventsData = [];
    hourly_events.forEach(d => {
      let date = new Date(d.date);
      let array = {
        event_date: date,
        number_events: d.events,
        hour: d.hour
      };

      eventsData.push(array);
    });

    am4core.ready(function() {
      // Themes begin
      am4core.useTheme(am4themes_spiritedaway);
      // Themes end
      var data = eventsData;
      /*["Activity Date":"2019-04-07T06:23:49.000Z","Activity Name":"Lunch Ride","Activity Type":"Ride","Distance":16901.30078125,"Moving Time":4731},,
{"Events Date":"2019-04-08T09:02:50.000Z","Activity Name":"Afternoon Ride","Activity Type":"Ride","Events":10051.400390625,"Moving Time":2123}]
*/
      var weeklyData = [];
      var dailyData = [];

      var firstDay = new Date(data[0]["event_date"]);
      firstDay = am4core.time.round(firstDay, "year", 1);
      var total = 0;
      // PREPARE DATA
      function prepareDistanceData(data) {
        for (var i = 0; i < 7; i++) {
          dailyData.push({
            day: chart.dateFormatter.language.translate(
              chart.dateFormatter.weekdaysShort[i]
            )
          });
        }

        for (var i = 0; i < 53; i++) {
          weeklyData[i] = {};
          weeklyData[i].distance = 0;
          var date = new Date(firstDay);
          date.setDate(i * 7);
          am4core.time.round(date, "week", 1);
          var endDate = am4core.time.round(new Date(date), "week", 1);

          weeklyData[i].date = date;
          weeklyData[i].endDate = endDate;
        }

        am4core.array.each(data, function(di) {
          var date = new Date(di["event_date"]);
          var weekDay = date.getDay();
          var weekNumber = am4core.utils.getWeek(date);

          if (weekNumber == 1 && date.getMonth() == 11) {
            weekNumber = 53;
          }

          var distance = am4core.math.round(di["number_events"], 1);

          weeklyData[weekNumber - 1].distance += distance;
          weeklyData[weekNumber - 1].distance = am4core.math.round(
            weeklyData[weekNumber - 1].distance,
            1
          );
          total += distance;

          dailyData.push({
            date: date,
            day: chart.dateFormatter.language.translate(
              chart.dateFormatter.weekdaysShort[weekDay]
            ),
            distance: distance,
            title: di["hour"]
          });
        });
      }

      // CHART
      var chart = am4core.create("hourlydiv", am4charts.RadarChart);
      prepareDistanceData(data);

      chart.innerRadius = am4core.percent(15);
      chart.radius = am4core.percent(90);
      chart.data = weeklyData;
      chart.fontSize = "11px";
      chart.startAngle = 95;
      chart.endAngle = chart.startAngle + 350;

      // Create axes
      var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.baseInterval = { timeUnit: "week", count: 1 };
      dateAxis.renderer.innerRadius = am4core.percent(40);
      dateAxis.renderer.minGridDistance = 5;
      dateAxis.renderer.labels.template.relativeRotation = 0;
      dateAxis.renderer.labels.template.location = 0.5;
      dateAxis.renderer.labels.template.radius = am4core.percent(-57);
      dateAxis.renderer.labels.template.fontSize = "8px";
      dateAxis.dateFormats.setKey("week", "w");
      dateAxis.periodChangeDateFormats.setKey("week", "w");
      dateAxis.cursorTooltipEnabled = false;

      var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.renderer.inversed = true;
      valueAxis.renderer.radius = am4core.percent(40);
      valueAxis.renderer.minGridDistance = 15;
      valueAxis.renderer.minLabelPosition = 0.05;
      valueAxis.renderer.axisAngle = 90;
      valueAxis.cursorTooltipEnabled = false;
      valueAxis.renderer.labels.template.fill = am4core.color("#ce3750");

      // Create series
      var columnSeries = chart.series.push(new am4charts.RadarColumnSeries());
      columnSeries.dataFields.dateX = "date";
      columnSeries.dataFields.valueY = "distance";
      columnSeries.columns.template.strokeOpacity = 0;
      columnSeries.columns.template.width = am4core.percent(95);
      columnSeries.fill = am4core.color("#ce3750");
      columnSeries.fillOpacity = 0.6;
      columnSeries.tooltip.fontSize = 10;
      columnSeries.tooltip.pointerOrientation = "down";
      columnSeries.tooltip.background.fillOpacity = 0.5;
      columnSeries.columns.template.tooltipText =
        "[bold]{date} - {endDate}\n[font-size:13px]Total {valueY} events ";
      columnSeries.cursorTooltipEnabled = false;

      // weekday axis
      var weekDayAxis = chart.yAxes.push(new am4charts.CategoryAxis());
      weekDayAxis.dataFields.category = "day";
      weekDayAxis.data = dailyData;
      weekDayAxis.renderer.innerRadius = am4core.percent(50);
      weekDayAxis.renderer.minGridDistance = 10;
      weekDayAxis.renderer.grid.template.location = 0;
      weekDayAxis.renderer.line.disabled = true;
      weekDayAxis.renderer.axisAngle = 90;
      weekDayAxis.cursorTooltipEnabled = false;
      weekDayAxis.renderer.labels.template.fill = am4core.color("#ce3750");

      // bubble series
      var bubbleSeries = chart.series.push(new am4charts.RadarSeries());
      bubbleSeries.dataFields.dateX = "date";
      bubbleSeries.dataFields.categoryY = "day";
      bubbleSeries.dataFields.value = "distance";
      bubbleSeries.yAxis = weekDayAxis;
      bubbleSeries.data = dailyData;
      bubbleSeries.strokeOpacity = 0;
      bubbleSeries.maskBullets = false;
      bubbleSeries.cursorTooltipEnabled = false;
      bubbleSeries.tooltip.fontSize = 10;
      bubbleSeries.tooltip.pointerOrientation = "down";
      bubbleSeries.tooltip.background.fillOpacity = 0.4;

      var bubbleBullet = bubbleSeries.bullets.push(
        new am4charts.CircleBullet()
      );
      bubbleBullet.locationX = 0.5;
      bubbleBullet.stroke = am4core.color("#ce3750");
      bubbleBullet.fill = am4core.color("#ce3750");
      bubbleBullet.tooltipText =
        "[bold]{date}, {value} event\n[font-size:13px],{title} :00 hs";
      bubbleBullet.adapter.add("tooltipY", function(tooltipY, target) {
        return -target.circle.radius;
      });

      bubbleSeries.heatRules.push({
        target: bubbleBullet.circle,
        min: 2,
        max: 12,
        dataField: "value",
        property: "radius"
      });
      bubbleSeries.dataItems.template.locations.categoryY = 0.5;

      // add month ranges
      for (var i = 0; i < 13; i++) {
        var range = dateAxis.axisRanges.create();
        range.date = new Date(firstDay.getFullYear(), i, 0, 0, 0, 0);
        range.endDate = new Date(firstDay.getFullYear(), i + 1, 0, 0, 0, 0);
        if (i % 2) {
          range.axisFill.fillOpacity = 0.4;
        } else {
          range.axisFill.fillOpacity = 0.8;
        }
        range.axisFill.radius = -28;
        range.axisFill.adapter.add("innerRadius", function(
          innerRadius,
          target
        ) {
          return dateAxis.renderer.pixelRadius + 7;
        });
        range.axisFill.fill = am4core.color("#ce3750");
        range.axisFill.stroke = am4core.color("#bec0c2");
        range.grid.disabled = true;
        range.label.text = chart.dateFormatter.language.translate(
          chart.dateFormatter.months[i]
        );
        range.label.bent = true;
        range.label.radius = 10;
        range.label.fontSize = 10;
        range.label.paddingBottom = 5;
        range.label.interactionsEnabled = false;
        range.axisFill.interactionsEnabled = true;
        range.axisFill.cursorOverStyle = am4core.MouseCursorStyle.pointer;
        range.axisFill.events.on("hit", function(event) {
          if (dateAxis.start == 0 && dateAxis.end == 1) {
            dateAxis.zoomToDates(
              event.target.dataItem.date,
              event.target.dataItem.endDate
            );
          } else {
            dateAxis.zoom({ start: 0, end: 1 });
          }
        });
      }

      chart.cursor = new am4charts.RadarCursor();
      chart.cursor.innerRadius = am4core.percent(40);
      chart.cursor.lineY.disabled = true;

      var label = chart.radarContainer.createChild(am4core.Label);
      label.horizontalCenter = "middle";
      label.verticalCenter = "middle";
      label.fill = am4core.color("#ce3750");
      label.fontSize = 16;
      label.fontWeight = "bold";
      label.text = "WEEKLY\nTOTALS";

      var title = chart.createChild(am4core.Label);
      title.fill = am4core.color("#ce3750");
      title.fontSize = 20;
      title.isMeasured = false;
      title.valign = "top";
      title.align = "left";
      title.wrap = true;
      title.width = 200;
      title.text =
        "[bold]IN " +
        firstDay.getFullYear() +
        "\nTotal number of  " +
        Math.round(total) +
        " events happened.\n[font-size:11; #ce3750]Each circle represents a event.";
    });
  });
// end am4core.ready()