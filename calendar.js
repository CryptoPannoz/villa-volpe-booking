// Villa Volpe Booking Calendar JavaScript
// FIXED: Checkout day is now available for booking (checkout happens in the morning)

// Configuration
const CONFIG = {
    calendarId: 'be5a630aebb1f10d8e8bee8144948cda4b8227517394f8ff109a17c9424b6e57@group.calendar.google.com',
    apiKey: 'AIzaSyDkmWoTVEgonSPPTYrKIY9SuoodIVO4lpQ',
    minNights: 3,
    maxGuests: 4,
    email: 'villavolpeorta@gmail.com'
};

// State
let state = {
    currentMonth: new Date(),
    checkInDate: null,
    checkOutDate: null,
    blockedDates: [],
    guestData: {
        name: '',
        email: '',
        phone: '',
        adults: 2,
        children: 0,
        pets: 'no',
        requests: ''
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
    setupEventListeners();
    loadBlockedDates();
});

// Calendar Initialization
function initializeCalendar() {
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('current-month');
    
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    
    // Update month display
    monthDisplay.textContent = state.currentMonth.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    // Clear grid
    grid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }
    
    // Add day cells
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        dayCell.dataset.date = date.toISOString().split('T')[0];
        
        // Check if date is in the past
        if (date < today) {
            dayCell.classList.add('blocked');
        }
        // Check if date is blocked
        else if (isDateBlocked(date)) {
            dayCell.classList.add('blocked');
        }
        // Available date
        else {
            dayCell.classList.add('available');
            dayCell.addEventListener('click', () => selectDate(date));
        }
        
        // Highlight today
        if (date.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }
        
        // Highlight selected dates
        if (state.checkInDate && date.toDateString() === state.checkInDate.toDateString()) {
            dayCell.classList.add('selected');
        }
        if (state.checkOutDate && date.toDateString() === state.checkOutDate.toDateString()) {
            dayCell.classList.add('selected');
        }
        
        // Highlight dates in range
        if (state.checkInDate && state.checkOutDate) {
            if (date > state.checkInDate && date < state.checkOutDate) {
                dayCell.classList.add('in-range');
            }
        }
        
        grid.appendChild(dayCell);
    }
}

// Date Selection Logic
function selectDate(date) {
    // If no check-in selected, or both dates selected, start new selection
    if (!state.checkInDate || (state.checkInDate && state.checkOutDate)) {
        state.checkInDate = date;
        state.checkOutDate = null;
    }
    // If check-in selected but no check-out
    else if (state.checkInDate && !state.checkOutDate) {
        // If selected date is before check-in, swap them
        if (date < state.checkInDate) {
            state.checkOutDate = state.checkInDate;
            state.checkInDate = date;
        } else {
            state.checkOutDate = date;
        }
        
        // Validate minimum nights
        const nights = calculateNights(state.checkInDate, state.checkOutDate);
        if (nights < CONFIG.minNights) {
            alert(`Minimum ${CONFIG.minNights} nights stay required`);
            state.checkOutDate = null;
        }
        
        // Check if any dates in range are blocked
        if (state.checkOutDate && hasBlockedDatesInRange(state.checkInDate, state.checkOutDate)) {
            alert('Selected dates contain unavailable days. Please choose different dates.');
            state.checkInDate = null;
            state.checkOutDate = null;
        }
    }
    
    updateDateDisplay();
    renderCalendar();
}

function updateDateDisplay() {
    const checkInDisplay = document.getElementById('checkin-display');
    const checkOutDisplay = document.getElementById('checkout-display');
    const nightsDisplay = document.getElementById('nights-display');
    const nightsCount = document.getElementById('nights-count');
    const continueBtn = document.getElementById('continue-to-guests');
    
    if (state.checkInDate) {
        checkInDisplay.textContent = formatDate(state.checkInDate);
    } else {
        checkInDisplay.textContent = 'Select date';
    }
    
    if (state.checkOutDate) {
        checkOutDisplay.textContent = formatDate(state.checkOutDate);
        const nights = calculateNights(state.checkInDate, state.checkOutDate);
        nightsCount.textContent = nights;
        nightsDisplay.style.display = 'block';
        continueBtn.disabled = false;
    } else {
        checkOutDisplay.textContent = 'Select date';
        nightsDisplay.style.display = 'none';
        continueBtn.disabled = true;
    }
}

// Date Utilities
function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function calculateNights(checkIn, checkOut) {
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function isDateBlocked(date) {
    const dateStr = date.toISOString().split('T')[0];
    return state.blockedDates.includes(dateStr);
}

function hasBlockedDatesInRange(startDate, endDate) {
    const current = new Date(startDate);
    current.setDate(current.getDate() + 1); // Start from day after check-in
    
    while (current < endDate) {
        if (isDateBlocked(current)) {
            return true;
        }
        current.setDate(current.getDate() + 1);
    }
    return false;
}

// Load Blocked Dates from Google Calendar
async function loadBlockedDates() {
    try {
        const timeMin = new Date().toISOString();
        const timeMax = new Date();
        timeMax.setMonth(timeMax.getMonth() + 12);
        
        const url = `https://www.googleapis.com/calendar/v3/calendars/${CONFIG.calendarId}/events?key=${CONFIG.apiKey}&timeMin=${timeMin}&timeMax=${timeMax.toISOString()}&singleEvents=true`;
        
        console.log('Loading blocked dates from Google Calendar...');
        console.log('Calendar ID:', CONFIG.calendarId);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error('Google Calendar API Error:', data.error);
            alert('Error loading calendar availability. Please contact us directly at ' + CONFIG.email);
            return;
        }
        
        if (data.items) {
            console.log(`Found ${data.items.length} events in Google Calendar`);
            
            data.items.forEach(event => {
                let startDate, endDate;
                
                // Handle all-day events (event.start.date)
                if (event.start.date) {
                    startDate = new Date(event.start.date);
                    endDate = new Date(event.end.date);
                    console.log(`[ALL-DAY] Event: ${event.summary || 'Booking'}`);
                    console.log(`  From: ${event.start.date} To: ${event.end.date}`);
                }
                // Handle timed events (event.start.dateTime)
                else if (event.start.dateTime) {
                    startDate = new Date(event.start.dateTime);
                    endDate = new Date(event.end.dateTime);
                    console.log(`[TIMED] Event: ${event.summary || 'Booking'}`);
                    console.log(`  From: ${event.start.dateTime} To: ${event.end.dateTime}`);
                }
                
                if (startDate && endDate) {
                    // Reset time to midnight for date comparison
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(0, 0, 0, 0);
                    
                    // FIXED: Block dates from check-in to day BEFORE checkout
                    // Because checkout happens in the morning, the checkout night is available
                    let currentDate = new Date(startDate);
                    while (currentDate < endDate) {  // Changed from <= to < (this is the fix!)
                        const dateStr = currentDate.toISOString().split('T')[0];
                        if (!state.blockedDates.includes(dateStr)) {
                            state.blockedDates.push(dateStr);
                            console.log(`  Blocked: ${dateStr}`);
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    
                    console.log(`  Checkout day ${endDate.toISOString().split('T')[0]} is AVAILABLE (checkout in morning)`);
                }
            });
            
            console.log(`Total blocked dates: ${state.blockedDates.length}`);
            console.log('All blocked dates:', state.blockedDates.sort());
        }
        
        renderCalendar();
    } catch (error) {
        console.error('Error loading blocked dates:', error);
        alert('Unable to load calendar availability. Please contact us directly at ' + CONFIG.email);
    }
}

// Event Listeners
function setupEventListeners() {
    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
        renderCalendar();
    });
    
    // Continue to guests
    document.getElementById('continue-to-guests').addEventListener('click', () => {
        goToStep('guests');
    });
    
    // Guest form validation
    const guestForm = document.getElementById('guest-form');
    const adultsSelect = document.getElementById('num-adults');
    const childrenSelect = document.getElementById('num-children');
    const warningDiv = document.getElementById('guest-limit-warning');
    
    function validateGuestCount() {
        const adults = parseInt(adultsSelect.value) || 0;
        const children = parseInt(childrenSelect.value) || 0;
        const total = adults + children;
        
        if (total > CONFIG.maxGuests) {
            warningDiv.style.display = 'flex';
            return false;
        } else {
            warningDiv.style.display = 'none';
            return true;
        }
    }
    
    adultsSelect.addEventListener('change', validateGuestCount);
    childrenSelect.addEventListener('change', validateGuestCount);
    
    // Continue to policy
    document.getElementById('continue-to-policy').addEventListener('click', () => {
        if (!guestForm.checkValidity()) {
            guestForm.reportValidity();
            return;
        }
        
        if (!validateGuestCount()) {
            return;
        }
        
        // Save guest data
        state.guestData = {
            name: document.getElementById('guest-name').value,
            email: document.getElementById('guest-email').value,
            phone: document.getElementById('guest-phone').value,
            adults: parseInt(document.getElementById('num-adults').value),
            children: parseInt(document.getElementById('num-children').value),
            pets: document.getElementById('pets').value,
            requests: document.getElementById('special-requests').value
        };
        
        updateSummary();
        goToStep('policy');
    });
    
    // Policy acceptance
    document.getElementById('accept-policy').addEventListener('change', (e) => {
        document.getElementById('send-request').disabled = !e.target.checked;
    });
    
    // Send request
    document.getElementById('send-request').addEventListener('click', sendBookingRequest);
}

// Step Navigation
function goToStep(stepName) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step-${stepName}`).classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update Summary
function updateSummary() {
    document.getElementById('summary-checkin').textContent = formatDate(state.checkInDate);
    document.getElementById('summary-checkout').textContent = formatDate(state.checkOutDate);
    
    const nights = calculateNights(state.checkInDate, state.checkOutDate);
    document.getElementById('summary-nights').textContent = `${nights} night${nights > 1 ? 's' : ''}`;
    
    const totalGuests = state.guestData.adults + state.guestData.children;
    let guestText = `${state.guestData.adults} adult${state.guestData.adults > 1 ? 's' : ''}`;
    if (state.guestData.children > 0) {
        guestText += `, ${state.guestData.children} child${state.guestData.children > 1 ? 'ren' : ''}`;
    }
    document.getElementById('summary-guests').textContent = guestText;
    
    // Display pets
    const petsText = state.guestData.pets === 'yes' ? 'Yes (€120 cleaning fee applies)' : 'No';
    document.getElementById('summary-pets').textContent = petsText;
}

// Send Booking Request
function sendBookingRequest() {
    const nights = calculateNights(state.checkInDate, state.checkOutDate);
    const totalGuests = state.guestData.adults + state.guestData.children;
    
    // Prepare email content
    const subject = `Booking Request for Villa Volpe - ${formatDate(state.checkInDate)} to ${formatDate(state.checkOutDate)}`;
    
    const body = `
VILLA VOLPE BOOKING REQUEST

RESERVATION DETAILS:
- Check-in: ${formatDate(state.checkInDate)}
- Check-out: ${formatDate(state.checkOutDate)}
- Duration: ${nights} night${nights > 1 ? 's' : ''}
- Guests: ${state.guestData.adults} adult${state.guestData.adults > 1 ? 's' : ''}${state.guestData.children > 0 ? `, ${state.guestData.children} child${state.guestData.children > 1 ? 'ren' : ''}` : ''}

GUEST INFORMATION:
- Name: ${state.guestData.name}
- Email: ${state.guestData.email}
- Phone: ${state.guestData.phone}
- Pets: ${state.guestData.pets === 'yes' ? 'Yes (€120 cleaning fee applies)' : 'No'}

SPECIAL REQUESTS:
${state.guestData.requests || 'None'}

---
The guest has read and accepted all booking, cancellation, and additional policies.

Please respond to this request within 24 hours.
    `.trim();
    
    // Create mailto link
    const mailtoLink = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show confirmation
    document.getElementById('confirmation-email').textContent = state.guestData.email;
    goToStep('confirmation');
}

// Reset Widget
function resetWidget() {
    state.checkInDate = null;
    state.checkOutDate = null;
    state.guestData = {
        name: '',
        email: '',
        phone: '',
        adults: 2,
        children: 0,
        pets: 'no',
        requests: ''
    };
    
    // Reset form
    document.getElementById('guest-form').reset();
    document.getElementById('accept-policy').checked = false;
    
    // Go back to calendar
    goToStep('calendar');
    renderCalendar();
}
