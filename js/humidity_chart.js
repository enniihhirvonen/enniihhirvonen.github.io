// Load the Google Charts library, specifying the 'corechart' package which includes line charts.
google.charts.load('current', { 'packages': ['corechart'] });


// Load both displays once Google Charts is ready, then refresh them every 15 seconds.
google.charts.setOnLoadCallback(() => {
    drawHumidityChart();
    drawLatestHumidity();
    setInterval(() => {
        drawHumidityChart();
        drawLatestHumidity();
    }, 15000);
});

// Define the function that will fetch data and draw the chart.
function drawHumidityChart() {
    // Request the 24 most recent feed entries for the humidity chart.
    const url = "https://api.thingspeak.com/channels/3507707/feeds.json?api_key=0KW4J70JK3L8KODF&results=20";
    // Use the Fetch API to retrieve data from the ThingSpeak channel.
    fetch(url)
        // Convert the response to JSON format.
        .then(response => response.json())

        // Process the JSON data.
        .then(data => {
            // Extract the 'feeds' array which contains individual data entries.
            const feeds = data.feeds;

            // Initialize the chart data array with column headers.
            // Google Charts expects the first row to define the column names and types.
            const chartData = [['Time', 'Humidity']];

            // Loop through each feed entry to extract and format the data.
            feeds.forEach(feed => {
                // Convert the timestamp string to a JavaScript Date object.
                const time = new Date(feed.created_at);

                // Convert the humidity value from string to float.
                const humidity = parseFloat(feed.field2);

                // Only include valid humidity values (i.e., not NaN).
                if (!isNaN(humidity)) {
                    // Add a new row to the chart data: [timestamp, humidity].
                    chartData.push([time, humidity]);
                }
            });

            // Convert the array of data into a DataTable object required by Google Charts.
            const dataTable = google.visualization.arrayToDataTable(chartData);

            // Define chart options such as title, axis labels, curve style, and legend position.
            const options = {
                title: 'Humidity Over Time',
                curveType: 'function', // Smooths the line curve.
                legend: { position: 'bottom' },
                hAxis: {
                    title: 'Time',
                    format: 'HH:mm',
                    slantedText: true,
                    slantedTextAngle: 45
                }, // Horizontal axis label and time format.
                vAxis: { title: 'Humidity (%)' }, // Vertical axis label.
                pointSize: 5,
                chartArea: { left: 60, right: 20, width: '90%' },
            };

            // Create a new LineChart object and attach it to the HTML element with ID 'chart_div'.
            const chart = new google.visualization.LineChart(document.getElementById('chart_div2'));

            // Draw the chart using the prepared data and options.
            chart.draw(dataTable, options);
        })

        // Handle any errors that occur during the fetch or chart drawing process.
        .catch(error => {
            console.error("Error fetching or drawing chart:", error);
        });
}

function drawLatestHumidity() {
    // Request one feed entry to get the newest humidity measurement.
    const url = "https://api.thingspeak.com/channels/3507707/feeds.json?api_key=0KW4J70JK3L8KODF&results=1";
    // Find the page element where the latest humidity will be displayed.
    const display = document.getElementById('last-humidity');
    const notice = document.getElementById('humidity-notice');

    // Fetch the latest feed from ThingSpeak.
    fetch(url)
        .then(response => {
            // Treat HTTP errors as failed requests before parsing the response.
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            // Parse ThingSpeak's JSON response.
            return response.json();
        })
        .then(data => {
            // Use an empty array if the response contains no feed entries.
            const feeds = data.feeds || [];
            // Find the newest feed that contains a valid humidity value in field2.
            const latestFeed = [...feeds].reverse().find(feed => {
                return feed.field2 !== null && feed.field2 !== '' && Number.isFinite(Number(feed.field2));
            });

            // Show a helpful message when no valid humidity was returned.
            if (!latestFeed) {
                display.textContent = 'No humidity measurements available.';
                notice.textContent = '';
                return;
            }

            // Convert the humidity to a number for display.
            const humidity = Number(latestFeed.field2);

            // Display humidity; the shared measurement time appears below both readings.
            display.textContent = `Latest recorded humidity: ${humidity} %`;

            if (humidity < 40) {
                notice.textContent = `Warning: humidity is below 40 %.`;
            } else if (humidity > 80) {
                notice.textContent = `Warning: humidity is above 80 %.`;
            } else {
                notice.textContent = '';
            }
        })

        .catch(error => {
            // Log the error and show a message in the page if the request fails.
            console.error('Error fetching last measured data:', error);
            display.textContent = 'Unable to load the latest humidity.';
            notice.textContent = '';
        });
}
