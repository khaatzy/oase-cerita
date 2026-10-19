/**
 * OASE Komunitas - Dukungan Komunitas Empatis
 * Fitur: Feed Curhat, Reaksi Empati (Pelukan Virtual), Komentar Saling Menguatkan,
 * dan Wewenang Khusus Moderator (Hapus Komentar Melanggar).
 */

document.addEventListener('DOMContentLoaded', async () => {
  // AUTH GUARD: HANYA PENGGUNA LOGIN YANG DAPAT MENGAKSES
  let session = null;
  if (window.AuthService && window.AuthService.getSession) {
    try { session = await window.AuthService.getSession(); } catch (e) {}
  }
  const activeEmail = localStorage.getItem('oase_active_user_email');
  if (!session && !activeEmail) {
    sessionStorage.setItem('oase_auth_redirect', window.location.pathname.split('/').pop() || 'komunitas.html');
    window.location.href = 'dashboard-awal.html?auth=required';
    return;
  }

  // Inisialisasi ikon
  if (window.lucide) lucide.createIcons();

  const communityFeedContainer = document.getElementById('communityFeedContainer');
  const moderatorStatusBadge = document.getElementById('moderatorStatusBadge');
  const deleteCommentModal = document.getElementById('deleteCommentModal');
  const cancelDeleteCommentBtn = document.getElementById('cancelDeleteCommentBtn');
  const confirmDeleteCommentBtn = document.getElementById('confirmDeleteCommentBtn');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Modal Bagikan Cerita Komunitas
  const newCommunityStoryModal = document.getElementById('newCommunityStoryModal');
  const openNewStoryModalBtn = document.getElementById('openNewStoryModalBtn');
  const heroShareStoryBtn = document.getElementById('heroShareStoryBtn');
  const closeNewStoryModalBtn = document.getElementById('closeNewStoryModalBtn');
  const cancelNewStoryModalBtn = document.getElementById('cancelNewStoryModalBtn');
  const newCommunityStoryForm = document.getElementById('newCommunityStoryForm');
  const communityStoryAuthorInput = document.getElementById('communityStoryAuthorInput');
  const communityStoryCategorySelect = document.getElementById('communityStoryCategorySelect');
  const communityStoryContentInput = document.getElementById('communityStoryContentInput');

  let currentCategory = 'all';
  let isModerator = false;
  let currentUserName = 'Sahabat OASE';
  let commentToDelete = null;
  let storyToDelete = null;
  const activeCommentDrafts = {};
  const expandedCommentsState = {};

  // Modal Hapus Cerita (Khusus Moderator)
  const deleteStoryModal = document.getElementById('deleteStoryModal');
  const deleteStoryModalDesc = document.getElementById('deleteStoryModalDesc');
  const cancelDeleteStoryBtn = document.getElementById('cancelDeleteStoryBtn');
  const confirmDeleteStoryBtn = document.getElementById('confirmDeleteStoryBtn');

  // Modal Peringatan SARA
  const saraWarningModal = document.getElementById('saraWarningModal');
  const saraWarningModalMessage = document.getElementById('saraWarningModalMessage');
  const closeSaraWarningBtn = document.getElementById('closeSaraWarningBtn');

  if (closeSaraWarningBtn) {
    closeSaraWarningBtn.onclick = () => {
      if (saraWarningModal) saraWarningModal.classList.add('hidden');
    };
  }

  function showSaraAlert(matchedWord) {
    const safeWord = escapeHtml(matchedWord || 'kata terlarang');
    if (saraWarningModal && saraWarningModalMessage) {
      saraWarningModalMessage.innerHTML = `Teks Anda terdeteksi mengandung kata yang dilarang atau berindikasi ujaran kebencian / SARA: <strong class="text-rose-600 underline">"${safeWord}"</strong>.<br><br>Demi menjaga ruang empati OASE tetap aman, damai, dan bebas dari cyberbullying, konten Anda tidak dapat dipublikasikan. Silakan hapus atau ubah kata tersebut.`;
      saraWarningModal.classList.remove('hidden');
    } else {
      alert(`⚠️ PERINGATAN SISTEM OASE: Teks Anda memuat kata yang dilarang ("${safeWord}"). Konten tidak dapat dipublikasikan.`);
    }
  }

  // Fungsi komprehensif pemeriksa SARA & Cyberbullying
  function checkTextForViolations(text) {
    if (!text || typeof text !== 'string') return { isViolation: false };

    // 1. Cek via CrisisDetectionService bawaan
    if (window.CrisisDetectionService && typeof window.CrisisDetectionService.checkContent === 'function') {
      const res = window.CrisisDetectionService.checkContent(text);
      if (res && res.isViolation) return res;
    }

    // 2. Cek kamus kustom sensor SARA dari Moderator
    const customList = (window.SaraKeywordService && typeof window.SaraKeywordService.getCustomKeywordsSync === 'function')
      ? window.SaraKeywordService.getCustomKeywordsSync()
      : (() => { try { return JSON.parse(localStorage.getItem('oase_custom_sara_keywords') || '[]'); } catch(e) { return []; } })();

    const lower = text.toLowerCase();
    for (const item of customList) {
      const kw = (item.keyword || '').toLowerCase().trim();
      if (!kw) continue;
      if (lower.includes(kw)) {
        return { isViolation: true, matchedKeyword: item.keyword, category: item.category || 'sara' };
      }
    }

    return { isViolation: false };
  }

  // 1. CEK IDENTITAS & ROLE MODERATOR
  async function checkUserRole() {
    try {
      const activeEmail = localStorage.getItem('oase_active_user_email');
      const savedProfiles = JSON.parse(localStorage.getItem('oase_user_profiles') || '{}');

      let userProfile = null;
      if (activeEmail && savedProfiles[activeEmail]) {
        userProfile = savedProfiles[activeEmail];
      }

      if (window.AuthService && window.AuthService.getCurrentUser) {
        const authUser = await window.AuthService.getCurrentUser();
        if (authUser && authUser.email) {
          const profile = await window.AuthService.getUserProfile(authUser.id, authUser.email);
          if (profile) userProfile = profile;
        }
      }

      if (userProfile) {
        currentUserName = userProfile.display_name || userProfile.full_name || 'Sahabat OASE';
        if (userProfile.role === 'moderator' || userProfile.role === 'counselor') {
          isModerator = true;
          if (moderatorStatusBadge) {
            moderatorStatusBadge.classList.remove('hidden');
            moderatorStatusBadge.classList.add('flex');
          }
        }
      }
    } catch (e) {
      console.warn('Gagal memverifikasi role pengguna:', e);
    }
  }

  // 2. PENYIMPANAN CERITA & REAKSI LOKAL
  function getStoredComments() {
    return JSON.parse(localStorage.getItem('oase_community_comments') || '{}');
  }

  function saveStoredComments(commentsObj) {
    localStorage.setItem('oase_community_comments', JSON.stringify(commentsObj));
  }

  function getStoredReactions() {
    return JSON.parse(localStorage.getItem('oase_community_reactions') || '{}');
  }

  function saveStoredReactions(reactionsObj) {
    localStorage.setItem('oase_community_reactions', JSON.stringify(reactionsObj));
  }

  function getStoredCommunityStories() {
    return JSON.parse(localStorage.getItem('oase_community_stories') || '[]');
  }

  function saveStoredCommunityStories(stories) {
    localStorage.setItem('oase_community_stories', JSON.stringify(stories));
  }

  // 3. RENDER FEED KOMUNITAS (DENGAN PROTEKSI INPUT TYPING & ACCORDION KOMENTAR)
  async function renderCommunityFeed() {
    await checkUserRole();

    // Pastikan kata kunci SARA kustom dari Supabase ter-load di memori
    if (window.SaraKeywordService && typeof window.SaraKeywordService.getCustomKeywords === 'function') {
      try { await window.SaraKeywordService.getCustomKeywords(); } catch(e) {}
    }

    // Rekam nilai draft yang sedang diketik sebelum re-render
    document.querySelectorAll('.comment-input').forEach(inp => {
      const sId = inp.closest('.comment-form')?.dataset.storyId;
      if (sId && inp.value) {
        activeCommentDrafts[sId] = inp.value;
      }
    });

    let allStories = [];
    if (window.CommunityService && typeof window.CommunityService.getStories === 'function') {
      try {
        allStories = await window.CommunityService.getStories();
      } catch(e) {
        allStories = getStoredCommunityStories();
      }
    } else {
      allStories = getStoredCommunityStories();
    }

    // Filter kategori
    const filteredStories = currentCategory === 'all'
      ? allStories
      : allStories.filter(s => 
          (s.category || '').toLowerCase().includes(currentCategory.toLowerCase()) ||
          (s.emotion || '').toLowerCase().includes(currentCategory.toLowerCase())
        );

    if (filteredStories.length === 0) {
      communityFeedContainer.innerHTML = `
        <div class="bg-white rounded-3xl p-10 text-center border border-heather-100 space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-heather-50 text-heather-600 flex items-center justify-center mx-auto">
            <i data-lucide="feather" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-oase-plum">Belum ada cerita di kategori ini</h3>
          <p class="text-xs text-oase-muted">Jadilah yang pertama membagikan cerita ke teman-teman komunitas!</p>
          <button id="emptyStateShareBtn" type="button" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-heather-500 hover:bg-heather-600 text-white font-bold text-xs mt-2 transition-all">
            <i data-lucide="pen-tool" class="w-3.5 h-3.5"></i>
            <span>Bagikan Cerita Pertama</span>
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      const emptyStateShareBtn = document.getElementById('emptyStateShareBtn');
      if (emptyStateShareBtn) {
        emptyStateShareBtn.onclick = openNewStoryModal;
      }
      return;
    }

    let storedComments = {};
    if (window.CommunityService && typeof window.CommunityService.getComments === 'function') {
      try {
        storedComments = await window.CommunityService.getComments();
      } catch(e) {
        storedComments = getStoredComments();
      }
    } else {
      storedComments = getStoredComments();
    }
    const storedReactions = getStoredReactions();

    communityFeedContainer.innerHTML = '';

    filteredStories.forEach(story => {
      const storyId = story.id;
      // Cerita baru TIDAK memiliki komentar dummy buatan
      const storyComments = storedComments[storyId] || [];

      // Cerita baru mulai dari 0 reaksi (bukan 16 atau 10!)
      const reactions = storedReactions[storyId] || {
        hugs: story.hugs || 0,
        cheers: story.cheers || 0,
        userHugged: false,
        userCheered: false
      };

      const isCommentsOpen = Boolean(expandedCommentsState[storyId]);
      const draftVal = activeCommentDrafts[storyId] || '';

      const card = document.createElement('div');
      card.className = "bg-white rounded-3xl p-6 sm:p-8 border border-heather-100 hover:border-heather-300 shadow-sm transition-all space-y-5 animate-fadeIn";
      card.dataset.storyId = storyId;

      const timeAgo = getTimeAgo(story.created_at);

      card.innerHTML = `
        <!-- Card Header -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-heather-400 to-heather-200 text-white flex items-center justify-center font-bold text-sm shadow-2xs flex-shrink-0">
              <i data-lucide="user" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-extrabold text-oase-plum">${escapeHtml(story.author_name)}</h3>
                <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">🔒 Anonim</span>
              </div>
              <span class="text-[11px] text-oase-muted flex items-center gap-1 mt-0.5">
                <i data-lucide="clock" class="w-3 h-3"></i>
                <span>${timeAgo}</span>
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-heather-50 text-heather-800 border border-heather-200 text-xs font-bold">
              ${escapeHtml(story.category)}
            </span>
            ${isModerator ? `
              <button 
                type="button" 
                class="delete-story-btn px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 border border-rose-200 transition-all flex-shrink-0"
                data-story-id="${storyId}"
                data-author="${escapeHtml(story.author_name)}"
                title="Wewenang Moderator: Hapus Cerita Ini"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-600"></i>
                <span class="hidden sm:inline">Hapus Cerita</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Story Content -->
        <div class="p-4 rounded-2xl bg-oase-surface/60 border border-oase-border/50 text-xs sm:text-sm text-oase-plum leading-relaxed italic">
          "${escapeHtml(story.story_content || story.content || '')}"
        </div>

        <!-- Action / Reactions Bar -->
        <div class="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-heather-100">
          <div class="flex items-center gap-2">
            <!-- Pelukan Virtual -->
            <button class="hug-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${reactions.userHugged ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold' : 'bg-white border-heather-200 text-oase-plum hover:bg-rose-50'} text-xs font-semibold transition-all" data-story-id="${storyId}">
              <span>🤗</span>
              <span>Pelukan Virtual</span>
              <span class="hug-count font-bold ml-0.5" id="hug-count-${storyId}">(${reactions.hugs})</span>
            </button>

            <!-- Semangat -->
            <button class="cheer-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${reactions.userCheered ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-white border-heather-200 text-oase-plum hover:bg-amber-50'} text-xs font-semibold transition-all" data-story-id="${storyId}">
              <span>❤️</span>
              <span>Semangat</span>
              <span class="cheer-count font-bold ml-0.5" id="cheer-count-${storyId}">(${reactions.cheers})</span>
            </button>
          </div>

          <!-- Toggle Komentar (Gaya Instagram / TikTok) -->
          <button class="toggle-comments-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isCommentsOpen ? 'bg-heather-100 border-heather-300 text-heather-900' : 'border-heather-200 bg-white hover:bg-heather-50 text-heather-800'} text-xs font-bold transition-all" data-story-id="${storyId}">
            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
            <span class="toggle-comments-label">
              ${isCommentsOpen ? `Tutup Komentar (${storyComments.length})` : (storyComments.length > 0 ? `Lihat ${storyComments.length} Komentar` : 'Tulis Dukungan')}
            </span>
          </button>
        </div>

        <!-- Section Komentar (Gaya Instagram/TikTok: Collapsible dengan max-height scroll) -->
        <div class="comments-section pt-3 space-y-3 ${isCommentsOpen ? '' : 'hidden'} animate-fadeIn border-t border-dashed border-heather-200" id="comments-section-${storyId}">
          
          <div class="flex items-center justify-between text-xs font-bold text-oase-plum px-1">
            <span class="flex items-center gap-1.5 text-heather-800">
              <i data-lucide="messages-square" class="w-3.5 h-3.5 text-heather-600"></i>
              <span>Dukungan Teman Komunitas (<span id="comments-count-${storyId}">${storyComments.length}</span>)</span>
            </span>
            <button type="button" class="close-comments-btn text-[11px] text-oase-muted hover:text-rose-600 font-bold" data-story-id="${storyId}">
              Tutup ✕
            </button>
          </div>

          <!-- Daftar Komentar (Scrollable rapi tidak menumpuk memanjang ke bawah) -->
          <div class="comments-list space-y-2.5 max-h-60 sm:max-h-72 overflow-y-auto pr-1.5" id="comments-list-${storyId}">
            ${renderCommentsListHtml(storyId, storyComments)}
          </div>

          <!-- Form Kirim Komentar -->
          <form class="comment-form flex items-center gap-2 pt-1" data-story-id="${storyId}">
            <input 
              type="text" 
              placeholder="Tulis untaian semangat atau pelukan hangat..." 
              required
              maxlength="250"
              value="${escapeHtml(draftVal)}"
              class="comment-input flex-grow px-3.5 py-2.5 rounded-xl border border-heather-200 text-xs text-oase-plum focus:outline-none focus:border-heather-500 focus:ring-2 focus:ring-heather-200 bg-oase-surface/50"
            />
            <button type="submit" class="px-4 py-2.5 rounded-xl bg-heather-500 hover:bg-heather-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all flex-shrink-0">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>Kirim</span>
            </button>
          </form>

        </div>
      `;

      communityFeedContainer.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
    attachEventListeners();
  }

  // 4. RENDER HTML DAFTAR KOMENTAR (DENGAN WEWENANG HAPUS KHUSUS MODERATOR)
  function renderCommentsListHtml(storyId, comments) {
    if (!comments || comments.length === 0) {
      return `<p class="text-[11px] text-oase-muted italic py-3 text-center bg-heather-50/40 rounded-xl border border-dashed border-heather-200">Belum ada komentar dukungan. Jadilah orang pertama yang mengirimkan pelukan hangat! ✨</p>`;
    }

    return comments.map(c => `
      <div class="comment-item p-3 rounded-2xl bg-heather-50/70 border border-heather-100 flex items-start justify-between gap-3 text-xs" data-comment-id="${c.id}" data-story-id="${storyId}">
        <div class="space-y-1 flex-grow">
          <div class="flex items-center gap-2">
            <span class="font-bold text-oase-plum">${escapeHtml(c.author)}</span>
            <span class="text-[10px] text-oase-muted font-normal">• ${getTimeAgo(c.created_at)}</span>
          </div>
          <p class="text-oase-muted leading-relaxed">${escapeHtml(c.content)}</p>
        </div>

        <!-- Tombol Hapus Khusus Moderator -->
        ${isModerator ? `
          <button 
            type="button" 
            class="delete-comment-btn px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1 border border-rose-200 flex-shrink-0 transition-colors"
            data-story-id="${storyId}"
            data-comment-id="${c.id}"
            title="Wewenang Moderator: Hapus komentar ini"
          >
            <i data-lucide="trash-2" class="w-3 h-3 text-rose-600"></i>
            <span>Hapus</span>
          </button>
        ` : ''}
      </div>
    `).join('');
  }

  // 5. ATTACH EVENT LISTENERS (DENGAN PROTEKSI INPUT TYPING & ACCORDION)
  function attachEventListeners() {
    // A. Simpan draft input komentar saat user mengetik (Revisi 1)
    document.querySelectorAll('.comment-input').forEach(input => {
      const storyId = input.closest('.comment-form')?.dataset.storyId;
      if (storyId) {
        input.oninput = (e) => {
          activeCommentDrafts[storyId] = e.target.value;
        };
      }
    });

    // B. Toggle Buka/Tutup Komentar (Gaya Instagram / TikTok - Revisi 2)
    document.querySelectorAll('.toggle-comments-btn').forEach(btn => {
      btn.onclick = () => {
        const storyId = btn.dataset.storyId;
        const section = document.getElementById(`comments-section-${storyId}`);
        const label = btn.querySelector('.toggle-comments-label');
        if (!section) return;

        const isCurrentlyHidden = section.classList.contains('hidden');
        if (isCurrentlyHidden) {
          section.classList.remove('hidden');
          expandedCommentsState[storyId] = true;
          btn.classList.add('bg-heather-100', 'border-heather-300', 'text-heather-900');
          btn.classList.remove('bg-white', 'text-heather-800');
          const count = document.getElementById(`comments-count-${storyId}`)?.textContent || '0';
          if (label) label.textContent = `Tutup Komentar (${count})`;
          const inp = section.querySelector('.comment-input');
          if (inp) inp.focus();
        } else {
          section.classList.add('hidden');
          expandedCommentsState[storyId] = false;
          btn.classList.remove('bg-heather-100', 'border-heather-300', 'text-heather-900');
          btn.classList.add('bg-white', 'text-heather-800');
          const count = document.getElementById(`comments-count-${storyId}`)?.textContent || '0';
          if (label) label.textContent = parseInt(count) > 0 ? `Lihat ${count} Komentar` : 'Tulis Dukungan';
        }
      };
    });

    // C. Tombol Tutup Komentar di dalam Section
    document.querySelectorAll('.close-comments-btn').forEach(btn => {
      btn.onclick = () => {
        const storyId = btn.dataset.storyId;
        const section = document.getElementById(`comments-section-${storyId}`);
        const toggleBtn = document.querySelector(`.toggle-comments-btn[data-story-id="${storyId}"]`);
        const label = toggleBtn?.querySelector('.toggle-comments-label');
        if (section) section.classList.add('hidden');
        expandedCommentsState[storyId] = false;
        if (toggleBtn) {
          toggleBtn.classList.remove('bg-heather-100', 'border-heather-300', 'text-heather-900');
          toggleBtn.classList.add('bg-white', 'text-heather-800');
        }
        const count = document.getElementById(`comments-count-${storyId}`)?.textContent || '0';
        if (label) label.textContent = parseInt(count) > 0 ? `Lihat ${count} Komentar` : 'Tulis Dukungan';
      };
    });

    // D. Tombol Pelukan Virtual (Mulai dari 0 untuk cerita baru - Revisi 3)
    document.querySelectorAll('.hug-btn').forEach(btn => {
      btn.onclick = async () => {
        const storyId = btn.dataset.storyId;
        const stored = getStoredReactions();
        const cur = stored[storyId] || { hugs: 0, cheers: 0, userHugged: false, userCheered: false };
        if (!cur.userHugged) {
          cur.hugs += 1;
          cur.userHugged = true;
          stored[storyId] = cur;
          saveStoredReactions(stored);
          btn.classList.add('bg-rose-100', 'border-rose-300', 'text-rose-800', 'font-bold');
          const countEl = document.getElementById(`hug-count-${storyId}`);
          if (countEl) countEl.textContent = `(${cur.hugs})`;
          if (window.CommunityService && typeof window.CommunityService.sendReaction === 'function') {
            await window.CommunityService.sendReaction({ storyId, type: 'hugs' });
          }
          showToast('Pelukan virtual berhasil dikirim! 🤗');
        } else {
          showToast('Anda sudah memberikan pelukan virtual untuk cerita ini.');
        }
      };
    });

    // E. Tombol Semangat (Mulai dari 0 untuk cerita baru - Revisi 3)
    document.querySelectorAll('.cheer-btn').forEach(btn => {
      btn.onclick = async () => {
        const storyId = btn.dataset.storyId;
        const stored = getStoredReactions();
        const cur = stored[storyId] || { hugs: 0, cheers: 0, userHugged: false, userCheered: false };
        if (!cur.userCheered) {
          cur.cheers += 1;
          cur.userCheered = true;
          stored[storyId] = cur;
          saveStoredReactions(stored);
          btn.classList.add('bg-amber-100', 'border-amber-300', 'text-amber-900', 'font-bold');
          const countEl = document.getElementById(`cheer-count-${storyId}`);
          if (countEl) countEl.textContent = `(${cur.cheers})`;
          if (window.CommunityService && typeof window.CommunityService.sendReaction === 'function') {
            await window.CommunityService.sendReaction({ storyId, type: 'cheers' });
          }
          showToast('Dukungan semangat berhasil dikirim! ❤️');
        } else {
          showToast('Anda sudah mengirimkan semangat untuk cerita ini.');
        }
      };
    });

    // F. Form Tambah Komentar (Sensor SARA Pengomentar - Revisi 4)
    document.querySelectorAll('.comment-form').forEach(form => {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const storyId = form.dataset.storyId;
        const input = form.querySelector('.comment-input');
        const text = input.value.trim();
        if (!text) return;

        // FILTER KEAMANAN SARA & CYBERBULLYING PENGOMENTAR
        const check = checkTextForViolations(text);
        if (check.isViolation) {
          showSaraAlert(check.matchedKeyword);
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
          if (window.CommunityService && typeof window.CommunityService.addComment === 'function') {
            await window.CommunityService.addComment({
              storyId,
              author: currentUserName || 'Sahabat OASE',
              content: text
            });
          } else {
            const storedComments = getStoredComments();
            if (!storedComments[storyId]) storedComments[storyId] = [];
            const newComment = {
              id: 'c-' + Date.now(),
              author: currentUserName || 'Sahabat OASE',
              content: text,
              created_at: new Date().toISOString()
            };
            storedComments[storyId].unshift(newComment);
            saveStoredComments(storedComments);
          }

          input.value = '';
          delete activeCommentDrafts[storyId];
          showToast('Komentar dukungan Anda berhasil dikirim! ✨');

          // Perbarui komentar pada DOM kartu ini secara langsung
          const storedComments = window.CommunityService 
            ? window.CommunityService.getStoredCommentsSync() 
            : getStoredComments();
          const storyComments = storedComments[storyId] || [];
          const listEl = document.getElementById(`comments-list-${storyId}`);
          const countEl = document.getElementById(`comments-count-${storyId}`);
          if (listEl) listEl.innerHTML = renderCommentsListHtml(storyId, storyComments);
          if (countEl) countEl.textContent = storyComments.length;

          attachDeleteCommentEvents();
          if (window.lucide) lucide.createIcons();
        } catch (err) {
          alert('Gagal mengirim komentar: ' + err.message);
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      };
    });

    // Pasang wewenang hapus khusus moderator
    attachDeleteCommentEvents();
    attachDeleteStoryEvents();
  }

  // 6. HANDLER HAPUS KOMENTAR KHUSUS MODERATOR
  function attachDeleteCommentEvents() {
    if (!isModerator) return;
    document.querySelectorAll('.delete-comment-btn').forEach(btn => {
      btn.onclick = () => {
        const storyId = btn.dataset.storyId;
        const commentId = btn.dataset.commentId;
        commentToDelete = { storyId, commentId };
        if (deleteCommentModal) deleteCommentModal.classList.remove('hidden');
      };
    });
  }

  if (cancelDeleteCommentBtn) {
    cancelDeleteCommentBtn.onclick = () => {
      commentToDelete = null;
      if (deleteCommentModal) deleteCommentModal.classList.add('hidden');
    };
  }

  if (confirmDeleteCommentBtn) {
    confirmDeleteCommentBtn.onclick = async () => {
      if (!commentToDelete || !isModerator) return;
      const { storyId, commentId } = commentToDelete;

      if (window.CommunityService && typeof window.CommunityService.deleteComment === 'function') {
        await window.CommunityService.deleteComment({
          storyId,
          commentId,
          deletedBy: currentUserName || 'Moderator OASE',
          reason: 'Pelanggaran pedoman komunitas'
        });
      } else {
        const storedComments = getStoredComments();
        if (storedComments[storyId]) {
          storedComments[storyId] = storedComments[storyId].filter(c => c.id !== commentId);
          saveStoredComments(storedComments);
        }
      }

      commentToDelete = null;
      if (deleteCommentModal) deleteCommentModal.classList.add('hidden');
      showToast('Komentar berhasil dihapus oleh Moderator. 🛡️');

      const storedComments = window.CommunityService 
        ? window.CommunityService.getStoredCommentsSync() 
        : getStoredComments();
      const storyComments = storedComments[storyId] || [];
      const listEl = document.getElementById(`comments-list-${storyId}`);
      const countEl = document.getElementById(`comments-count-${storyId}`);
      if (listEl) listEl.innerHTML = renderCommentsListHtml(storyId, storyComments);
      if (countEl) countEl.textContent = storyComments.length;
      attachDeleteCommentEvents();
      if (window.lucide) lucide.createIcons();
    };
  }

  // 7. HANDLER HAPUS CERITA KHUSUS MODERATOR (Revisi 4)
  function attachDeleteStoryEvents() {
    if (!isModerator) return;
    document.querySelectorAll('.delete-story-btn').forEach(btn => {
      btn.onclick = () => {
        const storyId = btn.dataset.storyId;
        const author = btn.dataset.author || 'Anonim';
        storyToDelete = { storyId, author };
        if (deleteStoryModalDesc) {
          deleteStoryModalDesc.innerHTML = `Wewenang Moderator: Apakah Anda yakin ingin menghapus cerita oleh <strong>${escapeHtml(author)}</strong> beserta seluruh komentarnya dari komunitas OASE? Tindakan ini tidak dapat dibatalkan.`;
        }
        if (deleteStoryModal) deleteStoryModal.classList.remove('hidden');
      };
    });
  }

  if (cancelDeleteStoryBtn) {
    cancelDeleteStoryBtn.onclick = () => {
      storyToDelete = null;
      if (deleteStoryModal) deleteStoryModal.classList.add('hidden');
    };
  }

  if (confirmDeleteStoryBtn) {
    confirmDeleteStoryBtn.onclick = async () => {
      if (!storyToDelete || !isModerator) return;
      const { storyId, author } = storyToDelete;

      confirmDeleteStoryBtn.disabled = true;
      confirmDeleteStoryBtn.textContent = 'Menghapus Cerita...';

      try {
        if (window.CommunityService && typeof window.CommunityService.deleteStory === 'function') {
          await window.CommunityService.deleteStory(storyId, currentUserName || 'Moderator OASE', 'Pelanggaran pedoman komunitas');
        } else {
          let stories = getStoredCommunityStories();
          stories = stories.filter(s => s.id !== storyId);
          saveStoredCommunityStories(stories);
        }
        showToast(`Cerita oleh ${author} berhasil dihapus permanen oleh Moderator! 🛡️`);
      } catch (err) {
        alert('Gagal menghapus cerita: ' + err.message);
      } finally {
        confirmDeleteStoryBtn.disabled = false;
        confirmDeleteStoryBtn.textContent = 'Ya, Hapus Cerita';
        storyToDelete = null;
        if (deleteStoryModal) deleteStoryModal.classList.add('hidden');
        await renderCommunityFeed();
      }
    };
  }

  // 8. FILTER KATEGORI BUTTONS
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'bg-heather-500', 'text-white', 'shadow-xs');
        b.classList.add('bg-white', 'text-oase-muted', 'border', 'border-heather-200');
      });
      btn.classList.add('active', 'bg-heather-500', 'text-white', 'shadow-xs');
      btn.classList.remove('bg-white', 'text-oase-muted', 'border', 'border-heather-200');

      currentCategory = btn.dataset.cat;
      renderCommunityFeed();
    };
  });

  // 9. MODAL BAGIKAN CERITA KE KOMUNITAS (DENGAN SENSOR SARA PEMBUAT CERITA - Revisi 4)
  function openNewStoryModal() {
    if (newCommunityStoryModal) {
      newCommunityStoryModal.classList.remove('hidden');
      if (communityStoryAuthorInput) {
        if (!communityStoryAuthorInput.value && currentUserName && currentUserName !== 'Sahabat OASE') {
          communityStoryAuthorInput.value = currentUserName;
        }
        communityStoryAuthorInput.focus();
      }
    }
  }

  function closeNewStoryModal() {
    if (newCommunityStoryModal) {
      newCommunityStoryModal.classList.add('hidden');
    }
    if (newCommunityStoryForm) {
      newCommunityStoryForm.reset();
    }
  }

  if (openNewStoryModalBtn) openNewStoryModalBtn.onclick = openNewStoryModal;
  if (heroShareStoryBtn) heroShareStoryBtn.onclick = openNewStoryModal;
  if (closeNewStoryModalBtn) closeNewStoryModalBtn.onclick = closeNewStoryModal;
  if (cancelNewStoryModalBtn) cancelNewStoryModalBtn.onclick = closeNewStoryModal;

  if (newCommunityStoryModal) {
    newCommunityStoryModal.onclick = (e) => {
      if (e.target === newCommunityStoryModal) closeNewStoryModal();
    };
  }

  if (newCommunityStoryForm) {
    newCommunityStoryForm.onsubmit = async (e) => {
      e.preventDefault();
      const author = communityStoryAuthorInput ? communityStoryAuthorInput.value.trim() : '';
      const category = communityStoryCategorySelect ? communityStoryCategorySelect.value : 'Akademik';
      const content = communityStoryContentInput ? communityStoryContentInput.value.trim() : '';

      if (!content) return;

      // FILTER KEAMANAN SARA & CYBERBULLYING PEMBUAT CERITA (Revisi 4)
      const fullTextToValidate = (author + ' ' + content).trim();
      const check = checkTextForViolations(fullTextToValidate);
      if (check.isViolation) {
        showSaraAlert(check.matchedKeyword);
        return;
      }

      const submitBtn = newCommunityStoryForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mempublikasikan...';
      }

      try {
        if (window.CommunityService && typeof window.CommunityService.createStory === 'function') {
          await window.CommunityService.createStory({
            authorName: author || 'Sahabat Anonim',
            category: category,
            emotion: 'Berbagi Cerita',
            content: content
          });
        } else {
          const newStory = {
            id: 'story-kom-' + Date.now(),
            author_name: author || 'Sahabat Anonim',
            category: category,
            emotion: 'Berbagi Cerita',
            created_at: new Date().toISOString(),
            story_content: content,
            hugs: 0,
            cheers: 0
          };
          const stories = getStoredCommunityStories();
          stories.unshift(newStory);
          saveStoredCommunityStories(stories);
        }

        closeNewStoryModal();
        await renderCommunityFeed();
        showToast('Cerita komunitasmu berhasil dibagikan ke semua orang! ✨');
      } catch(err) {
        alert('Gagal membagikan cerita: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i data-lucide="send" class="w-3.5 h-3.5"></i><span>Bagikan Sekarang</span>`;
          if (window.lucide) lucide.createIcons();
        }
      }
    };
  }

  // HELPER FUNCTIONS
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getTimeAgo(isoDate) {
    if (!isoDate) return 'Baru saja';
    const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  }

  function showToast(msg) {
    const existing = document.getElementById('oaseToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'oaseToast';
    toast.className = 'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-oase-plum text-white font-bold text-xs shadow-xl border border-heather-400 flex items-center gap-2 animate-fadeIn';
    toast.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4 text-amber-400"></i><span>${msg}</span>`;
    document.body.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // 10. REALTIME SYNCHRONIZATION DENGAN PROTEKSI INPUT TYPING (Revisi 1)
  if (window.CommunityService && typeof window.CommunityService.initRealtime === 'function') {
    window.CommunityService.initRealtime();
    window.CommunityService.onUpdate((data) => {
      if (!data) return;

      // Jika ada komentar baru, HANYA perbarui kartu terkait tanpa menghapus feed atau input user lain!
      if (data.action === 'NEW_COMMENT' && data.payload) {
        const sId = data.payload.story_id;
        const listEl = document.getElementById(`comments-list-${sId}`);
        const countEl = document.getElementById(`comments-count-${sId}`);
        if (listEl) {
          const storedComments = window.CommunityService 
            ? window.CommunityService.getStoredCommentsSync() 
            : getStoredComments();
          const storyComments = storedComments[sId] || [];
          listEl.innerHTML = renderCommentsListHtml(sId, storyComments);
          if (countEl) countEl.textContent = storyComments.length;

          const toggleBtn = document.querySelector(`.toggle-comments-btn[data-story-id="${sId}"] .toggle-comments-label`);
          const isSectionOpen = expandedCommentsState[sId];
          if (toggleBtn) {
            toggleBtn.textContent = isSectionOpen 
              ? `Tutup Komentar (${storyComments.length})` 
              : (storyComments.length > 0 ? `Lihat ${storyComments.length} Komentar` : 'Tulis Dukungan');
          }

          attachDeleteCommentEvents();
          if (window.lucide) lucide.createIcons();
          return;
        }
      }

      // Jika ada komentar dihapus
      if (data.action === 'DELETE_COMMENT' && data.payload) {
        const sId = data.payload.storyId;
        const listEl = document.getElementById(`comments-list-${sId}`);
        const countEl = document.getElementById(`comments-count-${sId}`);
        if (listEl) {
          const storedComments = window.CommunityService 
            ? window.CommunityService.getStoredCommentsSync() 
            : getStoredComments();
          const storyComments = storedComments[sId] || [];
          listEl.innerHTML = renderCommentsListHtml(sId, storyComments);
          if (countEl) countEl.textContent = storyComments.length;

          const toggleBtn = document.querySelector(`.toggle-comments-btn[data-story-id="${sId}"] .toggle-comments-label`);
          const isSectionOpen = expandedCommentsState[sId];
          if (toggleBtn) {
            toggleBtn.textContent = isSectionOpen 
              ? `Tutup Komentar (${storyComments.length})` 
              : (storyComments.length > 0 ? `Lihat ${storyComments.length} Komentar` : 'Tulis Dukungan');
          }

          attachDeleteCommentEvents();
          if (window.lucide) lucide.createIcons();
          return;
        }
      }

      // Jika ada reaksi pelukan/semangat
      if (data.action === 'REACTION' && data.payload) {
        const { storyId, type, count } = data.payload;
        if (type === 'hugs') {
          const countEl = document.getElementById(`hug-count-${storyId}`);
          if (countEl) countEl.textContent = `(${count})`;
        } else if (type === 'cheers') {
          const countEl = document.getElementById(`cheer-count-${storyId}`);
          if (countEl) countEl.textContent = `(${count})`;
        }
        return;
      }

      // Untuk penambahan/penghapusan cerita, perbarui feed namun tetap pertahankan draft ketikan
      renderCommunityFeed();
    });
  }

  // Mulai memuat
  await renderCommunityFeed();
});
