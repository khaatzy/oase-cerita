// ==============================================================================
// LAMAN MODERATOR - OASE CERITA
// Pemantauan Ujaran Kebencian (SARA), Manajemen Komentar, Laporan Bug & Otoritas
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // ============================================================================
  // 1. STATE & VARIABEL GLOBAL
  // ============================================================================
  let currentModerator = null;
  let activeTab = 'hateSpeech'; // 'hateSpeech', 'allComments', 'bugReports', 'keywords', 'auditLogs'
  let activeBugFilter = 'active'; // 'active', 'selesai', 'all'
  let commentToDelete = null; // { storyId, commentId, author, text, source }
  let isAlarmSoundEnabled = localStorage.getItem('oase_mod_sound_enabled') !== 'false';
  let currentAuthRole = 'moderator'; // 'user' or 'moderator'
  let currentAuthMode = 'login'; // 'login' or 'register'

  // ============================================================================
  // 2. REFERENSI ELEMEN DOM
  // ============================================================================
  // Header & Profile
  const greetingHeading = document.getElementById('greetingHeading');
  const navModName = document.getElementById('navModName');
  const navModRole = document.getElementById('navModRole');
  const logoutBtn = document.getElementById('logoutBtn');
  const moderatorStatusSelect = document.getElementById('moderatorStatusSelect');
  const moderatorStatusDot = document.getElementById('moderatorStatusDot');
  const toggleAlarmSoundBtn = document.getElementById('toggleAlarmSoundBtn');
  const alarmSoundIcon = document.getElementById('alarmSoundIcon');

  // Notifikasi Bell & Urgent Banner
  const modNotifBellBtn = document.getElementById('modNotifBellBtn');
  const modNotifBadge = document.getElementById('modNotifBadge');
  const modNotifDropdown = document.getElementById('modNotifDropdown');
  const modNotifList = document.getElementById('modNotifList');
  const clearModNotifBtn = document.getElementById('clearModNotifBtn');
  const urgentHateSpeechBanner = document.getElementById('urgentHateSpeechBanner');
  const urgentBannerText = document.getElementById('urgentBannerText');
  const viewUrgentAlertsBtn = document.getElementById('viewUrgentAlertsBtn');
  const dismissUrgentBannerBtn = document.getElementById('dismissUrgentBannerBtn');

  // Stat Cards
  const statMonitoredComments = document.getElementById('statMonitoredComments');
  const statHateSpeechCount = document.getElementById('statHateSpeechCount');
  const statBugReportsCount = document.getElementById('statBugReportsCount');
  const statSafetyIndex = document.getElementById('statSafetyIndex');
  const badgeHateSpeechCount = document.getElementById('badgeHateSpeechCount');
  const badgeBugReportsCount = document.getElementById('badgeBugReportsCount');
  const bugCountActive = document.getElementById('bugCountActive');
  const bugCountResolved = document.getElementById('bugCountResolved');
  const bugCountAll = document.getElementById('bugCountAll');

  // Tab Buttons
  const tabBtnHateSpeech = document.getElementById('tabBtnHateSpeech');
  const tabBtnAllComments = document.getElementById('tabBtnAllComments');
  const tabBtnBugReports = document.getElementById('tabBtnBugReports');
  const tabBtnKeywords = document.getElementById('tabBtnKeywords');
  const tabBtnAuditLogs = document.getElementById('tabBtnAuditLogs');

  // Sections
  const sectionHateSpeech = document.getElementById('sectionHateSpeech');
  const sectionAllComments = document.getElementById('sectionAllComments');
  const sectionBugReports = document.getElementById('sectionBugReports');
  const sectionKeywords = document.getElementById('sectionKeywords');
  const sectionAuditLogs = document.getElementById('sectionAuditLogs');

  // Section Containers
  const hateSpeechListContainer = document.getElementById('hateSpeechListContainer');
  const allCommentsListContainer = document.getElementById('allCommentsListContainer');
  const bugReportsListContainer = document.getElementById('bugReportsListContainer');
  const auditLogsContainer = document.getElementById('auditLogsContainer');
  const commentSearchInput = document.getElementById('commentSearchInput');

  // SARA Keywords & Modal
  const customKeywordsContainer = document.getElementById('customKeywordsContainer');
  const customKeywordsCountBadge = document.getElementById('customKeywordsCountBadge');
  const openAddKeywordModalBtn = document.getElementById('openAddKeywordModalBtn');
  const closeAddKeywordModalBtn = document.getElementById('closeAddKeywordModalBtn');
  const cancelAddKeywordBtn = document.getElementById('cancelAddKeywordBtn');
  const addSaraKeywordModal = document.getElementById('addSaraKeywordModal');
  const addSaraKeywordForm = document.getElementById('addSaraKeywordForm');
  const newSaraKeywordInput = document.getElementById('newSaraKeywordInput');
  const newSaraCategorySelect = document.getElementById('newSaraCategorySelect');
  const newSaraNoteInput = document.getElementById('newSaraNoteInput');

  // Kelola Akun Moderator Modal
  const openManageModsBtn = document.getElementById('openManageModsBtn');
  const manageModsModal = document.getElementById('manageModsModal');
  const closeManageModsModalBtn = document.getElementById('closeManageModsModalBtn');
  const closeManageModsModalBtn2 = document.getElementById('closeManageModsModalBtn2');
  const addModEmailForm = document.getElementById('addModEmailForm');
  const newModEmailInput = document.getElementById('newModEmailInput');
  const authorizedModsList = document.getElementById('authorizedModsList');
  const modsTotalCountBadge = document.getElementById('modsTotalCountBadge');

  // Modals & Forms
  const deleteModal = document.getElementById('deleteModal');
  const deleteCommentPreview = document.getElementById('deleteCommentPreview');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  const dualAuthModal = document.getElementById('dualAuthModal');
  const roleTabUser = document.getElementById('roleTabUser');
  const roleTabMod = document.getElementById('roleTabMod');
  const roleHelpNotice = document.getElementById('roleHelpNotice');
  const roleHelpText = document.getElementById('roleHelpText');
  const tabAuthSignIn = document.getElementById('tabAuthSignIn');
  const tabAuthSignUp = document.getElementById('tabAuthSignUp');
  const dualLoginForm = document.getElementById('dualLoginForm');
  const dualAuthEmail = document.getElementById('dualAuthEmail');
  const dualAuthPassword = document.getElementById('dualAuthPassword');
  const dualAuthSubmitBtn = document.getElementById('dualAuthSubmitBtn');
  const dualAuthBtnText = document.getElementById('dualAuthBtnText');
  const authAlertBox = document.getElementById('authAlertBox');
  const fillDemoModBtn = document.getElementById('fillDemoModBtn');

  // Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // ============================================================================
  // 3. INISIALISASI PENYIMPANAN DATA (LOCAL STORAGE STORES)
  // ============================================================================
  function getCommunityComments() {
    return JSON.parse(localStorage.getItem('oase_community_comments') || '{}');
  }

  function saveCommunityComments(obj) {
    localStorage.setItem('oase_community_comments', JSON.stringify(obj));
  }

  function getBugReports() {
    let reports = JSON.parse(localStorage.getItem('oase_bug_reports') || 'null');
    if (!reports) {
      // Inisialisasi data laporan bug awal jika masih kosong
      reports = [
        {
          id: 'bug-' + (Date.now() - 7200000),
          category: '📱 Tampilan Berantakan (Mobile/Desktop)',
          description: 'Pada HP resolusi kecil tombol navigasi footer sempat berhimpitan dengan teks.',
          reporter: 'siswa1@oase.id',
          status: 'proses', // 'baru', 'proses', 'selesai'
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'bug-' + (Date.now() - 3600000),
          category: '⚙️ Audio Relaksasi & Mood',
          description: 'Suara gemercik air hujan sangat nyaman, mohon tambahkan opsi timer berhenti otomatis 15 menit.',
          reporter: 'anonym_student@gmail.com',
          status: 'baru',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      localStorage.setItem('oase_bug_reports', JSON.stringify(reports));
    }
    return reports;
  }

  function saveBugReports(reports) {
    localStorage.setItem('oase_bug_reports', JSON.stringify(reports));
  }

  function getAuditLogs() {
    return JSON.parse(localStorage.getItem('oase_moderation_logs') || '[]');
  }

  function addAuditLog(action, target, reason) {
    const logs = getAuditLogs();
    const entry = {
      id: 'log-' + Date.now(),
      action: action, // 'HAPUS_KOMENTAR', 'SELESAIKAN_BUG', 'ABAIKAN_PERINGATAN'
      target: target,
      reason: reason,
      moderator: currentModerator ? (currentModerator.display_name || currentModerator.email) : 'Moderator OASE',
      timestamp: new Date().toISOString()
    };
    logs.unshift(entry);
    localStorage.setItem('oase_moderation_logs', JSON.stringify(logs.slice(0, 100))); // simpan maks 100 log
    renderAuditLogs();
  }

  function getWhitelistedComments() {
    return JSON.parse(localStorage.getItem('oase_mod_whitelisted_comments') || '[]');
  }

  function addWhitelistedComment(commentId) {
    const list = getWhitelistedComments();
    if (!list.includes(commentId)) {
      list.push(commentId);
      localStorage.setItem('oase_mod_whitelisted_comments', JSON.stringify(list));
    }
  }

  // ============================================================================
  // 4. AUTENTIKASI SUPABASE & DUAL-OPTION ROLE LOGIN
  // ============================================================================
  // Helper untuk mendapatkan nama sapaan moderator yang paling akurat & tersimpan
  function getResolvedModName(email, profile = null) {
    if (!email) return 'Moderator OASE';
    const emailKey = email.toLowerCase().trim();
    const custom = localStorage.getItem('oase_mod_custom_name_' + emailKey);
    if (custom && custom.trim()) return custom.trim();

    if (window.AuthService && typeof window.AuthService.getModeratorCredentialsMap === 'function') {
      const cMap = window.AuthService.getModeratorCredentialsMap();
      if (cMap[emailKey] && (cMap[emailKey].display_name || cMap[emailKey].displayName)) {
        return (cMap[emailKey].display_name || cMap[emailKey].displayName).trim();
      }
    }

    if (profile) {
      const pName = profile.display_name || profile.full_name || '';
      if (pName && pName !== 'Sahabat OASE' && !pName.includes('@')) return pName.trim();
    }

    return email.split('@')[0];
  }

  // ============================================================================
  async function checkAuth() {
    // Cek apakah ada sesi moderator tersimpan
    const savedModEmail = localStorage.getItem('oase_active_moderator_email');
    let session = null;

    if (window.AuthService && typeof window.AuthService.getSession === 'function') {
      try {
        session = await window.AuthService.getSession();
      } catch (e) {
        console.warn('Gagal membaca sesi Supabase:', e);
      }
    }

    if (session && session.user) {
      const email = session.user.email;
      let profile = {};
      try {
        profile = await window.AuthService.getUserProfile(session.user.id, email);
      } catch (e) {
        profile = { email, display_name: email.split('@')[0], role: 'user' };
      }

      // Cek apakah akun memiliki wewenang moderator resmi
      const isAuthorizedMod = (window.AuthService && typeof window.AuthService.isModeratorEmail === 'function')
        ? window.AuthService.isModeratorEmail(email, profile)
        : (profile && profile.role === 'moderator');

      if (isAuthorizedMod) {
        currentModerator = {
          id: session.user.id,
          email: email,
          display_name: getResolvedModName(email, profile),
          role: 'moderator'
        };
        localStorage.setItem('oase_active_moderator_email', email);
        initDashboard();
        return;
      } else {
        localStorage.removeItem('oase_active_moderator_email');
      }
    } else if (savedModEmail) {
      // Verifikasi email tersimpan dengan whitelist resmi
      const isAuthorizedMod = (window.AuthService && typeof window.AuthService.isModeratorEmail === 'function')
        ? window.AuthService.isModeratorEmail(savedModEmail, null)
        : false;

      if (isAuthorizedMod) {
        currentModerator = {
          id: 'local-mod-' + savedModEmail,
          email: savedModEmail,
          display_name: getResolvedModName(savedModEmail, null),
          role: 'moderator'
        };
        initDashboard();
        return;
      } else {
        localStorage.removeItem('oase_active_moderator_email');
      }
    }

    // Jika belum terotentikasi sebagai moderator, buka pop-up modal
    openDualAuthModal();
  }

  function openDualAuthModal() {
    if (!dualAuthModal) return;
    dualAuthModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    setAuthRole('moderator');
    setAuthMode('login');
  }

  function closeDualAuthModal() {
    if (!dualAuthModal) return;
    dualAuthModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    if (!currentModerator) {
      window.location.href = 'dashboard-awal.html';
    }
  }

  function setAuthRole(role) {
    currentAuthRole = role;
    clearAuthAlert();

    const dualAuthModeTabsContainer = document.getElementById('dualAuthModeTabsContainer');

    if (role === 'user') {
      roleTabUser.className = "py-2.5 px-3 rounded-xl text-xs font-bold bg-white text-heather-700 shadow-sm transition-all flex items-center justify-center gap-1.5 border border-heather-200";
      roleTabMod.className = "py-2.5 px-3 rounded-xl text-xs font-bold text-oase-muted hover:text-rose-700 transition-all flex items-center justify-center gap-1.5";
      
      roleHelpNotice.className = "p-3 rounded-2xl bg-heather-50 border border-heather-200 text-[11px] text-heather-900 flex items-start gap-2";
      roleHelpText.innerHTML = `<strong>Mode Pengguna Biasa:</strong> Masuk atau daftar sebagai siswa untuk membaca cerita, saling menguatkan, atau curhat ke konselor. (Kamu akan dialihkan ke Dashboard Siswa)`;
      
      if (dualAuthModeTabsContainer) dualAuthModeTabsContainer.classList.remove('hidden');
      dualAuthBtnText.textContent = currentAuthMode === 'login' ? 'Masuk sebagai Siswa' : 'Daftar sebagai Siswa';
      dualAuthSubmitBtn.className = "w-full py-3 rounded-xl bg-gradient-to-r from-heather-600 to-heather-500 hover:from-heather-700 hover:to-heather-600 text-white font-bold text-xs shadow-md shadow-heather-500/20 transition-all flex items-center justify-center gap-2";
    } else {
      roleTabMod.className = "py-2.5 px-3 rounded-xl text-xs font-bold bg-white text-rose-700 shadow-sm transition-all flex items-center justify-center gap-1.5 border border-rose-200";
      roleTabUser.className = "py-2.5 px-3 rounded-xl text-xs font-bold text-oase-muted hover:text-heather-700 transition-all flex items-center justify-center gap-1.5";
      
      roleHelpNotice.className = "p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[11px] text-rose-950 flex items-start gap-2";
      roleHelpText.innerHTML = `<strong>🔒 Akun Khusus Pengawas:</strong> Pendaftaran akun moderator tidak dibuka untuk umum demi menjaga keamanan dan privasi komunitas. Silakan masuk dengan akun resmi yang telah diverifikasi.`;
      
      if (dualAuthModeTabsContainer) dualAuthModeTabsContainer.classList.add('hidden');
      setAuthMode('login');
      dualAuthBtnText.textContent = 'Masuk sebagai Moderator';
      dualAuthSubmitBtn.className = "w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-heather-600 hover:from-rose-700 hover:to-heather-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2";
    }
  }

  function setAuthMode(mode) {
    currentAuthMode = mode;
    clearAuthAlert();

    if (mode === 'login') {
      tabAuthSignIn.className = "flex-1 py-1.5 text-xs font-bold rounded-lg bg-white text-rose-700 shadow-2xs transition-all";
      tabAuthSignUp.className = "flex-1 py-1.5 text-xs font-bold rounded-lg text-oase-muted hover:text-rose-700 transition-all";
      dualAuthBtnText.textContent = currentAuthRole === 'moderator' ? 'Masuk sebagai Moderator' : 'Masuk sebagai Siswa';
    } else {
      tabAuthSignUp.className = "flex-1 py-1.5 text-xs font-bold rounded-lg bg-white text-rose-700 shadow-2xs transition-all";
      tabAuthSignIn.className = "flex-1 py-1.5 text-xs font-bold rounded-lg text-oase-muted hover:text-rose-700 transition-all";
      dualAuthBtnText.textContent = currentAuthRole === 'moderator' ? 'Masuk sebagai Moderator' : 'Daftar Akun Siswa';
    }
  }

  function showAuthAlert(msg, type = 'error') {
    authAlertBox.classList.remove('hidden', 'bg-rose-50', 'text-rose-700', 'border-rose-200', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
    if (type === 'error') {
      authAlertBox.classList.add('bg-rose-50', 'text-rose-700', 'border-rose-200');
    } else {
      authAlertBox.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
    }
    authAlertBox.textContent = msg;
  }

  function clearAuthAlert() {
    authAlertBox.classList.add('hidden');
    authAlertBox.textContent = '';
  }

  // Event Listeners Dual Modal
  const openLoginModalBtn = document.getElementById('openLoginModalBtn');
  const closeDualAuthModalBtn = document.getElementById('closeDualAuthModalBtn');

  if (openLoginModalBtn) {
    openLoginModalBtn.onclick = () => {
      openDualAuthModal();
    };
  }

  if (closeDualAuthModalBtn) {
    closeDualAuthModalBtn.onclick = () => {
      closeDualAuthModal();
    };
  }

  if (roleTabUser) roleTabUser.onclick = () => setAuthRole('user');
  if (roleTabMod) roleTabMod.onclick = () => setAuthRole('moderator');
  if (tabAuthSignIn) tabAuthSignIn.onclick = () => setAuthMode('login');
  if (tabAuthSignUp) tabAuthSignUp.onclick = () => setAuthMode('register');

  if (dualLoginForm) {
    dualLoginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = dualAuthEmail.value.trim();
      const password = dualAuthPassword.value;
      const originalBtnText = dualAuthBtnText.textContent;

      dualAuthBtnText.textContent = 'Memproses Autentikasi...';
      dualAuthSubmitBtn.disabled = true;

      try {
        if (currentAuthRole === 'moderator') {
          // KHUSUS MODERATOR: Hanya Login (Tidak ada registrasi publik)
          if (window.AuthService && typeof window.AuthService.signIn === 'function') {
            await window.AuthService.signIn(email, password);
          }

          // Cek verifikasi peran akun di Supabase / profile
          let profile = null;
          try {
            const session = await window.AuthService.getSession();
            if (session && session.user) {
              profile = await window.AuthService.getUserProfile(session.user.id, email);
            }
          } catch (e) {}

          const isMod = (window.AuthService && typeof window.AuthService.isModeratorEmail === 'function')
            ? window.AuthService.isModeratorEmail(email, profile)
            : (profile && profile.role === 'moderator');

          if (!isMod) {
            if (window.AuthService && typeof window.AuthService.signOut === 'function') {
              await window.AuthService.signOut();
            }
            showAuthAlert('Akses Ditolak: Akun ini tidak terdaftar dalam daftar resmi pengawas/moderator OASE. Silakan beralih ke tab User Biasa.', 'error');
            return;
          }

          localStorage.setItem('oase_active_moderator_email', email);
          currentModerator = {
            id: 'mod-' + Date.now(),
            email: email,
            display_name: getResolvedModName(email, profile),
            role: 'moderator'
          };

          showAuthAlert('Selamat bertugas, Moderator! Membuka konsol pemantauan...', 'success');
          setTimeout(() => {
            closeDualAuthModal();
            initDashboard();
            showToast(`Selamat datang, ${currentModerator.display_name}! Sesi moderator aktif.`);
          }, 800);
          return;
        }

        // UNTUK USER BIASA
        if (currentAuthMode === 'login') {
          if (window.AuthService && typeof window.AuthService.signIn === 'function') {
            await window.AuthService.signIn(email, password);
          }
          localStorage.setItem('oase_active_user_email', email);
          showAuthAlert('Berhasil masuk sebagai Siswa! Mengalihkan ke Dashboard...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard-user.html';
          }, 800);
        } else {
          if (window.AuthService && typeof window.AuthService.signUp === 'function') {
            await window.AuthService.signUp(email, password);
          }
          showAuthAlert(`Pendaftaran berhasil! Silakan masuk dengan akun ${email}.`, 'success');
          setTimeout(() => {
            setAuthMode('login');
          }, 1200);
        }
      } catch (err) {
        showAuthAlert(err.message || 'Terjadi kesalahan autentikasi. Silakan periksa kembali email dan kata sandi Anda.', 'error');
      } finally {
        dualAuthBtnText.textContent = originalBtnText;
        dualAuthSubmitBtn.disabled = false;
      }
    };
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      if (confirm('Apakah kamu yakin ingin keluar dari Laman Moderator?')) {
        try {
          if (window.AuthService && typeof window.AuthService.signOut === 'function') {
            await window.AuthService.signOut();
          }
        } catch (e) {}
        localStorage.removeItem('oase_active_moderator_email');
        currentModerator = null;
        window.location.href = 'dashboard-awal.html';
      }
    };
  }

  // ============================================================================
  // 5. FITUR 1: SAPAAN HANGAT, HAMBURGER DRAWER & CUSTOM DISPLAY NAME
  // ============================================================================
  function getActiveModDisplayName() {
    if (!currentModerator) return 'Moderator';
    return getResolvedModName(currentModerator.email, currentModerator);
  }

  function setupWarmGreeting() {
    if (!currentModerator) return;

    const hour = new Date().getHours();
    let timeGreeting = 'Selamat Pagi';
    if (hour >= 11 && hour < 15) timeGreeting = 'Selamat Siang';
    else if (hour >= 15 && hour < 18) timeGreeting = 'Selamat Sore';
    else if (hour >= 18 || hour < 4) timeGreeting = 'Selamat Malam';

    const cleanName = getActiveModDisplayName();

    if (greetingHeading) {
      greetingHeading.innerHTML = `${timeGreeting}, <span class="text-rose-600">${escapeHtml(cleanName)}</span>.`;
    }
    if (navModName) navModName.textContent = cleanName;
    if (navModRole) navModRole.textContent = 'Otoritas Pengawas OASE';

    // Update elemen pada Drawer Hamburger
    const modInitialLabel = document.getElementById('modInitialLabel');
    const modNameLabel = document.getElementById('modNameLabel');
    const modEmailLabel = document.getElementById('modEmailLabel');
    if (modInitialLabel) modInitialLabel.textContent = cleanName.charAt(0).toUpperCase();
    if (modNameLabel) modNameLabel.textContent = cleanName;
    if (modEmailLabel) modEmailLabel.textContent = currentModerator.email || 'moderator@oase.id';

    // Status Selector Handler
    if (moderatorStatusSelect && moderatorStatusDot) {
      moderatorStatusSelect.onchange = () => {
        const val = moderatorStatusSelect.value;
        if (val === 'active') {
          moderatorStatusDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse";
          moderatorStatusSelect.className = "bg-transparent border-0 text-xs font-bold text-emerald-800 focus:ring-0 cursor-pointer p-0 pr-2";
          showToast('Status diperbarui: Siaga Mengawasi');
        } else if (val === 'review') {
          moderatorStatusDot.className = "w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse";
          moderatorStatusSelect.className = "bg-transparent border-0 text-xs font-bold text-amber-800 focus:ring-0 cursor-pointer p-0 pr-2";
          showToast('Status diperbarui: Sedang Investigasi');
        } else {
          moderatorStatusDot.className = "w-2.5 h-2.5 rounded-full bg-slate-400";
          moderatorStatusSelect.className = "bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer p-0 pr-2";
          showToast('Status diperbarui: Mode Istirahat');
        }
      };
    }
  }

  // Hamburger Menu Drawer Handlers
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const hamburgerDrawer = document.getElementById('hamburgerDrawer');
  const hamburgerDrawerOverlay = document.getElementById('hamburgerDrawerOverlay');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const logoutDrawerBtn = document.getElementById('logoutDrawerBtn');

  function openDrawer() {
    if (hamburgerDrawerOverlay) hamburgerDrawerOverlay.classList.remove('hidden');
    if (hamburgerDrawer) hamburgerDrawer.classList.remove('translate-x-full');
  }

  function closeDrawer() {
    if (hamburgerDrawer) hamburgerDrawer.classList.add('translate-x-full');
    if (hamburgerDrawerOverlay) hamburgerDrawerOverlay.classList.add('hidden');
  }

  if (hamburgerBtn) hamburgerBtn.onclick = openDrawer;
  if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
  if (hamburgerDrawerOverlay) hamburgerDrawerOverlay.onclick = closeDrawer;

  if (logoutDrawerBtn) {
    logoutDrawerBtn.onclick = async () => {
      if (confirm('Apakah kamu yakin ingin keluar dari Laman Moderator?')) {
        try {
          if (window.AuthService && typeof window.AuthService.signOut === 'function') {
            await window.AuthService.signOut();
          }
        } catch (e) {}
        localStorage.removeItem('oase_active_moderator_email');
        currentModerator = null;
        window.location.href = 'dashboard-awal.html';
      }
    };
  }

  // Custom Display Name Modal Handlers
  const modDisplayNameModal = document.getElementById('modDisplayNameModal');
  const closeModDisplayNameModalBtn = document.getElementById('closeModDisplayNameModalBtn');
  const cancelModDisplayNameBtn = document.getElementById('cancelModDisplayNameBtn');
  const openChangeModDisplayNameBtn = document.getElementById('openChangeModDisplayNameBtn');
  const quickChangeModDisplayNameBtn = document.getElementById('quickChangeModDisplayNameBtn');
  const openChangeModDisplayNameDrawerBtn = document.getElementById('openChangeModDisplayNameDrawerBtn');
  const changeModDisplayNameForm = document.getElementById('changeModDisplayNameForm');
  const newModDisplayNameInput = document.getElementById('newModDisplayNameInput');

  function openModDisplayNameModal() {
    if (!modDisplayNameModal) return;
    const currentName = getActiveModDisplayName();
    if (newModDisplayNameInput) {
      newModDisplayNameInput.value = currentName;
      newModDisplayNameInput.focus();
    }
    modDisplayNameModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeModDisplayNameModal() {
    if (!modDisplayNameModal) return;
    modDisplayNameModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  if (openChangeModDisplayNameBtn) openChangeModDisplayNameBtn.onclick = openModDisplayNameModal;
  if (quickChangeModDisplayNameBtn) quickChangeModDisplayNameBtn.onclick = () => {
    closeDrawer();
    openModDisplayNameModal();
  };
  if (openChangeModDisplayNameDrawerBtn) openChangeModDisplayNameDrawerBtn.onclick = () => {
    closeDrawer();
    openModDisplayNameModal();
  };
  if (closeModDisplayNameModalBtn) closeModDisplayNameModalBtn.onclick = closeModDisplayNameModal;
  if (cancelModDisplayNameBtn) cancelModDisplayNameBtn.onclick = closeModDisplayNameModal;

  document.querySelectorAll('.quick-mod-name-chip').forEach(chip => {
    chip.onclick = () => {
      if (newModDisplayNameInput && chip.dataset.name) {
        newModDisplayNameInput.value = chip.dataset.name;
      }
    };
  });

  if (changeModDisplayNameForm) {
    changeModDisplayNameForm.onsubmit = async (e) => {
      e.preventDefault();
      const newName = newModDisplayNameInput ? newModDisplayNameInput.value.trim() : '';
      if (!newName) {
        alert('Mohon masukkan nama atau sapaan Anda.');
        return;
      }

      if (currentModerator) {
        currentModerator.display_name = newName;
        localStorage.setItem('oase_mod_custom_name_' + currentModerator.email, newName);

        try {
          if (window.AuthService && typeof window.AuthService.updateDisplayName === 'function') {
            await window.AuthService.updateDisplayName(currentModerator.id, currentModerator.email, newName);
          }
        } catch (err) {
          console.warn('Supabase profile update fallback:', err);
        }

        setupWarmGreeting();
        closeModDisplayNameModal();
        showToast(`Nama sapaan berhasil diubah menjadi "${newName}"! ✨`);
      }
    };
  }

  // ============================================================================
  // 6. FITUR 2: DETEKSI & PERINGATAN REAL-TIME UJARAN KEBENCIAN (SARA)
  // ============================================================================
  function scanCommunityCommentsForHateSpeech() {
    const commentsObj = getCommunityComments();
    const whitelisted = getWhitelistedComments();
    const flaggedList = [];
    let totalCount = 0;

    // Scan setiap komentar di setiap cerita
    Object.keys(commentsObj).forEach(storyId => {
      const comments = commentsObj[storyId] || [];
      comments.forEach(comment => {
        totalCount++;
        // Cek apakah sudah di-whitelist oleh moderator
        if (whitelisted.includes(comment.id)) return;

        // Gunakan CrisisDetectionService resmi dari OASE
        let checkResult = { isViolation: false, isSara: false, label: null, matchedKeyword: null };
        if (window.CrisisDetectionService && typeof window.CrisisDetectionService.checkContent === 'function') {
          checkResult = window.CrisisDetectionService.checkContent(comment.content || '');
        } else {
          // Fallback lokal jika service belum termuat
          const lower = (comment.content || '').toLowerCase();
          const saraList = ['kafir', 'cokin', 'nigger', 'negro', 'aliran sesat', 'pki', 'kadrun', 'cebong', 'bunuh', 'mutilasi'];
          for (const word of saraList) {
            if (lower.includes(word)) {
              checkResult = { isViolation: true, isSara: true, label: 'Ujaran Kebencian / SARA', matchedKeyword: word };
              break;
            }
          }
        }

        if (checkResult.isViolation || checkResult.isSara || checkResult.isCrisis) {
          flaggedList.push({
            storyId,
            commentId: comment.id,
            author: comment.author || 'Anonim',
            content: comment.content,
            created_at: comment.created_at,
            violationType: checkResult.isSara ? 'Ujaran Kebencian / SARA' : (checkResult.isCrisis ? 'Krisis & Self-Harm' : 'Kekerasan / Pelanggaran'),
            matchedKeyword: checkResult.matchedKeyword || 'Kata Terlarang',
            label: checkResult.label || 'Melanggar Pedoman Komunitas'
          });
        }
      });
    });

    return { flaggedList, totalCount };
  }

  function playAlertPing() {
    if (!isAlarmSoundEnabled) return;
    try {
      if (window.AudioAlertService && typeof window.AudioAlertService.playCrisisAlarm === 'function') {
        window.AudioAlertService.playCrisisAlarm();
      } else {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      }
    } catch (e) {
      console.warn('Audio alert sound notice:', e);
    }
  }

  function renderHateSpeechAlerts() {
    const { flaggedList, totalCount } = scanCommunityCommentsForHateSpeech();

    // Perbarui Statistik & Badge
    statMonitoredComments.textContent = totalCount;
    statHateSpeechCount.textContent = flaggedList.length;
    badgeHateSpeechCount.textContent = flaggedList.length;

    // Perbarui Indeks Keamanan
    const safeRate = totalCount === 0 ? 100 : Math.max(0, Math.round(((totalCount - flaggedList.length) / totalCount) * 100));
    statSafetyIndex.textContent = `${safeRate}%`;

    // Dropdown Bell Notifikasi
    if (flaggedList.length > 0) {
      modNotifBadge.classList.remove('hidden');
      modNotifBadge.textContent = flaggedList.length;

      // Tampilkan banner darurat
      urgentHateSpeechBanner.classList.remove('hidden');
      urgentBannerText.textContent = `Perhatian: Terdeteksi ${flaggedList.length} komentar yang mengandung ujaran kebencian/SARA! Segera tindak lanjuti.`;

      // Render Dropdown List
      modNotifList.innerHTML = flaggedList.map(item => `
        <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-rose-800">${escapeHtml(item.author)}</span>
            <span class="px-1.5 py-0.5 rounded-md bg-rose-200 text-rose-900 text-[9px] font-black uppercase">${escapeHtml(item.matchedKeyword)}</span>
          </div>
          <p class="text-rose-950 line-clamp-2 italic">"${escapeHtml(item.content)}"</p>
          <div class="pt-1 flex items-center justify-between text-[10px] text-rose-700">
            <span>${getTimeAgo(item.created_at)}</span>
            <button class="font-bold text-rose-900 underline quick-delete-notif-btn" data-story-id="${item.storyId}" data-comment-id="${item.commentId}" data-author="${escapeHtml(item.author)}" data-content="${escapeHtml(item.content)}">Hapus Langsung</button>
          </div>
        </div>
      `).join('');

      // Pasang event hapus langsung dari notifikasi
      document.querySelectorAll('.quick-delete-notif-btn').forEach(btn => {
        btn.onclick = () => {
          promptDeleteComment({
            storyId: btn.dataset.storyId,
            commentId: btn.dataset.commentId,
            author: btn.dataset.author,
            text: btn.dataset.content,
            source: 'notif'
          });
        };
      });
    } else {
      modNotifBadge.classList.add('hidden');
      urgentHateSpeechBanner.classList.add('hidden');
      modNotifList.innerHTML = `<p class="text-xs text-center text-oase-muted py-4">Belum ada peringatan ujaran kebencian baru.</p>`;
    }

    // Render Section 1 Container
    if (flaggedList.length === 0) {
      hateSpeechListContainer.innerHTML = `
        <div class="bg-white rounded-3xl p-10 text-center border border-emerald-200 space-y-3 shadow-xs">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <i data-lucide="check-circle-2" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base sm:text-lg font-bold text-emerald-950">Komunitas OASE Bersih & Damai</h3>
          <p class="text-xs text-oase-muted max-w-md mx-auto leading-relaxed">
            Tidak ada komentar yang mengandung ujaran kebencian, pelecehan suku/agama/ras, atau ancaman kekerasan saat ini. Sistem penjaga terus memantau setiap detik.
          </p>
        </div>
      `;
    } else {
      hateSpeechListContainer.innerHTML = flaggedList.map(item => `
        <div class="bg-white rounded-3xl p-5 sm:p-6 border-2 border-rose-400 hover:border-rose-500 shadow-sm transition-all space-y-4 animate-fadeIn">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-rose-100">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                <i data-lucide="alert-octagon" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-extrabold text-oase-plum">${escapeHtml(item.author)}</span>
                  <span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200 uppercase tracking-wide">
                    ⚠️ ${escapeHtml(item.violationType)}
                  </span>
                </div>
                <span class="text-[11px] text-oase-muted">Diposting: ${getTimeAgo(item.created_at)}</span>
              </div>
            </div>

            <span class="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 w-max">
              Kata Terdeteksi: <strong>"${escapeHtml(item.matchedKeyword)}"</strong>
            </span>
          </div>

          <!-- Cuplikan Komentar Berbahaya -->
          <div class="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">Isi Komentar yang Melanggar:</span>
            <p class="text-xs sm:text-sm text-rose-950 font-medium leading-relaxed italic">
              "${highlightViolation(item.content, item.matchedKeyword)}"
            </p>
          </div>

          <!-- Tombol Otoritas Moderator -->
          <div class="flex items-center justify-between gap-3 pt-1 flex-wrap">
            <span class="text-[11px] text-oase-muted">
              Status AI: <strong>${escapeHtml(item.label)}</strong>
            </span>

            <div class="flex items-center gap-2">
              <button 
                type="button" 
                class="ignore-alert-btn px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                data-comment-id="${item.commentId}"
                title="Tandai aman jika bukan merupakan ujaran kebencian yang disengaja"
              >
                Abaikan / Aman
              </button>

              <button 
                type="button" 
                class="delete-hate-comment-btn px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-rose-500/20 transition-all"
                data-story-id="${item.storyId}"
                data-comment-id="${item.commentId}"
                data-author="${escapeHtml(item.author)}"
                data-content="${escapeHtml(item.content)}"
                data-keyword="${escapeHtml(item.matchedKeyword)}"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Hapus Komentar Pelanggaran</span>
              </button>
            </div>
          </div>
        </div>
      `).join('');

      // Event listener tombol abaikan
      document.querySelectorAll('.ignore-alert-btn').forEach(btn => {
        btn.onclick = () => {
          const cId = btn.dataset.commentId;
          addWhitelistedComment(cId);
          addAuditLog('ABAIKAN_PERINGATAN', `Komentar ID: ${cId}`, 'Ditandai aman oleh moderator (False Positive)');
          showToast('Peringatan telah diabaikan.');
          renderHateSpeechAlerts();
        };
      });

      // Event listener tombol hapus
      document.querySelectorAll('.delete-hate-comment-btn').forEach(btn => {
        btn.onclick = () => {
          promptDeleteComment({
            storyId: btn.dataset.storyId,
            commentId: btn.dataset.commentId,
            author: btn.dataset.author,
            text: btn.dataset.content,
            reason: `Memuat ujaran kebencian / kata terlarang: "${btn.dataset.keyword}"`
          });
        };
      });
    }

    if (window.lucide) lucide.createIcons();
  }

  function highlightViolation(text, keyword) {
    if (!keyword || !text) return escapeHtml(text || '');
    const safeText = escapeHtml(text);
    const safeKeyword = escapeHtml(keyword);
    const regex = new RegExp(`(${safeKeyword})`, 'gi');
    return safeText.replace(regex, `<mark class="bg-rose-300 text-rose-950 font-black px-1 rounded">$1</mark>`);
  }

  // ============================================================================
  // 7. FITUR 3: MANAJEMEN SELURUH KOMENTAR KOMUNITAS (WEWENANG HAPUS)
  // ============================================================================
  function renderAllCommunityComments(filterQuery = '') {
    const commentsObj = getCommunityComments();
    const query = (filterQuery || '').toLowerCase().trim();
    const allList = [];

    Object.keys(commentsObj).forEach(storyId => {
      const comments = commentsObj[storyId] || [];
      comments.forEach(c => {
        if (!query || (c.author || '').toLowerCase().includes(query) || (c.content || '').toLowerCase().includes(query)) {
          allList.push({
            storyId,
            commentId: c.id,
            author: c.author || 'Anonim',
            content: c.content,
            created_at: c.created_at
          });
        }
      });
    });

    if (allList.length === 0) {
      allCommentsListContainer.innerHTML = `
        <div class="bg-white rounded-3xl p-8 text-center border border-heather-100 space-y-2">
          <i data-lucide="message-square-off" class="w-8 h-8 text-oase-muted mx-auto"></i>
          <h4 class="text-sm font-bold text-oase-plum">Tidak ada komentar ditemukan</h4>
          <p class="text-xs text-oase-muted">Belum ada komentar dukungan yang cocok dengan kriteria pencarian.</p>
        </div>
      `;
    } else {
      allCommentsListContainer.innerHTML = allList.map(c => `
        <div class="p-4 sm:p-5 rounded-2xl bg-white border border-heather-100 hover:border-heather-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="space-y-1.5 flex-grow">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-oase-plum">${escapeHtml(c.author)}</span>
              <span class="text-[10px] text-oase-muted">• ${getTimeAgo(c.created_at)}</span>
              <span class="px-2 py-0.5 rounded-full bg-heather-50 text-heather-700 text-[10px] font-semibold">Cerita ID: ${escapeHtml(c.storyId)}</span>
            </div>
            <p class="text-xs sm:text-sm text-oase-plum leading-relaxed bg-oase-surface/50 p-3 rounded-xl border border-oase-border/40">
              "${escapeHtml(c.content)}"
            </p>
          </div>

          <button 
            type="button" 
            class="delete-single-comment-btn px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 border border-rose-200 transition-all flex-shrink-0"
            data-story-id="${c.storyId}"
            data-comment-id="${c.commentId}"
            data-author="${escapeHtml(c.author)}"
            data-content="${escapeHtml(c.content)}"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Hapus Komentar</span>
          </button>
        </div>
      `).join('');

      document.querySelectorAll('.delete-single-comment-btn').forEach(btn => {
        btn.onclick = () => {
          promptDeleteComment({
            storyId: btn.dataset.storyId,
            commentId: btn.dataset.commentId,
            author: btn.dataset.author,
            text: btn.dataset.content,
            reason: 'Tindakan manual moderator'
          });
        };
      });
    }

    if (window.lucide) lucide.createIcons();
  }

  // Modal Konfirmasi Hapus Komentar
  function promptDeleteComment(data) {
    commentToDelete = data;
    deleteCommentPreview.innerHTML = `
      <strong>Penulis:</strong> ${escapeHtml(data.author)}<br>
      <strong>Isi:</strong> "${escapeHtml(data.text)}"
    `;
    deleteModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.onclick = () => {
      commentToDelete = null;
      deleteModal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    };
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.onclick = () => {
      if (!commentToDelete) return;
      const { storyId, commentId, author, text, reason } = commentToDelete;

      const commentsObj = getCommunityComments();
      if (commentsObj[storyId]) {
        commentsObj[storyId] = commentsObj[storyId].filter(c => c.id !== commentId);
        saveCommunityComments(commentsObj);
      }

      // Catat ke Log Audit
      addAuditLog(
        'HAPUS_KOMENTAR', 
        `Komentar oleh ${author} ("${text.slice(0, 30)}...")`, 
        reason || 'Pelanggaran pedoman komunitas'
      );

      deleteModal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
      commentToDelete = null;

      // Segarkan Tampilan
      renderHateSpeechAlerts();
      renderAllCommunityComments(commentSearchInput ? commentSearchInput.value : '');
      showToast('Komentar berhasil dihapus permanen oleh Moderator! 🛡️');
    };
  }

  // ============================================================================
  // 8. FITUR 4: KOTAK LAPORAN BUG & ADUAN SISWA (MULTI-MODERATOR REAL-TIME)
  // ============================================================================
  async function renderBugReports() {
    let reports = [];
    if (window.BugReportService) {
      reports = await window.BugReportService.getReports({ includeResolved: true });
    } else {
      reports = getBugReports();
    }

    const uncompletedReports = reports.filter(r => r.status !== 'selesai');
    const resolvedReports = reports.filter(r => r.status === 'selesai');

    if (badgeBugReportsCount) badgeBugReportsCount.textContent = uncompletedReports.length;
    if (statBugReportsCount) statBugReportsCount.textContent = uncompletedReports.length;
    if (bugCountActive) bugCountActive.textContent = uncompletedReports.length;
    if (bugCountResolved) bugCountResolved.textContent = resolvedReports.length;
    if (bugCountAll) bugCountAll.textContent = reports.length;

    let filtered = [];
    if (activeBugFilter === 'active') {
      filtered = uncompletedReports;
    } else if (activeBugFilter === 'selesai') {
      filtered = resolvedReports;
    } else {
      filtered = reports;
    }

    if (filtered.length === 0) {
      bugReportsListContainer.innerHTML = `
        <div class="bg-white rounded-3xl p-8 text-center border border-amber-100 space-y-2">
          <i data-lucide="check-circle" class="w-8 h-8 text-emerald-500 mx-auto"></i>
          <h4 class="text-sm font-bold text-oase-plum">Tidak ada laporan kendala</h4>
          <p class="text-xs text-oase-muted">${activeBugFilter === 'active' ? 'Semua pengaduan siswa saat ini telah selesai ditangani.' : 'Belum ada rekaman laporan pada kategori ini.'}</p>
        </div>
      `;
    } else {
      bugReportsListContainer.innerHTML = filtered.map(report => {
        const isResolved = report.status === 'selesai';
        let statusBadge = '';
        if (report.status === 'baru') {
          statusBadge = `<span class="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200">Menunggu Ditinjau</span>`;
        } else if (report.status === 'proses') {
          statusBadge = `<span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-200">Sedang Diproses</span>`;
        } else {
          statusBadge = `<span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">Sudah Teratasi</span>`;
        }

        return `
          <div class="bg-white rounded-2xl p-4 sm:p-5 border ${isResolved ? 'border-gray-200 bg-gray-50/50' : 'border-amber-200'} shadow-2xs space-y-3 transition-all">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-extrabold text-amber-950">${escapeHtml(report.category)}</span>
                ${statusBadge}
                <span class="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-semibold">${escapeHtml(report.device || 'Perangkat Web')}</span>
              </div>
              <span class="text-[11px] text-gray-500">
                ${getTimeAgo(report.created_at)} • <strong>${escapeHtml(report.reporter)}</strong> (${escapeHtml(report.reporter_email || 'Anonim')})
              </span>
            </div>

            <p class="text-xs sm:text-sm text-gray-800 leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
              ${escapeHtml(report.description)}
            </p>

            <div class="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 flex-wrap">
              <div class="flex items-center gap-2">
                ${!isResolved ? `
                  <button 
                    type="button" 
                    class="resolve-bug-btn px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-98"
                    data-bug-id="${report.id}"
                    data-category="${escapeHtml(report.category)}"
                  >
                    <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                    <span>✓ Tandai Sudah Selesai</span>
                  </button>
                ` : `
                  <span class="text-xs text-emerald-800 font-bold flex items-center gap-1">
                    <i data-lucide="check" class="w-4 h-4 text-emerald-600"></i>
                    <span>Telah diselesaikan oleh ${escapeHtml(report.resolved_by || 'Moderator')} (${getTimeAgo(report.resolved_at)})</span>
                  </span>
                `}

                <div class="flex items-center gap-1.5 text-xs">
                  <span class="text-gray-400 text-[11px]">Status:</span>
                  <select class="bug-status-select bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 py-1 px-2 cursor-pointer focus:outline-none" data-bug-id="${report.id}" data-category="${escapeHtml(report.category)}">
                    <option value="baru" ${report.status === 'baru' ? 'selected' : ''}>Menunggu Ditinjau</option>
                    <option value="proses" ${report.status === 'proses' ? 'selected' : ''}>Sedang Diproses</option>
                    <option value="selesai" ${report.status === 'selesai' ? 'selected' : ''}>Sudah Teratasi</option>
                  </select>
                </div>
              </div>

              <button 
                type="button" 
                class="delete-bug-btn text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors px-2 py-1"
                data-bug-id="${report.id}"
                title="Hapus Laporan Secara Permanen"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Hapus</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Tombol Tandai Selesai Langsung
      document.querySelectorAll('.resolve-bug-btn').forEach(btn => {
        btn.onclick = async () => {
          const bId = btn.dataset.bugId;
          const cat = btn.dataset.category || 'Kendala Teknis';
          const modName = currentModerator ? (currentModerator.display_name || currentModerator.email) : 'Moderator OASE';

          if (window.BugReportService) {
            await window.BugReportService.updateStatus(bId, 'selesai', modName);
          } else {
            const reports = getBugReports();
            const target = reports.find(r => r.id === bId);
            if (target) {
              target.status = 'selesai';
              target.resolved_by = modName;
              target.resolved_at = new Date().toISOString();
              saveBugReports(reports);
            }
          }

          addAuditLog('SELESAIKAN_BUG', `Laporan: ${cat}`, `Diselesaikan oleh ${modName}`);
          showToast(`Laporan "${cat}" berhasil diselesaikan dan dihapus dari antrean aktif.`);
          renderBugReports();
        };
      });

      // Event listener status select
      document.querySelectorAll('.bug-status-select').forEach(sel => {
        sel.onchange = async () => {
          const bId = sel.dataset.bugId;
          const cat = sel.dataset.category || 'Kendala Teknis';
          const newStatus = sel.value;
          const modName = currentModerator ? (currentModerator.display_name || currentModerator.email) : 'Moderator OASE';

          if (window.BugReportService) {
            await window.BugReportService.updateStatus(bId, newStatus, modName);
          } else {
            const reports = getBugReports();
            const target = reports.find(r => r.id === bId);
            if (target) {
              target.status = newStatus;
              if (newStatus === 'selesai') {
                target.resolved_by = modName;
                target.resolved_at = new Date().toISOString();
              }
              saveBugReports(reports);
            }
          }

          addAuditLog('UPDATE_STATUS_BUG', `Laporan: ${cat}`, `Status diubah menjadi: ${newStatus}`);
          showToast(`Status laporan berhasil diubah ke: ${newStatus}`);
          renderBugReports();
        };
      });

      // Event listener delete bug
      document.querySelectorAll('.delete-bug-btn').forEach(btn => {
        btn.onclick = async () => {
          const bId = btn.dataset.bugId;
          if (confirm('Apakah kamu yakin ingin menghapus laporan kendala ini?')) {
            if (window.BugReportService) {
              await window.BugReportService.deleteReport(bId);
            } else {
              let reports = getBugReports();
              reports = reports.filter(r => r.id !== bId);
              saveBugReports(reports);
            }
            addAuditLog('HAPUS_LAPORAN_BUG', `ID: ${bId}`, 'Dihapus oleh moderator');
            showToast('Laporan bug telah dihapus.');
            renderBugReports();
          }
        };
      });
    }

    if (window.lucide) lucide.createIcons();
  }

  // Filter Kategori Bug (Aktif vs Selesai vs Semua)
  document.querySelectorAll('.bug-filter-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.bug-filter-btn').forEach(b => {
        b.className = "bug-filter-btn px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-amber-50";
      });
      btn.className = "bug-filter-btn px-4 py-2 rounded-full bg-amber-600 text-white font-bold";
      activeBugFilter = btn.dataset.filter;
      renderBugReports();
    };
  });

  // Tambah Laporan Uji Coba Button
  const addSampleBugBtn = document.getElementById('addSampleBugBtn');
  if (addSampleBugBtn) {
    addSampleBugBtn.onclick = async () => {
      const sampleCategories = [
        '📱 Tampilan Berantakan (Mobile/Desktop)',
        '⚙️ Tombol / Navigasi Macet',
        '💬 Kendala Login / Cerita',
        '🎧 Audio Relaksasi Mood'
      ];
      const randomCat = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];
      if (window.BugReportService) {
        await window.BugReportService.submitReport({
          reporterName: 'Siswa Percobaan (Uji Coba)',
          reporterEmail: 'tester@oase.id',
          category: randomCat,
          device: 'Laptop Windows (Chrome)',
          pageUrl: 'komunitas.html',
          description: 'Laporan pengujian sistem dari moderator untuk memverifikasi alur kerja.'
        });
      }
      addAuditLog('TAMBAH_LAPORAN_BUG', randomCat, 'Laporan baru dibuat untuk pengujian');
      showToast('Laporan uji coba berhasil ditambahkan ke antrean aktif!');
      renderBugReports();
    };
  }

  // ============================================================================
  // 9. FITUR 5: KAMUS SENSOR SARA DINAMIS (MULTI-MODERATOR SYNC)
  // ============================================================================
  async function renderSaraKeywords() {
    let customList = [];
    if (window.SaraKeywordService) {
      customList = await window.SaraKeywordService.getCustomKeywords();
    }

    if (customKeywordsCountBadge) {
      customKeywordsCountBadge.textContent = `${customList.length} Kata Terdaftar`;
    }

    if (!customKeywordsContainer) return;

    if (customList.length === 0) {
      customKeywordsContainer.innerHTML = `
        <p class="text-xs text-rose-900/70 italic py-2">
          Belum ada kosakata tambahan dari moderator. Klik tombol <strong>"+ Tambah Kosakata Terlarang"</strong> di atas untuk mendaftarkan kata baru yang akan langsung aktif di seluruh sistem.
        </p>
      `;
    } else {
      customKeywordsContainer.innerHTML = customList.map(kw => {
        let catBadge = 'bg-rose-100 text-rose-800 border-rose-200';
        let catLabel = 'SARA';
        if (kw.category === 'kekerasan') {
          catBadge = 'bg-amber-100 text-amber-800 border-amber-200';
          catLabel = 'KEKERASAN';
        } else if (kw.category === 'krisis') {
          catBadge = 'bg-indigo-100 text-indigo-800 border-indigo-200';
          catLabel = 'KRISIS';
        } else if (kw.category === 'lainnya') {
          catBadge = 'bg-gray-100 text-gray-800 border-gray-200';
          catLabel = 'UMUM';
        }

        return `
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-rose-200 shadow-2xs text-xs text-rose-950 animate-fadeIn">
            <span class="font-extrabold text-rose-900">"${escapeHtml(kw.keyword)}"</span>
            <span class="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase border ${catBadge}">${catLabel}</span>
            <span class="text-[10px] text-gray-400">oleh ${escapeHtml(kw.added_by || 'Moderator')}</span>
            <button class="delete-sara-keyword-btn p-0.5 text-gray-400 hover:text-rose-600 transition-colors" data-id="${kw.id}" data-word="${escapeHtml(kw.keyword)}" title="Hapus kata kunci ini">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.delete-sara-keyword-btn').forEach(btn => {
        btn.onclick = async () => {
          const kwId = btn.dataset.id;
          const word = btn.dataset.word;
          if (confirm(`Apakah kamu yakin ingin menghapus kosakata "${word}" dari kamus sensor SARA?`)) {
            if (window.SaraKeywordService) {
              await window.SaraKeywordService.deleteKeyword(kwId);
            }
            addAuditLog('HAPUS_KATA_SARA', `Kata: "${word}"`, 'Dihapus dari kamus sensor');
            showToast(`Kosakata "${word}" berhasil dihapus.`);
            renderSaraKeywords();
            renderHateSpeechAlerts();
          }
        };
      });
    }

    if (window.lucide) lucide.createIcons();
  }

  // Modal Tambah Kosakata Sensor SARA
  if (openAddKeywordModalBtn) {
    openAddKeywordModalBtn.onclick = () => {
      if (addSaraKeywordModal) {
        addSaraKeywordModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (newSaraKeywordInput) {
          newSaraKeywordInput.value = '';
          newSaraKeywordInput.focus();
        }
      }
    };
  }

  function closeAddKeywordModal() {
    if (addSaraKeywordModal) {
      addSaraKeywordModal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  }

  if (closeAddKeywordModalBtn) closeAddKeywordModalBtn.onclick = closeAddKeywordModal;
  if (cancelAddKeywordBtn) cancelAddKeywordBtn.onclick = closeAddKeywordModal;

  if (addSaraKeywordForm) {
    addSaraKeywordForm.onsubmit = async (e) => {
      e.preventDefault();
      const keyword = newSaraKeywordInput.value.trim();
      const category = newSaraCategorySelect.value;
      const note = newSaraNoteInput.value.trim();
      const addedBy = currentModerator ? (currentModerator.display_name || currentModerator.email) : 'Moderator OASE';

      if (!keyword) {
        alert('Mohon masukkan kosakata atau frasa terlarang.');
        return;
      }

      try {
        if (window.SaraKeywordService) {
          await window.SaraKeywordService.addKeyword({
            keyword,
            category,
            note,
            addedBy
          });
        }
        addAuditLog('TAMBAH_KATA_SARA', `Kata: "${keyword}"`, `Kategori: ${category}`);
        closeAddKeywordModal();
        await renderSaraKeywords();
        renderHateSpeechAlerts();
        showToast(`Kosakata "${keyword}" berhasil disimpan dan disinkronkan ke seluruh moderator! 🛡️`);
      } catch (err) {
        console.error('Error adding keyword:', err);
        alert(err.message || 'Gagal menyimpan kata kunci.');
      }
    };
  }

  // ============================================================================
  // 10. FITUR KHUSUS: MANAJEMEN AKUN MODERATOR RESMI (WHITELIST)
  // ============================================================================
  // Elemen Form & Password Kelola Akun Moderator
  const newModPasswordInput = document.getElementById('newModPasswordInput');
  const newModNameInput = document.getElementById('newModNameInput');
  const generateModPasswordBtn = document.getElementById('generateModPasswordBtn');
  const toggleModPasswordVisibilityBtn = document.getElementById('toggleModPasswordVisibilityBtn');
  const modPasswordEyeIcon = document.getElementById('modPasswordEyeIcon');
  const addModFeedback = document.getElementById('addModFeedback');

  if (generateModPasswordBtn && newModPasswordInput) {
    generateModPasswordBtn.onclick = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$*';
      let pass = 'Mod';
      for (let i = 0; i < 6; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      pass += '!26';
      newModPasswordInput.value = pass;
      newModPasswordInput.type = 'text';
      if (modPasswordEyeIcon) modPasswordEyeIcon.setAttribute('data-lucide', 'eye-off');
      if (window.lucide) lucide.createIcons();
      showToast('Kata sandi acak berhasil dibuat!');
    };
  }

  if (toggleModPasswordVisibilityBtn && newModPasswordInput) {
    toggleModPasswordVisibilityBtn.onclick = () => {
      const isPassword = newModPasswordInput.type === 'password';
      newModPasswordInput.type = isPassword ? 'text' : 'password';
      toggleModPasswordVisibilityBtn.innerHTML = isPassword
        ? '<i data-lucide="eye-off" class="w-4 h-4 text-rose-600"></i>'
        : '<i data-lucide="eye" class="w-4 h-4 text-gray-400"></i>';
      if (window.lucide) lucide.createIcons();
    };
  }

  function renderAuthorizedModerators() {
    if (!authorizedModsList) return;
    const allMods = (window.AuthService && typeof window.AuthService.getAllModeratorEmails === 'function')
      ? window.AuthService.getAllModeratorEmails()
      : (window.AuthService && window.AuthService.MODERATORS_LIST ? window.AuthService.MODERATORS_LIST : ['moderator@oase.id']);

    if (modsTotalCountBadge) {
      modsTotalCountBadge.textContent = `${allMods.length} Akun`;
    }

    const defaultMods = (window.AuthService && window.AuthService.MODERATORS_LIST) || [];
    const credMap = (window.AuthService && typeof window.AuthService.getModeratorCredentialsMap === 'function')
      ? window.AuthService.getModeratorCredentialsMap()
      : {};

    authorizedModsList.innerHTML = allMods.map(email => {
      const isDefault = defaultMods.some(dm => dm.toLowerCase() === email.toLowerCase());
      const cred = credMap[email.toLowerCase()];
      const modDisplayName = getResolvedModName(email, cred);
      const password = cred && cred.password ? cred.password : (isDefault ? 'default123' : '');

      return `
        <div class="p-3 rounded-2xl border border-gray-100 bg-gray-50/70 text-xs space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 overflow-hidden flex-1">
              <div class="w-7 h-7 rounded-full bg-heather-100 text-heather-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                <i data-lucide="shield" class="w-3.5 h-3.5"></i>
              </div>
              <div class="overflow-hidden">
                <span class="font-bold text-gray-800 truncate block">${escapeHtml(email)}</span>
                ${modDisplayName ? `<span class="text-[10px] text-gray-500 block">Sapaan: <strong>${escapeHtml(modDisplayName)}</strong></span>` : ''}
              </div>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase flex-shrink-0 ${isDefault ? 'bg-heather-100 text-heather-800' : 'bg-emerald-100 text-emerald-800'}">
                ${isDefault ? 'Utama' : 'Tambahan'}
              </span>
            </div>

            ${!isDefault ? `
              <button class="remove-mod-btn text-gray-400 hover:text-rose-600 p-1 transition-colors flex-shrink-0" data-email="${escapeHtml(email)}" title="Hapus otorisasi moderator">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            ` : `
              <span class="text-[10px] text-gray-400 font-semibold px-1 flex-shrink-0">Sistem</span>
            `}
          </div>

          ${password ? `
            <div class="flex items-center justify-between pt-1.5 border-t border-gray-200/60 text-[11px] gap-2">
              <span class="text-gray-500 font-mono text-[10px] truncate">Kata Sandi: <strong class="text-gray-800">${escapeHtml(password)}</strong></span>
              <button type="button" class="copy-single-cred-btn px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-[10px] flex items-center gap-1 transition-all shadow-2xs flex-shrink-0" data-email="${escapeHtml(email)}" data-pass="${escapeHtml(password)}" data-name="${escapeHtml(modDisplayName || 'Moderator')}">
                <i data-lucide="copy" class="w-3 h-3 text-heather-600"></i>
                <span>Salin Kredensial</span>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    document.querySelectorAll('.copy-single-cred-btn').forEach(btn => {
      btn.onclick = () => {
        const text = `Akun Moderator OASE Cerita:\nNama: ${btn.dataset.name}\nEmail: ${btn.dataset.email}\nKata Sandi: ${btn.dataset.pass}\nLogin di: laman-moderator.html`;
        navigator.clipboard.writeText(text);
        showToast(`Kredensial untuk ${btn.dataset.email} berhasil disalin!`);
      };
    });

    document.querySelectorAll('.remove-mod-btn').forEach(btn => {
      btn.onclick = async () => {
        const em = btn.dataset.email;
        if (confirm(`Apakah kamu yakin ingin mencabut hak akses moderator untuk akun: ${em}?`)) {
          try {
            if (window.AuthService && typeof window.AuthService.removeModeratorEmail === 'function') {
              await window.AuthService.removeModeratorEmail(em);
            }
            addAuditLog('CABUT_MODERATOR', `Email: ${em}`, 'Dicabut oleh moderator');
            showToast(`Hak akses moderator untuk ${em} berhasil dicabut.`);
            renderAuthorizedModerators();
          } catch(err) {
            alert(err.message || 'Gagal menghapus moderator.');
          }
        }
      };
    });

    if (window.lucide) lucide.createIcons();
  }

  // Modal Kelola Akun Moderator
  if (openManageModsBtn) {
    openManageModsBtn.onclick = () => {
      if (manageModsModal) {
        manageModsModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (addModFeedback) addModFeedback.classList.add('hidden');
        renderAuthorizedModerators();
        if (newModEmailInput) {
          newModEmailInput.value = '';
          newModEmailInput.focus();
        }
        if (newModPasswordInput) newModPasswordInput.value = '';
        if (newModNameInput) newModNameInput.value = '';
      }
    };
  }

  function closeManageModsModal() {
    if (manageModsModal) {
      manageModsModal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  }

  if (closeManageModsModalBtn) closeManageModsModalBtn.onclick = closeManageModsModal;
  if (closeManageModsModalBtn2) closeManageModsModalBtn2.onclick = closeManageModsModal;

  if (addModEmailForm) {
    addModEmailForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = newModEmailInput ? newModEmailInput.value.trim() : '';
      const password = newModPasswordInput ? newModPasswordInput.value : '';
      const displayName = newModNameInput ? newModNameInput.value.trim() : '';
      const submitBtn = document.getElementById('submitAddModBtn');

      if (!email || !email.includes('@')) {
        alert('Mohon masukkan alamat email yang valid.');
        return;
      }

      if (!password || password.length < 6) {
        alert('Mohon tentukan kata sandi minimal 6 karakter untuk akun moderator ini.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Mendaftarkan Akun...</span>`;
      }

      try {
        if (window.AuthService && typeof window.AuthService.addModeratorAccount === 'function') {
          await window.AuthService.addModeratorAccount({
            email,
            password,
            displayName: displayName || email.split('@')[0],
            addedBy: currentModerator ? (currentModerator.display_name || currentModerator.email) : 'Moderator Utama'
          });
        } else if (window.AuthService && typeof window.AuthService.addModeratorEmail === 'function') {
          await window.AuthService.addModeratorEmail(email, currentModerator ? (currentModerator.display_name || currentModerator.email) : 'Moderator Utama');
        }

        addAuditLog('TAMBAH_MODERATOR', `Email: ${email}`, `Diberikan akses resmi moderator dengan kata sandi`);
        showToast(`Akun Moderator ${email} berhasil didaftarkan! 🛡️`);
        
        if (addModFeedback) {
          addModFeedback.classList.remove('hidden');
          addModFeedback.innerHTML = `
            <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div class="flex items-center gap-1.5 font-bold text-emerald-800">
                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
                <span>Akun Moderator Berhasil Didaftarkan!</span>
              </div>
              <div class="bg-white p-2.5 rounded-xl border border-emerald-100 font-mono text-[11px] space-y-0.5">
                <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p><strong>Password:</strong> ${escapeHtml(password)}</p>
                ${displayName ? `<p><strong>Nama:</strong> ${escapeHtml(displayName)}</p>` : ''}
              </div>
              <button type="button" class="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all copy-new-mod-btn">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>Salin Kredensial untuk Dikirimkan</span>
              </button>
            </div>
          `;
          const copyBtn = addModFeedback.querySelector('.copy-new-mod-btn');
          if (copyBtn) {
            copyBtn.onclick = () => {
              const text = `Halo ${displayName || 'Moderator'},\nBerikut kredensial akun Moderator OASE Cerita Anda:\nEmail: ${email}\nKata Sandi: ${password}\nLaman Akses: https://.../laman-moderator.html\nMohon simpan dengan aman.`;
              navigator.clipboard.writeText(text);
              showToast('Kredensial berhasil disalin ke clipboard!');
            };
          }
          if (window.lucide) lucide.createIcons();
        }

        if (newModEmailInput) newModEmailInput.value = '';
        if (newModPasswordInput) newModPasswordInput.value = '';
        if (newModNameInput) newModNameInput.value = '';
        renderAuthorizedModerators();
      } catch (err) {
        alert(err.message || 'Gagal menambahkan akun moderator.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4"></i><span>Daftarkan Akun Moderator</span>`;
          if (window.lucide) lucide.createIcons();
        }
      }
    };
  }

  // ============================================================================
  // 11. FITUR 6: LOG AUDIT TINDAKAN MODERASI
  // ============================================================================
  function renderAuditLogs() {
    const logs = getAuditLogs();
    if (logs.length === 0) {
      auditLogsContainer.innerHTML = `
        <div class="bg-white rounded-3xl p-8 text-center border border-heather-100 text-oase-muted text-xs">
          Belum ada rekaman tindakan moderasi.
        </div>
      `;
    } else {
      auditLogsContainer.innerHTML = logs.map(log => `
        <div class="p-3.5 rounded-xl bg-white border border-heather-100 flex items-center justify-between text-xs gap-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md bg-heather-100 text-heather-800 text-[10px] font-bold">${escapeHtml(log.action)}</span>
              <span class="font-bold text-oase-plum">${escapeHtml(log.target)}</span>
            </div>
            <p class="text-[11px] text-oase-muted">Keterangan: ${escapeHtml(log.reason)}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-[10px] text-heather-600 font-bold block">${escapeHtml(log.moderator)}</span>
            <span class="text-[10px] text-oase-muted">${getTimeAgo(log.timestamp)}</span>
          </div>
        </div>
      `).join('');
    }
  }

  const clearAuditLogsBtn = document.getElementById('clearAuditLogsBtn');
  if (clearAuditLogsBtn) {
    clearAuditLogsBtn.onclick = () => {
      if (confirm('Bersihkan seluruh riwayat audit log?')) {
        localStorage.removeItem('oase_moderation_logs');
        renderAuditLogs();
        showToast('Riwayat log berhasil dibersihkan.');
      }
    };
  }

  // ============================================================================
  // 11. NAVIGASI TAB MODERATOR (CAPSULE PILL STYLE)
  // ============================================================================
  function switchTab(tabKey) {
    activeTab = tabKey;
    const tabs = [
      { key: 'hateSpeech', btn: tabBtnHateSpeech, sec: sectionHateSpeech },
      { key: 'allComments', btn: tabBtnAllComments, sec: sectionAllComments },
      { key: 'bugReports', btn: tabBtnBugReports, sec: sectionBugReports },
      { key: 'keywords', btn: tabBtnKeywords, sec: sectionKeywords },
      { key: 'auditLogs', btn: tabBtnAuditLogs, sec: sectionAuditLogs }
    ];

    tabs.forEach(t => {
      if (!t.btn || !t.sec) return;
      if (t.key === tabKey) {
        t.btn.className = `px-5 py-2.5 rounded-full bg-[#8E3476] text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all`;
        t.sec.classList.remove('hidden');
      } else {
        t.btn.className = `px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center gap-2 transition-all`;
        t.sec.classList.add('hidden');
      }
    });

    if (window.lucide) lucide.createIcons();
  }

  if (tabBtnHateSpeech) tabBtnHateSpeech.onclick = () => switchTab('hateSpeech');
  if (tabBtnAllComments) tabBtnAllComments.onclick = () => switchTab('allComments');
  if (tabBtnBugReports) tabBtnBugReports.onclick = () => switchTab('bugReports');
  if (tabBtnKeywords) tabBtnKeywords.onclick = () => switchTab('keywords');
  if (tabBtnAuditLogs) tabBtnAuditLogs.onclick = () => switchTab('auditLogs');

  // Search input filter untuk seluruh komentar
  if (commentSearchInput) {
    commentSearchInput.oninput = () => {
      renderAllCommunityComments(commentSearchInput.value);
    };
  }

  // Segarkan tombol-tombol
  const refreshHateSpeechBtn = document.getElementById('refreshHateSpeechBtn');
  if (refreshHateSpeechBtn) refreshHateSpeechBtn.onclick = () => {
    renderHateSpeechAlerts();
    showToast('Pemindaian ujaran kebencian selesai diperbarui.');
  };

  const refreshAllCommentsBtn = document.getElementById('refreshAllCommentsBtn');
  if (refreshAllCommentsBtn) refreshAllCommentsBtn.onclick = () => {
    renderAllCommunityComments(commentSearchInput ? commentSearchInput.value : '');
    showToast('Daftar seluruh komentar berhasil disegarkan.');
  };

  const refreshBugReportsBtn = document.getElementById('refreshBugReportsBtn');
  if (refreshBugReportsBtn) refreshBugReportsBtn.onclick = () => {
    renderBugReports();
    showToast('Kotak laporan bug berhasil disegarkan.');
  };

  // Notifikasi Bell Toggle
  if (modNotifBellBtn && modNotifDropdown) {
    modNotifBellBtn.onclick = (e) => {
      e.stopPropagation();
      modNotifDropdown.classList.toggle('hidden');
    };

    document.addEventListener('click', (e) => {
      if (!modNotifDropdown.contains(e.target) && e.target !== modNotifBellBtn) {
        modNotifDropdown.classList.add('hidden');
      }
    });
  }

  if (clearModNotifBtn) {
    clearModNotifBtn.onclick = () => {
      modNotifBadge.classList.add('hidden');
      urgentHateSpeechBanner.classList.add('hidden');
      modNotifList.innerHTML = `<p class="text-xs text-center text-oase-muted py-4">Semua peringatan telah ditandai dibaca.</p>`;
      showToast('Peringatan telah ditandai dibaca.');
    };
  }

  if (viewUrgentAlertsBtn) {
    viewUrgentAlertsBtn.onclick = () => {
      switchTab('hateSpeech');
      window.scrollTo({ top: sectionHateSpeech.offsetTop - 100, behavior: 'smooth' });
    };
  }

  if (dismissUrgentBannerBtn) {
    dismissUrgentBannerBtn.onclick = () => {
      urgentHateSpeechBanner.classList.add('hidden');
    };
  }

  // Toggle Audio Alarm
  if (toggleAlarmSoundBtn && alarmSoundIcon) {
    updateAlarmSoundUI();
    toggleAlarmSoundBtn.onclick = () => {
      isAlarmSoundEnabled = !isAlarmSoundEnabled;
      localStorage.setItem('oase_mod_sound_enabled', isAlarmSoundEnabled ? 'true' : 'false');
      updateAlarmSoundUI();
      showToast(isAlarmSoundEnabled ? 'Audio alarm peringatan AKTIF 🔔' : 'Audio alarm peringatan DIBISUKAN 🔕');
      if (isAlarmSoundEnabled) playAlertPing();
    };
  }

  function updateAlarmSoundUI() {
    if (isAlarmSoundEnabled) {
      toggleAlarmSoundBtn.title = "Audio Alarm Peringatan: Aktif (Klik untuk membisukan)";
      alarmSoundIcon.setAttribute('data-lucide', 'volume-2');
      alarmSoundIcon.className = "w-4 h-4 text-heather-600";
    } else {
      toggleAlarmSoundBtn.title = "Audio Alarm Peringatan: Dibisukan (Klik untuk mengaktifkan)";
      alarmSoundIcon.setAttribute('data-lucide', 'volume-x');
      alarmSoundIcon.className = "w-4 h-4 text-rose-500";
    }
    if (window.lucide) lucide.createIcons();
  }

  // Real-time synchronization via storage event (bila tab lain menambahkan komentar)
  window.addEventListener('storage', (e) => {
    if (e.key === 'oase_community_comments') {
      const prevCount = parseInt(statHateSpeechCount.textContent || '0');
      renderHateSpeechAlerts();
      renderAllCommunityComments(commentSearchInput ? commentSearchInput.value : '');
      const newCount = parseInt(statHateSpeechCount.textContent || '0');
      if (newCount > prevCount) {
        playAlertPing();
        showToast('⚠️ Peringatan baru: Terdeteksi komentar berpotensi melanggar!');
      }
    } else if (e.key === 'oase_bug_reports') {
      renderBugReports();
    }
  });

  // ============================================================================
  // 11. TOAST HELPER & UTILITIES
  // ============================================================================
  let toastTimer = null;
  function showToast(msg) {
    if (!toastNotification || !toastMessage) return;
    toastMessage.textContent = msg;
    toastNotification.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
    toastNotification.classList.add('translate-y-0', 'opacity-100');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
      toastNotification.classList.remove('translate-y-0', 'opacity-100');
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getTimeAgo(dateString) {
    if (!dateString) return 'Baru saja';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'Baru saja';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  }

  // ============================================================================
  // 12. RUN AWAL & REAL-TIME EVENT SUBSCRIBERS
  // ============================================================================
  let isRealtimeSubscribed = false;

  async function initDashboard() {
    setupWarmGreeting();
    renderHateSpeechAlerts();
    renderAllCommunityComments();
    await renderBugReports();
    await renderSaraKeywords();
    renderAuthorizedModerators();
    renderAuditLogs();
    switchTab('hateSpeech');

    // Inisialisasi Real-time Sync untuk Laporan Bug & Kamus SARA
    if (!isRealtimeSubscribed) {
      isRealtimeSubscribed = true;

      // 1. Sinkronisasi Real-time Laporan Bug antar Moderator
      if (window.BugReportService && typeof window.BugReportService.initRealtime === 'function') {
        window.BugReportService.initRealtime();
        window.BugReportService.onUpdate((data) => {
          if (!data) return;
          renderBugReports();

          if (data.action === 'STATUS_CHANGED' && data.payload) {
            if (data.payload.newStatus === 'selesai') {
              showToast(`Laporan ${data.payload.report?.category || 'kendala'} telah diselesaikan oleh ${data.payload.resolvedBy || 'Moderator lain'}.`);
            }
          } else if (data.action === 'NEW_REPORT' && data.payload) {
            playAlertPing();
            showToast(`⚠️ Laporan bug baru masuk: ${data.payload.category}`);
          }
        });
      }

      // 2. Sinkronisasi Real-time Kamus Sensor SARA antar Seluruh Moderator
      if (window.SaraKeywordService && typeof window.SaraKeywordService.initRealtime === 'function') {
        window.SaraKeywordService.initRealtime();
        window.SaraKeywordService.onUpdate((data) => {
          if (!data) return;
          renderSaraKeywords();
          renderHateSpeechAlerts();

          if (data.action === 'ADD' && data.payload) {
            showToast(`Moderator ${data.payload.added_by || 'lain'} mendaftarkan kosakata sensor baru: "${data.payload.keyword}"`);
          } else if (data.action === 'DELETE') {
            showToast('Daftar kamus sensor SARA diperbarui.');
          }
        });
      }
    }

    // Cek apakah ada hate speech terdeteksi saat load untuk alarm
    const { flaggedList } = scanCommunityCommentsForHateSpeech();
    if (flaggedList.length > 0) {
      playAlertPing();
    }
  }

  // Cek otentikasi saat load
  await checkAuth();
});
