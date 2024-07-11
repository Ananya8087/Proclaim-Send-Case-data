// contentScript.js

// Function to extract data from each row
function extractRowData(row) {
    console.debug('Extracting data from row:', row);

    // Extract the case ID
    const caseIdElement = row.querySelector('div:nth-child(1) > div:nth-child(1)');
    const caseId = caseIdElement ? caseIdElement.textContent.trim() : 'N/A';
    console.debug('Case ID:', caseId);

    // Extract the bill number

    let billNumberElement = row.querySelector('div:nth-child(2)');
    let billNumber = billNumberElement ? billNumberElement.textContent.trim() : 'N/A';
    
    if (billNumber === '') {
        billNumberElement = caseIdElement ? caseIdElement.nextElementSibling : null;
        billNumber = billNumberElement ? billNumberElement.textContent.trim() : 'N/A';
    }

    console.debug('Bill Number:', billNumber);

    // Extract other data
    const otherData = {
        hospital: row.querySelector('div.text-truncate').textContent.trim(),
        duration: row.querySelector('div:nth-child(6)').textContent.trim()
        // Add more fields as needed
    };
    console.debug('Other Data:', otherData);
    console.debug('Bill Number:', billNumber);

    return { caseId, billNumber, ...otherData };
    
}

// Function to capture data of a specific row and store in local storage
// Function to capture data of a specific row and store in local storage
function captureRowData(button) {
    const row = button.closest('.row-grid.summary-landing-widths.landing-grid--list');
    if (row) {
        console.log('Row identified for the clicked button:', row);
        const rowData = extractRowData(row);
        console.debug('Captured row data on button click:', rowData);

        // Send captured data to background script
        chrome.runtime.sendMessage({ action: 'captureData', data: rowData }, response => {
            console.debug('Message sent to background script. Response:', response);
        });

        // Store captured data in local storage
        chrome.storage.local.set({ 'lastCapturedRow': rowData }, () => {
            console.log('Row data saved to local storage:', rowData);
        });
    } else {
        console.error('Row not found for the clicked button');
    }
}


// Function to add click detection to "Tabulate" buttons
function addClickDetection() {
    const container = document.querySelector('.summary--landing-list');
    if (!container) {
        console.error('Container not found for click detection');
        // Retrieve and print saved data from local storage
        chrome.storage.local.get(null, (result) => {
            console.log('Saved data from local storage:', result);
        });

        return;
    
        
        
    }
    

    const buttons = container.querySelectorAll('.btn.btn-primary.width-100px');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Clicked Tabulate button:', button);
            console.log('clicked');
            captureRowData(button);
            console.log('clicked n selected');
        });
    });
}

// Function to continuously check for the container and rows every 3 seconds
function setupPatientDetailsButton() {
    setInterval(() => {
        const rowData = captureAllRowsData();
        if (rowData.length > 0) {
            // Send captured data to background script
            chrome.runtime.sendMessage({ action: 'captureData', data: rowData }, response => {
                console.debug('Message sent to background script. Response:', response);
            });
        }
        addClickDetection();
        printAllRowsData(); // Add click detection for buttons
    }, 500);
}

// Function to capture all rows data within the specified container
function captureAllRowsData() {
    console.debug('Capturing all rows data...');

    const container = document.querySelector('.summary--landing-list');
    console.log("container", container);
    if (!container) {
        console.error('Container not found');
        return [];
    }

    const rows = container.querySelectorAll('.row-grid.summary-landing-widths.landing-grid--list');
    console.debug('Found rows:', rows.length, rows);
    if (rows.length > 0) {
        console.log("found");
    } else {
        console.log("nothing");
    }

    const rowData = Array.from(rows).map(row => {
        try {
            return extractRowData(row);
        } catch (e) {
            console.error('Error extracting data from row:', row, e);
            return null;
        }
    }).filter(data => data !== null);

    console.debug('Captured row data:', rowData);
    return rowData;
}

// Start checking for the container and rows
setupPatientDetailsButton();

// Function to print all rows data to console
function printAllRowsData() {
    const rowData = captureAllRowsData();
    console.log('All rows data:', rowData);
}


// Dynamically create a button on the webpage for sending data
const sendbutton = document.createElement('button');
sendbutton.id = 'sendbuttonid';
sendbutton.textContent = 'Send Data';
sendbutton.style.position = 'fixed';
sendbutton.style.bottom = '10px';
sendbutton.style.right = '12px';
sendbutton.style.padding = '5px';
sendbutton.style.zIndex = '1000';
sendbutton.disabled = false; // Initially enabled
document.body.appendChild(sendbutton);



// Function to fetch existing case IDs from Google Sheets
function fetchExistingCaseIds(callback) {
    fetch('https://script.google.com/macros/s/AKfycbzoIIbKi-9C4zJwjoKXg8pJ9p5pk1pWpH1p0xGox3Zm45C0xBwccJlqhxp8S3dk4uexBg/exec')
        .then(response => response.json())
        .then(allData => {
            console.log('Existing case IDs:', allData.caseIds);
            callback(allData.caseIds);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            callback([]);
        });
}

// Function to extract data and send to Google Sheets
function extractData() {
    // Disable the button permanently
    sendbutton.disabled = true;
    sendbutton.textContent = 'Sending...';

    // Retrieve the last captured row data from local storage
    chrome.storage.local.get('lastCapturedRow', (result) => {
        const rowData = result.lastCapturedRow;
        if (rowData) {
            console.log('Last captured row data:', rowData);

            // Extract data from the page
            const caseIdElement = document.querySelector('div.new-page-nav > ul > li:nth-child(4) > strong');
            const claimedAmountElement = document.querySelector('div.text-right span');
            let billAmountElement = document.querySelector('div.text-right.text-truncate[ngbtooltip="Total bill"] > span');
            let nmeAmountElement = document.querySelector('div.text-right.text-truncate[ngbtooltip="Total NME"] > span');
            let discountElement = document.querySelector('div.text-right.text-truncate[ngbtooltip="Total disc."] > span');

            if (caseIdElement && claimedAmountElement && billAmountElement && nmeAmountElement && discountElement) {
                let data = {
                    outerCaseId: rowData.caseId, // Add outer case ID
                    billNumber: rowData.billNumber, // Add bill number from row data
                    //hospital: rowData.hospital, // Add hospital from row data
                    //duration: rowData.duration, // Add duration from row data
                    caseId: caseIdElement.innerText.split(": ")[1].trim(),
                    claimedAmount: claimedAmountElement.innerText.trim(),
                    billAmount: billAmountElement.innerText.trim(),
                    nmeAmount: nmeAmountElement.innerText.trim(),
                    discount: discountElement.innerText.trim()
                };
                console.log('Data to send:', data);

                // Fetch existing case IDs from Google Sheets
                fetchExistingCaseIds(existingCaseIds => {
                    const currentCaseId = parseInt(data.caseId);
                    const caseIds = Array.isArray(existingCaseIds) ? existingCaseIds : [];
                    const exists = caseIds.length >= 1 && caseIds.includes(currentCaseId);
                    const submitButton = document.querySelector('button.btn.primary');

                    if (exists) {
                        console.log('Duplicate case ID found:', currentCaseId);
                        console.log('Data not sent to Google Sheets.');

                        // Enable the button again (not needed in this case since we're disabling permanently)
                        sendbutton.disabled = true;
                        sendbutton.textContent = 'Send Data';
                        console.log('Last captured row data:', rowData);
                    } else {
                        console.log('No duplicate found. Sending data to Google Sheets.');
                        console.log('Last captured row data:', rowData);
                        fetch('https://script.google.com/macros/s/AKfycbzoIIbKi-9C4zJwjoKXg8pJ9p5pk1pWpH1p0xGox3Zm45C0xBwccJlqhxp8S3dk4uexBg/exec', {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            console.log('Data sent to Google Sheets:', response);
                            console.log('Last captured row data:', rowData);

                            // Show success alert
                            alert('Data was sent successfully!');
                            const submitButton = document.querySelector('button.btn.primary');
                            if (submitButton) {
                                submitButton.click();
                            }

                            // Enable the submit button permanently regardless of send button state
                            submitButton.disabled = false;
                        })
                        .catch(error => {
                            console.error('Error sending data to Google Sheets:', error);

                            // Enable the button again (not needed in this case since we're disabling permanently)
                            sendbutton.disabled = true;
                            sendbutton.textContent = 'Send Data';
                        });
                    }
                });
            } else {
                console.log("Data extraction failed");
                // Enable the button again if data extraction failed (not needed in this case since we're disabling permanently)
                sendbutton.disabled = true;
                sendbutton.textContent = 'Send Data';
            }
        } else {
            console.error('No row data found in local storage');
            sendbutton.disabled = false;
            sendbutton.textContent = 'Send Data';
        }
    });
}

// Add click event listener to the dynamically created button
sendbutton.addEventListener('click', extractData);

// Function to observe changes in the Submit button
function observeSubmitButton() {
    const submitButton = document.querySelector('button.btn.primary');

    if (submitButton) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'disabled' && !submitButton.disabled) {
                    console.log("Submit button is enabled permanently");
                    // Do nothing here since we want to enable it permanently
                }
            });
        });

        observer.observe(submitButton, {
            attributes: true // Monitor attribute changes
        });
    } else {
        console.log("Submit button not found");
    }
}

// Run observeSubmitButton once to initialize
observeSubmitButton();

// Start listening for relevant console messages (optional)
// No changes needed here unless for debugging purposes
function listenForConsoleMessages() {
    const consoleLogListener = function(message) {
        if (message.includes('No duplicate found. Sending data to Google Sheets.') || message.includes('Duplicate case ID found:')) {
            console.log("Enabling submit button permanently");
            // No action needed here as we handle this in observeSubmitButton()
        }
    };

    // Override console.log to intercept messages (optional)
    // No changes needed here unless for debugging purposes
    const originalConsoleLog = console.log;
    console.log = function() {
        originalConsoleLog.apply(console, arguments);
        consoleLogListener(Array.from(arguments).join(' '));
    };
}

// Start listening for relevant console messages (optional)
// No changes needed here unless for debugging purposes
listenForConsoleMessages();
