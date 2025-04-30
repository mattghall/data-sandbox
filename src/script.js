let chart; // Store the Chart.js instance globally
let uploadedSeries = {}; // Store individual series and their metadata

// Load state from localStorage
const loadState = () => {
    const metadata = JSON.parse(localStorage.getItem('uploadedSeriesMetadata')) || {};
    for (const [key, value] of Object.entries(metadata)) {
        uploadedSeries[key] = { ...value };

        // Restore the actual data for small series
        if (value.saveToLocalStorage) {
            uploadedSeries[key].data = value.data;
        } else {
            uploadedSeries[key].data = []; // Large series will need to be re-uploaded
        }
    }
    renderFileList();
    updateGraph();
};

// Save state to localStorage
const saveState = () => {
    const metadata = {};
    for (const [key, value] of Object.entries(uploadedSeries)) {
        metadata[key] = {
            timestampKey: value.timestampKey,
            dataKey: value.dataKey,
            color: value.color,
            name: value.name,
            timezone: value.timezone,
            saveToLocalStorage: value.saveToLocalStorage // Track if the series is saved
        };

        // Save the actual data for small series
        if (value.saveToLocalStorage) {
            metadata[key].data = value.data;
        }
    }
    localStorage.setItem('uploadedSeriesMetadata', JSON.stringify(metadata));
};

// Handle file upload
const MAX_LOCAL_STORAGE_SIZE = 5000000; // Approx. 5MB limit for localStorage

const handleAddSeries = () => {
    const fileInput = $('<input type="file" accept=".json">');
    fileInput.on('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    if (Array.isArray(jsonData) && jsonData.length !== 0) {
                        addArrayOfJsonSeries(jsonData, file);
                    } else if (Object.keys(jsonData).length > 0) {
                        // If the JSON is an object, convert it to an array
                        const transformedData = transformData(jsonData);
                        addArrayOfJsonSeries(transformedData, file);
                    } else {
                        alert('Invalid JSON format. Please upload a valid JSON file.');
                    }

                } catch (error) {
                    alert('Invalid JSON file. Please upload a valid JSON file.');
                }
            };
            reader.readAsText(file);
        }
    });
    fileInput.click(); // Trigger the file input dialog
};

// Handle adding series from a file
const addArrayOfJsonSeries = (jsonData, file) => {
    const fileSize = new Blob([JSON.stringify(jsonData)]).size;

    // Create a series for each key in the JSON data
    const keys = Object.keys(jsonData[0]);
    keys.forEach((key) => {
        if (key !== 'timestamp') {
            const seriesId = `${file.name}-${key}`;
            uploadedSeries[seriesId] = {
                data: jsonData.map(entry => ({
                    timestamp: entry.timestamp,
                    value: entry[key]
                })),
                color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`, // Random color
                name: `${file.name} - ${key}`,
                timestampKey: 'timestamp',
                dataKey: key,
                saveToLocalStorage: fileSize <= MAX_LOCAL_STORAGE_SIZE // Flag for saving
            };
        }
    });

    // Show a message if the file is too large
    if (fileSize > MAX_LOCAL_STORAGE_SIZE) {
        $('#largeFileWarning').text(
            'This file is too large to be saved. It will only be rendered on the graph.'
        ).show();
    } else {
        $('#largeFileWarning').hide();
    }

    saveState();
    renderFileList();
    updateGraph();
}

// Function to transform the data into the standard format
const transformData = (data) => {
    const keys = Object.keys(data);
    const timestamps = data[keys[0]].map(entry => entry[0]); // Extract timestamps from the first key
    const transformed = timestamps.map((timestamp, index) => {
        const transformedEntry = { timestamp: new Date(timestamp).toISOString() };

        keys.forEach(key => {
            if (Array.isArray(data[key][index])) {
                // Handle standard time/value pairs, check for null values
                const value = data[key][index][1];
                transformedEntry[key] = value !== null ? value.toString() : null;
            } else if (typeof data[key][index] === 'object' && data[key][index]?.stats) {
                // Handle "stats" property as a time/value pair array, check for null values
                const statsEntry = data[key][index].stats[index];
                if (statsEntry && statsEntry[1] !== null) {
                    transformedEntry[`stats`] = statsEntry[1].toString();
                } else {
                    transformedEntry[`stats`] = null;
                }
            }
        });

        return transformedEntry;
    });
    return transformed;
};

// Populate the key selection modal
const populateKeySelectionModal = (fileName, firstObject) => {
    const keys = Object.keys(firstObject);

    // Populate the timestamp key dropdown
    const timestampKeySelect = $('#timestampKey');
    timestampKeySelect.empty();
    keys.forEach(key => {
        timestampKeySelect.append(`<option value="${key}">${key}</option>`);
    });

    // Populate the data keys checkboxes
    const dataKeysContainer = $('#dataKeysContainer'); // Use a container for checkboxes
    dataKeysContainer.empty();

    // When the timestamp key changes, update the data keys list
    timestampKeySelect.on('change', function () {
        const selectedTimestampKey = $(this).val();
        dataKeysContainer.empty();
        keys.forEach(key => {
            if (key !== selectedTimestampKey) {
                dataKeysContainer.append(`
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${key}" id="dataKey-${key}" checked>
                        <label class="form-check-label" for="dataKey-${key}">${key}</label>
                    </div>
                `);
            }
        });
    });

    // Trigger the change event to initialize the data keys list
    timestampKeySelect.trigger('change');

    // Save the file name in the modal for reference
    $('#keySelectionModal').data('fileName', fileName);
};

// Save the selected keys and update the file list
const saveSelectedKeys = () => {
    const fileName = $('#keySelectionModal').data('fileName');
    const timestampKey = $('#timestampKey').val();
    const dataKeys = $('#dataKeysContainer input[type="checkbox"]:checked').map(function () {
        return $(this).val();
    }).get();
    const sourceTimezone = $('#timezoneSelect').val();


    if (!timestampKey || dataKeys.length === 0) {
        alert('Please select a timestamp key and at least one data key.');
        return;
    }

    // Update the metadata
    uploadedFiles[fileName].timestampKey = timestampKey;
    uploadedFiles[fileName].dataKeys = dataKeys;
    uploadedFiles[fileName].timezone = sourceTimezone;

    // Convert timestamps to the selected timezone
    const fileData = uploadedFiles[fileName].data;
    fileData.forEach(entry => {
        const originalTimestamp = entry[timestampKey];
        const convertedTimestamp = luxon.DateTime.fromISO(originalTimestamp, { zone: sourceTimezone })
            .setZone('UTC')
            .toISO();
        entry[timestampKey] = convertedTimestamp; // Update the timestamp in the selected timezone
    });

    // Save to localStorage only if the file is small enough
    if (uploadedFiles[fileName].saveToLocalStorage) {
        saveState();
    }

    $('#keySelectionModal').modal('hide');
    renderFileList();
};

// Render the file list
const renderFileList = () => {
    const fileListContainer = $('#file-list');
    fileListContainer.empty();

    Object.keys(uploadedSeries).forEach(seriesId => {
        const series = uploadedSeries[seriesId];
        const listItem = $(`
            <div class="list-group-item d-flex align-items-center">
                <input type="checkbox" class="form-check-input me-3" id="${seriesId}" value="${seriesId}" checked>
                <input type="text" class="form-control me-3" value="${series.name}" placeholder="Series Name">
                <input type="color" class="form-control-color me-3" value="${series.color}">
                ${series.saveToLocalStorage ? '' : '<span class="badge bg-warning text-dark me-3">Not Saved</span>'}
                <button class="btn btn-danger btn-sm delete-btn" data-series="${seriesId}">
                    <i data-feather="trash-2"></i>
                </button>
            </div>
        `);

        // Checkbox change event
        listItem.find('input[type="checkbox"]').on('change', updateGraph);

        // Name change event
        listItem.find('input[type="text"]').on('blur', function () {
            series.name = $(this).val();
            saveState();
            updateGraph();
        });

        // Color change event
        listItem.find('input[type="color"]').on('input', function () {
            series.color = $(this).val();
            saveState();
            updateGraph();
        });

        // Trash button click event
        listItem.find('.delete-btn').on('click', function () {
            const seriesId = $(this).data('series');
            delete uploadedSeries[seriesId];
            saveState();
            renderFileList();
            updateGraph();
        });

        fileListContainer.append(listItem);
    });

    // Re-render Feather icons
    feather.replace();
};

// Update the graph
const updateGraph = () => {
    const selectedSeries = $('#file-list input[type="checkbox"]:checked').map(function () {
        return $(this).val();
    }).get();

    const allLabels = new Set();
    const datasets = [];

    selectedSeries.forEach(seriesId => {
        const series = uploadedSeries[seriesId];
        const { data, timestampKey, dataKey, color, name } = series;

        // Map the labels (timestamps)
        const labels = data.map(entry => new Date(entry[timestampKey]).toISOString());
        labels.forEach(label => allLabels.add(label));

        // Create a dataset for the series
        const values = data.map(entry => entry.value);

        datasets.push({
            label: name,
            dataMap: labels.reduce((map, label, idx) => {
                map[label] = values[idx];
                return map;
            }, {}),
            backgroundColor: `${color}33`,
            borderColor: color,
            borderWidth: 1,
            pointRadius: 3
        });
    });

    const sortedLabels = Array.from(allLabels).sort((a, b) => new Date(a) - new Date(b));

    // Auto-fill the date selectors
    if (sortedLabels.length > 0) {
        const minDate = new Date(sortedLabels[0]).toISOString().slice(0, 16); // Get the earliest date
        const maxDate = new Date(sortedLabels[sortedLabels.length - 1]).toISOString().slice(0, 16); // Get the latest date

        if (!$('#start-date').val()) {
            $('#start-date').val(minDate);
        }
        if (!$('#end-date').val()) {
            $('#end-date').val(maxDate);
        }
    }

    // Filter the data based on the selected date range
    const startDate = new Date($('#start-date').val());
    const endDate = new Date($('#end-date').val());
    const filteredLabels = sortedLabels.filter(label => {
        const date = new Date(label);
        return date >= startDate && date <= endDate;
    });

    const alignedDatasets = datasets.map(dataset => {
        const alignedData = filteredLabels.map(label => dataset.dataMap[label] || null);
        return {
            label: dataset.label,
            data: alignedData,
            backgroundColor: dataset.backgroundColor,
            borderColor: dataset.borderColor,
            borderWidth: dataset.borderWidth,
            pointRadius: dataset.pointRadius
        };
    });

    const ctx = document.getElementById('myChart').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: filteredLabels,
            datasets: alignedDatasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time', // Use the time scale
                    time: {
                        tooltipFormat: 'MMM dd, yyyy HH:mm', // Format for tooltips
                        displayFormats: {
                            millisecond: 'HH:mm:ss.SSS',
                            second: 'HH:mm:ss',
                            minute: 'HH:mm',
                            hour: 'HH:mm',
                            day: 'MMM dd', // Show the date on day changes
                            week: 'MMM dd',
                            month: 'MMM yyyy',
                            quarter: '[Q]Q - yyyy',
                            year: 'yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time UTCs'
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10 // Adjust the number of labels shown
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        pinch: {
                            enabled: true
                        },
                        wheel: {
                            enabled: true
                        },
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(97, 237, 16, .2)'
                        },
                        mode: 'x',
                    }
                }
            }
        }
    });
};

// Function to round a color to the nearest web-safe color
const roundToWebSafeColor = (hexColor) => {
    // Convert the hex color to RGB components
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Helper function to round to the nearest multiple of 51
    const roundToWebSafe = (value) => Math.round(value / 51) * 51;

    // Round each component to the nearest web-safe value
    const webSafeR = roundToWebSafe(r);
    const webSafeG = roundToWebSafe(g);
    const webSafeB = roundToWebSafe(b);

    // Convert the rounded RGB components back to a hex color
    return `#${webSafeR.toString(16).padStart(2, '0')}${webSafeG.toString(16).padStart(2, '0')}${webSafeB.toString(16).padStart(2, '0')}`;
};

$('#colorPicker').on('input', function () {
    const selectedColor = $(this).val(); // Get the selected color
    const webSafeColor = roundToWebSafeColor(selectedColor); // Round to web-safe color
    $(this).val(webSafeColor); // Update the color picker with the web-safe color
    console.log(`Selected color: ${selectedColor}, Web-safe color: ${webSafeColor}`);
});

// Event listeners for date selectors
$('#start-date, #end-date').on('change', updateGraph);

// Event listeners
$(document).ready(() => {
    $('#add-series').on('click', handleAddSeries);
    $('#saveKeysButton').on('click', saveSelectedKeys);
    $('#resetZoom').on('click', function () {
        chart.resetZoom();
    });
    // Load state on page load
    loadState();
    $('#toggle-menu').on('click', function () {
        if( $("#drawer").hasClass("col-md-5")) {
            $("#drawer").removeClass("col-md-5");
            $("#drawer").addClass("col-md-1");
        } else {
            $("#drawer").addClass("col-md-5");
            $("#drawer").removeClass("col-md-1");

        }
       
    });
});