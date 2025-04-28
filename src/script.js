let chart; // Store the Chart.js instance globally
let uploadedFiles = {}; // Store uploaded files and their metadata

const loadState = () => {
    const metadata = JSON.parse(localStorage.getItem('uploadedFilesMetadata')) || {};
    for (const [key, value] of Object.entries(metadata)) {
        uploadedFiles[key] = { ...value };

        // Restore the actual data for small files
        if (value.saveToLocalStorage) {
            uploadedFiles[key].data = value.data;
        } else {
            uploadedFiles[key].data = []; // Large files will need to be re-uploaded
        }
    }
    renderFileList();
    updateGraph();
};

// Save state to local storage
const saveState = () => {
    const metadata = {};
    for (const [key, value] of Object.entries(uploadedFiles)) {
        metadata[key] = {
            timestampKey: value.timestampKey,
            dataKeys: value.dataKeys,
            color: value.color,
            name: value.name,
            timezone: value.timezone,
            saveToLocalStorage: value.saveToLocalStorage // Track if the file is saved
        };

        // Save the actual data for small files
        if (value.saveToLocalStorage) {
            metadata[key].data = value.data;
        }
    }
    localStorage.setItem('uploadedFilesMetadata', JSON.stringify(metadata));
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
                    if (!Array.isArray(jsonData) || jsonData.length === 0) {
                        alert('Invalid JSON file. Please upload a valid JSON array.');
                        return;
                    }

                    const fileSize = new Blob([JSON.stringify(jsonData)]).size;

                    // Store the file data in memory
                    uploadedFiles[file.name] = {
                        data: jsonData,
                        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`, // Random color
                        name: file.name,
                        saveToLocalStorage: fileSize <= MAX_LOCAL_STORAGE_SIZE // Flag for saving
                    };

                    // Show the key selection modal
                    populateKeySelectionModal(file.name, jsonData[0]);

                    // Show a message if the file is too large
                    if (fileSize > MAX_LOCAL_STORAGE_SIZE) {
                        $('#largeFileWarning').text(
                            'This file is too large to be saved. It will only be rendered on the graph.'
                        ).show();
                    } else {
                        $('#largeFileWarning').hide();
                    }

                    $('#keySelectionModal').modal('show');
                } catch (error) {
                    alert('Invalid JSON file. Please upload a valid JSON file.');
                }
            };
            reader.readAsText(file);
        }
    });
    fileInput.click(); // Trigger the file input dialog
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

    Object.keys(uploadedFiles).forEach(fileName => {
        const file = uploadedFiles[fileName];
        const listItem = $(`
            <div class="list-group-item d-flex align-items-center">
                <input type="checkbox" class="form-check-input me-3" id="${fileName}" value="${fileName}" checked>
                <input type="text" class="form-control me-3" value="${file.name}" placeholder="Series Name">
                <input type="color" class="form-control-color me-3" value="${file.color}">
                <button class="btn btn-light btn-sm me-3 timezone-btn" data-bs-toggle="tooltip" title="${file.timezone || 'UTC'}">
                    <i data-feather="clock"></i>
                </button>
                ${file.saveToLocalStorage ? '' : '<span class="badge bg-warning text-dark me-3">Not Saved</span>'}
                <button class="btn btn-danger btn-sm delete-btn" data-file="${fileName}">
                    <i data-feather="trash-2"></i>
                </button>
            </div>
        `);

        // Checkbox change event
        listItem.find('input[type="checkbox"]').on('change', updateGraph);

        // Name change event
        listItem.find('input[type="text"]').on('blur', function () {
            file.name = $(this).val();
            saveState();
            updateGraph();
        });

        // Color change event
        listItem.find('input[type="color"]').on('input', function () {
            file.color = $(this).val();
            saveState();
            updateGraph();
        });

        // Trash button click event
        listItem.find('.delete-btn').on('click', function () {
            const fileName = $(this).data('file');
            delete uploadedFiles[fileName];
            saveState();
            renderFileList();
            updateGraph();
        });

        fileListContainer.append(listItem);
    });

    // Re-render Feather icons
    feather.replace();

    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });

    updateGraph();
};

// Update the graph
const updateGraph = () => {
    const selectedFiles = $('#file-list input[type="checkbox"]:checked').map(function () {
        return $(this).val();
    }).get();

    const allLabels = new Set();
    const datasets = [];

    selectedFiles.forEach(fileName => {
        const file = uploadedFiles[fileName];
        const { data, timestampKey, dataKeys, color, name } = file;

        if (!timestampKey || !dataKeys) {
            console.error(`Missing keys for file: ${fileName}`);
            return;
        }

        // Map the labels (timestamps)
        const labels = data.map(entry => new Date(entry[timestampKey]).toISOString());
        labels.forEach(label => allLabels.add(label));

        // Create a dataset for each data key
        dataKeys.forEach(dataKey => {
            const values = data.map(entry => entry[dataKey]);

            datasets.push({
                label: `${name} - ${dataKey}`,
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
});