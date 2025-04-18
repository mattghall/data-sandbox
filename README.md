# Data Sandbox

This project is a web-based tool for visualizing JSON data as graphs. It allows users to upload JSON files, customize series names, and dynamically update the graph.

## Features
- Upload JSON files and visualize data as a graph.
- Customize series names and save them in local storage.
- Select tick durations for the X-axis.
- Responsive design with a collapsible drawer for managing series.

## Technologies
- HTML, CSS, JavaScript
- Bootstrap 5
- jQuery
- Chart.js

## Project Structure

```
json-graph-webpage
├── src
│   ├── index.html       # Main HTML document
│   ├── script.js        # JavaScript for loading and graphing data
│   └── style.css        # CSS styles for the webpage
├── data
│   └── sample.json      # Sample JSON data for testing
└── README.md            # Project documentation
```

## How to Use
1. Clone the repository:
   ```bash
   git clone https://github.com/mattghall/data-sandbox.git
   ```
2. Open the `index.html` file in a web browser.

## Dependencies

This project uses a graphing library. Make sure to include the necessary library in your `index.html` file. For example, if using Chart.js, include the following in the `<head>` section:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

## Usage

- Place your JSON data in the `data/sample.json` file.
- Modify the `script.js` file to parse your JSON data and render the graph as needed.

## License

This project is open source and available under the MIT License.