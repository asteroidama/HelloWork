// ============================
// INIZIALIZZAZIONE
// ============================

let deferredPrompt;
let currentMonth = new Date();
let calendarMonth = new Date();
let shifts = [];

// ✅ AGGIUNTA: defaultHourlyRate e showTestButton
let settings = {
    theme: 'light',
    color: 'blue',
    notificationsEnabled: false,
    notificationTime: '21:00',
    defaultHourlyRate: 8.00,        // ✅ AGGIUNTO
    showTestButton: false           // ✅ AGGIUNTO
};

// Carica dati al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    applyTheme();
    loadShifts();
    setupEventListeners();
    renderCalendar();
    updateSummary();
    setDefaultDate();
    checkNotificationPermission();
    checkInstallStatus();
    checkQuickAddFromNotification();
});

// ============================
// GESTIONE TEMA E COLORI
// ============================

function loadSettings() {
    const saved = localStorage.getItem('settings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    // AGGIUNGI queste righe:
    if (settings.notificationsEnabled) {
        scheduleDailyNotification();
    }
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

function applyTheme() {
    // Applica dark/light mode
    if (settings.theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Applica colore
    document.body.setAttribute('data-color', settings.color);
    
    // Aggiorna UI impostazioni
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });
    
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === settings.color);
    });
}

// ============================
// GESTIONE PWA - INSTALLAZIONE
// ============================

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-button').classList.remove('hidden');
});

document.getElementById('install-button').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        showToast('App installata con successo! 🎉', 'success');
    }
    
    deferredPrompt = null;
    document.getElementById('install-button').classList.add('hidden');
});

window.addEventListener('appinstalled', () => {
    showToast('App installata! Ora puoi usarla dalla home screen', 'success');
    checkInstallStatus();
});

function checkInstallStatus() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const statusElement = document.getElementById('install-status');
    if (statusElement) {
        statusElement.textContent = isStandalone ? 'Sì' : 'No';
    }
}

// ============================
// GESTIONE TABS E NAVIGAZIONE
// ============================

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Settings
    document.getElementById('settings-button').addEventListener('click', openSettings);
    document.getElementById('settings-back').addEventListener('click', closeSettings);

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.theme = btn.dataset.theme;
            saveSettings();
            applyTheme();
        });
    });

    // Color buttons
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.color = btn.dataset.color;
            saveSettings();
            applyTheme();
        });
    });

    // Form submission
    document.getElementById('shift-form').addEventListener('submit', handleShiftSubmit);

    // Calendar navigation
    document.getElementById('prev-month-cal').addEventListener('click', () => changeCalendarMonth(-1));
    document.getElementById('next-month-cal').addEventListener('click', () => changeCalendarMonth(1));

    // Summary navigation
    document.getElementById('prev-month').addEventListener('click', () => changeSummaryMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeSummaryMonth(1));

    // Modal
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', (e) => {
    // Chiudi solo se modal non è in modalità editing
    const modalBody = document.getElementById('modal-body');
    const hasForm = modalBody.querySelector('form') || modalBody.querySelector('input[type="time"]');
    
    if (!hasForm) {
        // Nessun form aperto = è solo visualizzazione dettagli
        closeModal();
    }
});

    // Settings buttons
    document.getElementById('notifications-enabled').addEventListener('change', toggleNotifications);
    document.getElementById('export-data').addEventListener('click', exportData);
    document.getElementById('import-data').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importData);
    document.getElementById('clear-data').addEventListener('click', clearAllData);

    // Notification time
    document.getElementById('notification-time').addEventListener('change', () => {
        settings.notificationTime = document.getElementById('notification-time').value;
        saveSettings();
        if (settings.notificationsEnabled) {
            scheduleDailyNotification();
        }
    });

    // ✅ AGGIUNGI questi event listener per i nuovi controlli
    document.getElementById('default-hourly-rate').addEventListener('change', () => {
        settings.defaultHourlyRate = parseFloat(document.getElementById('default-hourly-rate').value);
        saveSettings();
        showToast('Paga oraria aggiornata ✓', 'success');
    });

    document.getElementById('show-test-notification').addEventListener('change', toggleTestButton);
    document.getElementById('test-notification-btn').addEventListener('click', sendTestNotification);
}

// ✅ AGGIUNGI: Gestione back button sistema
window.addEventListener('popstate', (e) => {
    const settingsPage = document.getElementById('settings-page');
    const modal = document.getElementById('shift-modal');
    
    // Se impostazioni aperte, chiudi
    if (!settingsPage.classList.contains('hidden')) {
        e.preventDefault();
        closeSettings();
    }
    // Se modal aperto, chiudi
    else if (!modal.classList.contains('hidden')) {
        e.preventDefault();
        closeModal();
    }
});

function switchTab(tabName) {
    // Aggiorna bottoni
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Aggiorna contenuto
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Aggiorna dati se necessario
    if (tabName === 'riepilogo') {
        updateSummary();
    } else if (tabName === 'calendario') {
        renderCalendar();
    }
}

function openSettings() {
    document.getElementById('settings-page').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // ✅ AGGIUNGI: Push state per gestire back button
    history.pushState({ page: 'settings' }, '', '');
}

function closeSettings() {
    document.getElementById('settings-page').classList.add('hidden');
    document.body.style.overflow = '';
    
    // ✅ AGGIUNGI: Rimuovi state solo se siamo in settings
    if (history.state?.page === 'settings') {
        history.back();
    }
}

// ============================
// CALENDARIO
// ============================

function changeCalendarMonth(direction) {
    calendarMonth.setMonth(calendarMonth.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    // Aggiorna titolo
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    document.getElementById('calendar-month').textContent = `${monthNames[month]} ${year}`;

    // Primo e ultimo giorno del mese
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Giorno della settimana del primo giorno (0 = domenica, ma vogliamo lunedì = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const container = document.getElementById('calendar-days');
    container.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Giorni del mese precedente
    for (let i = startDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createDayElement(day, month - 1, year, true);
        container.appendChild(dayEl);
    }

    // Giorni del mese corrente
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.getTime() === today.getTime();
        const dayEl = createDayElement(day, month, year, false, isToday);
        container.appendChild(dayEl);
    }

    // Giorni del mese successivo
    const totalCells = container.children.length;
    const remainingCells = 42 - totalCells; // 6 righe x 7 giorni
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createDayElement(day, month + 1, year, true);
        container.appendChild(dayEl);
    }
}

function createDayElement(day, month, year, isOtherMonth, isToday = false) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    if (isOtherMonth) {
        div.classList.add('other-month');
    }
    if (isToday) {
        div.classList.add('today');
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const shift = shifts.find(s => s.date === dateStr);

    if (shift && !shift.isRest) {  // ← AGGIUNGI && !shift.isRest
        div.classList.add('has-shift');
        div.innerHTML = `
            <span class="day-number">${day}</span>
            <div class="day-shift-times">
                <span class="day-shift-time">${shift.startTime}</span>
                <span class="day-shift-time">${shift.endTime}</span>
            </div>
        `;
    } else {
    div.innerHTML = `<span class="day-number">${day}</span>`;
}

    div.addEventListener('click', () => openDayModal(dateStr, shift));

    return div;
}

function openDayModal(dateStr, shift) {
    const modal = document.getElementById('shift-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    const date = new Date(dateStr + 'T12:00:00');
    const formattedDate = formatDate(dateStr);

    title.textContent = `Turno ${formattedDate}`;

    if (shift) {
        const displayStart = shift.isRest ? '/' : shift.startTime;
        const displayEnd = shift.isRest ? '/' : shift.endTime;
        body.innerHTML = `
            <div class="shift-detail-item" style="cursor: pointer;" onclick="editShiftTime(${shift.id}, '${dateStr}')">
                <div class="shift-detail-icon">🕐</div>
                <div class="shift-detail-content">
                    <div class="shift-detail-label">Orario (clicca per modificare)</div>
                    <div class="shift-detail-value">${shift.startTime} - ${shift.endTime}</div>
                </div>
            </div>
            <div class="shift-detail-item">
                <div class="shift-detail-icon">⏱️</div>
                <div class="shift-detail-content">
                    <div class="shift-detail-label">Ore Totali</div>
                    <div class="shift-detail-value">${formatHours(parseFloat(shift.hours))}</div>
                </div>
            </div>
            <div class="shift-detail-item">
                <div class="shift-detail-icon">💰</div>
                <div class="shift-detail-content">
                    <div class="shift-detail-label">Guadagno</div>
                    <div class="shift-detail-value">€ ${shift.earnings}</div>
                </div>
            </div>
            ${shift.notes ? `
            <div class="shift-detail-item">
                <div class="shift-detail-icon">📝</div>
                <div class="shift-detail-content">
                    <div class="shift-detail-label">Note</div>
                    <div class="shift-detail-value">${shift.notes}</div>
                </div>
            </div>
            ` : ''}
        `;
    } else {
        body.innerHTML = `
            <div class="modal-empty-state">
                <div class="empty-state-icon">📅</div>
                <div class="empty-state-text">Nessun turno in questa data</div>
                <button class="modal-add-shift-btn" onclick="addShiftFromModal('${dateStr}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    <span>Aggiungi Turno</span>
                </button>
            </div>
        `;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function editShiftTime(shiftId, dateStr) {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;
    
    const modal = document.getElementById('shift-modal');
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    
    const formattedDate = formatDate(dateStr);
    title.textContent = `Modifica Turno - ${formattedDate}`;
    
    const isCurrentlyRest = shift.isRest || shift.startTime === '/';
    
    body.innerHTML = `
        <div style="padding: var(--space-md);">
            <!-- Checkbox riposo -->
            <div style="margin-bottom: var(--space-lg); padding: var(--space-md); background: var(--bg-tertiary); border-radius: var(--radius-md);">
                <label style="display: flex; align-items: center; gap: var(--space-sm); cursor: pointer;">
                    <input type="checkbox" id="edit-no-work" ${isCurrentlyRest ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                    <span style="font-weight: 500;">😴 Non ho lavorato (riposo)</span>
                </label>
            </div>
            
            <!-- Sezione orari -->
            <div id="edit-time-section" style="display: ${isCurrentlyRest ? 'none' : 'block'};">
                <div style="text-align: center; margin-bottom: var(--space-lg);">
                    <h3 style="margin-bottom: var(--space-md); color: var(--text-secondary);">Ora Inizio</h3>
                    <input type="time" id="edit-start" value="${shift.startTime !== '/' ? shift.startTime : '19:00'}" 
                        style="font-size: 2rem; padding: var(--space-lg); width: 100%; 
                        border: 2px solid var(--border-color); border-radius: var(--radius-md); 
                        background: var(--bg-primary); color: var(--text-primary);">
                </div>
                
                <div style="text-align: center; margin-bottom: var(--space-lg);">
                    <h3 style="margin-bottom: var(--space-md); color: var(--text-secondary);">Ora Fine</h3>
                    <input type="time" id="edit-end" value="${shift.endTime !== '/' ? shift.endTime : '23:00'}" 
                        style="font-size: 2rem; padding: var(--space-lg); width: 100%; 
                        border: 2px solid var(--border-color); border-radius: var(--radius-md); 
                        background: var(--bg-primary); color: var(--text-primary);">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Paga Oraria (€)</label>
                    <input type="number" id="edit-hourly" class="form-input" step="0.01" value="${shift.hourlyRate}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Note</label>
                <textarea id="edit-notes" class="form-textarea" rows="2">${shift.notes || ''}</textarea>
            </div>
            
<div style="display: flex; gap: var(--space-md); margin-top: var(--space-md); justify-content: center;">
    <button id="move-shift-btn" class="icon-action-btn" title="Sposta turno">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13l-7 7m0 0l7-7m-7 7V3h11l5 5v14"/>
        </svg>
    </button>
    <button id="delete-shift-btn" class="icon-action-btn danger" title="Elimina turno">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
    </button>
</div>

            <button id="update-shift-btn" class="btn-primary" style="width: 100%; margin-top: var(--space-md);">
                Aggiorna Turno
            </button>
        </div>
    `;

    
    // Gestione checkbox
    const checkbox = document.getElementById('edit-no-work');
    const timeSection = document.getElementById('edit-time-section');
    
    checkbox.addEventListener('change', () => {
        timeSection.style.display = checkbox.checked ? 'none' : 'block';
    });
    
    // Salva modifiche
    document.getElementById('update-shift-btn').addEventListener('click', () => {
        const isRest = checkbox.checked;
        const notes = document.getElementById('edit-notes').value;
        
        if (isRest) {
            // Aggiorna a riposo
            shift.startTime = '/';
            shift.endTime = '/';
            shift.hours = '0';
            shift.earnings = '0.00';
            shift.notes = notes;
            shift.isRest = true;
            
            saveShifts();
            renderCalendar();
            updateSummary();
            closeModal();
            showToast('✓ Turno aggiornato', 'success');
        } else {
            // Aggiorna turno normale
            const startTime = document.getElementById('edit-start').value;
            const endTime = document.getElementById('edit-end').value;
            const hourlyRate = parseFloat(document.getElementById('edit-hourly').value);
            
            if (!startTime || !endTime) {
                showToast('⚠️ Inserisci gli orari', 'error');
                return;
            }
            
            const start = new Date(`${shift.date}T${startTime}`);
            const end = new Date(`${shift.date}T${endTime}`);
            
            if (end < start) {
                end.setDate(end.getDate() + 1);
            }
            
            const hours = (end - start) / (1000 * 60 * 60);
            const earnings = hours * hourlyRate;
            
            shift.startTime = startTime;
            shift.endTime = endTime;
            shift.hours = hours.toFixed(2);
            shift.hourlyRate = hourlyRate;
            shift.earnings = earnings.toFixed(2);
            shift.notes = notes;
            shift.isRest = false;
            
            saveShifts();
            renderCalendar();
            updateSummary();
            closeModal();
            showToast('✓ Turno aggiornato', 'success');
        }
    });

// Elimina turno
    document.getElementById('delete-shift-btn').addEventListener('click', () => {
        if (confirm('Sei sicuro di voler eliminare questo turno?')) {
            shifts = shifts.filter(s => s.id !== shiftId);
            saveShifts();
            renderCalendar();
            updateSummary();
            closeModal();
            showToast('🗑️ Turno eliminato', 'success');
        }
    });
    
    // Sposta turno
    document.getElementById('move-shift-btn').addEventListener('click', () => {
        showMoveShiftModal(shiftId);
    });

}

function closeModal() {
    document.getElementById('shift-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

function addShiftFromModal(dateStr) {
    closeModal();
    showQuickAddShift(dateStr);
}

function showQuickAddShift(dateStr) {
    const modal = document.getElementById('shift-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    const formattedDate = formatDate(dateStr);
    title.textContent = `Aggiungi Turno - ${formattedDate}`;
    
    const defaultStart = '19:00';
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes <= 15 ? '00' : minutes <= 45 ? '30' : '00';
    const roundedHour = minutes > 45 ? (now.getHours() + 1) % 24 : now.getHours();
    const defaultEnd = `${String(roundedHour).padStart(2, '0')}:${roundedMinutes}`;
    
    body.innerHTML = `
        <div style="padding: var(--space-md);">
            <!-- ✅ CHECKBOX IN ALTO -->
            <div style="margin-bottom: var(--space-lg); padding: var(--space-md); background: var(--bg-tertiary); border-radius: var(--radius-md);">
                <label style="display: flex; align-items: center; gap: var(--space-sm); cursor: pointer;">
                    <input type="checkbox" id="quick-no-work" style="width: 20px; height: 20px; cursor: pointer;">
                    <span style="font-weight: 500;">😴 Non ho lavorato (riposo)</span>
                </label>
            </div>
            
            <!-- ✅ SEZIONE LANCETTE (nascosta se checkbox attiva) -->
            <div id="time-inputs-section">
                <div style="text-align: center; margin-bottom: var(--space-lg);">
                    <h3 style="margin-bottom: var(--space-md); color: var(--text-secondary);">Ora Inizio Turno</h3>
                    <input type="time" id="quick-start" value="${defaultStart}" 
                        style="font-size: 2rem; padding: var(--space-lg); width: 100%; 
                        border: 2px solid var(--border-color); border-radius: var(--radius-md); 
                        background: var(--bg-primary); color: var(--text-primary);">
                </div>
                
                <div style="text-align: center; margin-bottom: var(--space-lg);">
                    <h3 style="margin-bottom: var(--space-md); color: var(--text-secondary);">Ora Fine Turno</h3>
                    <input type="time" id="quick-end" value="${defaultEnd}" 
                        style="font-size: 2rem; padding: var(--space-lg); width: 100%; 
                        border: 2px solid var(--border-color); border-radius: var(--radius-md); 
                        background: var(--bg-primary); color: var(--text-primary);">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Paga Oraria (€)</label>
                    <input type="number" id="quick-hourly" class="form-input" step="0.01" value="${settings.defaultHourlyRate}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Note (opzionali)</label>
                <textarea id="quick-notes" class="form-textarea" rows="2"></textarea>
            </div>
            
            <button id="save-shift-btn" class="btn-primary" style="width: 100%; margin-top: var(--space-md);">
                Salva Turno
            </button>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // ✅ Gestione checkbox - nascondi/mostra lancette
    const checkbox = document.getElementById('quick-no-work');
    const timeSection = document.getElementById('time-inputs-section');
    
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            timeSection.style.display = 'none';
        } else {
            timeSection.style.display = 'block';
        }
    });
    
    // ✅ Salva turno
    document.getElementById('save-shift-btn').addEventListener('click', () => {
        const isRest = checkbox.checked;
        const notes = document.getElementById('quick-notes').value;
        
        if (isRest) {
            // Turno riposo
            const restShift = {
                id: Date.now(),
                date: dateStr,
                startTime: '/',
                endTime: '/',
                hours: '0',
                hourlyRate: settings.defaultHourlyRate,
                earnings: '0.00',
                notes: notes,
                isRest: true
            };
            
            shifts.push(restShift);
            saveShifts();
            renderCalendar();
            updateSummary();
            closeModal();
            showToast('✓ Riposo registrato', 'success');
        } else {
            // Turno normale
            const startTime = document.getElementById('quick-start').value;
            const endTime = document.getElementById('quick-end').value;
            const hourlyRate = parseFloat(document.getElementById('quick-hourly').value);
            
            if (!startTime || !endTime) {
                showToast('⚠️ Inserisci gli orari', 'error');
                return;
            }
            
            const start = new Date(`${dateStr}T${startTime}`);
            const end = new Date(`${dateStr}T${endTime}`);
            
            if (end < start) {
                end.setDate(end.getDate() + 1);
            }
            
            const hours = (end - start) / (1000 * 60 * 60);
            const earnings = hours * hourlyRate;
            
            const shift = {
                id: Date.now(),
                date: dateStr,
                startTime: startTime,
                endTime: endTime,
                hours: hours.toFixed(2),
                hourlyRate: hourlyRate,
                earnings: earnings.toFixed(2),
                notes: notes
            };
            
            shifts.push(shift);
            saveShifts();
            renderCalendar();
            updateSummary();
            closeModal();
            showToast('✓ Turno aggiunto', 'success');
        }
    });
}

function showMoveShiftModal(shiftId) {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;
    
    const modal = document.getElementById('shift-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = 'Sposta Turno';
    
    body.innerHTML = `
        <div style="padding: var(--space-lg); text-align: center;">
            <p style="margin-bottom: var(--space-lg); color: var(--text-secondary);">
                Seleziona la nuova data per questo turno
            </p>
            <input type="date" id="new-shift-date" class="form-input" value="${shift.date}" 
                style="font-size: 1.2rem; text-align: center; margin-bottom: var(--space-lg);">
            <div style="display: flex; gap: var(--space-md);">
                <button id="cancel-move" class="btn-primary" style="background: var(--text-secondary); flex: 1;">
                    Annulla
                </button>
                <button id="confirm-move" class="btn-primary" style="flex: 1;">
                    Sposta
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('cancel-move').addEventListener('click', () => {
        editShiftTime(shiftId, shift.date);
    });
    
    document.getElementById('confirm-move').addEventListener('click', () => {
        const newDate = document.getElementById('new-shift-date').value;
        
        if (!newDate) {
            showToast('⚠️ Seleziona una data', 'error');
            return;
        }
        
        // Controlla se esiste già un turno in quella data
        const existingShift = shifts.find(s => s.date === newDate);
        if (existingShift) {
            if (!confirm('Esiste già un turno in questa data. Vuoi sostituirlo?')) {
                return;
            }
            shifts = shifts.filter(s => s.date !== newDate);
        }
        
        shift.date = newDate;
        saveShifts();
        renderCalendar();
        updateSummary();
        closeModal();
        showToast('✓ Turno spostato', 'success');
    });
}

// ============================
// GESTIONE TURNI
// ============================

function loadShifts() {
    const saved = localStorage.getItem('shifts');
    shifts = saved ? JSON.parse(saved) : [];
}

function saveShifts() {
    localStorage.setItem('shifts', JSON.stringify(shifts));
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('shift-date').value = today;
}

function handleShiftSubmit(e) {
    e.preventDefault();

    const date = document.getElementById('shift-date').value;
    const startTime = document.getElementById('shift-start').value;
    const endTime = document.getElementById('shift-end').value;
    const hourlyRate = parseFloat(document.getElementById('shift-hourly').value);
    const notes = document.getElementById('shift-notes').value;

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (end < start) {
        end.setDate(end.getDate() + 1);
    }

    const hours = (end - start) / (1000 * 60 * 60);
    const earnings = hours * hourlyRate;

    const shift = {
        id: Date.now(),
        date,
        startTime,
        endTime,
        hours: hours.toFixed(2),
        hourlyRate,
        earnings: earnings.toFixed(2),
        notes
    };

    shifts.push(shift);
    saveShifts();

    e.target.reset();
    setDefaultDate();

    showToast('Turno aggiunto con successo! ✓', 'success');

    if (document.getElementById('calendario-tab').classList.contains('active')) {
        renderCalendar();
    }

    scheduleNotification(shift);
}

function deleteShift(id) {
    if (!confirm('Sei sicuro di voler eliminare questo turno?')) return;

    shifts = shifts.filter(shift => shift.id !== id);
    saveShifts();
    renderCalendar();
    updateSummary();

    showToast('Turno eliminato', 'success');
}

// ============================
// RIEPILOGO E STATISTICHE
// ============================

function changeSummaryMonth(direction) {
    currentMonth.setMonth(currentMonth.getMonth() + direction);
    updateSummary();
}

function updateSummary() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

    const monthShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.getFullYear() === year && shiftDate.getMonth() === month;
    });

    const totalHours = monthShifts.reduce((sum, shift) => sum + parseFloat(shift.hours), 0);
    const totalEarnings = monthShifts.reduce((sum, shift) => sum + parseFloat(shift.earnings), 0);
    const totalShifts = monthShifts.length;

    document.getElementById('total-hours').textContent = formatHours(totalHours);
    document.getElementById('total-shifts').textContent = totalShifts;
    document.getElementById('total-earnings').textContent = `€ ${totalEarnings.toFixed(2)}`;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ============================
// NOTIFICHE
// ============================

// ✅ MODIFICA: Aggiorna checkNotificationPermission
function checkNotificationPermission() {
    const checkbox = document.getElementById('notifications-enabled');
    const timeInput = document.getElementById('notification-time');
    const hourlyRateInput = document.getElementById('default-hourly-rate');
    const testToggle = document.getElementById('show-test-notification');
    
    if ('Notification' in window) {
        checkbox.checked = Notification.permission === 'granted' && settings.notificationsEnabled;
        if (timeInput) timeInput.value = settings.notificationTime;
        if (hourlyRateInput) hourlyRateInput.value = settings.defaultHourlyRate;
        if (testToggle) testToggle.checked = settings.showTestButton;
        updateTestButtonVisibility();  // ✅ AGGIUNTO
    } else {
        checkbox.disabled = true;
    }
}

async function toggleNotifications() {
    const checkbox = document.getElementById('notifications-enabled');
    
    if (checkbox.checked) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            checkbox.checked = false;
            showToast('Permesso notifiche negato', 'error');
            return;
        }
        settings.notificationsEnabled = true;
        scheduleDailyNotification();
        showToast('Notifiche abilitate! 🔔', 'success');
    } else {
        settings.notificationsEnabled = false;
        showToast('Notifiche disabilitate', 'success');
    }
    
    saveSettings();
}

function scheduleNotification(shift) {
    if (!settings.notificationsEnabled) return;
    if (Notification.permission !== 'granted') return;
}

function scheduleDailyNotification() {
    if (!settings.notificationsEnabled) return;
    if (Notification.permission !== 'granted') return;
    
    const checkAndNotify = () => {
        const now = new Date();
        const [hours, minutes] = settings.notificationTime.split(':');
        const notificationTime = new Date();
        notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (now > notificationTime) {
            notificationTime.setDate(notificationTime.getDate() + 1);
        }
        
        const delay = notificationTime - now;
        
        setTimeout(() => {
            const notificationDate = new Date().toISOString().split('T')[0];
            localStorage.setItem('notification_date', notificationDate);
    
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ 
                    type: 'SHOW_START_NOTIFICATION',
                    date: notificationDate  // ✅ AGGIUNGI QUESTO
                });
            }
    
            scheduleDailyNotification();
        }, delay);
    };
    
    checkAndNotify();
}

// ============================
// ✅ NOTIFICHE INTERATTIVE - NUOVE FUNZIONI
// ============================

function toggleTestButton() {
    const checkbox = document.getElementById('show-test-notification');
    settings.showTestButton = checkbox.checked;
    saveSettings();
    updateTestButtonVisibility();
    
    if (settings.showTestButton) {
        showToast('Pulsante test attivato 🧪', 'success');
    } else {
        showToast('Pulsante test nascosto', 'success');
    }
}

function updateTestButtonVisibility() {
    const button = document.getElementById('test-notification-btn');
    if (button) {
        if (settings.showTestButton) {
            button.classList.remove('hidden');
        } else {
            button.classList.add('hidden');
        }
    }
}

async function sendTestNotification() {
    if (!settings.notificationsEnabled) {
        showToast('⚠️ Abilita prima le notifiche!', 'error');
        return;
    }
    
    if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            showToast('Permesso negato', 'error');
            return;
        }
    }
    
    const notificationDate = new Date().toISOString().split('T')[0];
    localStorage.setItem('notification_date', notificationDate);
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ 
            type: 'SHOW_START_NOTIFICATION',
            date: notificationDate  // ✅ AGGIUNGI QUESTO
        });
        showToast('📱 Notifica test inviata!', 'success');
    } else {
        showToast('⚠️ Service Worker non pronto', 'error');
    }
}

// Gestisci risposta da Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[APP] Messaggio da SW:', event.data);
        
        if (event.data.type === 'NOTIFICATION_ACTION') {
            handleNotificationAction(event.data.action, event.data.date);
        }
    });
}

function handleNotificationAction(action, notificationDate) {
    console.log('[APP] Gestisco azione:', action, notificationDate);
    
    if (!notificationDate) {
        notificationDate = localStorage.getItem('notification_date') || new Date().toISOString().split('T')[0];
    }
    
    if (action === 'rest') {
        const restShift = {
            id: Date.now(),
            date: notificationDate,
            startTime: '/',
            endTime: '/',
            hours: '0',
            hourlyRate: settings.defaultHourlyRate,
            earnings: '0.00',
            notes: '',
            isRest: true
        };
        
        shifts.push(restShift);
        saveShifts();
        renderCalendar();
        updateSummary();
        showToast('✓ Riposo registrato', 'success');
        
    } else if (action === 'set-shift' || action === 'open') {
        // Vai al calendario e apri lancette
        switchTab('calendario');
        setTimeout(() => {
            showQuickAddShift(notificationDate);
        }, 300);
    }
    
    localStorage.removeItem('notification_date');
}

async function checkQuickAddFromNotification() {
    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    const quickAddDate = urlParams.get('quickadd');
    
    if (quickAddDate) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
            showQuickAddShift(quickAddDate);
        }, 500);
        return;
    }
    
    // ✅ CHECK PENDING ACTIONS da Service Worker
    if ('caches' in window) {
        try {
            const cache = await caches.open('temp-actions');
            const response = await cache.match('/pending-action');
            
            if (response) {
                const data = await response.json();
                
                // Verifica che non sia vecchia (max 10 secondi)
                if (Date.now() - data.timestamp < 10000) {
                    console.log('[APP] Eseguo azione pendente:', data);
                    
                    // Rimuovi l'azione
                    await cache.delete('/pending-action');
                    
                    // Esegui azione
                    if (data.action === 'rest') {
                        const restShift = {
                            id: Date.now(),
                            date: data.date,
                            startTime: '/',
                            endTime: '/',
                            hours: '0',
                            hourlyRate: settings.defaultHourlyRate,
                            earnings: '0.00',
                            notes: '',
                            isRest: true
                        };
                        
                        shifts.push(restShift);
                        saveShifts();
                        renderCalendar();
                        updateSummary();
                        showToast('✓ Riposo registrato', 'success');
                        
                    } else if (data.action === 'set-shift') {
                        switchTab('calendario');
                        setTimeout(() => {
                            showQuickAddShift(data.date);
                        }, 500);
                    }
                } else {
                    // Troppo vecchia, elimina
                    await cache.delete('/pending-action');
                }
            }
        } catch (error) {
            console.error('[APP] Errore controllo azioni pendenti:', error);
        }
    }
}

// ============================
// IMPORT/EXPORT DATI
// ============================

function exportData() {
    const data = {
        shifts,
        settings,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hello-work-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Dati esportati con successo! 💾', 'success');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            if (!data.shifts || !Array.isArray(data.shifts)) {
                throw new Error('Formato file non valido');
            }
            
            if (confirm(`Importare ${data.shifts.length} turni? I dati attuali verranno sostituiti.`)) {
                shifts = data.shifts;
                if (data.settings) {
                    settings = { ...settings, ...data.settings };
                }
                
                saveShifts();
                saveSettings();
                applyTheme();
                renderCalendar();
                updateSummary();
                
                showToast('Dati importati con successo! 📥', 'success');
            }
        } catch (error) {
            showToast('Errore nell\'importazione: file non valido', 'error');
        }
    };
    
    reader.readAsText(file);
}

function clearAllData() {
    if (!confirm('Sei sicuro di voler cancellare TUTTI i dati? Questa azione non può essere annullata!')) return;
    if (!confirm('Sei DAVVERO sicuro? Tutti i turni verranno eliminati permanentemente!')) return;
    
    shifts = [];
    saveShifts();
    renderCalendar();
    updateSummary();
    
    showToast('Tutti i dati sono stati cancellati', 'success');
}

// ============================
// UTILITY
// ============================

function formatDate(dateString) {
    const date = new Date(dateString + 'T12:00:00');
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('it-IT', options);
}

function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) {
        return `${h}h`;
    }
    return `${h}h ${m}m`;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ============================
// SERVICE WORKER REGISTRATION
// ============================

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/HelloWork/HelloWork/service-worker.js')
        .then(reg => console.log('Service Worker registrato'))
        .catch(err => console.log('Errore Service Worker:', err));
}

// ============================
// SWIPE GESTURES
// ============================

let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
let swipeTarget = null;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    swipeTarget = e.target;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffY) > Math.abs(diffX)) return;
    if (Math.abs(diffX) < 50) return;

    const isOnCalendarContainer = swipeTarget.closest('.calendar-container');
    const isOnMonthSelector = swipeTarget.closest('.month-selector');
    const isOnSummaryCards = swipeTarget.closest('.summary-cards');

    const isOnCalendarTab = document.getElementById('calendario-tab').classList.contains('active');
    const isOnRiepilogoTab = document.getElementById('riepilogo-tab').classList.contains('active');

    if (isOnCalendarTab) {
        if (isOnCalendarContainer) {
            if (diffX > 0) {
                changeCalendarMonth(-1);
            } else {
                changeCalendarMonth(1);
            }
        } else {
            if (diffX < -100) {
                switchTab('riepilogo');
            }
        }
    }
    else if (isOnRiepilogoTab) {
        if (isOnMonthSelector) {
            if (diffX > 0) {
                changeSummaryMonth(-1);
            } else {
                changeSummaryMonth(1);
            }
        } else if (!isOnSummaryCards) {
            if (diffX > 100) {
                switchTab('calendario');
            }
        }
    }
});