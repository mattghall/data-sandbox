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

// Save uploaded JSON data and series name in local storage
const saveFileToLocalStorage = (fileName, data, seriesName) => {
    const storedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || {};
    storedFiles[fileName] = { data, seriesName };
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
        const { seriesName } = storedFiles[fileName];

        const listItem = $(`
            <div class="list-group-item d-flex align-items-center">
                <input type="checkbox" class="form-check-input me-2" id="${fileName}" value="${fileName}" checked>
                <span class="me-2">${fileName}</span>
                <input type="text" class="form-control me-2" value="${seriesName || fileName}" placeholder="Series Name">
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

        // Trash button click event
        listItem.find('button').on('click', () => {
            deleteFileFromLocalStorage(fileName);
        });

        fileListContainer.append(listItem);
    });
};

// Update the graph based on selected checkboxes and tick duration
const updateGraph = () => {
    const storedFiles = loadFilesFromLocalStorage();
    const selectedFiles = $('#file-list input[type="checkbox"]:checked').map(function () {
        return $(this).val();
    }).get();

    // Collect all unique timestamps (timeUTC) from the selected files
    const allLabels = new Set();
    const datasets = selectedFiles.map(fileName => {
        const data = storedFiles[fileName].data;
        const labels = data.map(entry => new Date(entry.timeUTC).toISOString());
        const values = data.map(entry => entry.value);

        // Add labels (timestamps) to the Set to ensure uniqueness
        labels.forEach(label => allLabels.add(label));

        // Return the dataset with a mapping of labels to values
        return {
            label: storedFiles[fileName].seriesName || fileName,
            dataMap: labels.reduce((map, label, index) => {
                map[label] = values[index];
                return map;
            }, {}),
            backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
                Math.random() * 255
            )}, ${Math.floor(Math.random() * 255)}, 0.2)`,
            borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
                Math.random() * 255
            )}, ${Math.floor(Math.random() * 255)}, 1)`,
            borderWidth: 1
        };
    });

    // Convert the Set of labels to a sorted array
    const sortedLabels = Array.from(allLabels).sort((a, b) => new Date(a) - new Date(b));

    // Align each dataset's values with the sorted labels
    const alignedDatasets = datasets.map(dataset => {
        const alignedData = sortedLabels.map(label => dataset.dataMap[label] || null);
        return {
            label: dataset.label,
            data: alignedData,
            backgroundColor: dataset.backgroundColor,
            borderColor: dataset.borderColor,
            borderWidth: dataset.borderWidth
        };
    });

    // Get the selected tick duration from the dropdown
    const tickDuration = parseInt(document.getElementById('tick-duration').value, 10);

    const ctx = document.getElementById('myChart').getContext('2d');

    // Destroy the existing chart instance if it exists
    if (chart) {
        chart.destroy();
    }

    // Create a new chart instance
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedLabels, // Use the sorted timestamps as the X-axis labels
            datasets: alignedDatasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (UTC)'
                    },
                    ticks: {
                        callback: function (value, index, ticks) {
                            const timestamp = new Date(sortedLabels[value]);
                            const minutes = timestamp.getMinutes();
                            const hours = timestamp.getHours();

                            // Show labels based on the selected tick duration
                            if ((hours * 60 + minutes) % tickDuration === 0) {
                                return timestamp.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                });
                            }
                            return ''; // Skip other labels
                        },
                        maxRotation: 45, // Rotate labels for better readability
                        minRotation: 0
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
                    saveFileToLocalStorage(file.name, jsonData, seriesName); // Save with series name
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

    // Add event listeners
    $('#add-series').on('click', handleAddSeries);
    $('#tick-duration').on('change', updateGraph);
    $('#refresh-graph').on('click', updateGraph);
});