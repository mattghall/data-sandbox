let chart; // Store the Chart.js instance globally
let uploadedFiles = {}; // Store uploaded files and their metadata

// Load state from local storage
const loadState = () => {
    const savedState = JSON.parse(localStorage.getItem('uploadedFiles')) || {};
    uploadedFiles = savedState;
    renderFileList();
};

// Save state to local storage
const saveState = () => {
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
};

// Handle file upload
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

                    // Store the file data temporarily
                    uploadedFiles[file.name] = {
                        data: jsonData,
                        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
                        name: file.name
                    };

                    // Populate the modal with keys from the first object
                    populateKeySelectionModal(file.name, jsonData[0]);

                    // Show the modal
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
                        <input class="form-check-input" type="checkbox" value="${key}" id="dataKey-${key}">
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

    if (!timestampKey || dataKeys.length === 0) {
        alert('Please select a timestamp key and at least one data key.');
        return;
    }

    // Save the selected keys in the uploadedFiles object
    uploadedFiles[fileName].timestampKey = timestampKey;
    uploadedFiles[fileName].dataKeys = dataKeys;

    // Close the modal
    $('#keySelectionModal').modal('hide');

    // Save state and render the file list
    saveState();
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
                <input type="checkbox" class="form-check-input me-2" id="${fileName}" value="${fileName}" checked>
                <input type="text" class="form-control me-2" value="${file.name}" placeholder="Series Name">
                <input type="color" class="form-control-color me-2" value="${file.color}">
                <button class="btn btn-danger btn-sm">🗑️</button>
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
        listItem.find('button').on('click', () => {
            delete uploadedFiles[fileName];
            saveState();
            renderFileList();
            updateGraph();
        });

        fileListContainer.append(listItem);
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
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    ticks: {
                        autoSkip: true, // Automatically skip labels to avoid clutter
                        maxTicksLimit: 20, // Maximum number of labels to display
                        minRotation: 90, // Minimum rotation angle for labels
                    maxRotation: 90  // Maximum rotation angle for labels
                    },
                    grid: {
                        display: true,
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    });
};

// Event listeners for date selectors
$('#start-date, #end-date').on('change', updateGraph);

// Event listeners
$(document).ready(() => {
    $('#add-series').on('click', handleAddSeries);
    $('#saveKeysButton').on('click', saveSelectedKeys);

    // Load state on page load
    loadState();
});