// Villa Volpe Booking Calendar JavaScript

// Configuration
const CONFIG = {
    calendarId: 'be5a630aebb1f10d8e8bee8149448cda4b822751739--snip--',
    apiKey: 'YOUR_GOOGLE_API_KEY', // Optional if calendar is public
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
    // For now, use mock data. In production, fetch from Google Calendar API
    // Example blocked dates (you can replace this with actual API call)
    state.blockedDates = [
        // Format: 'YYYY-MM-DD'
        // Add your blocked dates here
    ];
    
    // Uncomment below to fetch from Google Calendar API
    /*
    try {
        const timeMin = new Date().toISOString();
        const timeMax = new Date();
        timeMax.setMonth(timeMax.getMonth() + 12);
        
        const url = `https://www.googleapis.com/calendar/v3/calendars/${CONFIG.calendarId}/events?key=${CONFIG.apiKey}&timeMin=${timeMin}&timeMax=${timeMax.toISOString()}&singleEvents=true`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items) {
            data.items.forEach(event => {
                if (event.start.date) {
                    const startDate = new Date(event.start.date);
                    const endDate = new Date(event.end.date);
                    
                    // Add all dates in the event range
                    let currentDate = new Date(startDate);
                    while (currentDate < endDate) {
                        state.blockedDates.push(currentDate.toISOString().split('T')[0]);
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            });
        }
        
        renderCalendar();
    } catch (error) {
        console.error('Error loading blocked dates:', error);
    }
    */
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
    state = {
        currentMonth: new Date(),
        checkInDate: null,
        checkOutDate: null,
        blockedDates: state.blockedDates, // Keep blocked dates
        guestData: {
            name: '',
            email: '',
            phone: '',
            adults: 2,
            children: 0,
            requests: ''
        }
    };
    
    // Reset form
    document.getElementById('guest-form').reset();
    document.getElementById('accept-policy').checked = false;
    
    // Go back to calendar
    goToStep('calendar');
    renderCalendar();
}

// Manual Blocked Dates Management
// You can manually add blocked dates here until Google Calendar API is set up
function addBlockedDates(dates) {
    // dates should be an array of strings in 'YYYY-MM-DD' format
    // Example: ['2025-12-25', '2025-12-26', '2025-12-31']
    state.blockedDates = [...state.blockedDates, ...dates];
    renderCalendar();
}

// Example: Add Christmas and New Year as blocked
// addBlockedDates(['2025-12-24', '2025-12-25', '2025-12-26', '2025-12-31', '2026-01-01']);
