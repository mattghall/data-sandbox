let chart; // Store the Chart.js instance globally
let uploadedFiles = {}; // Store uploaded files and their metadata

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
                    uploadedFiles[file.name] = { data: jsonData };

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

    // Populate the data keys dropdown
    const dataKeysSelect = $('#dataKeys');
    dataKeysSelect.empty();
    keys.forEach(key => {
        dataKeysSelect.append(`<option value="${key}">${key}</option>`);
    });

    // Save the file name in the modal for reference
    $('#keySelectionModal').data('fileName', fileName);
};

// Save the selected keys and update the file list
const saveSelectedKeys = () => {
    const fileName = $('#keySelectionModal').data('fileName');
    const timestampKey = $('#timestampKey').val();
    const dataKeys = $('#dataKeys').val();

    if (!timestampKey || dataKeys.length === 0) {
        alert('Please select a timestamp key and at least one data key.');
        return;
    }

    // Save the selected keys in the uploadedFiles object
    uploadedFiles[fileName].timestampKey = timestampKey;
    uploadedFiles[fileName].dataKeys = dataKeys;

    // Close the modal
    $('#keySelectionModal').modal('hide');

    // Render the file list
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
                <span class="me-2">${fileName}</span>
                <button class="btn btn-danger btn-sm">🗑️</button>
            </div>
        `);

        // Checkbox change event
        listItem.find('input[type="checkbox"]').on('change', updateGraph);

        // Trash button click event
        listItem.find('button').on('click', () => {
            delete uploadedFiles[fileName];
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
        const { data, timestampKey, dataKeys } = file;

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
                label: `${fileName} - ${dataKey}`,
                data: labels.map(label => {
                    const index = labels.indexOf(label);
                    return values[index] || null;
                }),
                borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
                backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.2)`,
                borderWidth: 1,
                pointRadius: 3
            });
        });
    });

    const sortedLabels = Array.from(allLabels).sort((a, b) => new Date(a) - new Date(b));

    const ctx = document.getElementById('myChart').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
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

// Event listeners
$(document).ready(() => {
    $('#add-series').on('click', handleAddSeries);
    $('#saveKeysButton').on('click', saveSelectedKeys);
});