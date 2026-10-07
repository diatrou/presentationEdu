/**
 * Lightweight Schedule Timer for Presentation Control Bar
 * Ελαφρύς Χρονομετρητής Προγράμματος για την Μπάρα Ελέγχου
 */
function initScheduleTimer() {
    const timerElement = document.getElementById('schedule-timer');
    if (!timerElement) return;

    function updateTimer() {
        const config = window.CONFIG || {};
        // Read directly as Array or fallback to slots / Ανάγνωση απευθείας ως πίνακα
        const rawSchedule = config.schedule || window.SCHEDULE;
        const slots = Array.isArray(rawSchedule) ? rawSchedule : (rawSchedule ? rawSchedule.slots : null);

        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            timerElement.textContent = "--:--";
            return;
        }

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        let currentSlot = null;
        let nextSlot = null;

        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const [startH, startM] = slot.start.split(':').map(Number);
            const [endH, endM] = slot.end.split(':').map(Number);
            
            const startTotal = startH * 60 + startM;
            const endTotal = endH * 60 + endM;

            if (currentMinutes >= startTotal && currentMinutes < endTotal) {
                currentSlot = slot;
                currentSlot.endTotal = endTotal;
                break;
            } else if (currentMinutes < startTotal && !nextSlot) {
                nextSlot = slot;
                nextSlot.startTotal = startTotal;
            }
        }

        if (currentSlot) {
            const remaining = currentSlot.endTotal - currentMinutes;
            timerElement.textContent = `${currentSlot.label} (Απομένουν: ${remaining}λ)`;
        } else if (nextSlot) {
            const untilStart = nextSlot.startTotal - currentMinutes;
            timerElement.textContent = `Επόμενο: ${nextSlot.label} (σε ${untilStart}λ)`;
        } else {
            timerElement.textContent = "Εκτός Ωραρίου";
        }
    }

    updateTimer();
    setTimeout(updateTimer, 500);
    setInterval(updateTimer, 30000);
}