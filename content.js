// Dynamically create a button on the webpage
const sendbutton = document.createElement('button');
sendbutton.id = 'sendbuttonid';
sendbutton.textContent = 'Send Data';
sendbutton.style.position = 'fixed';
sendbutton.style.top = '58px';
sendbutton.style.right = '700px';
sendbutton.style.padding = '5px';
sendbutton.style.zIndex = '1000';
document.body.appendChild(sendbutton);

// Function to fetch existing case IDs from Google Sheets
function fetchExistingCaseIds(callback) {
    fetch('https://script.google.com/macros/s/AKfycbw2mJkd_CxEmhr4U9q3VOhxpeGBAAMfjS6pVYz8jFATX9uZe8ut9oYCcg5c9zQ914T7TQ/exec')
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
    const caseIdElement = document.querySelector('div.new-page-nav > ul > li:nth-child(4) > strong');
    const claimedAmountElement = document.querySelector('div.text-right span');
    let billAmountElement = document.querySelector('div.text-right.text-truncate[ngbtooltip="Total bill"] > span');
    let nmeAmountElement = document.querySelector('div.text-right.text-truncate[ngbtooltip="Total NME"] > span');
    let discountElement = document.querySelector('div.text-right.text-truncate[ngbtooltip="Total disc."] > span');

    if (caseIdElement && claimedAmountElement && billAmountElement && nmeAmountElement && discountElement) {
        let data = {
            caseId: caseIdElement.innerText.split(": ")[1].trim(),
            claimedAmount: claimedAmountElement.innerText.trim(),
            billAmount: billAmountElement.innerText.trim(),
            nmeAmount: nmeAmountElement.innerText.trim(),
            discount: discountElement.innerText.trim()
        };

        // Fetch existing case IDs from Google Sheets
        fetchExistingCaseIds(existingCaseIds => {
            const currentCaseId = parseInt(data.caseId);
            const caseIds = Array.isArray(existingCaseIds) ? existingCaseIds : [];
            const exists = caseIds.length >= 1 && caseIds.includes(currentCaseId);

            if (exists) {
                console.log('Duplicate case ID found:', currentCaseId);
                console.log('Data not sent to Google Sheets.');
                // showNotification('Error sending data');
            } else {
                console.log('No duplicate found. Sending data to Google Sheets.');
                fetch('https://script.google.com/macros/s/AKfycbw2mJkd_CxEmhr4U9q3VOhxpeGBAAMfjS6pVYz8jFATX9uZe8ut9oYCcg5c9zQ914T7TQ/exec', {
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
                    // Optionally clear the data if needed
                    // chrome.storage.local.set({ data: [] });
                })
                .catch(error => console.error('Error sending data to Google Sheets:', error));
            }
        });
    }
}

// Add event listener to send data when the button is clicked
sendbutton.addEventListener('click', extractData);

// Optionally, you may want to run the extraction function periodically every 3 seconds
// setInterval(extractData, 3000);  // Commented out as it's not necessary when using the button click

// Run the extraction function once initially (optional, depending on your needs)
// extractData();  // Commented out as it's not necessary when using the button click
