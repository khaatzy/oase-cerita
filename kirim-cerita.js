  // AUTH GUARD: HANYA PENGGUNA LOGIN YANG DAPAT MENGAKSES
  (async function checkAuthGuard() {
    let session = null;
    if (window.AuthService && window.AuthService.getSession) {
      try { session = await window.AuthService.getSession(); } catch (e) {}
    }
    const activeEmail = localStorage.getItem('oase_active_user_email');
    if (!session && !activeEmail) {
      sessionStorage.setItem('oase_auth_redirect', window.location.pathname.split('/').pop() || 'kirim-cerita.html');
      window.location.href = 'dashboard-awal.html?auth=required';
      return;
    }
  })();

  // Initialize Lucide Icons
  lucide.createIcons();

    // DOM Elements
    const counselorsGrid = document.getElementById('counselorsGrid');
    const selectedCounselorIdInput = document.getElementById('selectedCounselorIdInput');
    const selectedCounselorNameInput = document.getElementById('selectedCounselorNameInput');
    const selectedGenderInput = document.getElementById('selectedGenderInput');
    const selectedCategoryInput = document.getElementById('selectedCategoryInput');
    const storyTextarea = document.getElementById('storyContentTextarea');
    const currentWordCountSpan = document.getElementById('currentWordCount');
    const wordCountWarning = document.getElementById('wordCountWarning');
    const submissionForm = document.getElementById('storySubmissionForm');
    const submitBtn = document.getElementById('submitStoryBtn');

    // Modals
    const successModal = document.getElementById('successModal');
    const ticketCodeDisplay = document.getElementById('ticketCodeDisplay');
    const copyTicketBtn = document.getElementById('copyTicketBtn');
    const copyFeedbackText = document.getElementById('copyFeedbackText');
    const modalCheckStatusBtn = document.getElementById('modalCheckStatusBtn');

    const checkTicketModal = document.getElementById('checkTicketModal');
    const openCheckTicketBtn = document.getElementById('openCheckTicketBtn');
    const closeCheckTicketModalBtn = document.getElementById('closeCheckTicketModalBtn');
    const searchTicketInput = document.getElementById('searchTicketInput');
    const searchTicketBtn = document.getElementById('searchTicketBtn');
    const ticketResultBox = document.getElementById('ticketResultBox');

    // 1. RENDER COUNSELORS FROM counselors.js
    function renderCounselors() {
      const counselors = window.COUNSELORS_DATA || [];
      if (!counselorsGrid) return;
      counselorsGrid.innerHTML = '';

      counselors.forEach((c, index) => {
        const isDefault = index === 0; // Pilihkan otomatis by default
        const card = document.createElement('div');
        card.className = `counselor-card p-4 rounded-2xl border border-oase-border bg-oase-surface/50 hover:bg-heather-50/80 cursor-pointer transition-all flex items-start gap-3.5 relative ${isDefault ? 'selected' : ''}`;
        card.setAttribute('data-id', c.id);
        card.setAttribute('data-name', c.name);

        card.innerHTML = `
          <div class="relative flex-shrink-0">
            <img src="${c.avatar}" alt="${c.name}" class="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-sm w-12 h-12">
            <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" title="${c.status}"></span>
          </div>
          <div class="flex-grow min-w-0 pr-6">
            <div class="flex items-center gap-2">
              <h4 class="text-sm font-bold text-oase-plum truncate">${c.name}</h4>
            </div>
            <p class="text-xs text-heather-600 font-medium truncate mt-0.5">${c.role}</p>
            <div class="flex flex-wrap gap-1 mt-2">
              ${c.specialties.map(s => `<span class="px-2 py-0.5 rounded-md bg-white border border-heather-200 text-[10px] font-semibold text-heather-700">${s}</span>`).join('')}
            </div>
          </div>
          <div class="counselor-indicator w-5 h-5 rounded-full border-2 border-oase-border flex items-center justify-center flex-shrink-0 absolute top-4 right-4 transition-colors">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
        `;

        card.addEventListener('click', () => {
          document.querySelectorAll('.counselor-card').forEach(el => el.classList.remove('selected'));
          card.classList.add('selected');
          selectedCounselorIdInput.value = c.id;
          selectedCounselorNameInput.value = c.name;
        });

        counselorsGrid.appendChild(card);
      });

      if (counselors.length > 0) {
        selectedCounselorIdInput.value = counselors[0].id;
        selectedCounselorNameInput.value = counselors[0].name;
      }
    }

    // 2. EDUCATION SELECTION HANDLER (PILIHAN TOMBOL JENJANG)
    document.querySelectorAll('.education-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.education-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('educationLevelSelect').value = btn.getAttribute('data-education');
      });
    });

    // 3. GENDER SELECTION HANDLER
    document.querySelectorAll('.gender-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.gender-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedGenderInput.value = btn.getAttribute('data-gender');
      });
    });

    // 4. CATEGORY SELECTION HANDLER
    document.querySelectorAll('.category-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategoryInput.value = btn.getAttribute('data-category');
      });
    });

    // 4. LIVE WORD COUNTER (MAX 2000 WORDS)
    storyTextarea.addEventListener('input', () => {
      const text = storyTextarea.value.trim();
      const words = text ? text.split(/\s+/).length : 0;
      currentWordCountSpan.textContent = words;

      if (words > 2000) {
        wordCountWarning.classList.remove('hidden');
        storyTextarea.classList.add('border-red-400', 'focus:border-red-500', 'focus:ring-red-100');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        wordCountWarning.classList.add('hidden');
        storyTextarea.classList.remove('border-red-400', 'focus:border-red-500', 'focus:ring-red-100');
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    });

    // 5. FORM SUBMISSION
    submissionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validasi gender
      if (!selectedGenderInput.value) {
        alert('Silakan pilih Jenis Kelamin terlebih dahulu.');
        return;
      }

      // Validasi kategori
      if (!selectedCategoryInput.value) {
        alert('Silakan pilih salah satu Kategori Cerita.');
        return;
      }

      const rawAuthorName = document.getElementById('authorNameInput').value;
      const educationLevel = document.getElementById('educationLevelSelect').value;
      const gradeClass = document.getElementById('gradeClassInput').value;
      const gender = selectedGenderInput.value;
      const category = selectedCategoryInput.value;
      const counselorId = selectedCounselorIdInput.value;
      const counselorName = selectedCounselorNameInput.value;
      const storyContent = storyTextarea.value.trim();

      // Cek jumlah kata
      const words = storyContent.split(/\s+/).length;
      if (words > 2000) {
        alert('Cerita Anda melebihi batas 2000 kata. Mohon dipersingkat.');
        return;
      }

      // Cek apakah ada akun pengguna yang sedang login untuk audit identitas
      let userEmail = null;
      let userId = null;
      let userRealName = null;

      try {
        if (window.AuthService && window.AuthService.getSession) {
          const authSession = await window.AuthService.getSession();
          if (authSession && authSession.user) {
            userEmail = authSession.user.email;
            userId = authSession.user.id;
            const profile = await window.AuthService.getUserProfile(userId, userEmail);
            if (profile) {
              userRealName = profile.display_name || profile.full_name || null;
            }
          }
        }
      } catch (err) {}

      if (!userEmail) {
        try {
          const savedProfiles = JSON.parse(localStorage.getItem('oase_user_profiles') || '{}');
          const keys = Object.keys(savedProfiles);
          if (keys.length > 0) {
            userEmail = keys[0];
            userRealName = savedProfiles[userEmail].display_name || savedProfiles[userEmail].full_name || null;
          }
        } catch (e) {}
      }

      // Cek deteksi kata SARA, kekerasan, atau krisis
      const safetyCheck = window.CrisisDetectionService ? window.CrisisDetectionService.checkContent(storyContent) : { isViolation: false };
      if (safetyCheck.isViolation) {
        alert(`⚠️ PERINGATAN SISTEM: Cerita Anda terdeteksi mengandung kata krisis/SARA atau berbahaya ("${safetyCheck.matchedKeyword}"). Sistem telah mencatat aktivitas ini dan informasi akun untuk ditinjau konselor secara prioritas demi keselamatan bersama.`);
      }

      // Tampilkan status loading tombol
      const originalBtnHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Mengirim Cerita & Membuat Tiket...</span>
      `;

      try {
        const result = await window.CounselingService.submitCounselingStory({
          authorName: rawAuthorName,
          educationLevel,
          gradeClass,
          gender,
          category,
          counselorId,
          counselorName,
          storyContent,
          userEmail,
          userId,
          userRealName
        });

        // Sukses! Tampilkan modal receipt dengan kode unik
        ticketCodeDisplay.textContent = result.ticketCode;
        successModal.classList.remove('hidden');

        // Simpan ke riwayat tiket lokal agar mudah dicek kembali
        try {
          let savedTickets = JSON.parse(localStorage.getItem('oase_my_anon_tickets') || '[]');
          if (!savedTickets.includes(result.ticketCode)) {
            savedTickets.unshift(result.ticketCode);
            localStorage.setItem('oase_my_anon_tickets', JSON.stringify(savedTickets.slice(0, 15)));
          }
        } catch (e) {}

        // Reset form
        submissionForm.reset();
        selectedGenderInput.value = '';
        selectedCategoryInput.value = '';
        document.querySelectorAll('.gender-chip').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.education-chip').forEach(b => b.classList.remove('active'));
        const defaultEdu = document.querySelector('.education-chip[data-education="SMA / SMK / MA"]');
        if (defaultEdu) defaultEdu.classList.add('active');
        document.getElementById('educationLevelSelect').value = 'SMA / SMK / MA';
        currentWordCountSpan.textContent = '0';

      } catch (err) {
        console.error('Gagal mengirim cerita:', err);
        alert('Terjadi kendala saat mengirim cerita. Silakan coba lagi.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    });

    // 6. COPY TICKET CODE
    copyTicketBtn.addEventListener('click', () => {
      const code = ticketCodeDisplay.textContent;
      navigator.clipboard.writeText(code).then(() => {
        copyFeedbackText.classList.remove('hidden');
        setTimeout(() => copyFeedbackText.classList.add('hidden'), 3000);
      });
    });

        // 7. MODAL CHECK TICKET STATUS & RIWAYAT CURHAT
    const curhatTabSearchBtn = document.getElementById('curhatTabSearchBtn');
    const curhatTabHistoryBtn = document.getElementById('curhatTabHistoryBtn');
    const curhatMyHistoryCountBadge = document.getElementById('curhatMyHistoryCountBadge');
    const curhatSearchPanel = document.getElementById('curhatSearchPanel');
    const curhatHistoryPanel = document.getElementById('curhatHistoryPanel');
    const refreshCurhatHistoryBtn = document.getElementById('refreshCurhatHistoryBtn');
    const curhatHistoryList = document.getElementById('curhatHistoryList');
    const closeCheckTicketFooterBtn = document.getElementById('closeCheckTicketFooterBtn');

    function switchCurhatTab(tab) {
      if (tab === 'search') {
        if (curhatTabSearchBtn) {
          curhatTabSearchBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-rose-900 shadow-2xs border border-rose-200";
        }
        if (curhatTabHistoryBtn) {
          curhatTabHistoryBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-rose-900";
        }
        if (curhatSearchPanel) curhatSearchPanel.classList.remove('hidden');
        if (curhatHistoryPanel) curhatHistoryPanel.classList.add('hidden');
      } else {
        if (curhatTabHistoryBtn) {
          curhatTabHistoryBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-rose-900 shadow-2xs border border-rose-200";
        }
        if (curhatTabSearchBtn) {
          curhatTabSearchBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-rose-900";
        }
        if (curhatHistoryPanel) curhatHistoryPanel.classList.remove('hidden');
        if (curhatSearchPanel) curhatSearchPanel.classList.add('hidden');
        renderCurhatHistoryList();
      }
      if (window.lucide) lucide.createIcons();
    }

    async function renderCurhatHistoryList() {
      if (!curhatHistoryList) return;

      curhatHistoryList.innerHTML = `
        <div class="p-8 text-center text-xs text-gray-500">
          <i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-rose-600"></i>
          <span>Memuat riwayat curhat Anda...</span>
        </div>
      `;
      if (window.lucide) lucide.createIcons();

      let stories = [];
      try {
        if (window.CounselingService && typeof window.CounselingService.getMySubmissions === 'function') {
          stories = await window.CounselingService.getMySubmissions();
        } else {
          stories = JSON.parse(localStorage.getItem('oase_my_anon_stories') || '[]');
        }
      } catch(e) {
        stories = JSON.parse(localStorage.getItem('oase_my_anon_stories') || '[]');
      }

      if (curhatMyHistoryCountBadge) {
        curhatMyHistoryCountBadge.textContent = stories.length;
      }

      if (!stories || stories.length === 0) {
        curhatHistoryList.innerHTML = `
          <div class="p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center space-y-2 bg-gray-50/50">
            <div class="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <i data-lucide="clock" class="w-5 h-5"></i>
            </div>
            <p class="text-xs font-semibold text-gray-700">Belum ada riwayat curhat</p>
            <p class="text-[11px] text-gray-400">Curhat yang kamu kirimkan melalui perangkat atau akun ini akan otomatis tercatat di sini.</p>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      curhatHistoryList.innerHTML = stories.map(s => {
        const isReplied = !!(s.counselor_reply && s.counselor_reply.trim() !== '');
        const statusBadge = isReplied
          ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i> Sudah Dibalas</span>`
          : `<span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3 text-amber-600"></i> Menunggu Tanggapan</span>`;

        const dateStr = s.created_at
          ? new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Baru saja';

        const snippet = (s.story_content || '').substring(0, 110);

        return `
          <div class="history-curhat-item p-4 rounded-2xl border border-gray-200 hover:border-rose-300 bg-white hover:bg-rose-50/20 transition-all shadow-2xs space-y-2.5 cursor-pointer text-left" data-ticket="${s.ticket_code}">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-xs font-extrabold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">${s.ticket_code}</span>
                <button type="button" class="copy-curhat-ticket-btn p-1 text-gray-400 hover:text-rose-700 rounded-md hover:bg-rose-100/50 transition-colors" data-code="${s.ticket_code}" title="Salin Kode Tiket">
                  <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                </button>
              </div>
              ${statusBadge}
            </div>

            <div class="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
              <span class="font-bold text-gray-700 flex items-center gap-1"><i data-lucide="tag" class="w-3 h-3 text-rose-500"></i> ${s.category || 'Curhat'}</span>
              <span>•</span>
              <span class="flex items-center gap-1"><i data-lucide="user-check" class="w-3 h-3 text-heather-500"></i> ${s.counselor_name || 'Konselor OASE'}</span>
              <span>•</span>
              <span>${dateStr}</span>
            </div>

            <p class="text-xs text-gray-600 line-clamp-2 italic leading-relaxed bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
              "${snippet}${snippet.length >= 110 ? '...' : ''}"
            </p>

            ${isReplied ? `
              <div class="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <span class="flex items-center gap-1 font-bold"><i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-600"></i> Konselor telah membalas!</span>
                <span class="text-[11px] font-bold text-emerald-700 underline flex items-center gap-0.5">Baca Jawaban &rarr;</span>
              </div>
            ` : `
              <div class="text-[11px] text-amber-700 flex items-center gap-1">
                <i data-lucide="hourglass" class="w-3 h-3"></i>
                <span>Sedang dalam antrean penelaahan konselor</span>
              </div>
            `}
          </div>
        `;
      }).join('');

      curhatHistoryList.querySelectorAll('.history-curhat-item').forEach(card => {
        card.onclick = (e) => {
          if (e.target.closest('.copy-curhat-ticket-btn')) return;
          const ticketCode = card.dataset.ticket;
          switchCurhatTab('search');
          if (searchTicketInput) searchTicketInput.value = ticketCode;
          searchTicketBtn.click();
        };
      });

      curhatHistoryList.querySelectorAll('.copy-curhat-ticket-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const code = btn.dataset.code;
          navigator.clipboard.writeText(code).then(() => {
            alert(`Kode tiket ${code} berhasil disalin!`);
          });
        };
      });

      if (window.lucide) lucide.createIcons();
    }

    if (curhatTabSearchBtn) curhatTabSearchBtn.addEventListener('click', () => switchCurhatTab('search'));
    if (curhatTabHistoryBtn) curhatTabHistoryBtn.addEventListener('click', () => switchCurhatTab('history'));
    if (refreshCurhatHistoryBtn) refreshCurhatHistoryBtn.addEventListener('click', () => renderCurhatHistoryList());
    if (closeCheckTicketFooterBtn) closeCheckTicketFooterBtn.addEventListener('click', () => {
      checkTicketModal.classList.add('hidden');
    });

    openCheckTicketBtn.addEventListener('click', () => {
      checkTicketModal.classList.remove('hidden');
      ticketResultBox.classList.add('hidden');
      searchTicketInput.value = '';
      switchCurhatTab('search');
      if (window.CounselingService && typeof window.CounselingService.getMySubmissions === 'function') {
        window.CounselingService.getMySubmissions().then(stories => {
          if (curhatMyHistoryCountBadge) curhatMyHistoryCountBadge.textContent = stories.length;
        }).catch(() => {});
      }
    });

    closeCheckTicketModalBtn.addEventListener('click', () => {
      checkTicketModal.classList.add('hidden');
    });

    modalCheckStatusBtn.addEventListener('click', () => {
      const currentCode = ticketCodeDisplay.textContent;
      successModal.classList.add('hidden');
      checkTicketModal.classList.remove('hidden');
      searchTicketInput.value = currentCode;
      searchTicketBtn.click();
    });

    searchTicketBtn.addEventListener('click', async () => {
      const queryCode = searchTicketInput.value.trim().toUpperCase();
      if (!queryCode) {
        alert('Masukkan kode tiket terlebih dahulu.');
        return;
      }

      searchTicketBtn.disabled = true;
      searchTicketBtn.innerHTML = 'Mencari...';

      try {
        const data = await window.CounselingService.getStoryByTicket(queryCode);
        ticketResultBox.classList.remove('hidden');

        if (!data) {
          ticketResultBox.innerHTML = `
            <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center space-y-1">
              <p class="font-bold">Kode Tiket Tidak Ditemukan</p>
              <p>Pastikan kode tiket yang kamu masukkan sudah benar (contoh: OASE-8392-AB).</p>
            </div>
          `;
        } else {
          const isReplied = data.counselor_reply && data.counselor_reply.trim() !== '';
          const statusBadge = isReplied 
            ? '<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Sudah Dibalas Konselor</span>' 
            : '<span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">Sedang Ditinjau Konselor</span>';

          ticketResultBox.innerHTML = `
            <div class="bg-oase-surface p-4 rounded-2xl border border-oase-border space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-heather-700">${data.ticket_code}</span>
                ${statusBadge}
              </div>
              <div class="text-xs space-y-1 text-oase-muted">
                <p><strong>Pengirim:</strong> ${data.author_name} (${data.education_level}${data.grade_class ? ' - ' + data.grade_class : ''})</p>
                <p><strong>Kategori:</strong> ${data.category}</p>
                <p><strong>Konselor:</strong> ${data.counselor_name}</p>
              </div>

              <div class="pt-2 border-t border-oase-border">
                <p class="text-xs font-bold text-oase-plum mb-1">Cerita Kamu:</p>
                <div class="p-3 bg-white rounded-xl border border-oase-border text-xs text-oase-muted italic max-h-32 overflow-y-auto leading-relaxed">
                  "${data.story_content}"
                </div>
              </div>

              ${isReplied ? `
                <div class="pt-2 border-t border-emerald-100">
                  <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                    <i data-lucide="message-circle" class="w-4 h-4 text-emerald-600"></i>
                    <span>Tanggapan dari ${data.counselor_name}:</span>
                  </div>
                  <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-medium leading-relaxed">
                    ${data.counselor_reply}
                  </div>
                </div>
              ` : `
                <div class="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <i data-lucide="clock" class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"></i>
                  <span>Konselor sedang membaca ceritamu. Harap simpan kode tiket ini dan cek kembali nanti secara berkala.</span>
                </div>
              `}
            </div>
          `;
          lucide.createIcons();
        }
      } catch (err) {
        console.error('Error saat mencari tiket:', err);
        ticketResultBox.classList.remove('hidden');
        ticketResultBox.innerHTML = `<p class="text-xs text-red-500 text-center">Gagal memuat data tiket. Coba lagi nanti.</p>`;
      } finally {
        searchTicketBtn.disabled = false;
        searchTicketBtn.innerHTML = `
          <i data-lucide="search" class="w-4 h-4"></i>
          <span>Cari</span>
        `;
        lucide.createIcons();
      }
    });

    // Close modal on click outside
    window.addEventListener('click', (e) => {
      if (e.target === checkTicketModal) checkTicketModal.classList.add('hidden');
    });

    // Bantuan Darurat & Laporan Bug Handlers
    const emergencyHelpModal = document.getElementById('emergencyHelpModal');
    const floatingEmergencyBtn = document.getElementById('floatingEmergencyBtn');
    const closeEmergencyModalBtn = document.getElementById('closeEmergencyModalBtn');
    const tabEmergencyBtn = document.getElementById('tabEmergencyBtn');
    const tabBugReportBtn = document.getElementById('tabBugReportBtn');
    const emergencyTabContent = document.getElementById('emergencyTabContent');
    const bugReportTabContent = document.getElementById('bugReportTabContent');
    const sendBugWhatsAppBtn = document.getElementById('sendBugWhatsAppBtn');
    const sendBugEmailBtn = document.getElementById('sendBugEmailBtn');
    const bugCategorySelect = document.getElementById('bugCategorySelect');
    const bugDescriptionInput = document.getElementById('bugDescriptionInput');

    if (floatingEmergencyBtn && emergencyHelpModal) {
      floatingEmergencyBtn.addEventListener('click', () => {
        emergencyHelpModal.classList.remove('hidden');
        lucide.createIcons();
      });
    }

    if (closeEmergencyModalBtn && emergencyHelpModal) {
      closeEmergencyModalBtn.addEventListener('click', () => emergencyHelpModal.classList.add('hidden'));
    }

    if (tabEmergencyBtn && tabBugReportBtn) {
      tabEmergencyBtn.addEventListener('click', () => {
        tabEmergencyBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-rose-500 text-white shadow-xs flex items-center justify-center gap-1.5";
        tabBugReportBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold transition-all text-oase-muted hover:text-oase-plum flex items-center justify-center gap-1.5";
        emergencyTabContent.classList.remove('hidden');
        bugReportTabContent.classList.add('hidden');
      });

      tabBugReportBtn.addEventListener('click', () => {
        tabBugReportBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white shadow-xs flex items-center justify-center gap-1.5";
        tabEmergencyBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold transition-all text-oase-muted hover:text-oase-plum flex items-center justify-center gap-1.5";
        emergencyTabContent.classList.add('hidden');
        bugReportTabContent.classList.remove('hidden');
      });
    }

    if (sendBugWhatsAppBtn) {
      sendBugWhatsAppBtn.addEventListener('click', () => {
        const category = bugCategorySelect.value;
        const desc = bugDescriptionInput.value.trim();
        if (!desc) {
          alert('Mohon isi deskripsi bug atau kendala yang Anda alami.');
          return;
        }
        const text = encodeURIComponent(`Halo Tim IT OASE Cerita, saya ingin melaporkan bug pada Formulir Kirim Cerita:\n\n*Kategori:* ${category}\n*Deskripsi:* ${desc}`);
        window.open(`https://wa.me/6282228176090?text=${text}`, '_blank');
      });
    }

    if (sendBugEmailBtn) {
      sendBugEmailBtn.addEventListener('click', () => {
        const category = bugCategorySelect.value;
        const desc = bugDescriptionInput.value.trim();
        if (!desc) {
          alert('Mohon isi deskripsi bug atau kendala yang Anda alami.');
          return;
        }
        const subject = encodeURIComponent(`[Laporan Bug OASE] - ${category}`);
        const body = encodeURIComponent(`Halo Tim IT OASE Cerita,\n\nSaya ingin melaporkan kendala pada platform OASE Cerita:\n\nKategori: ${category}\nHalaman: Kirim Cerita\nDeskripsi: ${desc}\n\nTerima kasih.`);
        window.location.href = `mailto:arkhanzaazs020911@gmail.com?subject=${subject}&body=${body}`;
      });
    }

    // Initial render
    renderCounselors();

    // Auto-open modal jika URL memuat parameter atau hash cek tiket
    if (window.location.hash === '#cek-tiket' || window.location.search.includes('cek=1')) {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('ticket') || '';
      if (checkTicketModal) {
        checkTicketModal.classList.remove('hidden');
        if (codeFromUrl) {
          searchTicketInput.value = codeFromUrl;
          searchTicketBtn.click();
        }
      }
    }

