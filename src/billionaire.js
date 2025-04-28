let currentPage = 0;
const itemsPerPage = 5;
let secondsElapsed = 0;
const earningsData = [];

// Fetch data from the JSON file
async function fetchBillionairesData() {
    try {
        const response = await fetch('../data/billionaires.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch billionaires data:', error);
        return [];
    }
}

// Start and update the stopwatch
function startStopwatch() {
    const startTime = Date.now();

    // Update the stopwatch display every 10ms
    setInterval(() => {
        const elapsedTime = Date.now() - startTime;

        const days = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
        const seconds = Math.floor((elapsedTime / 1000) % 60);
        const milliseconds = elapsedTime % 1000;

        $("#stopwatch-days").text(days);
        $("#stopwatch-hours").text(hours.toString().padStart(2, "0"));
        $("#stopwatch-minutes").text(minutes.toString().padStart(2, "0"));
        $("#stopwatch-seconds").text(seconds.toString().padStart(2, "0"));
        $("#stopwatch-milliseconds").text(milliseconds.toString().padStart(3, "0"));
    }, 10);

    // Update the earnings display every 10ms
    setInterval(() => {
        secondsElapsed = (Date.now() - startTime) / 1000;
        updateEarnings();
    }, 10);
}

// Update billionaire earnings dynamically
function updateEarnings() {
    earningsData.forEach(({ element, moneyPerSecondLife }) => {
        const earnings = (moneyPerSecondLife * secondsElapsed).toFixed(2);
        element.text(`$${Number(earnings).toLocaleString()}`);
    });
}

// Load and display billionaire cards
async function loadBillionaires() {
    const data = await fetchBillionairesData();
    const list = $("#billionaires-list");
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;

    const currentData = data.slice(start, end);

    currentData.forEach((billionaire, index) => {
        const moneyPerSecondYear = (((billionaire.finalWorth - billionaire.estPreviousWorth) * 1000000) / (365 * 24 * 60 * 60)).toFixed(2);
        const moneyPerSecondLife = ((billionaire.finalWorth * 1000000) / (billionaire.age - 18) / (2040 * 60 * 60)).toFixed(2);

        const card = $(`
      <div class="billionaire-card">
        <div class="card-header">
          <div class="rank">${start + index + 1}</div>
          <img src="${billionaire.imageSrc}" alt="${billionaire.name}">
          <div class="billionaire-info">
            <h2>${billionaire.name}</h2>
            <p>Live earnings: <span class="earnings">$0.00</span></p>
          </div>
          <button class="details-toggle">
            <i data-feather="chevron-down"></i>
          </button>
        </div>
        <div class="details" style="display: none;">
          <p>Net Worth: $${billionaire.finalWorth.toLocaleString()}M</p>
          <p>Earnings Per Second this year: $${moneyPerSecondYear}</p>
          <p>Earnings Per Second Lifetime: $${moneyPerSecondLife}</p>
          <p>Source: ${billionaire.source}</p>
          <p>Age: ${billionaire.age}</p>
          <p>City: ${billionaire.city}, ${billionaire.state}</p>
          <p>Citizenship: ${billionaire.countryOfCitizenship}</p>
        </div>
      </div>
    `);

        list.append(card);

        // Add to earningsData
        const earningsElement = card.find(".earnings");
        earningsData.push({
            element: earningsElement,
            moneyPerSecondLife: parseFloat(moneyPerSecondLife),
        });
    });

    currentPage++;

    if (currentPage * itemsPerPage >= data.length) {
        $("#load-more").hide();
    }

    feather.replace(); // Re-render Feather icons
}

// Initialize the "Median American" entry
function initializeMedianAmerican() {
    const medianAmericanElement = $(".billionaire-card .earnings").first();
    const moneyPerSecondLife = parseFloat(medianAmericanElement.data("money-per-second-life"));

    earningsData.push({
        element: medianAmericanElement,
        moneyPerSecondLife: moneyPerSecondLife,
    });

    // Open the modal for editing
    $(document).on("click", "#addCustomButton", function () {
        const modal = new bootstrap.Modal($("#editMedianAmericanModal")[0]);
        $("#customName").val("Custom Entry");
        $("#hourlyRate").val("");
        $("#annualSalary").val("");
        $("#earningsPerSecond").val("");
        modal.show();
    });

    let typingTimer;
    const doneTypingInterval = 500


    // Handle input changes in the modal
    $("#hourlyRate, #annualSalary, #earningsPerSecond").on("input", formatCustomInputModule())

    $("input").on("focus", function () {
        $(this).select();
    }).on("focusout", formatCustomInputModule());


    // Save custom entry
    $("#saveCustom").on("click", function () {
        const name = $("#customName").val();
        const hourlyRate = parseFloat($("#hourlyRate").val().replace(/[$,]/g, "")) || 0;
        const annualSalary = parseFloat($("#annualSalary").val().replace(/[$,]/g, "")) || 0;
        const earningsPerSecond = parseFloat($("#earningsPerSecond").val().replace(/[$,]/g, "")) || 0;


        const modal = bootstrap.Modal.getInstance($("#editMedianAmericanModal")[0]);
        modal.hide();
        addCustomEntry(name, hourlyRate, annualSalary, earningsPerSecond);
    });

    // Delete an entry
    $(document).on("click", ".delete-entry", function () {
        const card = $(this).closest(".billionaire-card");
        const earningsElement = card.find(".earnings");

        const index = earningsData.findIndex((entry) => entry.element.is(earningsElement));
        if (index !== -1) earningsData.splice(index, 1);

        card.remove();
    });

    function formatCustomInputModule() {
        return function () {
            let hourlyRate = parseFloat($("#hourlyRate").val().replace(/[$,]/g, "")) || 0;
            let annualSalary = parseFloat($("#annualSalary").val().replace(/[$,]/g, "")) || 0;
            let earningsPerSecond = parseFloat($("#earningsPerSecond").val().replace(/[$,]/g, "")) || 0;

            // Recalculate related fields
            if (this.id === "hourlyRate") {
                annualSalary = hourlyRate * 40 * 52;
                earningsPerSecond = hourlyRate / 3600;
                $("#annualSalary").val(`$${annualSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                $("#earningsPerSecond").val(`$${earningsPerSecond.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`);
            } else if (this.id === "annualSalary") {
                hourlyRate = annualSalary / (40 * 52);
                earningsPerSecond = annualSalary / (365 * 24 * 60 * 60);
                $("#hourlyRate").val(`$${hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                $("#earningsPerSecond").val(`$${earningsPerSecond.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`);
            } else if (this.id === "earningsPerSecond") {
                hourlyRate = earningsPerSecond * 3600;
                annualSalary = earningsPerSecond * 365 * 24 * 60 * 60;
                $("#hourlyRate").val(`$${hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                $("#annualSalary").val(`$${annualSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            } else {
                $("#hourlyRate").val(`$${hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                $("#annualSalary").val(`$${annualSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                $("#earningsPerSecond").val(`$${earningsPerSecond.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`);
            }
        };
    }
}

// Initialize collapsible cards
function initializeCollapsibleCards() {
    $(document).on("click", ".details-toggle", function () {
        const details = $(this).closest(".billionaire-card").find(".details");
        details.slideToggle();

        const icon = $(this).find("i");
        icon.attr("data-feather", details.is(":visible") ? "chevron-up" : "chevron-down");
        feather.replace();
    });
}

function addCustomEntry(name, hourlyRate, annualSalary, earningsPerSecond) {
    const customCard = $(`
  <div class="billionaire-card">
    <div class="card-header">
      <div class="rank">
        <button class="btn btn-danger btn-sm delete-entry">X</button>
      </div>
      <img src="avatar.webp" alt="${name}">
      <div class="billionaire-info">
        <h2>${name}</h2>
        <p>Live earnings: <span class="earnings" data-money-per-second-life="${earningsPerSecond}">$0.00</span></p>
      </div>
      <button class="details-toggle">
        <i data-feather="chevron-down"></i>
      </button>
    </div>
    <div class="details" style="display: none;">
      <p>Hourly Rate: $${hourlyRate.toLocaleString()}</p>
      <p>Annual Salary: $${annualSalary.toLocaleString()}</p>
      <p>Earnings Per Second: $${earningsPerSecond.toFixed(5)}</p>
    </div>
  </div>
`);

    $("#billionaires-list").prepend(customCard);

    earningsData.unshift({
        element: customCard.find(".earnings"),
        moneyPerSecondLife: earningsPerSecond,
    });
    feather.replace();
}

// Initialize the app
$(document).ready(function () {
    startStopwatch();
    initializeMedianAmerican();
    loadBillionaires();
    addCustomEntry("Median American", 61984, 29.80, 0.00197);
    initializeCollapsibleCards();

    $("#load-more").on("click", loadBillionaires);
});