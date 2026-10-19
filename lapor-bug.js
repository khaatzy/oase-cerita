// ==============================================================================
// LAPOR BUG - OASE CERITA (FRONTEND SCRIPT)
// Pengiriman Laporan Kendala Siswa ke Seluruh Moderator & Integrasi WhatsApp
// Wajib Login Terlebih Dahulu (Dual Role: Siswa / Moderator)
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // State Otentikasi
  let currentUser = null;
  let currentAuthRole = 'user'; // 'user' or 'moderator'

  // DOM Elements - Auth & Header
  const authUserInfoBadge = document.getElementById('authUserInfoBadge');
  const authUserNameSpan = document.getElementById('authUserNameSpan');
  const openAuthModalBtn = document.getElementById('openAuthModalBtn');
  const authRequiredBanner = document.getElementById('authRequiredBanner');
  const triggerLoginModalBtn = document.getElementById('triggerLoginModalBtn');
  const verifiedAccountBadge = document.getElementById('verifiedAccountBadge');
  const verifiedNameText = document.getElementById('verifiedNameText');
  const verifiedEmailText = document.getElementById('verifiedEmailText');
  const verifiedRoleBadge = document.getElementById('verifiedRoleBadge');

  // DOM Elements - Login Modal
  const bugAuthModal = document.getElementById('bugAuthModal');
  const closeBugAuthModalBtn = document.getElementById('closeBugAuthModalBtn');
  const roleTabUser = document.getElementById('roleTabUser');
  const roleTabMod = document.getElementById('roleTabMod');
  const roleHelpNotice = document.getElementById('roleHelpNotice');
  const roleHelpText = document.getElementById('roleHelpText');
  const authAlertBox = document.getElementById('authAlertBox');
  const bugLoginForm = document.getElementById('bugLoginForm');
  const authEmailInput = document.getElementById('authEmailInput');
  const authPasswordInput = document.getElementById('authPasswordInput');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authSubmitText = document.getElementById('authSubmitText');

  // DOM Elements - Bug Report Form
  const bugForm = document.getElementById('bugReportMainForm');
  const reporterNameInput = document.getElementById('reporterNameInput');
  const reporterEmailInput = document.getElementById('reporterEmailInput');
  const bugCategoryInput = document.getElementById('bugCategoryInput');
  const bugDeviceInput = document.getElementById('bugDeviceInput');
  const bugPageUrlInput = document.getElementById('bugPageUrlInput');
  const bugDescriptionArea = document.getElementById('bugDescriptionArea');
  const submitDirectBtn = document.getElementById('submitBugDirectBtn');
  const sendWhatsAppBtn = document.getElementById('sendViaWhatsAppBtn');
  const bugFormAlert = document.getElementById('bugFormAlert');
  const bugSuccessModal = document.getElementById('bugSuccessModal');
  const ticketResultId = document.getElementById('ticketResultId');
  const viewMyTicketNowBtn = document.getElementById('viewMyTicketNowBtn');
  const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');

  // DOM Elements - Ticket Tracker Modal & Badges
  const openCheckTicketModalBtn = document.getElementById('openCheckTicketModalBtn');
  const headerTicketCountBadge = document.getElementById('headerTicketCountBadge');
  const heroCheckTicketBtn = document.getElementById('heroCheckTicketBtn');
  const heroTicketStatusBadge = document.getElementById('heroTicketStatusBadge');
  const checkBugTicketModal = document.getElementById('checkBugTicketModal');
  const closeCheckTicketModalBtn = document.getElementById('closeCheckTicketModalBtn');
  const closeCheckTicketFooterBtn = document.getElementById('closeCheckTicketFooterBtn');
  const trackerTabSearchBtn = document.getElementById('trackerTabSearchBtn');
  const trackerTabHistoryBtn = document.getElementById('trackerTabHistoryBtn');
  const trackerMyHistoryCountBadge = document.getElementById('trackerMyHistoryCountBadge');
  const trackerSearchPanel = document.getElementById('trackerSearchPanel');
  const trackerHistoryPanel = document.getElementById('trackerHistoryPanel');
  const trackerSearchForm = document.getElementById('trackerSearchForm');
  const trackerSearchInput = document.getElementById('trackerSearchInput');
  const trackerSearchResultContainer = document.getElementById('trackerSearchResultContainer');
  const trackerHistoryList = document.getElementById('trackerHistoryList');
  const refreshTrackerHistoryBtn = document.getElementById('refreshTrackerHistoryBtn');

  // State Pelacakan Tiket
  const STORAGE_KEY_MY_BUGS = 'oase_my_bug_tickets';
  let activeTrackedTicketId = null;

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTime(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  }

  function getMyTicketIds() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MY_BUGS) || '[]');
    } catch(e) {
      return [];
    }
  }

  function addMyTicketId(ticketId) {
    if (!ticketId) return;
    const list = getMyTicketIds();
    const cleanId = ticketId.trim();
    if (!list.includes(cleanId)) {
      list.unshift(cleanId);
      localStorage.setItem(STORAGE_KEY_MY_BUGS, JSON.stringify(list));
    }
  }

  async function getMyReports() {
    let allReports = [];
    if (window.BugReportService) {
      try {
        allReports = await window.BugReportService.getReports({ includeResolved: true });
      } catch(e) {
        allReports = JSON.parse(localStorage.getItem('oase_bug_reports') || '[]');
      }
    } else {
      allReports = JSON.parse(localStorage.getItem('oase_bug_reports') || '[]');
    }

    const myIds = getMyTicketIds();
    const userEmail = (currentUser && currentUser.email) ? currentUser.email.toLowerCase().trim() : '';

    return allReports.filter(r => {
      const isMatchId = (r.ticket_id && myIds.includes(r.ticket_id)) || (r.id && myIds.includes(r.id));
      const isMatchEmail = userEmail && r.reporter_email && r.reporter_email.toLowerCase().trim() === userEmail;
      return isMatchId || isMatchEmail;
    });
  }

  // Pembaruan Status Tombol / Badge Tracker di Halaman Utama (Header & Hero)
  async function updateTrackerButtonStatus() {
    const myReports = await getMyReports();
    const total = myReports.length;

    if (trackerMyHistoryCountBadge) {
      trackerMyHistoryCountBadge.textContent = total;
    }

    if (headerTicketCountBadge) {
      if (total > 0) {
        headerTicketCountBadge.classList.remove('hidden');
        headerTicketCountBadge.textContent = total;
      } else {
        headerTicketCountBadge.classList.add('hidden');
      }
    }

    if (heroTicketStatusBadge) {
      if (total === 0) {
        heroTicketStatusBadge.textContent = 'Cek Status & Riwayat';
      } else {
        const hasProcessing = myReports.some(r => r.status === 'proses');
        const hasNew = myReports.some(r => r.status === 'baru');
        const allResolved = total > 0 && myReports.every(r => r.status === 'selesai');

        if (hasProcessing) {
          heroTicketStatusBadge.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1"></span>${total} Tiket (Sedang Diproses)`;
        } else if (hasNew) {
          heroTicketStatusBadge.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1"></span>${total} Tiket (Menunggu Ditinjau)`;
        } else if (allResolved) {
          heroTicketStatusBadge.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>${total} Tiket (Tuntas Selesai)`;
        } else {
          heroTicketStatusBadge.textContent = `${total} Laporan Terkirim`;
        }
      }
    }
  }

  // Inisialisasi Realtime Service Bug Report & Listener
  if (window.BugReportService && typeof window.BugReportService.initRealtime === 'function') {
    window.BugReportService.initRealtime();
    window.BugReportService.onUpdate((data) => {
      // Sinkronisasi realtime saat ada moderator yang memproses atau menyelesaikan tiket
      updateTrackerButtonStatus();

      if (activeTrackedTicketId) {
        searchTicket(activeTrackedTicketId, false);
      }

      if (trackerHistoryPanel && !trackerHistoryPanel.classList.contains('hidden')) {
        renderHistoryList();
      }
    });
  }

  // Cek parameter URL (misalnya ?page=komunitas.html)
  const urlParams = new URLSearchParams(window.location.search);
  const fromPage = urlParams.get('from');
  if (fromPage && bugPageUrlInput) {
    for (let i = 0; i < bugPageUrlInput.options.length; i++) {
      if (bugPageUrlInput.options[i].value.includes(fromPage)) {
        bugPageUrlInput.selectedIndex = i;
        break;
      }
    }
  }

  function showAlert(msg, isError = true) {
    if (!bugFormAlert) return;
    bugFormAlert.classList.remove('hidden', 'bg-red-50', 'text-red-700', 'border-red-200', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
    bugFormAlert.classList.add('border');
    if (isError) {
      bugFormAlert.classList.add('bg-red-50', 'text-red-700', 'border-red-200');
    } else {
      bugFormAlert.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
    }
    bugFormAlert.textContent = msg;
  }

  function showAuthAlert(msg, isError = true) {
    if (!authAlertBox) return;
    authAlertBox.classList.remove('hidden', 'bg-rose-50', 'text-rose-700', 'border-rose-200', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
    if (isError) {
      authAlertBox.classList.add('bg-rose-50', 'text-rose-700', 'border-rose-200');
    } else {
      authAlertBox.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
    }
    authAlertBox.textContent = msg;
  }

  function clearAuthAlert() {
    if (!authAlertBox) return;
    authAlertBox.classList.add('hidden');
    authAlertBox.textContent = '';
  }

  // ============================================================================
  // 1. SISTEM OTENTIKASI & CEK LOGIN SEBELUM LAPOR BUG
  // ============================================================================
  function openLoginModal() {
    if (!bugAuthModal) return;
    bugAuthModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    clearAuthAlert();
    setAuthRole('user');
  }

  function closeLoginModal() {
    if (!bugAuthModal) return;
    bugAuthModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    // Jika ditutup tanpa login, alihkan kembali ke dashboard awal
    if (!currentUser) {
      window.location.href = 'dashboard-awal.html';
    }
  }

  if (closeBugAuthModalBtn) {
    closeBugAuthModalBtn.onclick = closeLoginModal;
  }

  if (openAuthModalBtn) {
    openAuthModalBtn.onclick = openLoginModal;
  }

  if (triggerLoginModalBtn) {
    triggerLoginModalBtn.onclick = openLoginModal;
  }

  function setAuthRole(role) {
    currentAuthRole = role;
    clearAuthAlert();

    if (role === 'user') {
      if (roleTabUser) roleTabUser.className = "py-2 px-3 rounded-xl text-xs font-bold bg-white text-heather-700 shadow-sm transition-all flex items-center justify-center gap-1.5 border border-heather-200";
      if (roleTabMod) roleTabMod.className = "py-2 px-3 rounded-xl text-xs font-bold text-oase-muted hover:text-rose-700 transition-all flex items-center justify-center gap-1.5";
      if (roleHelpNotice) roleHelpNotice.className = "p-2.5 rounded-xl bg-heather-50 border border-heather-200 text-[11px] text-heather-900 flex items-start gap-2";
      if (roleHelpText) roleHelpText.innerHTML = `<strong>Mode Siswa:</strong> Masuk untuk mengirimkan kendala sistem dengan identitas terverifikasi.`;
      if (authSubmitBtn) authSubmitBtn.className = "w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-heather-700 hover:from-amber-700 hover:to-heather-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2";
      if (authSubmitText) authSubmitText.textContent = 'Masuk sebagai Siswa & Lanjutkan Lapor Bug';
    } else {
      if (roleTabMod) roleTabMod.className = "py-2 px-3 rounded-xl text-xs font-bold bg-white text-rose-700 shadow-sm transition-all flex items-center justify-center gap-1.5 border border-rose-200";
      if (roleTabUser) roleTabUser.className = "py-2 px-3 rounded-xl text-xs font-bold text-oase-muted hover:text-heather-700 transition-all flex items-center justify-center gap-1.5";
      if (roleHelpNotice) roleHelpNotice.className = "p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-950 flex items-start gap-2";
      if (roleHelpText) roleHelpText.innerHTML = `<strong>Mode Moderator:</strong> Masuk sebagai pengawas/tim teknis OASE resmi untuk menguji atau melaporkan kendala.`;
      if (authSubmitBtn) authSubmitBtn.className = "w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-heather-700 hover:from-rose-700 hover:to-heather-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2";
      if (authSubmitText) authSubmitText.textContent = 'Masuk sebagai Moderator & Lanjutkan Lapor Bug';
    }
  }

  if (roleTabUser) roleTabUser.onclick = () => setAuthRole('user');
  if (roleTabMod) roleTabMod.onclick = () => setAuthRole('moderator');

  async function checkAuth() {
    let session = null;
    if (window.AuthService && typeof window.AuthService.getSession === 'function') {
      try {
        session = await window.AuthService.getSession();
      } catch (e) {
        console.warn('Gagal membaca sesi auth:', e);
      }
    }

    const savedUserEmail = localStorage.getItem('oase_active_user_email');
    const savedModEmail = localStorage.getItem('oase_active_moderator_email');

    if (session && session.user) {
      const email = session.user.email;
      let profile = {};
      try {
        profile = await window.AuthService.getUserProfile(session.user.id, email);
      } catch(e) {
        profile = { email, display_name: email.split('@')[0], role: 'user' };
      }

      const isMod = (window.AuthService && typeof window.AuthService.isModeratorEmail === 'function')
        ? window.AuthService.isModeratorEmail(email, profile)
        : (profile && profile.role === 'moderator');

      const displayName = profile.display_name || profile.full_name || email.split('@')[0];

      currentUser = {
        id: session.user.id,
        email: email,
        displayName: displayName,
        role: isMod ? 'moderator' : 'siswa'
      };
      applyAuthenticatedUI();
      return;
    } else if (savedModEmail) {
      currentUser = {
        id: 'mod-' + savedModEmail,
        email: savedModEmail,
        displayName: localStorage.getItem('oase_mod_custom_name_' + savedModEmail) || 'Moderator OASE',
        role: 'moderator'
      };
      applyAuthenticatedUI();
      return;
    } else if (savedUserEmail) {
      currentUser = {
        id: 'user-' + savedUserEmail,
        email: savedUserEmail,
        displayName: savedUserEmail.split('@')[0],
        role: 'siswa'
      };
      applyAuthenticatedUI();
      return;
    }

    // Belum Login: Tampilkan Banner Wajib Login & Buka Modal
    currentUser = null;
    if (authRequiredBanner) authRequiredBanner.classList.remove('hidden');
    if (verifiedAccountBadge) verifiedAccountBadge.classList.add('hidden');
    if (openAuthModalBtn) openAuthModalBtn.classList.remove('hidden');
    if (authUserInfoBadge) authUserInfoBadge.classList.add('hidden');
    openLoginModal();
  }

  function applyAuthenticatedUI() {
    if (!currentUser) return;

    if (authRequiredBanner) authRequiredBanner.classList.add('hidden');
    if (openAuthModalBtn) openAuthModalBtn.classList.add('hidden');

    if (authUserInfoBadge && authUserNameSpan) {
      authUserInfoBadge.classList.remove('hidden');
      authUserNameSpan.textContent = currentUser.displayName;
    }

    if (verifiedAccountBadge) {
      verifiedAccountBadge.classList.remove('hidden');
      if (verifiedNameText) verifiedNameText.textContent = currentUser.displayName;
      if (verifiedEmailText) verifiedEmailText.textContent = currentUser.email;
      if (verifiedRoleBadge) {
        verifiedRoleBadge.textContent = currentUser.role === 'moderator' ? 'Moderator Resmi' : 'Siswa Terverifikasi';
        verifiedRoleBadge.className = currentUser.role === 'moderator'
          ? 'px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase flex-shrink-0'
          : 'px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase flex-shrink-0';
      }
    }

    if (reporterNameInput && !reporterNameInput.value) {
      reporterNameInput.value = currentUser.displayName;
    }
    if (reporterEmailInput && !reporterEmailInput.value) {
      reporterEmailInput.value = currentUser.email;
    }

    if (bugAuthModal) {
      bugAuthModal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }

    if (window.lucide) lucide.createIcons();
  }

  // Handler Submit Form Login
  if (bugLoginForm) {
    bugLoginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = authEmailInput ? authEmailInput.value.trim() : '';
      const password = authPasswordInput ? authPasswordInput.value : '';

      if (!email || !password) {
        showAuthAlert('Mohon isi email dan kata sandi.');
        return;
      }

      const origText = authSubmitText.textContent;
      authSubmitText.textContent = 'Memeriksa Autentikasi...';
      authSubmitBtn.disabled = true;

      try {
        if (currentAuthRole === 'moderator') {
          // Login Moderator
          if (window.AuthService && typeof window.AuthService.signIn === 'function') {
            await window.AuthService.signIn(email, password);
          }

          let profile = null;
          try {
            const session = await window.AuthService.getSession();
            if (session && session.user) {
              profile = await window.AuthService.getUserProfile(session.user.id, email);
            }
          } catch(e) {}

          const isMod = (window.AuthService && typeof window.AuthService.isModeratorEmail === 'function')
            ? window.AuthService.isModeratorEmail(email, profile)
            : false;

          if (!isMod) {
            if (window.AuthService && typeof window.AuthService.signOut === 'function') {
              await window.AuthService.signOut();
            }
            showAuthAlert('Akun ini tidak terdaftar sebagai Moderator resmi OASE. Silakan beralih ke User Siswa.', true);
            return;
          }

          localStorage.setItem('oase_active_moderator_email', email);
          currentUser = {
            id: 'mod-' + email,
            email: email,
            displayName: (profile && profile.display_name) || email.split('@')[0],
            role: 'moderator'
          };
        } else {
          // Login Siswa
          if (window.AuthService && typeof window.AuthService.signIn === 'function') {
            await window.AuthService.signIn(email, password);
          }
          localStorage.setItem('oase_active_user_email', email);
          currentUser = {
            id: 'user-' + email,
            email: email,
            displayName: email.split('@')[0],
            role: 'siswa'
          };
        }

        showAuthAlert('Berhasil masuk! Menyiapkan formulir...', false);
        setTimeout(() => {
          applyAuthenticatedUI();
          showAlert(`Selamat datang, ${currentUser.displayName}! Akun terverifikasi untuk pengiriman laporan.`, false);
        }, 600);
      } catch (err) {
        showAuthAlert(err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.', true);
      } finally {
        authSubmitText.textContent = origText;
        authSubmitBtn.disabled = false;
      }
    };
  }

  // ============================================================================
  // 2. PENGIRIMAN FORM LAPORAN BUG KE MODERATOR
  // ============================================================================
  if (bugForm) {
    bugForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!currentUser) {
        showAlert('Kamu wajib masuk (login) terlebih dahulu sebelum dapat mengirimkan laporan.');
        openLoginModal();
        return;
      }

      const reporterName = reporterNameInput ? reporterNameInput.value.trim() : (currentUser.displayName || 'Anonim');
      const reporterEmail = reporterEmailInput ? reporterEmailInput.value.trim() : currentUser.email;
      const category = bugCategoryInput ? bugCategoryInput.value : 'Lainnya';
      const device = bugDeviceInput ? bugDeviceInput.value : 'Perangkat Web';
      const pageUrl = bugPageUrlInput ? bugPageUrlInput.value : 'Sistem OASE';
      const description = bugDescriptionArea ? bugDescriptionArea.value.trim() : '';

      if (!description) {
        showAlert('Mohon isi penjelasan kendala secara rinci.');
        return;
      }

      if (submitDirectBtn) {
        submitDirectBtn.disabled = true;
        submitDirectBtn.innerHTML = `<span>Mengirim Laporan ke Moderator...</span>`;
      }

      try {
        if (!window.BugReportService) {
          throw new Error('Layanan laporan bug belum dimuat. Silakan muat ulang halaman.');
        }

        const res = await window.BugReportService.submitReport({
          reporterName,
          reporterEmail,
          category,
          device,
          pageUrl,
          description
        });

        if (res && res.success) {
          const generatedId = res.report.ticket_id || ('BUG-' + Math.floor(1000 + Math.random() * 9000));
          addMyTicketId(generatedId);
          activeTrackedTicketId = generatedId;
          updateTrackerButtonStatus();

          if (ticketResultId) {
            ticketResultId.textContent = generatedId;
          }
          if (bugSuccessModal) {
            bugSuccessModal.classList.remove('hidden');
          }
          if (bugDescriptionArea) bugDescriptionArea.value = '';
        } else {
          throw new Error('Gagal menyimpan laporan.');
        }
      } catch (err) {
        console.error('Error submitting bug:', err);
        showAlert(err.message || 'Gagal mengirim laporan. Periksa koneksi internet Anda.');
      } finally {
        if (submitDirectBtn) {
          submitDirectBtn.disabled = false;
          submitDirectBtn.innerHTML = `
            <i data-lucide="send" class="w-4 h-4"></i>
            <span>Kirim Laporan ke Tim Teknis & Moderator</span>
          `;
          if (window.lucide) lucide.createIcons();
        }
      }
    });
  }

  // ============================================================================
  // 3. PENGIRIMAN VIA WHATSAPP (Sesuai Permintaan Pengguna)
  // ============================================================================
  if (sendWhatsAppBtn) {
    sendWhatsAppBtn.addEventListener('click', async () => {
      if (!currentUser) {
        showAlert('Kamu wajib masuk (login) terlebih dahulu sebelum melaporkan kendala.');
        openLoginModal();
        return;
      }

      const reporterName = reporterNameInput ? reporterNameInput.value.trim() : (currentUser.displayName || 'Siswa OASE');
      const category = bugCategoryInput ? bugCategoryInput.value : 'Umum';
      const device = bugDeviceInput ? bugDeviceInput.value : 'Web';
      const pageUrl = bugPageUrlInput ? bugPageUrlInput.value : 'Sistem OASE';
      const description = bugDescriptionArea ? bugDescriptionArea.value.trim() : '';

      if (!description) {
        showAlert('Mohon isi penjelasan kendala pada formulir terlebih dahulu sebelum membuka WhatsApp.');
        return;
      }

      // Catat juga ke sistem BugReportService agar masuk ke konsol moderator
      if (window.BugReportService) {
        try {
          const res = await window.BugReportService.submitReport({
            reporterName,
            reporterEmail: currentUser.email || 'WhatsApp Reporter',
            category,
            device,
            pageUrl,
            description: `[Via WhatsApp] ${description}`
          });
          if (res && res.report && res.report.ticket_id) {
            addMyTicketId(res.report.ticket_id);
            activeTrackedTicketId = res.report.ticket_id;
            updateTrackerButtonStatus();
          }
        } catch(e) {}
      }

      const waNumber = '6282228176090';
      const message = `Halo Tim IT OASE Cerita, saya ingin melaporkan kendala/bug pada website:\n\n` +
        `*Pelapor:* ${reporterName} (${currentUser.email})\n` +
        `*Kategori:* ${category}\n` +
        `*Perangkat:* ${device}\n` +
        `*Halaman:* ${pageUrl}\n` +
        `*Kendala:* ${description}`;

      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    });
  }

  // ============================================================================
  // 4. MODAL SUKSES & PELACAKAN TIKET BUG (CEK KODE & RIWAYAT)
  // ============================================================================
  if (closeSuccessModalBtn && bugSuccessModal) {
    closeSuccessModalBtn.addEventListener('click', () => {
      bugSuccessModal.classList.add('hidden');
    });
  }

  if (viewMyTicketNowBtn) {
    viewMyTicketNowBtn.addEventListener('click', () => {
      if (bugSuccessModal) bugSuccessModal.classList.add('hidden');
      const ticketId = ticketResultId ? ticketResultId.textContent.trim() : activeTrackedTicketId;
      openCheckTicketModal(ticketId);
    });
  }

  function openCheckTicketModal(prefillTicketId = null) {
    if (!checkBugTicketModal) return;
    checkBugTicketModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    if (prefillTicketId) {
      switchTrackerTab('search');
      if (trackerSearchInput) trackerSearchInput.value = prefillTicketId;
      searchTicket(prefillTicketId);
    } else {
      const myIds = getMyTicketIds();
      if (myIds.length > 0) {
        switchTrackerTab('history');
        renderHistoryList();
      } else {
        switchTrackerTab('search');
      }
    }
    updateTrackerButtonStatus();
    if (window.lucide) lucide.createIcons();
  }

  function closeCheckTicketModal() {
    if (!checkBugTicketModal) return;
    checkBugTicketModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  if (openCheckTicketModalBtn) {
    openCheckTicketModalBtn.addEventListener('click', () => openCheckTicketModal());
  }

  if (heroCheckTicketBtn) {
    heroCheckTicketBtn.addEventListener('click', () => openCheckTicketModal());
  }

  if (closeCheckTicketModalBtn) {
    closeCheckTicketModalBtn.addEventListener('click', closeCheckTicketModal);
  }

  if (closeCheckTicketFooterBtn) {
    closeCheckTicketFooterBtn.addEventListener('click', closeCheckTicketModal);
  }

  if (checkBugTicketModal) {
    checkBugTicketModal.addEventListener('click', (e) => {
      if (e.target === checkBugTicketModal) {
        closeCheckTicketModal();
      }
    });
  }

  function switchTrackerTab(tab) {
    if (tab === 'search') {
      if (trackerTabSearchBtn) {
        trackerTabSearchBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-amber-900 shadow-2xs border border-amber-200";
      }
      if (trackerTabHistoryBtn) {
        trackerTabHistoryBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-amber-900";
      }
      if (trackerSearchPanel) trackerSearchPanel.classList.remove('hidden');
      if (trackerHistoryPanel) trackerHistoryPanel.classList.add('hidden');
    } else {
      if (trackerTabHistoryBtn) {
        trackerTabHistoryBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-amber-900 shadow-2xs border border-amber-200";
      }
      if (trackerTabSearchBtn) {
        trackerTabSearchBtn.className = "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-amber-900";
      }
      if (trackerHistoryPanel) trackerHistoryPanel.classList.remove('hidden');
      if (trackerSearchPanel) trackerSearchPanel.classList.add('hidden');
      renderHistoryList();
    }
    if (window.lucide) lucide.createIcons();
  }

  if (trackerTabSearchBtn) trackerTabSearchBtn.onclick = () => switchTrackerTab('search');
  if (trackerTabHistoryBtn) trackerTabHistoryBtn.onclick = () => switchTrackerTab('history');

  // Submit Handler Pencarian Kode Tiket
  if (trackerSearchForm) {
    trackerSearchForm.onsubmit = (e) => {
      e.preventDefault();
      const code = trackerSearchInput ? trackerSearchInput.value.trim() : '';
      if (code) {
        searchTicket(code);
      }
    };
  }

  if (refreshTrackerHistoryBtn) {
    refreshTrackerHistoryBtn.onclick = () => renderHistoryList();
  }

  // Fungsi Pencarian dan Render Detail Tiket
  async function searchTicket(query, showAlertOnNotFound = true) {
    const cleanQuery = (query || '').trim().toUpperCase();
    if (!cleanQuery) return;

    activeTrackedTicketId = cleanQuery;
    if (trackerSearchInput) trackerSearchInput.value = cleanQuery;

    let allReports = [];
    if (window.BugReportService) {
      try {
        allReports = await window.BugReportService.getReports({ includeResolved: true });
      } catch(e) {
        allReports = JSON.parse(localStorage.getItem('oase_bug_reports') || '[]');
      }
    } else {
      allReports = JSON.parse(localStorage.getItem('oase_bug_reports') || '[]');
    }

    const target = allReports.find(r => 
      (r.ticket_id && r.ticket_id.toUpperCase() === cleanQuery) ||
      (r.id && r.id.toUpperCase() === cleanQuery) ||
      (r.ticket_id && r.ticket_id.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanQuery.replace(/[^A-Z0-9]/g, ''))
    );

    if (!target) {
      if (showAlertOnNotFound && trackerSearchResultContainer) {
        trackerSearchResultContainer.innerHTML = `
          <div class="p-6 rounded-2xl border border-rose-200 bg-rose-50/70 text-center space-y-2.5 animate-fadeIn">
            <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <i data-lucide="alert-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-rose-900">Tiket Tidak Ditemukan</h4>
              <p class="text-xs text-rose-700 mt-0.5">Kode tiket <strong>"${escapeHtml(cleanQuery)}"</strong> tidak ditemukan dalam sistem.</p>
            </div>
            <p class="text-[11px] text-rose-600/90 leading-relaxed max-w-sm mx-auto">
              Periksa kembali kode tiket Anda. Kode tiket berformat seperti <code>BUG-1234</code>.
            </p>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
      }
      return;
    }

    // Target ditemukan
    addMyTicketId(target.ticket_id || target.id);
    updateTrackerButtonStatus();

    const isResolved = target.status === 'selesai';
    const isProcessing = target.status === 'proses';

    let statusBadgeHtml = '';
    let statusNoteHtml = '';

    if (isResolved) {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-extrabold shadow-2xs">
          <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
          <span>Selesai Dituntaskan</span>
        </span>
      `;
      statusNoteHtml = `
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"></i>
          <div class="space-y-0.5">
            <span class="font-extrabold text-emerald-900 block">Kendala Berhasil Dituntaskan!</span>
            <p class="text-[11px] text-emerald-900/90 leading-relaxed">
              Laporan ini telah diselesaikan oleh <strong>${escapeHtml(target.resolved_by || 'Tim Moderator OASE')}</strong>${target.resolved_at ? ` pada ${formatTime(target.resolved_at)}` : ''}. Terima kasih atas laporannya!
            </p>
          </div>
        </div>
      `;
    } else if (isProcessing) {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-900 text-xs font-extrabold shadow-2xs">
          <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Sedang Diinvestigasi Tim</span>
        </span>
      `;
      statusNoteHtml = `
        <div class="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
          <i data-lucide="clock" class="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"></i>
          <div class="space-y-0.5">
            <span class="font-extrabold text-blue-900 block">Sedang Ditangani oleh Moderator</span>
            <p class="text-[11px] text-blue-900/90 leading-relaxed">
              Tim moderator dan teknisi OASE saat ini sedang menguji dan menyelesaikan kendala yang kamu laporkan.
            </p>
          </div>
        </div>
      `;
    } else {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold shadow-2xs">
          <i data-lucide="hourglass" class="w-4 h-4 text-amber-600"></i>
          <span>Menunggu Pemeriksaan</span>
        </span>
      `;
      statusNoteHtml = `
        <div class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
          <i data-lucide="info" class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"></i>
          <div class="space-y-0.5">
            <span class="font-extrabold text-amber-900 block">Laporan Masuk ke Antrean</span>
            <p class="text-[11px] text-amber-900/90 leading-relaxed">
              Laporanmu sudah diterima dan diteruskan ke seluruh moderator OASE. Kamu akan melihat status berubah saat moderator mulai memproses.
            </p>
          </div>
        </div>
      `;
    }

    const step1Class = 'bg-amber-600 text-white ring-4 ring-amber-100';
    const step2Class = isProcessing || isResolved ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-500';
    const step3Class = isResolved ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-500';
    const bar1Class = isProcessing || isResolved ? 'bg-blue-500' : 'bg-gray-200';
    const bar2Class = isResolved ? 'bg-emerald-500' : 'bg-gray-200';

    if (trackerSearchResultContainer) {
      trackerSearchResultContainer.innerHTML = `
        <div class="p-5 sm:p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4 animate-fadeIn">
          
          <!-- Header Hasil Tiket -->
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider block">Nomor Tiket</span>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xl font-mono font-black text-oase-plum tracking-tight">${escapeHtml(target.ticket_id || target.id)}</span>
                <button type="button" class="copy-ticket-btn text-gray-400 hover:text-amber-700 p-1 rounded-lg hover:bg-gray-100 transition-colors" data-code="${escapeHtml(target.ticket_id || target.id)}" title="Salin Kode Tiket">
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
            <div>
              ${statusBadgeHtml}
            </div>
          </div>

          <!-- Timeline Progress Steps -->
          <div class="py-2">
            <div class="relative flex items-center justify-between">
              <!-- Step 1 -->
              <div class="flex flex-col items-center relative z-10">
                <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step1Class}">
                  <i data-lucide="check" class="w-4 h-4"></i>
                </div>
                <span class="text-[10px] font-bold text-gray-700 mt-1">Diterima</span>
              </div>

              <!-- Connecting Bar 1 -->
              <div class="flex-1 h-1 mx-2 rounded-full ${bar1Class}"></div>

              <!-- Step 2 -->
              <div class="flex flex-col items-center relative z-10">
                <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step2Class}">
                  ${isProcessing ? '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i>' : (isResolved ? '<i data-lucide="check" class="w-4 h-4"></i>' : '2')}
                </div>
                <span class="text-[10px] font-bold ${isProcessing ? 'text-blue-700' : (isResolved ? 'text-gray-700' : 'text-gray-400')} mt-1">Investigasi</span>
              </div>

              <!-- Connecting Bar 2 -->
              <div class="flex-1 h-1 mx-2 rounded-full ${bar2Class}"></div>

              <!-- Step 3 -->
              <div class="flex flex-col items-center relative z-10">
                <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step3Class}">
                  ${isResolved ? '<i data-lucide="check" class="w-4 h-4"></i>' : '3'}
                </div>
                <span class="text-[10px] font-bold ${isResolved ? 'text-emerald-700' : 'text-gray-400'} mt-1">Tuntas</span>
              </div>
            </div>
          </div>

          <!-- Status Notice Note -->
          ${statusNoteHtml}

          <!-- Metadata Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-0.5">
              <span class="text-[10px] font-bold uppercase text-gray-400 block">Kategori Kendala</span>
              <span class="font-extrabold text-gray-800">${escapeHtml(target.category || 'Teknis')}</span>
            </div>
            <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-0.5">
              <span class="text-[10px] font-bold uppercase text-gray-400 block">Halaman Terkait</span>
              <span class="font-extrabold text-gray-800 truncate block">${escapeHtml(target.page_url || 'Website')}</span>
            </div>
            <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-0.5">
              <span class="text-[10px] font-bold uppercase text-gray-400 block">Waktu Pelaporan</span>
              <span class="font-semibold text-gray-700">${formatTime(target.created_at)}</span>
            </div>
            <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-0.5">
              <span class="text-[10px] font-bold uppercase text-gray-400 block">Pelapor</span>
              <span class="font-semibold text-gray-700 truncate block">${escapeHtml(target.reporter || 'Siswa')}</span>
            </div>
          </div>

          <!-- Rincian Deskripsi -->
          <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
            <span class="text-[10px] font-extrabold uppercase text-gray-400 block">Isi Penjelasan Kendala:</span>
            <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${escapeHtml(target.description || '-')}</p>
          </div>

        </div>
      `;

      const copyBtn = trackerSearchResultContainer.querySelector('.copy-ticket-btn');
      if (copyBtn) {
        copyBtn.onclick = () => {
          const code = copyBtn.dataset.code;
          navigator.clipboard.writeText(code).then(() => {
            alert(`Kode tiket ${code} berhasil disalin!`);
          });
        };
      }

      if (window.lucide) lucide.createIcons();
    }
  }

  // Fungsi Render Riwayat Laporan Saya
  async function renderHistoryList() {
    if (!trackerHistoryList) return;

    trackerHistoryList.innerHTML = `
      <div class="p-6 text-center text-xs text-gray-500">
        <i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600"></i>
        <span>Memuat riwayat laporan Anda...</span>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    const myReports = await getMyReports();

    if (trackerMyHistoryCountBadge) {
      trackerMyHistoryCountBadge.textContent = myReports.length;
    }

    if (myReports.length === 0) {
      trackerHistoryList.innerHTML = `
        <div class="p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center space-y-2 bg-gray-50/50">
          <div class="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <i data-lucide="clock" class="w-5 h-5"></i>
          </div>
          <p class="text-xs font-semibold text-gray-600">Belum ada riwayat laporan kendala</p>
          <p class="text-[11px] text-gray-400">Laporan yang kamu kirimkan melalui perangkat atau akun ini akan otomatis tercatat di sini.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    trackerHistoryList.innerHTML = myReports.map(r => {
      const isResolved = r.status === 'selesai';
      const isProcessing = r.status === 'proses';
      
      let badge = '';
      if (isResolved) {
        badge = `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> Selesai</span>`;
      } else if (isProcessing) {
        badge = `<span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Diproses</span>`;
      } else {
        badge = `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold flex items-center gap-1"><i data-lucide="hourglass" class="w-3 h-3"></i> Baru</span>`;
      }

      return `
        <div class="p-3.5 rounded-2xl border border-gray-100 bg-white hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer history-ticket-item space-y-2" data-ticket="${escapeHtml(r.ticket_id || r.id)}">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 overflow-hidden">
              <span class="font-mono font-black text-xs text-amber-950">${escapeHtml(r.ticket_id || r.id)}</span>
              <span class="text-[11px] font-bold text-gray-700 truncate">• ${escapeHtml(r.category || 'Teknis')}</span>
            </div>
            <div>${badge}</div>
          </div>
          <p class="text-xs text-gray-600 line-clamp-2 leading-relaxed">${escapeHtml(r.description || '')}</p>
          <div class="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-50">
            <span>${formatTime(r.created_at)}</span>
            <span class="text-amber-700 font-bold hover:underline inline-flex items-center gap-1">Lihat Detail Status &rarr;</span>
          </div>
        </div>
      `;
    }).join('');

    trackerHistoryList.querySelectorAll('.history-ticket-item').forEach(card => {
      card.onclick = () => {
        const ticketCode = card.dataset.ticket;
        switchTrackerTab('search');
        searchTicket(ticketCode);
      };
    });

    if (window.lucide) lucide.createIcons();
  }

  // Jalankan pemeriksaan login saat halaman dibuka
  await checkAuth();
  await updateTrackerButtonStatus();
});
