let sessions = JSON.parse(localStorage.getItem('sessions')) || [];
let selectedDate = new Date();
const sessionsContainer = document.getElementById('sessions-container');
const dailyOverview = document.getElementById('daily-overview');
const monthlySummary = document.getElementById('monthly-summary');
const calendarGrid = document.getElementById('calendar-grid');
const monthLabel = document.getElementById('month-label');

function saveSessions() {
  localStorage.setItem('sessions', JSON.stringify(sessions));
}

// Calendar Rendering
function renderCalendar() {
  calendarGrid.innerHTML = '';
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  monthLabel.textContent = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const div = document.createElement('div');
    div.classList.add('calendar-day');
    div.textContent = day;

    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (sessions.some(s => s.date === dateString)) {
      div.style.boxShadow = "0 0 8px #00e5ff";
    }

    if (dateString === selectedDate.toISOString().split('T')[0]) {
      div.classList.add('active');
    }

    div.addEventListener('click', () => {
      selectedDate = new Date(dateString);
      renderCalendar();
      renderSessions();
      renderOverview();
    });

    calendarGrid.appendChild(div);
  }
}

document.getElementById('prev-month').addEventListener('click', () => {
  selectedDate.setMonth(selectedDate.getMonth() - 1);
  renderCalendar();
  renderSessions();
  renderOverview();
});

document.getElementById('next-month').addEventListener('click', () => {
  selectedDate.setMonth(selectedDate.getMonth() + 1);
  renderCalendar();
  renderSessions();
  renderOverview();
});

// Sessions
function createSession() {
  const session = {
    id: Date.now(),
    date: selectedDate.toISOString().split('T')[0],
    startTime: null,
    endTime: null,
    notes: '',
    duration: 0,
    running: false,
    intervalId: null,
    tags: []
  };
  sessions.push(session);
  saveSessions();
  renderSessions();
  renderOverview();
  renderCalendar();
}

function startTimer(sessionId) {
  const session = sessions.find(s => s.id === sessionId);
  if (session.running) return;
  session.running = true;
  session.startTime = session.startTime || new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka' });
  const display = document.getElementById(`timer-${session.id}`);
  session.intervalId = setInterval(() => {
    session.duration++;
    let minutes = Math.floor(session.duration / 60);
    let seconds = session.duration % 60;
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
  saveSessions();
}

function stopTimer(sessionId) {
  const session = sessions.find(s => s.id === sessionId);
  if (!session.running) return;
  session.running = false;
  clearInterval(session.intervalId);
  session.endTime = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka' });
  saveSessions();
  renderOverview();
}

function deleteSession(sessionId) {
  sessions = sessions.filter(s => s.id !== sessionId);
  saveSessions();
  renderSessions();
  renderOverview();
  renderCalendar();
}

function updateNotes(sessionId) {
  const session = sessions.find(s => s.id === sessionId);
  const textarea = document.getElementById(`notes-${session.id}`);
  session.notes = textarea.value;
  saveSessions();
}

function addTag(sessionId) {
  const tagInput = document.getElementById(`tag-input-${sessionId}`);
  const tagValue = tagInput.value.trim();
  if (tagValue === '') return;
  const session = sessions.find(s => s.id === sessionId);
  session.tags.push(tagValue);
  tagInput.value = '';
  saveSessions();
  renderSessions();
  renderOverview();
}

function renderSessions() {
  sessionsContainer.innerHTML = '';
  const daySessions = sessions.filter(s => s.date === selectedDate.toISOString().split('T')[0]);
  daySessions.forEach(session => {
    const div = document.createElement('div');
    div.classList.add('session');
    div.innerHTML = `
      <div class="timer-display" id="timer-${session.id}">${Math.floor(session.duration/60).toString().padStart(2,'0')}:${(session.duration%60).toString().padStart(2,'0')}</div>
      <button onclick="startTimer(${session.id})">▶️ Start</button>
      <button onclick="stopTimer(${session.id})">⏹️ Stop</button>
      <button onclick="deleteSession(${session.id})">🗑️ Delete</button>
      <p>Start: ${session.startTime || '--'} | End: ${session.endTime || '--'}</p>
      <textarea id="notes-${session.id}" placeholder="💬 What do you learn??" oninput="updateNotes(${session.id})">${session.notes}</textarea>
      <div class="tag-list">${session.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>
      <input type="text" id="tag-input-${session.id}" placeholder="➕ Add Tag">
      <button onclick="addTag(${session.id})">Add Tag</button>
    `;
    sessionsContainer.appendChild(div);
  });
}

function renderOverview() {
  dailyOverview.innerHTML = '';
  const daySessions = sessions.filter(s => s.date === selectedDate.toISOString().split('T')[0]);
  if (daySessions.length === 0) {
    dailyOverview.textContent = 'No sessions for this day.';
    return;
  }

  let totalDayDuration = 0;
  daySessions.forEach(s => {
    totalDayDuration += s.duration;
    const div = document.createElement('div');
    div.innerHTML = `
      <strong>Session:</strong> ${s.startTime || '--'} → ${s.endTime || '--'} | Duration: ${Math.floor(s.duration/60)}m ${s.duration%60}s
      <br><strong>Notes:</strong> ${s.notes}
      <br><strong>Tags:</strong> ${s.tags.join(', ')}
      <hr>
    `;
    dailyOverview.appendChild(div);
  });

  const hours = Math.floor(totalDayDuration/3600);
  const minutes = Math.floor((totalDayDuration%3600)/60);
  const totalDiv = document.createElement('div');
  totalDiv.innerHTML = `<strong>📌 Total Today:</strong> ${hours}h ${minutes}m`;
  dailyOverview.appendChild(totalDiv);

  // Monthly Summary
  const month = selectedDate.toISOString().slice(0,7);
  const monthSessions = sessions.filter(s => s.date.startsWith(month));
  const totalDuration = monthSessions.reduce((sum, s) => sum + s.duration, 0);
  const mhours = Math.floor(totalDuration/3600);
  const mminutes = Math.floor((totalDuration%3600)/60);
  monthlySummary.textContent = `Total study time this month: ${mhours}h ${mminutes}m`;
}

document.getElementById('add-session-btn').addEventListener('click', createSession);

renderCalendar();
renderSessions();
renderOverview();
