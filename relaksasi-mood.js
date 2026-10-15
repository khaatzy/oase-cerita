/**
 * OASE Relaksasi & Mood Tracker
 * Fitur: Peta Mood Harian, Animasi Pernapasan 4-7-8 Terpandu, dan Suara Alam Sintetis (Web Audio API)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // AUTH GUARD: HANYA PENGGUNA LOGIN YANG DAPAT MENGAKSES
  let session = null;
  if (window.AuthService && window.AuthService.getSession) {
    try { session = await window.AuthService.getSession(); } catch (e) {}
  }
  const activeEmail = localStorage.getItem('oase_active_user_email');
  if (!session && !activeEmail) {
    sessionStorage.setItem('oase_auth_redirect', window.location.pathname.split('/').pop() || 'relaksasi-mood.html');
    window.location.href = 'dashboard-awal.html?auth=required';
    return;
  }

  if (window.lucide) lucide.createIcons();

  // 1. SETUP TANGGAL HARI INI
  const currentDateLabel = document.getElementById('currentDateLabel');
  const now = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'short' };
  if (currentDateLabel) {
    currentDateLabel.textContent = now.toLocaleDateString('id-ID', options);
  }

  // 2. MOOD TRACKER LOGIC
  const moodChoiceBtns = document.querySelectorAll('.mood-choice-btn');
  const moodNoteInput = document.getElementById('moodNoteInput');
  const saveMoodBtn = document.getElementById('saveMoodBtn');
  const weeklyMoodTrackContainer = document.getElementById('weeklyMoodTrackContainer');

  let selectedMood = 'tenang';
  let selectedMoodIcon = '😌';
  let selectedMoodLabel = 'Tenang';

  // Highlight default
  const defaultBtn = document.querySelector('.mood-choice-btn[data-mood="tenang"]');
  if (defaultBtn) {
    defaultBtn.classList.add('border-heather-500', 'bg-heather-50', 'ring-2', 'ring-heather-300');
  }

  moodChoiceBtns.forEach(btn => {
    btn.onclick = () => {
      moodChoiceBtns.forEach(b => {
        b.classList.remove('border-heather-500', 'bg-heather-50', 'ring-2', 'ring-heather-300');
        b.classList.add('border-heather-100', 'bg-white');
      });
      btn.classList.add('border-heather-500', 'bg-heather-50', 'ring-2', 'ring-heather-300');
      btn.classList.remove('border-heather-100', 'bg-white');

      selectedMood = btn.dataset.mood;
      selectedMoodIcon = btn.dataset.icon;
      selectedMoodLabel = btn.dataset.label;
    };
  });

  function getStoredMoods() {
    return JSON.parse(localStorage.getItem('oase_daily_mood_entries') || '[]');
  }

  function saveStoredMoods(arr) {
    localStorage.setItem('oase_daily_mood_entries', JSON.stringify(arr));
  }

  if (saveMoodBtn) {
    saveMoodBtn.onclick = () => {
      const note = moodNoteInput ? moodNoteInput.value.trim() : '';
      const entries = getStoredMoods();
      const todayStr = new Date().toISOString().split('T')[0];

      // Hapus jika sudah ada entri hari ini, lalu masukkan yang baru
      const filtered = entries.filter(e => e.date !== todayStr);
      filtered.unshift({
        date: todayStr,
        dayName: new Date().toLocaleDateString('id-ID', { weekday: 'short' }),
        mood: selectedMood,
        icon: selectedMoodIcon,
        label: selectedMoodLabel,
        note: note,
        timestamp: new Date().toISOString()
      });

      saveStoredMoods(filtered);
      renderWeeklyMood();
      showToast(`Mood ${selectedMoodLabel} ${selectedMoodIcon} berhasil dicatat hari ini!`);
      if (moodNoteInput) moodNoteInput.value = '';
    };
  }

  function renderWeeklyMood() {
    if (!weeklyMoodTrackContainer) return;
    const entries = getStoredMoods();
    const map = {};
    entries.forEach(e => { map[e.date] = e; });

    // Buat 7 hari terakhir mundur dari hari ini
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayShort = d.toLocaleDateString('id-ID', { weekday: 'short' });
      days.push({
        dateStr,
        dayShort,
        entry: map[dateStr] || null
      });
    }

    weeklyMoodTrackContainer.innerHTML = days.map(d => {
      const hasEntry = !!d.entry;
      return `
        <div class="p-2.5 rounded-2xl ${hasEntry ? 'bg-heather-50 border border-heather-300' : 'bg-slate-50 border border-slate-200'} flex flex-col items-center gap-1">
          <span class="text-[10px] font-bold ${hasEntry ? 'text-heather-800' : 'text-slate-500'}">${d.dayShort}</span>
          <span class="text-xl sm:text-2xl">${hasEntry ? d.entry.icon : '—'}</span>
          <span class="text-[9px] text-oase-muted font-medium truncate max-w-full">${hasEntry ? d.entry.label : 'Kosong'}</span>
        </div>
      `;
    }).join('');
  }

  renderWeeklyMood();

  // 3. LATIHAN PERNAPASAN 4-7-8 TERPANDU
  const breathingCircle = document.getElementById('breathingCircle');
  const breathingActionText = document.getElementById('breathingActionText');
  const breathingTimerText = document.getElementById('breathingTimerText');
  const breathingSubText = document.getElementById('breathingSubText');
  const startBreathingBtn = document.getElementById('startBreathingBtn');
  const stopBreathingBtn = document.getElementById('stopBreathingBtn');

  let breathingInterval = null;
  let isBreathingActive = false;

  async function playSoftChime(frequency = 440) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    } catch (e) {}
  }

  async function runBreathingSession(maxCycles = 3) {
    isBreathingActive = true;
    startBreathingBtn.classList.add('hidden');
    stopBreathingBtn.classList.remove('hidden');

    for (let cycle = 1; cycle <= maxCycles; cycle++) {
      if (!isBreathingActive) break;

      // FASE 1: TARIK NAPAS (4 Detik)
      breathingActionText.textContent = 'Tarik Napas...';
      breathingSubText.textContent = `Tarik perlahan lewat hidung (Siklus ${cycle}/${maxCycles})`;
      breathingCircle.style.transform = 'scale(1.25)';
      breathingCircle.style.boxShadow = '0 0 50px 20px rgba(161, 65, 137, 0.4)';
      playSoftChime(523.25); // Nada C5

      for (let s = 4; s >= 1; s--) {
        if (!isBreathingActive) return;
        breathingTimerText.textContent = s;
        await sleep(1000);
      }

      // FASE 2: TAHAN NAPAS (7 Detik)
      breathingActionText.textContent = 'Tahan Napas...';
      breathingSubText.textContent = 'Tetap tenang dan rilekskan bahumu';
      playSoftChime(587.33); // Nada D5

      for (let s = 7; s >= 1; s--) {
        if (!isBreathingActive) return;
        breathingTimerText.textContent = s;
        await sleep(1000);
      }

      // FASE 3: HEMBUSKAN (8 Detik)
      breathingActionText.textContent = 'Hembuskan...';
      breathingSubText.textContent = 'Keluarkan perlahan lewat mulut dengan lembut';
      breathingCircle.style.transform = 'scale(0.85)';
      breathingCircle.style.boxShadow = 'none';
      playSoftChime(392.00); // Nada G4

      for (let s = 8; s >= 1; s--) {
        if (!isBreathingActive) return;
        breathingTimerText.textContent = s;
        await sleep(1000);
      }
    }

    // Sesi Selesai
    stopBreathingSession(true);
  }

  function stopBreathingSession(completed = false) {
    isBreathingActive = false;
    startBreathingBtn.classList.remove('hidden');
    stopBreathingBtn.classList.add('hidden');

    breathingCircle.style.transform = 'scale(1)';
    breathingCircle.style.boxShadow = 'none';
    breathingTimerText.textContent = '0';

    if (completed) {
      breathingActionText.textContent = 'Luar Biasa! ✨';
      breathingSubText.textContent = 'Tubuh dan pikiranmu sekarang jauh lebih tenang.';
      showToast('Latihan pernapasan 3 siklus selesai. Kerja bagus!');
    } else {
      breathingActionText.textContent = 'Siap?';
      breathingSubText.textContent = 'Tekan tombol mulai untuk latihan';
    }
  }

  if (startBreathingBtn) {
    startBreathingBtn.onclick = () => runBreathingSession(3);
  }

  if (stopBreathingBtn) {
    stopBreathingBtn.onclick = () => stopBreathingSession(false);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 4. SUARA ALAM RELAKSASI BERKUALITAS TINGGI (AUDIO HD ASLI)
  let activeAudio = null;
  let currentPlayingSound = null;

  // Sumber audio lokal & fallback CDN berkecepatan tinggi
  const SOUND_SOURCES = {
    rain: 'audio/rain.mp3',
    waves: 'audio/ocean.mp3',
    night: 'audio/night.mp3'
  };

  const SOUND_FALLBACKS = {
    rain: 'https://ambient-sound-mixer.vercel.app/audio/rain.mp3',
    waves: 'https://ambient-sound-mixer.vercel.app/audio/ocean.mp3',
    night: 'https://ambient-sound-mixer.vercel.app/audio/night.mp3'
  };

  const SOUND_LABELS = {
    rain: 'Rintik Hujan Damai',
    waves: 'Deburan Ombak Pantai',
    night: 'Malam Teduh & Jangkrik'
  };

  async function playSoundscape(type) {
    stopSoundscape();

    const localSrc = SOUND_SOURCES[type] || SOUND_SOURCES.rain;
    const fallbackSrc = SOUND_FALLBACKS[type] || SOUND_FALLBACKS.rain;

    try {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = 0.75;
      audio.src = localSrc;

      audio.onerror = () => {
        if (fallbackSrc && audio.src !== fallbackSrc) {
          audio.src = fallbackSrc;
          audio.play().catch(e => console.warn('Fallback play error:', e));
        }
      };

      await audio.play();
      activeAudio = audio;
      currentPlayingSound = type;
      playSoftChime(523.25);
    } catch (e) {
      console.warn('Gagal memutar audio lokal, mencoba jalur cadangan:', e);
      try {
        const fallbackAudio = new Audio(fallbackSrc);
        fallbackAudio.loop = true;
        fallbackAudio.volume = 0.75;
        await fallbackAudio.play();
        activeAudio = fallbackAudio;
        currentPlayingSound = type;
        playSoftChime(523.25);
      } catch (err) {
        console.error('Pemutaran audio diblokir peramban:', err);
      }
    }
  }

  function stopSoundscape() {
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
        activeAudio.src = '';
      } catch (e) {}
      activeAudio = null;
    }
    currentPlayingSound = null;
  }

  document.querySelectorAll('.sound-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      const soundType = btn.dataset.sound;

      if (currentPlayingSound === soundType) {
        // Stop current
        stopSoundscape();
        btn.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5"></i><span>Putar Suara</span>`;
        btn.classList.remove('bg-heather-500', 'text-white');
        btn.classList.add('bg-white', 'text-heather-800');
        showToast('Suara alam dihentikan.');
      } else {
        // Reset all buttons
        document.querySelectorAll('.sound-toggle-btn').forEach(b => {
          b.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5"></i><span>Putar Suara</span>`;
          b.classList.remove('bg-heather-500', 'text-white');
          b.classList.add('bg-white', 'text-heather-800');
        });

        // Start this sound
        playSoundscape(soundType);
        btn.innerHTML = `<i data-lucide="square" class="w-3.5 h-3.5"></i><span>Hentikan Suara</span>`;
        btn.classList.add('bg-heather-500', 'text-white');
        btn.classList.remove('bg-white', 'text-heather-800');
        showToast(`Memutar ${SOUND_LABELS[soundType] || soundType}... 🎧`);
      }
      lucide.createIcons();
    };
  });

  function showToast(msg) {
    const existing = document.getElementById('oaseToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'oaseToast';
    toast.className = 'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-oase-plum text-white font-bold text-xs shadow-xl border border-heather-400 flex items-center gap-2 animate-fadeIn';
    toast.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4 text-amber-400"></i><span>${msg}</span>`;
    document.body.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
