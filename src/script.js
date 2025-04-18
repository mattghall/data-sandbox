let chart; // Store the Chart.js instance globally

const loadJSON = (file) => {
    return fetch(file)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
};

const renderGraph = (data) => {
    // Extract labels (timeUTC) and values
    const labels = data.map(entry => new Date(entry.timeUTC).toLocaleString());
    const values = data.map(entry => entry.value);

    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
        type: 'line', // Line chart for time-series data
        data: {
            labels: labels,
            datasets: [{
                label: 'GHG Spike Data',
                data: values,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (UTC)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    },
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
};

// Save uploaded JSON data, series name, and color in local storage
const saveFileToLocalStorage = (fileName, data, seriesName, color) => {
    const storedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || {};
    storedFiles[fileName] = { data, seriesName, color };
    localStorage.setItem('uploadedFiles', JSON.stringify(storedFiles));
};

// Load all saved files from local storage
const loadFilesFromLocalStorage = () => {
    return JSON.parse(localStorage.getItem('uploadedFiles')) || {};
};

// Delete a file from local storage
const deleteFileFromLocalStorage = (fileName) => {
    const storedFiles = loadFilesFromLocalStorage();
    delete storedFiles[fileName];
    localStorage.setItem('uploadedFiles', JSON.stringify(storedFiles));
    renderFileList(); // Refresh the file list
    updateGraph(); // Refresh the graph
};

// Render the list of saved files in the drawer
const renderFileList = () => {
    const fileListContainer = $('#file-list');
    fileListContainer.empty(); // Clear existing list

    const storedFiles = loadFilesFromLocalStorage();
    Object.keys(storedFiles).forEach(fileName => {
        const { seriesName, color } = storedFiles[fileName];

        const listItem = $(`
            <div class="list-group-item d-flex align-items-center">
                <input type="checkbox" class="form-check-input me-2" id="${fileName}" value="${fileName}" checked>
                <span class="me-2">${fileName}</span>
                <input type="text" class="form-control me-2" value="${seriesName || fileName}" placeholder="Series Name">
                <input type="color" class="form-control-color me-2" value="${color || '#000000'}">
                <button class="btn btn-danger btn-sm">🗑️</button>
            </div>
        `);

        // Checkbox change event
        listItem.find('input[type="checkbox"]').on('change', updateGraph);

        // Series name input blur event
        listItem.find('input[type="text"]').on('blur', function () {
            storedFiles[fileName].seriesName = $(this).val();
            localStorage.setItem('uploadedFiles', JSON.stringify(storedFiles));
            updateGraph(); // Refresh the graph with the updated series name
        });

        // Color picker change event
        listItem.find('input[type="color"]').on('input', function () {
            storedFiles[fileName].color = $(this).val();
            localStorage.setItem('uploadedFiles', JSON.stringify(storedFiles));
            updateGraph(); // Refresh the graph with the updated color
        });

        // Trash button click event
        listItem.find('button').on('click', () => {
            deleteFileFromLocalStorage(fileName);
        });

        fileListContainer.append(listItem);
    });
};

// Save the checkbox states in local storage
const saveCheckboxStates = () => {
    const checkboxStates = {};
    $('#file-list input[type="checkbox"]').each(function () {
        checkboxStates[$(this).val()] = $(this).is(':checked');
    });
    localStorage.setItem('checkboxStates', JSON.stringify(checkboxStates));
};

// Load the checkbox states from local storage
const loadCheckboxStates = () => {
    return JSON.parse(localStorage.getItem('checkboxStates')) || {};
};

// Update the graph based on selected checkboxe, and date range
const updateGraph = () => {
    const storedFiles = loadFilesFromLocalStorage();
    const selectedFiles = $('#file-list input[type="checkbox"]:checked').map(function () {
        return $(this).val();
    }).get();

    // Collect all unique timestamps (timeUTC) from the selected files
    const allLabels = new Set();
    const datasets = selectedFiles.map(fileName => {
        const { data, seriesName, color } = storedFiles[fileName];
        const labels = data.map(entry => new Date(entry.timeUTC).toISOString());
        const values = data.map(entry => entry.value);

        // Add labels (timestamps) to the Set to ensure uniqueness
        labels.forEach(label => allLabels.add(label));

        // Return the dataset with a mapping of labels to values
        return {
            label: seriesName || fileName,
            dataMap: labels.reduce((map, label, index) => {
                map[label] = values[index];
                return map;
            }, {}),
            backgroundColor: `${color}33`, // Transparent version of the color
            borderColor: color,
            borderWidth: 1
        };
    });

    // Convert the Set of labels to a sorted array
    const sortedLabels = Array.from(allLabels).sort((a, b) => new Date(a) - new Date(b));

    // Set default values for the date pickers
    if (sortedLabels.length > 0) {
        const minDate = new Date(sortedLabels[0]).toISOString().slice(0, 16); // Get the earliest date and time
        const maxDate = new Date(sortedLabels[sortedLabels.length - 1]).toISOString().slice(0, 16); // Get the latest date and time

        // Set the default values for the date pickers if they are not already set
        if (!$('#start-date').val()) {
            $('#start-date').val(minDate);
        }
        if (!$('#end-date').val()) {
            $('#end-date').val(maxDate);
        }
    }

    // Filter labels by date range
    const startDate = new Date($('#start-date').val());
    const endDate = new Date($('#end-date').val());
    const filteredLabels = sortedLabels.filter(label => {
        const date = new Date(label);
        return date >= startDate && date <= endDate;
    });

    // Align each dataset's values with the filtered labels
    const alignedDatasets = datasets.map(dataset => {
        const alignedData = filteredLabels.map(label => dataset.dataMap[label] || null);
        return {
            label: dataset.label,
            data: alignedData,
            backgroundColor: dataset.backgroundColor,
            borderColor: dataset.borderColor,
            borderWidth: dataset.borderWidth,
            pointRadius: $('#toggle-data-points').is(':checked') ? 3 : 0 // Toggle data point bubbles
        };
    });

    const ctx = document.getElementById('myChart').getContext('2d');

    // Destroy the existing chart instance if it exists
    if (chart) {
        chart.destroy();
    }

    // Create a new chart instance
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: filteredLabels.map(label => {
                const date = new Date(label);
                return date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            }), // Format the X-axis labels
            datasets: alignedDatasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (UTC)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    },
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
};

// Handle adding a new series
const handleAddSeries = () => {
    const fileInput = $('<input type="file" accept=".json">');
    fileInput.on('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const seriesName = prompt('Enter a name for the series:', file.name);
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    saveFileToLocalStorage(file.name, jsonData, seriesName, '#000000'); // Default color is black
                    renderFileList(); // Refresh the file list
                    updateGraph(); // Refresh the graph
                } catch (error) {
                    alert('Invalid JSON file. Please upload a valid JSON file.');
                }
            };
            reader.readAsText(file);
        }
    });
    fileInput.click(); // Trigger the file input dialog
};

// Toggle the drawer visibility
const toggleDrawer = () => {
    const drawer = document.getElementById('drawer');
    const toggleButton = document.getElementById('toggle-drawer');
    if (drawer.classList.contains('collapsed')) {
        drawer.classList.remove('collapsed');
        toggleButton.textContent = 'Hide Drawer';
    } else {
        drawer.classList.add('collapsed');
        toggleButton.textContent = 'Show Drawer';
    }
};

// Initialize the page
$(document).ready(() => {
    renderFileList(); // Render the list of saved files
    updateGraph(); // Automatically load the graph on page load

    // Add event listeners
    $('#add-series').on('click', handleAddSeries);
    $('#refresh-graph').on('click', updateGraph);
    $('#toggle-data-points').on('change', updateGraph);
    $('#start-date, #end-date').on('change', updateGraph);
});