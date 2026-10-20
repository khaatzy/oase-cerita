// Modul Fitur Curhat Anonim, Riwayat Konseling & Rating Siswa (OASE)
(() => {
    let currentUser = null;
    function getCurrentUser() {
        return currentUser || JSON.parse(localStorage.getItem('oase_active_user') || 'null') || { email: localStorage.getItem('oase_active_user_email') };
    }
    // DOM Elements Fitur Baru (Curhat Anonim, Riwayat & Rating)
    const openAnonCurhatBtn = document.getElementById('openAnonCurhatBtn');
    const anonymousCurhatModal = document.getElementById('anonymousCurhatModal');
    const closeAnonModalBtn = document.getElementById('closeAnonModalBtn');
    const anonCurhatForm = document.getElementById('anonCurhatForm');
    const anonPseudonymLabel = document.getElementById('anonPseudonymLabel');
    const regenerateAnonNameBtn = document.getElementById('regenerateAnonNameBtn');
    const anonCounselorSelect = document.getElementById('anonCounselorSelect');
    const anonCategorySelect = document.getElementById('anonCategorySelect');
    const anonStoryInput = document.getElementById('anonStoryInput');
    const submitAnonStoryBtn = document.getElementById('submitAnonStoryBtn');

    const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
    const sessionHistoryList = document.getElementById('sessionHistoryList');

    const dashRatingModal = document.getElementById('dashRatingModal');
    const dashRatingTitle = document.getElementById('dashRatingTitle');
    const dashStarLabel = document.getElementById('dashStarLabel');
    const dashRatingReviewInput = document.getElementById('dashRatingReviewInput');
    const closeDashRatingModalBtn = document.getElementById('closeDashRatingModalBtn');
    const submitDashRatingBtn = document.getElementById('submitDashRatingBtn');

    // State Tambahan
    let currentAnonPseudonym = 'Sahabat Anonim #' + Math.floor(100 + Math.random() * 900);
    let activeRatingSessionId = null;
    let dashSelectedRating = 5;

    // 8. FITUR CURHAT ANONIM KE KONSELOR
    function setupAnonCurhat() {
      if (!openAnonCurhatBtn) return;
      openAnonCurhatBtn.addEventListener('click', () => {
        window.location.href = 'kirim-cerita.html';
      });

      if (closeAnonModalBtn) {
        closeAnonModalBtn.addEventListener('click', () => anonymousCurhatModal.classList.add('hidden'));
      }

      if (regenerateAnonNameBtn) {
        regenerateAnonNameBtn.addEventListener('click', generateAnonPseudonym);
      }

      // Handle Tombol Pilihan Jenjang Pendidikan di Modal Curhat Anonim
      const eduChips = document.querySelectorAll('.anon-edu-chip');
      const anonSelectedEducationInput = document.getElementById('anonSelectedEducationInput');
      eduChips.forEach(chip => {
        chip.addEventListener('click', () => {
          eduChips.forEach(c => {
            c.classList.remove('border-rose-500', 'bg-rose-50', 'text-rose-700', 'font-bold', 'shadow-xs');
            c.classList.add('border-oase-border', 'bg-white', 'text-oase-plum', 'font-semibold');
          });
          chip.classList.remove('border-oase-border', 'bg-white', 'text-oase-plum', 'font-semibold');
          chip.classList.add('border-rose-500', 'bg-rose-50', 'text-rose-700', 'font-bold', 'shadow-xs');
          if (anonSelectedEducationInput) {
            anonSelectedEducationInput.value = chip.getAttribute('data-education');
          }
        });
      });

      if (anonCurhatForm) {
        anonCurhatForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const counselorId = anonCounselorSelect.value;
          const counselorObj = (window.COUNSELORS_DATA || []).find(c => c.id === counselorId);
          const counselorName = counselorObj ? counselorObj.name : 'Konselor OASE';
          const category = anonCategorySelect.value;
          const storyContent = anonStoryInput.value.trim();
          const selectedEducation = (anonSelectedEducationInput && anonSelectedEducationInput.value) ? anonSelectedEducationInput.value : 'SMA / SMK / MA';

          if (!storyContent) return;

          submitAnonStoryBtn.disabled = true;
          submitAnonStoryBtn.textContent = 'Mengirim Curhat Anonim...';

          try {
            const res = await window.CounselingService.submitCounselingStory({
              authorName: currentAnonPseudonym,
              educationLevel: selectedEducation,
              gradeClass: 'Siswa Anonim',
              gender: 'Rahasia',
              category: category,
              counselorId: counselorId === 'auto' ? null : counselorId,
              counselorName: counselorName,
              storyContent: storyContent
            });

            // Simpan tiket ke list riwayat lokal agar mudah diakses
            try {
              let saved = JSON.parse(localStorage.getItem('oase_my_anon_tickets') || '[]');
              if (!saved.includes(res.ticketCode)) {
                saved.unshift(res.ticketCode);
                localStorage.setItem('oase_my_anon_tickets', JSON.stringify(saved.slice(0, 15)));
              }
            } catch (e) {}

            anonStoryInput.value = '';
            anonymousCurhatModal.classList.add('hidden');

            const anonSuccessModal = document.getElementById('anonSuccessModal');
            const anonTicketCodeDisplay = document.getElementById('anonTicketCodeDisplay');
            if (anonSuccessModal && anonTicketCodeDisplay) {
              anonTicketCodeDisplay.textContent = res.ticketCode || 'OASE-CERITA';
              anonSuccessModal.classList.remove('hidden');
            } else {
              alert(`Curhat anonim Anda berhasil dikirim dengan Kode Tiket: ${res.ticketCode || 'OASE-CERITA'}.\nKonselor akan membaca ceritamu secara rahasia di portal konseling.`);
            }
          } catch (err) {
            alert('Gagal mengirim curhat: ' + err.message);
          } finally {
            submitAnonStoryBtn.disabled = false;
            submitAnonStoryBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i><span>Kirimkan Curhat Anonim</span>`;
            lucide.createIcons();
          }
        });
      }
    }

    function generateAnonPseudonym() {
      currentAnonPseudonym = 'Sahabat Anonim #' + Math.floor(100 + Math.random() * 900);
      if (anonPseudonymLabel) anonPseudonymLabel.textContent = currentAnonPseudonym;
    }

    function populateAnonCounselors() {
      if (!anonCounselorSelect) return;
      const counselors = window.COUNSELORS_DATA || [];
      anonCounselorSelect.innerHTML = '';
      counselors.forEach(c => {
        const ratingInfo = window.getCounselorRatingInfo ? window.getCounselorRatingInfo(c.id) : { average: 5.0, totalReviews: 10 };
        const opt = document.createElement('option');
        opt.value = c.id;
        if (c.id === 'auto') {
          opt.textContent = '🌟 Pilihkan Otomatis (Konselor Pertama yang Siap)';
        } else {
          opt.textContent = `${c.name} • ${c.role} (⭐ ${ratingInfo.average})`;
        }
        anonCounselorSelect.appendChild(opt);
      });
    }

    // 9. RIWAYAT SESI KONSELING SELESAI & RATING
    async function loadCompletedSessions() {
      if (!sessionHistoryList || !currentUser) return;
      const completedSessions = await window.ChatSessionService.getCompletedSessions(currentUser.email);

      if (!completedSessions || completedSessions.length === 0) {
        sessionHistoryList.innerHTML = `
          <div class="py-8 text-center bg-oase-surface/50 rounded-2xl border border-dashed border-oase-border space-y-1">
            <p class="text-xs font-bold text-oase-plum">Belum Ada Riwayat Konseling yang Diselesaikan</p>
            <p class="text-[11px] text-oase-muted">Sesi konseling yang telah Anda selesaikan bersama konselor akan tercatat rapi di sini.</p>
          </div>
        `;
        return;
      }

      sessionHistoryList.innerHTML = '';
      completedSessions.forEach(s => {
        const counselorObj = (window.COUNSELORS_DATA || []).find(c => c.id === s.counselor_id) || {
          name: s.counselor_name || 'Konselor OASE',
          role: 'Konselor Terverifikasi',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80'
        };

        const item = document.createElement('div');
        item.className = "p-4 sm:p-5 rounded-2xl border border-heather-200/80 bg-white hover:border-heather-300 transition-all shadow-2xs space-y-3.5";

        const dateStr = s.ended_at ? new Date(s.ended_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sesi Lampau';

        let ratingHtml = '';
        if (s.rating) {
          ratingHtml = `
            <div class="flex items-center gap-2 text-xs">
              <span class="text-amber-500 font-bold tracking-wider">${'★'.repeat(s.rating)}${'☆'.repeat(5 - s.rating)}</span>
              <span class="text-oase-muted text-[11px]">Penilaian Anda (${s.rating}/5)</span>
            </div>
          `;
        } else {
          ratingHtml = `
            <button class="rate-session-btn px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-all flex items-center gap-1" data-id="${s.id}" data-counselor="${counselorObj.name}">
              <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-500"></i>
              <span>Beri Rating Konselor</span>
            </button>
          `;
        }

        let motivationHtml = '';
        if (s.motivational_message) {
          motivationHtml = `
            <div class="p-3 rounded-xl bg-gradient-to-r from-amber-50/70 via-rose-50/50 to-heather-50/70 border border-heather-100 text-xs text-oase-plum space-y-1">
              <span class="text-[10px] font-bold text-heather-700 flex items-center gap-1 uppercase tracking-wider">
                <i data-lucide="sparkles" class="w-3 h-3 text-amber-500"></i> Pesan Semangat dari ${counselorObj.name}:
              </span>
              <p class="italic leading-relaxed">"${s.motivational_message}"</p>
            </div>
          `;
        }

        item.innerHTML = `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-oase-border">
            <div class="flex items-center gap-3">
              <img src="${counselorObj.avatar}" alt="${counselorObj.name}" class="w-11 h-11 rounded-xl object-cover border border-heather-200 shadow-2xs flex-shrink-0">
              <div>
                <h4 class="text-xs sm:text-sm font-bold text-oase-plum">${counselorObj.name}</h4>
                <p class="text-[11px] text-heather-700 font-medium">Topik: ${s.topic}</p>
                <span class="text-[10px] text-oase-muted">${dateStr} • Durasi: 30 Menit</span>
              </div>
            </div>
            <div class="flex items-center gap-2 self-start sm:self-auto">
              <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                ✓ Selesai
              </span>
              <a href="ruang-chat.html?sessionId=${s.id}&role=user&readonly=true" onclick="sessionStorage.setItem('oase_active_chat_role', 'user')" class="px-3.5 py-1.5 rounded-xl border border-heather-200 bg-heather-50 hover:bg-heather-100 text-heather-800 text-xs font-bold transition-all flex items-center gap-1">
                <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                <span>Buka Riwayat Obrolan</span>
              </a>
            </div>
          </div>
          ${motivationHtml}
          <div class="flex items-center justify-between pt-1">
            ${ratingHtml}
            ${s.review ? `<p class="text-[11px] text-oase-muted italic truncate max-w-xs">"${s.review}"</p>` : ''}
          </div>
        `;

        sessionHistoryList.appendChild(item);
      });

      // Event listener tombol beri rating
      document.querySelectorAll('.rate-session-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sId = btn.getAttribute('data-id');
          const cName = btn.getAttribute('data-counselor');
          openDashRating(sId, cName);
        });
      });

      lucide.createIcons();
    }

    if (refreshHistoryBtn) {
      refreshHistoryBtn.addEventListener('click', loadCompletedSessions);
    }

    // 10. MODAL RATING DARI DASHBOARD
    function setupDashRating() {
      const starBtns = document.querySelectorAll('.dash-star-btn');
      const starTexts = {
        1: 'Kurang Puas (1 Bintang)',
        2: 'Cukup Membantu (2 Bintang)',
        3: 'Baik (3 Bintang)',
        4: 'Sangat Baik (4 Bintang)',
        5: 'Sangat Puas & Membantu (5 Bintang)'
      };

      const updateStarDisplay = (val) => {
        starBtns.forEach(btn => {
          const btnVal = parseInt(btn.getAttribute('data-val'));
          if (btnVal <= val) {
            btn.className = 'dash-star-btn text-amber-400 transition-transform hover:scale-125';
          } else {
            btn.className = 'dash-star-btn text-gray-300 transition-transform hover:scale-125';
          }
        });
        if (dashStarLabel) dashStarLabel.textContent = starTexts[val] || `${val} Bintang`;
      };

      starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          dashSelectedRating = parseInt(btn.getAttribute('data-val'));
          updateStarDisplay(dashSelectedRating);
        });
      });

      if (closeDashRatingModalBtn) {
        closeDashRatingModalBtn.addEventListener('click', () => dashRatingModal.classList.add('hidden'));
      }

      if (submitDashRatingBtn) {
        submitDashRatingBtn.addEventListener('click', async () => {
          if (!activeRatingSessionId) return;
          submitDashRatingBtn.disabled = true;
          submitDashRatingBtn.textContent = 'Menyimpan...';

          const review = dashRatingReviewInput ? dashRatingReviewInput.value.trim() : '';
          await window.ChatSessionService.rateSession(activeRatingSessionId, dashSelectedRating, review);

          alert(`Terima kasih! Penilaian ${dashSelectedRating} bintang berhasil disimpan.`);
          dashRatingModal.classList.add('hidden');
          submitDashRatingBtn.disabled = false;
          submitDashRatingBtn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Simpan Rating</span>`;
          lucide.createIcons();
          await loadCompletedSessions();
        });
      }
    }

    function openDashRating(sessionId, counselorName) {
      activeRatingSessionId = sessionId;
      if (dashRatingTitle) dashRatingTitle.textContent = `Beri Penilaian untuk ${counselorName}`;
      if (dashRatingReviewInput) dashRatingReviewInput.value = '';
      dashSelectedRating = 5;
      dashRatingModal.classList.remove('hidden');
    }

    // 10. FITUR CEK BALASAN DARI KONSELOR (KODE TIKET UNIK)
    function setupCheckTicketModal() {
      const navCheckTicketBtn = document.getElementById('navCheckTicketBtn');
      const drawerCheckTicketBtn = document.getElementById('drawerCheckTicketBtn');
      const cardCheckTicketBtn = document.getElementById('cardCheckTicketBtn');
      const checkTicketModal = document.getElementById('checkTicketModal');
      const closeCheckTicketModalBtn = document.getElementById('closeCheckTicketModalBtn');
      const searchTicketInput = document.getElementById('searchTicketInput');
      const searchTicketBtn = document.getElementById('searchTicketBtn');
      const ticketResultBox = document.getElementById('ticketResultBox');
      const recentTicketsContainer = document.getElementById('recentTicketsContainer');
      const recentTicketsList = document.getElementById('recentTicketsList');

      const anonSuccessModal = document.getElementById('anonSuccessModal');
      const copyAnonTicketBtn = document.getElementById('copyAnonTicketBtn');
      const anonCopyFeedbackText = document.getElementById('anonCopyFeedbackText');
      const anonCheckStatusNowBtn = document.getElementById('anonCheckStatusNowBtn');
      const closeAnonSuccessModalBtn = document.getElementById('closeAnonSuccessModalBtn');
      const anonTicketCodeDisplay = document.getElementById('anonTicketCodeDisplay');

      // Elemen Tab Riwayat Curhat
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
                <div class="flex items-center justify-between text-xs pt-1 border-t border-gray-100 flex-wrap gap-1">
                  ${s.rating ? `
                    <div class="flex items-center gap-1.5">
                      <span class="text-amber-500 font-bold">${'★'.repeat(s.rating)}${'☆'.repeat(5 - s.rating)}</span>
                      <span class="text-[11px] text-amber-800 font-semibold">(${s.rating}/5)</span>
                      ${s.review ? `<span class="text-[10px] text-gray-500 italic truncate max-w-[130px]">"${s.review}"</span>` : ''}
                    </div>
                  ` : `
                    <span class="text-[11px] text-amber-700 italic">Belum dinilai</span>
                  `}
                  <button type="button" class="open-curhat-rating-btn px-2.5 py-1 rounded-lg ${s.rating ? 'border border-amber-200 bg-white hover:bg-amber-50 text-amber-800' : 'bg-amber-500 hover:bg-amber-600 text-white'} text-[10px] font-bold transition-all flex items-center gap-1 shadow-2xs" data-ticket="${s.ticket_code}" data-counselor="${s.counselor_name || 'Konselor'}" data-rating="${s.rating || 5}" data-review="${encodeURIComponent(s.review || '')}">
                    <i data-lucide="star" class="w-3 h-3 ${s.rating ? 'fill-amber-400 text-amber-500' : 'fill-white text-white'}"></i>
                    <span>${s.rating ? 'Ubah Rating' : 'Beri Rating'}</span>
                  </button>
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
            searchTicket();
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

        curhatHistoryList.querySelectorAll('.open-curhat-rating-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const ticket = btn.dataset.ticket;
            const counselor = btn.dataset.counselor;
            const rVal = btn.dataset.rating || 5;
            const revVal = btn.dataset.review ? decodeURIComponent(btn.dataset.review) : '';
            openCurhatRating(ticket, counselor, rVal, revVal);
          };
        });

        if (window.lucide) lucide.createIcons();
      }

function openCheckModal(codeToSearch = '') {
        switchCurhatTab('search');
        if (window.CounselingService && typeof window.CounselingService.getMySubmissions === 'function') { window.CounselingService.getMySubmissions().then(stories => { if (curhatMyHistoryCountBadge) curhatMyHistoryCountBadge.textContent = stories.length; }).catch(() => {}); }
        if (!checkTicketModal) return;
        checkTicketModal.classList.remove('hidden');
        if (ticketResultBox) ticketResultBox.classList.add('hidden');
        if (searchTicketInput) searchTicketInput.value = codeToSearch;

        try {
          const savedTickets = JSON.parse(localStorage.getItem('oase_my_anon_tickets') || '[]');
          if (recentTicketsContainer && recentTicketsList) {
            if (savedTickets.length > 0) {
              recentTicketsContainer.classList.remove('hidden');
              recentTicketsList.innerHTML = '';
              savedTickets.slice(0, 5).forEach(ticketCode => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'px-2.5 py-1 rounded-xl bg-heather-50 hover:bg-heather-100 text-heather-800 text-[11px] font-mono font-bold border border-heather-200 transition-all';
                chip.textContent = ticketCode;
                chip.addEventListener('click', () => {
                  searchTicketInput.value = ticketCode;
                  searchTicket();
                });
                recentTicketsList.appendChild(chip);
              });
            } else {
              recentTicketsContainer.classList.add('hidden');
            }
          }
        } catch (e) {}

        if (codeToSearch) {
          searchTicket();
        }
      }

      async function searchTicket() {
        if (!searchTicketInput || !ticketResultBox || !searchTicketBtn) return;
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
              ? '<span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1"><i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i> Sudah Dibalas Konselor</span>' 
              : '<span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5 text-amber-600"></i> Sedang Ditinjau Konselor</span>';

            ticketResultBox.innerHTML = `
              <div class="bg-oase-surface p-4 sm:p-5 rounded-2xl border border-oase-border space-y-3.5">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <span class="font-mono text-xs font-bold text-heather-700 bg-white px-2.5 py-1 rounded-lg border border-heather-200">${data.ticket_code}</span>
                  ${statusBadge}
                </div>
                <div class="text-xs space-y-1 text-oase-muted">
                  <p><strong>Nama Samaran:</strong> <span class="text-oase-plum">${data.author_name}</span> (${data.education_level || 'Siswa'}${data.grade_class ? ' • ' + data.grade_class : ''})</p>
                  <p><strong>Kategori Masalah:</strong> <span class="text-oase-plum">${data.category}</span></p>
                  <p><strong>Konselor:</strong> <span class="text-oase-plum font-semibold">${data.counselor_name}</span></p>
                </div>

                <div class="pt-2 border-t border-oase-border">
                  <p class="text-xs font-bold text-oase-plum mb-1 flex items-center gap-1">
                    <i data-lucide="message-square" class="w-3.5 h-3.5 text-heather-500"></i>
                    <span>Isi Cerita Kamu:</span>
                  </p>
                  <div class="p-3.5 bg-white rounded-xl border border-oase-border text-xs text-oase-muted italic max-h-36 overflow-y-auto leading-relaxed">
                    "${data.story_content}"
                  </div>
                </div>

                ${isReplied ? `
                  <div class="pt-2 border-t border-emerald-100 space-y-2">
                    <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <i data-lucide="heart-handshake" class="w-4 h-4 text-emerald-600"></i>
                      <span>Balasan Resmi dari ${data.counselor_name}:</span>
                    </div>
                    <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-medium leading-relaxed">
                      ${data.counselor_reply}
                    </div>

                    <!-- KOTAK RATING JAWABAN KONSELOR (MIRIP DENGAN KONSELING LANGSUNG) -->
                    ${data.rating ? `
                      <div class="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs flex items-center justify-between gap-2 flex-wrap">
                        <div class="space-y-0.5">
                          <div class="flex items-center gap-1.5">
                            <span class="text-amber-500 font-bold tracking-wider text-sm">${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}</span>
                            <span class="text-amber-900 font-bold text-xs">Penilaian Anda (${data.rating}/5)</span>
                          </div>
                          ${data.review ? `<p class="text-[11px] text-gray-600 italic">"${data.review}"</p>` : ''}
                        </div>
                        <button type="button" class="open-curhat-rating-btn px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer" data-ticket="${data.ticket_code}" data-counselor="${data.counselor_name}" data-rating="${data.rating}" data-review="${encodeURIComponent(data.review || '')}">
                          <i data-lucide="edit-3" class="w-3 h-3 text-amber-600"></i>
                          <span>Ubah Penilaian</span>
                        </button>
                      </div>
                    ` : `
                      <div class="p-3.5 bg-gradient-to-r from-amber-50/90 via-rose-50/40 to-amber-50/90 rounded-2xl border border-amber-200 text-xs flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p class="font-bold text-amber-900 flex items-center gap-1">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i>
                            <span>Apakah tanggapan konselor ini membantumu?</span>
                          </p>
                          <p class="text-[11px] text-amber-700">Beri penilaian bintang & ulasan untuk ${data.counselor_name}.</p>
                        </div>
                        <button type="button" class="open-curhat-rating-btn px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer" data-ticket="${data.ticket_code}" data-counselor="${data.counselor_name}" data-rating="5" data-review="">
                          <i data-lucide="star" class="w-3.5 h-3.5 fill-white text-white"></i>
                          <span>Beri Rating</span>
                        </button>
                      </div>
                    `}
                  </div>
                ` : `
                  <div class="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <i data-lucide="clock" class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"></i>
                    <p class="leading-relaxed">Konselor sedang membaca dan menyiapkan panduan untuk ceritamu. Harap simpan kode tiket ini dan cek kembali nanti secara berkala ya!</p>
                  </div>
                `}
              </div>
            `;
                        ticketResultBox.querySelectorAll('.open-curhat-rating-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const ticket = btn.dataset.ticket;
                const counselor = btn.dataset.counselor;
                const rVal = btn.dataset.rating || 5;
                const revVal = btn.dataset.review ? decodeURIComponent(btn.dataset.review) : '';
                openCurhatRating(ticket, counselor, rVal, revVal);
              });
            });
            lucide.createIcons();
          }
        } catch (err) {
          console.error('Error saat mencari tiket:', err);
          ticketResultBox.classList.remove('hidden');
          ticketResultBox.innerHTML = `<p class="text-xs text-red-500 text-center">Gagal memuat data tiket. Coba lagi nanti.</p>`;
        } finally {
          searchTicketBtn.disabled = false;
          searchTicketBtn.innerHTML = `<i data-lucide="search" class="w-4 h-4"></i><span>Cari</span>`;
          lucide.createIcons();
        }
      }

      if (navCheckTicketBtn) navCheckTicketBtn.addEventListener('click', () => openCheckModal());
      if (drawerCheckTicketBtn) drawerCheckTicketBtn.addEventListener('click', () => {
        const drawer = document.getElementById('hamburgerDrawer');
        const overlay = document.getElementById('hamburgerDrawerOverlay');
        if (drawer) drawer.classList.add('translate-x-full');
        if (overlay) overlay.classList.add('hidden');
        openCheckModal();
      });
      if (cardCheckTicketBtn) cardCheckTicketBtn.addEventListener('click', () => openCheckModal());
      if (closeCheckTicketModalBtn) closeCheckTicketModalBtn.addEventListener('click', () => {
        if (checkTicketModal) checkTicketModal.classList.add('hidden');
      });
      if (closeCheckTicketFooterBtn) closeCheckTicketFooterBtn.addEventListener('click', () => {
        if (checkTicketModal) checkTicketModal.classList.add('hidden');
      });

      if (curhatTabSearchBtn) curhatTabSearchBtn.addEventListener('click', () => switchCurhatTab('search'));
      if (curhatTabHistoryBtn) curhatTabHistoryBtn.addEventListener('click', () => switchCurhatTab('history'));
      if (refreshCurhatHistoryBtn) refreshCurhatHistoryBtn.addEventListener('click', () => renderCurhatHistoryList());

      if (searchTicketBtn) searchTicketBtn.addEventListener('click', searchTicket);
      if (searchTicketInput) {
        searchTicketInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            searchTicket();
          }
        });
      }

      // Handler Modal Sukses Anonim
      if (copyAnonTicketBtn && anonTicketCodeDisplay) {
        copyAnonTicketBtn.addEventListener('click', () => {
          const code = anonTicketCodeDisplay.textContent;
          navigator.clipboard.writeText(code).then(() => {
            if (anonCopyFeedbackText) {
              anonCopyFeedbackText.classList.remove('hidden');
              setTimeout(() => anonCopyFeedbackText.classList.add('hidden'), 3000);
            }
          });
        });
      }

      if (anonCheckStatusNowBtn) {
        anonCheckStatusNowBtn.addEventListener('click', () => {
          const code = anonTicketCodeDisplay ? anonTicketCodeDisplay.textContent : '';
          if (anonSuccessModal) anonSuccessModal.classList.add('hidden');
          openCheckModal(code);
        });
      }

      if (closeAnonSuccessModalBtn) {
        closeAnonSuccessModalBtn.addEventListener('click', () => {
          if (anonSuccessModal) anonSuccessModal.classList.add('hidden');
        });
      }

      // Auto-open jika ada parameter action=cek-tiket atau hash #cek-tiket
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'cek-tiket' || window.location.hash === '#cek-tiket') {
        const ticketParam = urlParams.get('ticket') || '';
        setTimeout(() => openCheckModal(ticketParam), 300);
      }

      window.renderCurhatHistoryList = renderCurhatHistoryList;

      // ========================================================
      // 8. LOGIKA MODAL RATING BALASAN CURHAT ANONIM (DALAM SCOPE)
      // ========================================================
      const curhatRatingModal = document.getElementById('curhatRatingModal');
      const curhatRatingTitle = document.getElementById('curhatRatingTitle');
      const curhatRatingSubtitle = document.getElementById('curhatRatingSubtitle');
      const curhatStarLabel = document.getElementById('curhatStarLabel');
      const curhatRatingReviewInput = document.getElementById('curhatRatingReviewInput');
      const closeCurhatRatingModalBtn = document.getElementById('closeCurhatRatingModalBtn');
      const submitCurhatRatingBtn = document.getElementById('submitCurhatRatingBtn');
      const curhatStarBtns = document.querySelectorAll('.curhat-star-btn');

      let activeRatingTicketCode = null;
      let curhatSelectedRating = 5;

      const curhatStarTexts = {
        1: 'Kurang Membantu (1 Bintang)',
        2: 'Cukup Membantu (2 Bintang)',
        3: 'Baik & Membantu (3 Bintang)',
        4: 'Sangat Baik (4 Bintang)',
        5: 'Sangat Puas & Menenangkan (5 Bintang)'
      };

      function updateCurhatStarDisplay(val) {
        curhatStarBtns.forEach(btn => {
          const btnVal = parseInt(btn.getAttribute('data-val'));
          if (btnVal <= val) {
            btn.className = 'curhat-star-btn text-amber-400 transition-transform hover:scale-125 select-none';
          } else {
            btn.className = 'curhat-star-btn text-gray-300 transition-transform hover:scale-125 select-none';
          }
        });
        if (curhatStarLabel) curhatStarLabel.textContent = curhatStarTexts[val] || `${val} Bintang`;
      }

      curhatStarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          curhatSelectedRating = parseInt(btn.getAttribute('data-val')) || 5;
          updateCurhatStarDisplay(curhatSelectedRating);
        });
      });

      function openCurhatRating(ticketCode, counselorName, currentRating = 5, currentReview = '') {
        activeRatingTicketCode = ticketCode;
        curhatSelectedRating = parseInt(currentRating) || 5;
        if (curhatRatingTitle) {
          curhatRatingTitle.textContent = `Beri Penilaian untuk ${counselorName || 'Konselor'}`;
        }
        if (curhatRatingSubtitle) {
          curhatRatingSubtitle.textContent = `Bagikan pengalamanmu terhadap balasan ${counselorName || 'konselor'} atas curhatmu.`;
        }
        if (curhatRatingReviewInput) {
          curhatRatingReviewInput.value = currentReview || '';
        }
        updateCurhatStarDisplay(curhatSelectedRating);
        if (curhatRatingModal) curhatRatingModal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
      }

      if (closeCurhatRatingModalBtn) {
        closeCurhatRatingModalBtn.addEventListener('click', () => {
          if (curhatRatingModal) curhatRatingModal.classList.add('hidden');
        });
      }

      if (submitCurhatRatingBtn) {
        submitCurhatRatingBtn.addEventListener('click', async () => {
          if (!activeRatingTicketCode) return;
          submitCurhatRatingBtn.disabled = true;
          submitCurhatRatingBtn.innerHTML = `
            <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i>
            <span>Menyimpan...</span>
          `;
          if (window.lucide) lucide.createIcons();

          try {
            const review = curhatRatingReviewInput ? curhatRatingReviewInput.value.trim() : '';
            await window.CounselingService.rateSubmission(activeRatingTicketCode, curhatSelectedRating, review);
            alert(`Terima kasih banyak! Penilaian ${curhatSelectedRating} bintang berhasil disimpan untuk konselor.`);
            if (curhatRatingModal) curhatRatingModal.classList.add('hidden');

            if (searchTicketInput && searchTicketInput.value.trim().toUpperCase() === activeRatingTicketCode) {
              searchTicket();
            }
            if (typeof renderCurhatHistoryList === 'function') {
              await renderCurhatHistoryList();
            } else if (typeof window.renderCurhatHistoryList === 'function') {
              await window.renderCurhatHistoryList();
            }
          } catch(err) {
            alert('Gagal menyimpan rating: ' + (err.message || 'Terjadi kesalahan'));
          } finally {
            submitCurhatRatingBtn.disabled = false;
            submitCurhatRatingBtn.innerHTML = `
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              <span>Simpan Rating</span>
            `;
            if (window.lucide) lucide.createIcons();
          }
        });
      }
    }

    window.setupAnonCurhat = (user) => { if (user) currentUser = user; setupAnonCurhat(); };
    window.loadCompletedSessions = async (user) => { if (user) currentUser = user; await loadCompletedSessions(); };
    window.setupDashRating = setupDashRating;
    window.setupCheckTicketModal = setupCheckTicketModal;

    // Run check ticket setup on start
    setupCheckTicketModal();
})();

