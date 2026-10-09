// Schedule & Real-time Timer Logic (Centralized)
// Κεντρική Λογική Ωρολογίου Προγράμματος & Χρονομέτρου Πραγματικού Χρόνου
// Bilingual comments (Greek / English)

document.addEventListener('DOMContentLoaded', () => {
    // Start real-time timer update interval (every 1 second)
    // Έναρξη τακτικής ενημέρωσης χρονομέτρου (κάθε 1 δευτερόλεπτο)
    updateScheduleTimer();
    setInterval(updateScheduleTimer, 1000);
});

/**
 * Main centralized function to calculate current time slot, countdown, or out-of-hours state
 * Κύρια κεντρική συνάρτηση υπολογισμού τρέχουσας ώρας, αντίστροφης μέτρησης ή εκτός ωραρίου
 */
function updateScheduleTimer() {
    const timerEl = document.getElementById('schedule-timer');
    if (!timerEl) return;

    const config = window.CONFIG || {};
    // Support both config.schedule and fallback options / Υποστήριξη διαφορετικών δομών 
    const rawSchedule = config.schedule || window.SCHEDULE;
    const slots = Array.isArray(rawSchedule) ? rawSchedule : (rawSchedule ? rawSchedule.slots : null);

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
        timerEl.textContent = "Εκτός Ωραρίου";
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

    const firstSlotStart = parseTimeToMinutes(slots[0].start);
    const threeHoursInMinutes = 3 * 60; // 180 minutes / 180 λεπτά

    // Check if we are more than 3 hours before the first lecture
    // Έλεγχος αν βρισκόμαστε πάνω από 3 ώρες πριν την 1η ώρα
    if (currentMinutes < firstSlotStart - threeHoursInMinutes) {
        timerEl.textContent = "Εκτός Ωραρίου";
        return;
    }

    // Iterate through schedule to determine active or upcoming time slot
    // Διαπέραση του προγράμματος για εντοπισμό ενεργού ή επόμενης ώρας
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
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
        const remainingTotalSeconds = (activeSlot.endMin * 60) - (currentMinutes * 60 + currentSeconds);
        const remainingMinutes = Math.floor(remainingTotalSeconds / 60);
        
        timerEl.textContent = `${activeSlot.label} (Απομένουν: ${remainingMinutes}')`;
        return;
    }

    // Case 2: Waiting for the next scheduled slot to start (within the 3-hour window)
    // Περίπτωση 2: Αναμονή μέχρι την έναρξη της επόμενης ώρας (εντός παραθύρου 3 ωρών)
    if (nextSlot) {
        const diffMinutes = nextSlot.startMin - currentMinutes - 1;
        const remainingSeconds = 59 - currentSeconds;
        const formattedTime = formatTime(diffMinutes, remainingSeconds);

        timerEl.textContent = `Έναρξη σε: ${formattedTime}`;
        return;
    }

    // Case 3: All scheduled activities for the day have concluded
    // Περίπτωση 3: Ολοκλήρωση όλων των προγραμματισμένων ωρών της ημέρας
    timerEl.textContent = "Εκτός Ωραρίου";
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