// ==============================================================================
// LAPOR BUG - OASE CERITA (FRONTEND SCRIPT)
// Pengiriman Laporan Kendala Siswa ke Seluruh Moderator & Integrasi WhatsApp
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // Inisialisasi Realtime Service Bug Report
  if (window.BugReportService && typeof window.BugReportService.initRealtime === 'function') {
    window.BugReportService.initRealtime();
  }

  // Pre-fill email/user jika sedang login
  const activeUserEmail = localStorage.getItem('oase_active_user_email');
  if (activeUserEmail) {
    const emailInput = document.getElementById('reporterEmailInput');
    if (emailInput && !emailInput.value) {
      emailInput.value = activeUserEmail;
    }
  }

  // Cek parameter URL (misalnya ?page=komunitas.html)
  const urlParams = new URLSearchParams(window.location.search);
  const fromPage = urlParams.get('from');
  if (fromPage) {
    const pageSelect = document.getElementById('bugPageUrlInput');
    if (pageSelect) {
      for (let i = 0; i < pageSelect.options.length; i++) {
        if (pageSelect.options[i].value.includes(fromPage)) {
          pageSelect.selectedIndex = i;
          break;
        }
      }
    }
  }

  const bugForm = document.getElementById('bugReportMainForm');
  const submitDirectBtn = document.getElementById('submitBugDirectBtn');
  const sendWhatsAppBtn = document.getElementById('sendViaWhatsAppBtn');
  const bugFormAlert = document.getElementById('bugFormAlert');
  const bugSuccessModal = document.getElementById('bugSuccessModal');
  const ticketResultId = document.getElementById('ticketResultId');
  const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');

  function showAlert(msg, isError = true) {
    bugFormAlert.classList.remove('hidden', 'bg-red-50', 'text-red-700', 'border-red-200', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
    bugFormAlert.classList.add('border');
    if (isError) {
      bugFormAlert.classList.add('bg-red-50', 'text-red-700', 'border-red-200');
    } else {
      bugFormAlert.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
    }
    bugFormAlert.textContent = msg;
  }

  // 1. PENGIRIMAN LANGSUNG KE SELURUH MODERATOR
  if (bugForm) {
    bugForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const reporterName = document.getElementById('reporterNameInput').value;
      const reporterEmail = document.getElementById('reporterEmailInput').value;
      const category = document.getElementById('bugCategoryInput').value;
      const device = document.getElementById('bugDeviceInput').value;
      const pageUrl = document.getElementById('bugPageUrlInput').value;
      const description = document.getElementById('bugDescriptionArea').value;

      if (!description.trim()) {
        showAlert('Mohon isi penjelasan kendala secara rinci.');
        return;
      }

      submitDirectBtn.disabled = true;
      const origText = submitDirectBtn.innerHTML;
      submitDirectBtn.innerHTML = `<span>Mengirim Laporan ke Moderator...</span>`;

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
          ticketResultId.textContent = res.report.ticket_id || ('BUG-' + Math.floor(1000 + Math.random() * 9000));
          bugSuccessModal.classList.remove('hidden');
          bugForm.reset();
        } else {
          throw new Error('Gagal menyimpan laporan.');
        }
      } catch (err) {
        console.error('Error submitting bug:', err);
        showAlert(err.message || 'Gagal mengirim laporan. Periksa koneksi internet Anda.');
      } finally {
        submitDirectBtn.disabled = false;
        submitDirectBtn.innerHTML = origText;
      }
    });
  }

  // 2. PENGIRIMAN VIA WHATSAPP (Sesuai Permintaan Pengguna)
  if (sendWhatsAppBtn) {
    sendWhatsAppBtn.addEventListener('click', async () => {
      const reporterName = document.getElementById('reporterNameInput').value.trim() || 'Siswa OASE';
      const category = document.getElementById('bugCategoryInput').value;
      const device = document.getElementById('bugDeviceInput').value;
      const pageUrl = document.getElementById('bugPageUrlInput').value;
      const description = document.getElementById('bugDescriptionArea').value.trim();

      if (!description) {
        showAlert('Mohon isi penjelasan kendala pada formulir terlebih dahulu sebelum membuka WhatsApp.');
        return;
      }

      // Catat juga ke sistem BugReportService agar masuk ke laman moderator
      if (window.BugReportService) {
        try {
          await window.BugReportService.submitReport({
            reporterName,
            reporterEmail: document.getElementById('reporterEmailInput').value.trim() || 'WhatsApp Reporter',
            category,
            device,
            pageUrl,
            description: `[Via WhatsApp] ${description}`
          });
        } catch(e) {}
      }

      const waNumber = '6282228176090';
      const message = `Halo Tim IT OASE Cerita, saya ingin melaporkan kendala/bug pada website:\n\n` +
        `*Pelapor:* ${reporterName}\n` +
        `*Kategori:* ${category}\n` +
        `*Perangkat:* ${device}\n` +
        `*Halaman:* ${pageUrl}\n` +
        `*Kendala:* ${description}`;

      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    });
  }

  // 3. TUTUP MODAL SUKSES
  if (closeSuccessModalBtn && bugSuccessModal) {
    closeSuccessModalBtn.addEventListener('click', () => {
      bugSuccessModal.classList.add('hidden');
    });
  }
});
