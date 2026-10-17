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
  const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');

  // Inisialisasi Realtime Service Bug Report jika tersedia
  if (window.BugReportService && typeof window.BugReportService.initRealtime === 'function') {
    window.BugReportService.initRealtime();
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
          if (ticketResultId) {
            ticketResultId.textContent = res.report.ticket_id || ('BUG-' + Math.floor(1000 + Math.random() * 9000));
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
          await window.BugReportService.submitReport({
            reporterName,
            reporterEmail: currentUser.email || 'WhatsApp Reporter',
            category,
            device,
            pageUrl,
            description: `[Via WhatsApp] ${description}`
          });
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

  // 4. TUTUP MODAL SUKSES
  if (closeSuccessModalBtn && bugSuccessModal) {
    closeSuccessModalBtn.addEventListener('click', () => {
      bugSuccessModal.classList.add('hidden');
    });
  }

  // Jalankan pemeriksaan login saat halaman dibuka
  await checkAuth();
});
