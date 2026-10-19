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

  // 1. CEK IDENTITAS & ROLE MODERATOR
  async function checkUserRole() {
    try {
      const activeEmail = localStorage.getItem('oase_active_user_email');
      const savedProfiles = JSON.parse(localStorage.getItem('oase_user_profiles') || '{}');

      let userProfile = null;
      if (activeEmail && savedProfiles[activeEmail]) {
        userProfile = savedProfiles[activeEmail];
      }

      // Juga cek profil via AuthService jika terhubung
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

  // 2. DATA CERITA KOMUNITAS (DEFAULT & LOKAL)
  const defaultCommunityStories = [
    {
      id: 'story-kom-1',
      author_name: 'Bintang Kecil',
      category: 'Akademik',
      emotion: 'Cemas',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      story_content: 'Menjelang ujian akhir sekolah ini kepalaku sering pusing dan overthinking takut tidak bisa membanggakan orang tua. Kadang rasanya ingin istirahat sejenak tapi takut tertinggal oleh teman-teman yang lain.',
      hugs: 14,
      cheers: 22
    },
    {
      id: 'story-kom-2',
      author_name: 'Pengelana Senja',
      category: 'Pertemanan',
      emotion: 'Kesepian',
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      story_content: 'Di kelas rasanya ramai sekali, tapi kenapa aku merasa sangat sendiri ya? Teman-teman sekelompok asyik membicarakan hal yang tidak kupahami. Ada yang pernah merasa asing di tengah keramaian seperti ini?',
      hugs: 31,
      cheers: 19
    },
    {
      id: 'story-kom-3',
      author_name: 'Pena Teduh',
      category: 'Keluarga',
      emotion: 'Lelah',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      story_content: 'Ekspektasi orang tua terhadap nilaiku begitu tinggi. Setiap kali pulang membawa nilai 80 selalu dibandingkan dengan saudara yang dapat 95. Tapi hari ini aku bersyukur masih bisa tersenyum dan menemukan ruang aman ini.',
      hugs: 45,
      cheers: 38
    }
  ];

  // Ambil komentar dari localStorage
  function getStoredComments() {
    return JSON.parse(localStorage.getItem('oase_community_comments') || '{}');
  }

  function saveStoredComments(commentsObj) {
    localStorage.setItem('oase_community_comments', JSON.stringify(commentsObj));
  }

  // Ambil reaksi dari localStorage
  function getStoredReactions() {
    return JSON.parse(localStorage.getItem('oase_community_reactions') || '{}');
  }

  function saveStoredReactions(reactionsObj) {
    localStorage.setItem('oase_community_reactions', JSON.stringify(reactionsObj));
  }

  // Ambil & simpan cerita khusus komunitas (Bukan curhat konselor)
  function getStoredCommunityStories() {
    return JSON.parse(localStorage.getItem('oase_community_stories') || '[]');
  }

  function saveStoredCommunityStories(stories) {
    localStorage.setItem('oase_community_stories', JSON.stringify(stories));
  }

  // 3. RENDER FEED KOMUNITAS (MEMUAT CERITA & KOMENTAR DARI DATABASE & REAL-TIME)
  async function renderCommunityFeed() {
    await checkUserRole();

    // Memuat cerita dari CommunityService (Supabase + Realtime + Local Fallback)
    let allStories = [];
    if (window.CommunityService && typeof window.CommunityService.getStories === 'function') {
      try {
        allStories = await window.CommunityService.getStories();
      } catch(e) {
        allStories = [...getStoredCommunityStories(), ...defaultCommunityStories];
      }
    } else {
      allStories = [...getStoredCommunityStories(), ...defaultCommunityStories];
    }

    // Filter kategori
    const filteredStories = currentCategory === 'all'
      ? allStories
      : allStories.filter(s => (s.category || '').toLowerCase().includes(currentCategory.toLowerCase()));

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
      lucide.createIcons();
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
      const storyComments = storedComments[storyId] || [
        {
          id: `c-init-${storyId}`,
          author: 'Teman Baik',
          content: 'Kamu hebat sudah bertahan sejauh ini. Jangan lupa istirahat dan tarik napas panjang ya! Semangat selalu!',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      const reactions = storedReactions[storyId] || {
        hugs: story.hugs || 0,
        cheers: story.cheers || 0,
        userHugged: false,
        userCheered: false
      };

      const card = document.createElement('div');
      card.className = "bg-white rounded-3xl p-6 sm:p-8 border border-heather-100 hover:border-heather-300 shadow-sm transition-all space-y-5 animate-fadeIn";
      card.dataset.storyId = storyId;

      // Format waktu
      const timeAgo = getTimeAgo(story.created_at);

      card.innerHTML = `
        <!-- Card Header -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-heather-400 to-heather-200 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
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

          <span class="px-3 py-1 rounded-full bg-heather-50 text-heather-800 border border-heather-200 text-xs font-bold">
            ${escapeHtml(story.category)}
          </span>
        </div>

        <!-- Story Content -->
        <div class="p-4 rounded-2xl bg-oase-surface/60 border border-oase-border/50 text-xs sm:text-sm text-oase-plum leading-relaxed italic">
          "${escapeHtml(story.story_content)}"
        </div>

        <!-- Action / Reactions Bar -->
        <div class="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-heather-100">
          <div class="flex items-center gap-2">
            <!-- Pelukan Virtual -->
            <button class="hug-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${reactions.userHugged ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold' : 'bg-white border-heather-200 text-oase-plum hover:bg-rose-50'} text-xs font-semibold transition-all" data-story-id="${storyId}">
              <span>🤗</span>
              <span>Pelukan Virtual</span>
              <span class="hug-count font-bold ml-0.5">(${reactions.hugs})</span>
            </button>

            <!-- Semangat -->
            <button class="cheer-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${reactions.userCheered ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-white border-heather-200 text-oase-plum hover:bg-amber-50'} text-xs font-semibold transition-all" data-story-id="${storyId}">
              <span>❤️</span>
              <span>Semangat</span>
              <span class="cheer-count font-bold ml-0.5">(${reactions.cheers})</span>
            </button>
          </div>

          <!-- Toggle Komentar -->
          <button class="toggle-comments-btn flex items-center gap-1 px-3 py-1.5 rounded-xl border border-heather-200 bg-white hover:bg-heather-50 text-heather-800 text-xs font-bold transition-all" data-story-id="${storyId}">
            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
            <span>Dukungan (${storyComments.length})</span>
          </button>
        </div>

        <!-- Section Komentar (Terbuka Bawaan) -->
        <div class="comments-section pt-3 space-y-3" id="comments-section-${storyId}">
          
          <!-- Daftar Komentar -->
          <div class="comments-list space-y-2.5" id="comments-list-${storyId}">
            ${renderCommentsListHtml(storyId, storyComments)}
          </div>

          <!-- Form Kirim Komentar -->
          <form class="comment-form flex items-center gap-2 pt-2" data-story-id="${storyId}">
            <input 
              type="text" 
              placeholder="Tulis untaian semangat atau pelukan hangat..." 
              required
              maxlength="250"
              class="comment-input flex-grow px-3.5 py-2.5 rounded-xl border border-heather-200 text-xs text-oase-plum focus:outline-none focus:border-heather-500 focus:ring-2 focus:ring-heather-200 bg-oase-surface/40"
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

    lucide.createIcons();
    attachEventListeners();
  }

  // 4. RENDER HTML DAFTAR KOMENTAR (DENGAN TOMBOL HAPUS UNTUK MODERATOR)
  function renderCommentsListHtml(storyId, comments) {
    if (!comments || comments.length === 0) {
      return `<p class="text-[11px] text-oase-muted italic py-1">Belum ada komentar dukungan. Jadilah yang pertama memberikan pelukan hangat!</p>`;
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

  // 5. ATTACH EVENT LISTENERS
  function attachEventListeners() {
    // Tombol Pelukan Virtual
    document.querySelectorAll('.hug-btn').forEach(btn => {
      btn.onclick = async () => {
        const storyId = btn.dataset.storyId;
        const stored = getStoredReactions();
        const cur = stored[storyId] || { hugs: 10, cheers: 15, userHugged: false, userCheered: false };
        if (!cur.userHugged) {
          cur.hugs += 1;
          cur.userHugged = true;
          stored[storyId] = cur;
          saveStoredReactions(stored);
          btn.classList.add('bg-rose-100', 'border-rose-300', 'text-rose-800', 'font-bold');
          btn.querySelector('.hug-count').textContent = `(${cur.hugs})`;
          if (window.CommunityService && typeof window.CommunityService.sendReaction === 'function') {
            await window.CommunityService.sendReaction({ storyId, type: 'hugs' });
          }
          showToast('Pelukan virtual berhasil dikirim! 🤗');
        } else {
          showToast('Anda sudah mengirimkan pelukan virtual untuk cerita ini.');
        }
      };
    });

    // Tombol Semangat
    document.querySelectorAll('.cheer-btn').forEach(btn => {
      btn.onclick = async () => {
        const storyId = btn.dataset.storyId;
        const stored = getStoredReactions();
        const cur = stored[storyId] || { hugs: 10, cheers: 15, userHugged: false, userCheered: false };
        if (!cur.userCheered) {
          cur.cheers += 1;
          cur.userCheered = true;
          stored[storyId] = cur;
          saveStoredReactions(stored);
          btn.classList.add('bg-amber-100', 'border-amber-300', 'text-amber-900', 'font-bold');
          btn.querySelector('.cheer-count').textContent = `(${cur.cheers})`;
          if (window.CommunityService && typeof window.CommunityService.sendReaction === 'function') {
            await window.CommunityService.sendReaction({ storyId, type: 'cheers' });
          }
          showToast('Dukungan semangat berhasil dikirim! ❤️');
        } else {
          showToast('Anda sudah mengirimkan semangat untuk cerita ini.');
        }
      };
    });

    // Form Tambah Komentar
    document.querySelectorAll('.comment-form').forEach(form => {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const storyId = form.dataset.storyId;
        const input = form.querySelector('.comment-input');
        const text = input.value.trim();
        if (!text) return;

        // FILTER KEAMANAN SARA & CYBERBULLYING
        if (window.CrisisDetectionService) {
          const check = window.CrisisDetectionService.checkContent(text);
          if (check.isViolation) {
            alert(`⚠️ PERINGATAN KOMUNITAS: Komentar Anda terdeteksi mengandung kata yang dilarang atau berpotensi menyakiti sesama ("${check.matchedKeyword}"). Komentar tidak dapat dikirim demi menjaga ruang empati OASE tetap aman.`);
            return;
          }
        }

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
        showToast('Komentar dukungan Anda berhasil dibagikan! ✨');
        await renderCommunityFeed();
      };
    });

    // Pasang handler hapus komentar (jika moderator)
    attachDeleteCommentEvents();
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
      await renderCommunityFeed();
    };
  }

  // 7. FILTER KATEGORI BUTTONS
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

  // 8. MODAL BAGIKAN CERITA KE KOMUNITAS (MURNI HANYA TAMPIL DI KOMUNITAS)
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

      // Filter Keamanan SARA & Cyberbullying
      if (window.CrisisDetectionService) {
        const check = window.CrisisDetectionService.checkContent(content);
        if (check.isViolation) {
          alert(`⚠️ PERINGATAN KOMUNITAS: Cerita Anda terdeteksi mengandung kata yang dilarang atau berpotensi menyakiti sesama ("${check.matchedKeyword}"). Cerita tidak dapat dipublikasikan demi menjaga ruang empati OASE tetap aman.`);
          return;
        }
      }

      if (window.CommunityService && typeof window.CommunityService.createStory === 'function') {
        try {
          await window.CommunityService.createStory({
            authorName: author || 'Sahabat Anonim',
            category: category,
            emotion: 'Berbagi Cerita',
            content: content
          });
        } catch(err) {
          console.warn('Gagal menyimpan via CommunityService, fallback lokal:', err);
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
    lucide.createIcons();
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Inisialisasi Realtime Synchronization untuk Komunitas
  if (window.CommunityService && typeof window.CommunityService.initRealtime === 'function') {
    window.CommunityService.initRealtime();
    window.CommunityService.onUpdate(() => {
      renderCommunityFeed();
    });
  }

  // Mulai memuat
  await renderCommunityFeed();
});
