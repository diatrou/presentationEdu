// Schedule & Real-time Timer Logic
// Λογική Ωρολογίου Προγράμματος & Χρονομέτρου Πραγματικού Χρόνου

document.addEventListener('DOMContentLoaded', () => {
    // Start real-time timer update interval (every 1 second)
    // Έναρξη τακτικής ενημέρωσης χρονομέτρου (κάθε 1 δευτερόλεπτο)
    updateScheduleTimer();
    setInterval(updateScheduleTimer, 1000);
});

/**
 * Main function to calculate current time slot or countdown
 * Κύρια συνάρτηση υπολογισμού τρέχουσας εκπαιδευτικής ώρας ή αντίστροφης μέτρησης
 */
function updateScheduleTimer() {
    const timerEl = document.getElementById('schedule-timer');
    if (!timerEl) return;

    const config = window.CONFIG || {};
    const schedule = config.schedule;

    // Check if schedule array exists in configuration
    // Έλεγχος αν υπάρχει ορισμένο πρόγραμμα στις ρυθμίσεις
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
        timerEl.textContent = "--:--";
        return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    // Convert time string (HH:MM) to total minutes from start of day
    // Μετατροπή συμβολοσειράς ώρας (HH:MM) σε συνολικά λεπτά ημέρας
    const parseTimeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    let activeSlot = null;
    let nextSlot = null;

    // Iterate through schedule to determine active or upcoming time slot
    // Διαπεραση του προγράμματος για εντοπισμό ενεργού ή επόμενης ώρας
    for (let i = 0; i < schedule.length; i++) {
        const slot = schedule[i];
        const startMin = parseTimeToMinutes(slot.start);
        const endMin = parseTimeToMinutes(slot.end);

        if (currentMinutes >= startMin && currentMinutes < endMin) {
            activeSlot = { ...slot, startMin, endMin };
            break;
        } else if (currentMinutes < startMin && !nextSlot) {
            nextSlot = { ...slot, startMin, endMin };
        }
    }

    // Case 1: Currently inside an active lecture or break slot
    // Περίπτωση 1: Βρισκόμαστε εντός διδακτικής ώρας ή διαλείμματος
    if (activeSlot) {
        const remainingMinutes = activeSlot.endMin - currentMinutes - 1;
        const remainingSeconds = 59 - currentSeconds;
        const formattedTime = formatTime(remainingMinutes, remainingSeconds);
        
        timerEl.textContent = `${activeSlot.label}: ${formattedTime}`;
        return;
    }

    // Case 2: Waiting for the next scheduled slot to start
    // Περίπτωση 2: Αναμονή μέχρι την έναρξη της επόμενης προγραμματισμένης ώρας
    if (nextSlot) {
        const remainingMinutes = nextSlot.startMin - currentMinutes - 1;
        const remainingSeconds = 59 - currentSeconds;
        const formattedTime = formatTime(remainingMinutes, remainingSeconds);

        timerEl.textContent = `Έναρξη σε: ${formattedTime}`;
        return;
    }

    // Case 3: All scheduled activities for the day have concluded
    // Περίπτωση 3: Ολοκλήρωση όλων των προγραμματισμένων ωρών της ημέρας
    timerEl.textContent = "Τέλος Μαθήματος";
}

/**
 * Helper function to format minutes and seconds with leading zeros (MM:SS)
 * Βοηθητική συνάρτηση μορφοποίησης λεπτών και δευτερολέπτων (MM:SS)
 */
function formatTime(minutes, seconds) {
    const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const secsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minsStr}:${secsStr}`;
}