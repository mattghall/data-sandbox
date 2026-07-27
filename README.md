# Data Sandbox

This repo powers `data.trailmatt.com`.

## Pages
- `index.html`: Landing page for linked tools.
- `chart.html`: JSON time-series charting tool.
- `hexagons.html`: Hexagon art builder.

## App code
- `src/jsonCharting.js`: Chart page behavior.
- `src/style.css`: Shared chart/billionaires-era styles still used by `chart.html`.

## Deployment
GitHub Actions deploys this repo to `s3://trailmatt-data` and invalidates CloudFront for `data.trailmatt.com`.

## License
MIT