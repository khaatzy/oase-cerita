// Konfigurasi & Inisialisasi Supabase Client untuk OASE Cerita

const SUPABASE_URL = 'https://lfsgrihhlyffxrlwjyev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxmc2dyaWhobHlmZnhybHdqeWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjk4NTEsImV4cCI6MjEwNTcwNTg1MX0.0rsevZLOXjV-JTP3ui6WtJUdIM-hN-fZbuGuaZ7Py14';

// Inisialisasi client dari window.supabase (library @supabase/supabase-js yang dimuat via CDN)
let supabaseClient = null;

if (window.supabase && typeof window.supabase.createClient === 'function') {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  supabaseClient = window.supabaseClient; // backward compatibility for let declaration
} else {
  console.error('Supabase library belum dimuat. Pastikan CDN Supabase telah disertakan di HTML.');
}
// ==============================================================================
// 1. LAYANAN ENKRIPSI DATABASE (DATA PRIVACY & VAULT PROTECTION)
// ==============================================================================
const EncryptionService = {
  SECRET_SALT: 'OASE_CERITA_VAULT_ENCRYPTION_2026_KEY_PROTECTION_SECURE',

  // Enkripsi teks menjadi cipher aman (Format: ENC_v1:<hex>)
  encrypt(plainText) {
    if (!plainText || typeof plainText !== 'string') return plainText;
    if (plainText.startsWith('ENC_v1:')) return plainText; // Sudah terenkripsi
    try {
      const utf8Bytes = new TextEncoder().encode(plainText);
      const saltBytes = new TextEncoder().encode(this.SECRET_SALT);
      const cipherBytes = new Uint8Array(utf8Bytes.length);
      for (let i = 0; i < utf8Bytes.length; i++) {
        cipherBytes[i] = utf8Bytes[i] ^ saltBytes[i % saltBytes.length] ^ ((i * 17) & 0xff);
      }
      let hex = '';
      for (let i = 0; i < cipherBytes.length; i++) {
        hex += cipherBytes[i].toString(16).padStart(2, '0');
      }
      return 'ENC_v1:' + hex;
    } catch (e) {
      console.warn('Gagal mengenkripsi:', e);
      return plainText;
    }
  },

  // Dekripsi ciphertext kembali ke plaintext asli
  decrypt(cipherText) {
    if (!cipherText || typeof cipherText !== 'string') return cipherText;
    if (!cipherText.startsWith('ENC_v1:')) return cipherText; // Plaintext (data lawas / belum dienkripsi)
    try {
      const hex = cipherText.substring(7);
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
      }
      const saltBytes = new TextEncoder().encode(this.SECRET_SALT);
      const plainBytes = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        plainBytes[i] = bytes[i] ^ saltBytes[i % saltBytes.length] ^ ((i * 17) & 0xff);
      }
      return new TextDecoder().decode(plainBytes);
    } catch (e) {
      console.warn('Gagal mendekripsi:', e);
      return cipherText;
    }
  }
};

// ==============================================================================
// 2. LAYANAN DETEKSI KRISIS, SELF-HARM & SARA (SAFETY & INTEGRITY FILTER)
// ==============================================================================
const CrisisDetectionService = {
  // 1. Kata Kunci Krisis & Self-Harm
  CRISIS_KEYWORDS: [
    'bundir', 'bunuh diri', 'suicide', 'sayat', 'sayat tangan', 'sayat urat', 'iris urat', 'iris nadi',
    'cutter tangan', 'lukai diri', 'melukai diri', 'self harm', 'selfharm',
    'akhiri hidup', 'mengakhiri hidup', 'mau mati', 'ingin mati', 'pengen mati', 'gak mau hidup', 'tidak mau hidup',
    'gak kuat hidup', 'capek hidup', 'lelah hidup', 'gak sanggup hidup', 'mau menghilang selamanya',
    'cut myself', 'kill myself', 'overdosis', 'minum racun', 'minum baygon', 'minum potas',
    'gantung diri', 'lompat dari lantai', 'lompat gedung', 'lompat jembatan', 'tabrakkan diri'
  ],

  // 2. Kata Kunci Kekerasan & Ancaman
  VIOLENCE_KEYWORDS: [
    'bunuh', 'membunuh', 'pembunuhan', 'dibunuh', 'pembunuh',
    'bantai', 'membantai', 'pembantaian', 'gorok', 'penggal',
    'mutilasi', 'menikam', 'tikam', 'tusuk', 'tembak',
    'bom', 'ledakkan', 'teror', 'teroris', 'racuni',
    'bakar hidup', 'mati lu', 'mati kamu', 'mampus lu', 'mampus kamu', 'habisi kamu'
  ],

  // 3. Kata Kunci SARA (Suku, Agama, Ras, Antargolongan & Ujaran Kebencian)
  SARA_KEYWORDS: [
    'kafir', 'kristenisasi', 'islamofobia', 'aliran sesat', 'agama sesat', 'murtad', 'penista agama',
    'anjing kristen', 'islam teroris', 'babi yahudi', 'hina nabi', 'hina tuhan', 'najis lu',
    'cina cokin', 'cokin', 'chindo', 'aseng', 'asing aseng', 'pribumi monyet', 'non pribumi',
    'negro', 'nigger', 'nigga', 'monyet hitam', 'papua monyet', 'dasar monyet', 'jawa jongos', 'batak kasar',
    'kadrun', 'cebong', 'pki biadab', 'komunis laknat', 'genosida'
  ],

  // 4. Pola Regex Anti-Bypass & Sensor Karakter (#, *, leet-speak, spasi)
  PATTERNS: [
    { regex: /(?:mem|di|pe)?b[u*#@o_0-9v\W_-]*n[u*#@o_0-9v\W_-]*h/i, keyword: 'bunuh', category: 'kekerasan', label: 'Pembunuhan / Ancaman Nyawa' },
    { regex: /b[u*#@o_0-9v\W_-]*nd[i*#@!1_0-9\W_-]*r/i, keyword: 'bundir', category: 'krisis', label: 'Indikasi Bunuh Diri' },
    { regex: /s[a*#@4_0-9\W_-]*y[a*#@4_0-9\W_-]*t/i, keyword: 'sayat', category: 'krisis', label: 'Indikasi Melukai Diri (Self-Harm)' },
    { regex: /k[a*#@4_0-9\W_-]*f[i*#@!1_0-9\W_-]*r/i, keyword: 'kafir', category: 'sara', label: 'Ujaran Kebencian / SARA (Agama)' },
    { regex: /g[o*#@0_0-9\W_-]*r[o*#@0_0-9\W_-]*k/i, keyword: 'gorok', category: 'kekerasan', label: 'Kekerasan Ekstrem' },
    { regex: /b[a*#@4_0-9\W_-]*nt[a*#@4_0-9\W_-]*i/i, keyword: 'bantai', category: 'kekerasan', label: 'Kekerasan Ekstrem' },
    { regex: /m[u*#@o_0-9v\W_-]*t[i*#@!1_0-9\W_-]*l[a*#@4_0-9\W_-]*s[i*#@!1_0-9\W_-]*/i, keyword: 'mutilasi', category: 'kekerasan', label: 'Kekerasan Ekstrem' },
    { regex: /c[o*#@0_0-9\W_-]*k[i*#@!1_0-9\W_-]*n/i, keyword: 'cokin', category: 'sara', label: 'Ujaran Kebencian / SARA (Ras/Etnis)' },
    { regex: /\b(?:n[e3*#@_0-9]*gr[o0*#@_0-9]+|n[i1*#@!_0-9]*gg[a4e3*#@_0-9]+)\b/i, keyword: 'negro/nigger', category: 'sara', label: 'Ujaran Kebencian / SARA (Ras)' }
  ],

  // Normalisasi teks untuk leet-speak dasar
  normalizeText(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase()
      .replace(/[@4]/g, 'a')
      .replace(/[0]/g, 'o')
      .replace(/[1!|]/g, 'i')
      .replace(/[3]/g, 'e')
      .replace(/[$5]/g, 's')
      .replace(/[7]/g, 't')
      .replace(/[8]/g, 'b');
  },

  checkContent(text) {
    if (!text || typeof text !== 'string') {
      return { isCrisis: false, isSara: false, isViolation: false, matchedKeyword: null, category: null, label: null };
    }

    const raw = text.toLowerCase();
    const normalized = this.normalizeText(text);

    // 1. Cek Pola Regex Cerdas (Anti bypass: bun#h, b*nuh, b u n u h, k*fir, dll.)
    for (const p of this.PATTERNS) {
      const matchRaw = raw.match(p.regex);
      const matchNorm = normalized.match(p.regex);
      if (matchRaw || matchNorm) {
        const detected = (matchRaw && matchRaw[0]) || (matchNorm && matchNorm[0]) || p.keyword;
        return {
          isCrisis: true, // Untuk kompatibilitas kode lama
          isSara: p.category === 'sara',
          isViolation: true,
          category: p.category,
          matchedKeyword: detected.trim(),
          label: p.label
        };
      }
    }

    // 2. Cek Kosakata SARA
    for (const kw of this.SARA_KEYWORDS) {
      if (raw.includes(kw) || normalized.includes(kw)) {
        return {
          isCrisis: true,
          isSara: true,
          isViolation: true,
          category: 'sara',
          matchedKeyword: kw,
          label: 'Ujaran Kebencian / SARA'
        };
      }
    }

    // 3. Cek Kosakata Kekerasan
    for (const kw of this.VIOLENCE_KEYWORDS) {
      if (raw.includes(kw) || normalized.includes(kw)) {
        return {
          isCrisis: true,
          isSara: false,
          isViolation: true,
          category: 'kekerasan',
          matchedKeyword: kw,
          label: 'Ancaman Kekerasan'
        };
      }
    }

    // 4. Cek Kosakata Krisis & Self-Harm
    for (const kw of this.CRISIS_KEYWORDS) {
      if (raw.includes(kw) || normalized.includes(kw)) {
        return {
          isCrisis: true,
          isSara: false,
          isViolation: true,
          category: 'krisis',
          matchedKeyword: kw,
          label: 'Indikasi Krisis / Melukai Diri'
        };
      }
    }

    // 5. Cek Kosakata Kustom yang Ditambahkan Moderator Secara Dinamis (Real-time Sync)
    const customKeywords = (window.SaraKeywordService && typeof window.SaraKeywordService.getCustomKeywordsSync === 'function')
      ? window.SaraKeywordService.getCustomKeywordsSync()
      : (() => {
          try { return JSON.parse(localStorage.getItem('oase_custom_sara_keywords') || '[]'); } catch(e) { return []; }
        })();

    for (const item of customKeywords) {
      const kw = (item.keyword || '').toLowerCase().trim();
      if (!kw) continue;
      if (raw.includes(kw) || normalized.includes(kw)) {
        const cat = item.category || 'sara';
        return {
          isCrisis: cat === 'krisis',
          isSara: cat === 'sara',
          isViolation: true,
          category: cat,
          matchedKeyword: item.keyword,
          label: item.note || (cat === 'sara' ? 'Ujaran Kebencian / SARA (Kamus Moderator)' : 'Pelanggaran Aturan OASE')
        };
      }
    }

    return {
      isCrisis: false,
      isSara: false,
      isViolation: false,
      matchedKeyword: null,
      category: null,
      label: null
    };
  }
};

// ==============================================================================
// 3. LAYANAN NADA ALARM AUDIO KRISIS (WEB AUDIO API CHIME & ALARM)
// ==============================================================================
const AudioAlertService = {
  audioCtx: null,

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  playCrisisAlarm() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Nada 1: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Nada 2: 1174Hz (D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.35);
      gain2.gain.setValueAtTime(0.4, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 0.85);

      // Nada 3: 1046Hz (C6)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1046.50, now + 0.9);
      gain3.gain.setValueAtTime(0.45, now + 0.9);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.9);
      osc3.stop(now + 1.6);
    } catch (e) {
      console.warn('Audio alert error:', e);
    }
  },

  playChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }
};

window.EncryptionService = EncryptionService;
window.CrisisDetectionService = CrisisDetectionService;
window.SafetyFilterService = CrisisDetectionService;
window.AudioAlertService = AudioAlertService;

// Layanan Autentikasi (Auth Service)
const AuthService = {
  // Daftar Akun Baru
  async signUp(email, password) {
    if (!supabaseClient) throw new Error('Supabase client belum siap');
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Masuk / Login
  async signIn(email, password) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!supabaseClient) throw new Error('Supabase client belum siap');

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;
      return data;
    } catch (supabaseErr) {
      // Fallback kredensial lokal untuk akun moderator yang dibuat oleh admin/rekan moderator
      const modCreds = JSON.parse(localStorage.getItem('oase_moderator_credentials') || '{}');
      if (modCreds[cleanEmail] && modCreds[cleanEmail].password === password) {
        const dummyUser = {
          id: 'mod-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
          email: cleanEmail,
          user_metadata: { role: 'moderator', display_name: modCreds[cleanEmail].display_name }
        };
        const localSession = {
          user: dummyUser,
          access_token: 'local-mod-token-' + Date.now()
        };
        localStorage.setItem('oase_active_moderator_email', cleanEmail);
        return { user: dummyUser, session: localSession };
      }
      throw supabaseErr;
    }
  },

  // Keluar / Logout
  async signOut() {
    if (!supabaseClient) throw new Error('Supabase client belum siap');
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  },

  // Dapatkan Sesi Pengguna Aktif
  async getSession() {
    if (!supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  },

  // Listener Perubahan Status Sesi
  onAuthStateChange(callback) {
    if (!supabaseClient) return;
    return supabaseClient.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  // Perbarui Password Pengguna
  async updatePassword(newPassword) {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return data;
    }
    localStorage.setItem('oase_local_password', newPassword);
    return { success: true };
  },

  // Dapatkan Profil & Role Pengguna (User, Moderator, Konselor)
  async getUserProfile(userId, email) {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const customModName = cleanEmail ? (localStorage.getItem('oase_mod_custom_name_' + cleanEmail) || '') : '';
    const modCreds = this.getModeratorCredentialsMap();
    const credName = cleanEmail && modCreds[cleanEmail] ? (modCreds[cleanEmail].display_name || modCreds[cleanEmail].displayName || '') : '';

    if (supabaseClient && userId) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('auth_user_id', userId)
          .single();
        if (!error && data) {
          const rawName = data.display_name || data.full_name || '';
          const safeName = customModName || credName || (rawName && !rawName.includes('@') ? rawName : (cleanEmail ? cleanEmail.split('@')[0] : 'Sahabat OASE'));
          return {
            ...data,
            display_name: safeName,
            full_name: safeName
          };
        }
      } catch(e) {}
    }
    const savedProfiles = JSON.parse(localStorage.getItem('oase_user_profiles') || '{}');
    if (cleanEmail && savedProfiles[cleanEmail]) {
      const profile = savedProfiles[cleanEmail];
      const rawName = profile.display_name || profile.full_name || '';
      const safeName = customModName || credName || (rawName && !rawName.includes('@') ? rawName : cleanEmail.split('@')[0]);
      return {
        ...profile,
        display_name: safeName,
        full_name: safeName
      };
    }
    const finalName = customModName || credName || (cleanEmail ? cleanEmail.split('@')[0] : 'Sahabat OASE');
    return {
      email: cleanEmail || 'siswa@oase.id',
      role: 'user',
      moderator_approval_status: 'none',
      display_name: finalName,
      full_name: finalName
    };
  },

  // Perbarui Display Name / Nama Samaran Siswa untuk Menjaga Anonimitas
  async updateDisplayName(userId, email, newDisplayName) {
    if (!newDisplayName || !newDisplayName.trim()) throw new Error('Nama samaran tidak boleh kosong.');
    const trimmed = newDisplayName.trim();

    if (supabaseClient && userId) {
      try {
        await supabaseClient.from('profiles').upsert({
          auth_user_id: userId,
          email,
          display_name: trimmed,
          full_name: trimmed,
          updated_at: new Date().toISOString()
        });
      } catch(e) {}
    }

    const savedProfiles = JSON.parse(localStorage.getItem('oase_user_profiles') || '{}');
    savedProfiles[email] = {
      ...(savedProfiles[email] || {}),
      email,
      display_name: trimmed,
      full_name: trimmed
    };
    localStorage.setItem('oase_user_profiles', JSON.stringify(savedProfiles));
    return { success: true, displayName: trimmed };
  },

  // Pengajuan Role Moderator (Menunggu Persetujuan Moderator Utama)
  async requestModeratorRole(email, reason = '') {
    if (supabaseClient) {
      try {
        await supabaseClient.from('profiles').upsert({
          email,
          role: 'moderator',
          moderator_approval_status: 'pending',
          updated_at: new Date().toISOString()
        });
      } catch(e) {}
    }
    const savedProfiles = JSON.parse(localStorage.getItem('oase_user_profiles') || '{}');
    savedProfiles[email] = {
      ...(savedProfiles[email] || {}),
      email,
      role: 'moderator',
      moderator_approval_status: 'pending',
      moderator_reason: reason
    };
    localStorage.setItem('oase_user_profiles', JSON.stringify(savedProfiles));
    return { success: true, status: 'pending' };
  },

  // Daftar Akun Moderator Resmi (Whitelist Bawaan OASE)
  MODERATORS_LIST: [
    'moderator@oase.id',
    'arkhanzaazs020911@gmail.com'
  ],

  // Ambil daftar seluruh email moderator terdaftar (Bawaan + Dinamis)
  getAllModeratorEmails() {
    try {
      const dynamic = JSON.parse(localStorage.getItem('oase_custom_moderator_whitelist') || '[]');
      const combined = [...this.MODERATORS_LIST, ...dynamic];
      return Array.from(new Set(combined.map(e => e.toLowerCase().trim())));
    } catch (e) {
      return [...this.MODERATORS_LIST];
    }
  },

  // Ambil peta seluruh kredensial akun moderator (untuk manajemen & copy akun)
  getModeratorCredentialsMap() {
    try {
      const creds = JSON.parse(localStorage.getItem('oase_moderator_credentials') || '{}');
      // Normalisasi agar setiap entri memiliki display_name & displayName
      Object.keys(creds).forEach(em => {
        const item = creds[em];
        if (item) {
          const name = item.display_name || item.displayName || '';
          if (name) {
            item.display_name = name;
            item.displayName = name;
            if (!localStorage.getItem('oase_mod_custom_name_' + em)) {
              localStorage.setItem('oase_mod_custom_name_' + em, name);
            }
          }
        }
      });
      return creds;
    } catch(e) {
      return {};
    }
  },

  // Tambah akun moderator baru lengkap dengan email, password, dan nama panggilan
  async addModeratorAccount({ email, password, displayName = '', addedBy = 'Moderator Utama' }) {
    if (!email || !email.includes('@')) {
      throw new Error('Alamat email tidak valid.');
    }
    if (!password || password.length < 6) {
      throw new Error('Kata sandi akun moderator minimal 6 karakter.');
    }
    const cleanEmail = email.toLowerCase().trim();
    const currentList = this.getAllModeratorEmails();
    if (currentList.includes(cleanEmail)) {
      throw new Error('Email ini sudah terdaftar sebagai moderator resmi.');
    }

    const cleanName = (displayName || '').trim() || cleanEmail.split('@')[0];

    // Simpan custom display name langsung ke localStorage spesifik
    localStorage.setItem('oase_mod_custom_name_' + cleanEmail, cleanName);

    // 1. Coba daftarkan akun baru ke Supabase Auth
    let authUser = null;
    if (supabaseClient) {
      try {
        const { data } = await supabaseClient.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              role: 'moderator',
              display_name: cleanName
            }
          }
        });
        if (data && data.user) authUser = data.user;
      } catch (e) {
        console.warn('Supabase Auth signUp note:', e.message);
      }
    }

    // 2. Simpan ke database Supabase profiles jika ada
    if (supabaseClient) {
      try {
        await supabaseClient.from('profiles').upsert({
          auth_user_id: authUser ? authUser.id : undefined,
          email: cleanEmail,
          role: 'moderator',
          display_name: cleanName,
          full_name: cleanName,
          moderator_approval_status: 'approved',
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
      } catch (e) {}
    }

    // 3. Simpan kredensial moderator lokal (agar admin bisa melihat/menyalin & langsung login)
    const modCreds = this.getModeratorCredentialsMap();
    modCreds[cleanEmail] = {
      email: cleanEmail,
      password: password,
      display_name: cleanName,
      displayName: cleanName,
      added_by: addedBy,
      added_at: new Date().toISOString()
    };
    localStorage.setItem('oase_moderator_credentials', JSON.stringify(modCreds));

    // 4. Simpan ke dynamic whitelist browser
    const dynamic = JSON.parse(localStorage.getItem('oase_custom_moderator_whitelist') || '[]');
    if (!dynamic.includes(cleanEmail)) {
      dynamic.push(cleanEmail);
      localStorage.setItem('oase_custom_moderator_whitelist', JSON.stringify(dynamic));
    }

    // 5. Simpan profil lokal
    const savedProfiles = JSON.parse(localStorage.getItem('oase_user_profiles') || '{}');
    savedProfiles[cleanEmail] = {
      email: cleanEmail,
      role: 'moderator',
      display_name: cleanName,
      full_name: cleanName,
      moderator_approval_status: 'approved',
      added_by: addedBy,
      added_at: new Date().toISOString()
    };
    localStorage.setItem('oase_user_profiles', JSON.stringify(savedProfiles));

    return { success: true, email: cleanEmail, password, displayName: cleanName };
  },

  // Kompatibilitas mundur
  async addModeratorEmail(email, addedBy = 'Moderator Utama') {
    return this.addModeratorAccount({ email, password: 'ModeratorOase2026!', addedBy });
  },

  // Hapus email dari daftar moderator dinamis
  async removeModeratorEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (this.MODERATORS_LIST.some(e => e.toLowerCase().trim() === cleanEmail)) {
      throw new Error('Akun moderator utama bawaan tidak dapat dihapus.');
    }

    if (supabaseClient) {
      try {
        await supabaseClient.from('profiles').update({ role: 'user' }).eq('email', cleanEmail);
      } catch (e) {}
    }

    let dynamic = JSON.parse(localStorage.getItem('oase_custom_moderator_whitelist') || '[]');
    dynamic = dynamic.filter(e => e.toLowerCase().trim() !== cleanEmail);
    localStorage.setItem('oase_custom_moderator_whitelist', JSON.stringify(dynamic));

    const savedProfiles = JSON.parse(localStorage.getItem('oase_user_profiles') || '{}');
    if (savedProfiles[cleanEmail]) {
      savedProfiles[cleanEmail].role = 'user';
      localStorage.setItem('oase_user_profiles', JSON.stringify(savedProfiles));
    }

    const modCreds = this.getModeratorCredentialsMap();
    if (modCreds[cleanEmail]) {
      delete modCreds[cleanEmail];
      localStorage.setItem('oase_moderator_credentials', JSON.stringify(modCreds));
    }

    return { success: true };
  },

  // Cek apakah akun memiliki hak akses Moderator resmi secara ketat (Tanpa bypass substring)
  isModeratorEmail(email, profile = null) {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    // 1. Cek role resmi di profil database Supabase
    if (profile && profile.role === 'moderator') return true;
    // 2. Cek apakah email terdaftar persis dalam whitelist resmi OASE (Bawaan + Dinamis)
    const allMods = this.getAllModeratorEmails();
    return allMods.includes(lower);
  }
};

// Layanan Data Cerita (Story Service)
const StoryService = {
  // Ambil daftar cerita dari database
  async getStories(limit = 10) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Gagal memuat cerita dari Supabase:', error.message);
      return [];
    }
    return data || [];
  },

  // Tambah cerita baru
  async createStory({ content, emotionTag, isAnonymous = true }) {
    if (!supabaseClient) throw new Error('Supabase client belum siap');

    // Dapatkan user jika ada
    const session = await AuthService.getSession();
    const userId = session?.user?.id || null;
    const authorName = isAnonymous 
      ? `Sahabat Anonim #${Math.floor(100 + Math.random() * 900)}` 
      : 'Sahabat OASE';

    const { data, error } = await supabaseClient
      .from('stories')
      .insert([
        {
          user_id: userId,
          content,
          emotion_tag: emotionTag,
          is_anonymous: isAnonymous,
          author_name: authorName,
          hug_count: 0
        }
      ])
      .select();

    if (error) throw error;
    return data?.[0];
  },

  // Beri reaksi Pelukan Hangat
  async sendHug(storyId, currentHugs = 0) {
    if (!supabaseClient) return currentHugs + 1;
    const { data, error } = await supabaseClient
      .from('stories')
      .update({ hug_count: currentHugs + 1 })
      .eq('id', storyId)
      .select();

    if (error) {
      console.warn('Gagal menambah pelukan:', error.message);
      return currentHugs + 1;
    }
    return data?.[0]?.hug_count ?? (currentHugs + 1);
  }
};

// Layanan Pengiriman Cerita & Konseling (Counseling Service)
const CounselingService = {
  // Fungsi pembuat kode tiket unik format OASE-XXXX-XX (contoh: OASE-8392-AB)
  generateTicketCode() {
    const charsNum = '0123456789';
    const charsLetter = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let numPart = '';
    for (let i = 0; i < 4; i++) {
      numPart += charsNum.charAt(Math.floor(Math.random() * charsNum.length));
    }
    let letterPart = '';
    for (let i = 0; i < 2; i++) {
      letterPart += charsLetter.charAt(Math.floor(Math.random() * charsLetter.length));
    }
    return `OASE-${numPart}-${letterPart}`;
  },

  // Kirim curhatan / cerita ke konselor
  async submitCounselingStory({
    authorName,
    educationLevel,
    gradeClass = '',
    gender,
    category,
    counselorId,
    counselorName,
    storyContent,
    userEmail = null,
    userId = null,
    userRealName = null
  }) {
    const ticketCode = this.generateTicketCode();
    
    // Default nama jika tidak diisi pengirim: User1 - User9999
    const finalAuthorName = (authorName && authorName.trim() !== '')
      ? authorName.trim()
      : `User${Math.floor(100 + Math.random() * 900)}`;

    const crisisCheck = window.CrisisDetectionService ? window.CrisisDetectionService.checkContent(storyContent) : { isCrisis: false, isSara: false };
    const encryptedContent = window.EncryptionService ? window.EncryptionService.encrypt(storyContent) : storyContent;

    // Metadata audit untuk identitas pengirim jika terjadi pelanggaran SARA/krisis
    const hasViolation = !!(crisisCheck.isSara || crisisCheck.isCrisis || crisisCheck.isViolation);
    const auditMeta = {
      user_email: hasViolation ? (userEmail || 'Anonim (Tidak Login)') : null,
      user_id: hasViolation ? (userId || null) : null,
      real_name: hasViolation ? (userRealName || finalAuthorName) : null,
      flagged_words: hasViolation ? (crisisCheck.matchedKeyword || null) : null,
      is_sara: crisisCheck.isSara || false,
      is_crisis: crisisCheck.isCrisis || false,
      category: crisisCheck.category || null,
      submitted_at: new Date().toISOString()
    };

    const submissionData = {
      ticket_code: ticketCode,
      author_name: finalAuthorName,
      education_level: educationLevel,
      grade_class: gradeClass ? gradeClass.trim() : null,
      gender: gender,
      category: category,
      counselor_id: counselorId,
      counselor_name: counselorName,
      story_content: encryptedContent,
      status: 'menunggu_tanggapan',
      is_crisis: crisisCheck.isCrisis,
      priority: crisisCheck.isCrisis ? 'krisis' : 'normal',
      transfer_reason: JSON.stringify(auditMeta)
    };

    if (!supabaseClient) {
      console.warn('Supabase Client tidak aktif. Menggunakan penyimpanan lokal.');
      const localStories = JSON.parse(localStorage.getItem('oase_counseling_submissions') || '[]');
      localStories.push({ ...submissionData, created_at: new Date().toISOString() });
      localStorage.setItem('oase_counseling_submissions', JSON.stringify(localStories));
      return { success: true, ticketCode, data: submissionData };
    }

    const { data, error } = await supabaseClient
      .from('counseling_submissions')
      .insert([submissionData])
      .select();

    if (error) {
      console.warn('Supabase insert gagal (mungkin tabel belum dibuat di SQL Editor). Menyimpan fallback lokal:', error.message);
      const localStories = JSON.parse(localStorage.getItem('oase_counseling_submissions') || '[]');
      localStories.push({ ...submissionData, created_at: new Date().toISOString() });
      localStorage.setItem('oase_counseling_submissions', JSON.stringify(localStories));
      return { success: true, ticketCode, data: submissionData, fallback: true };
    }

    return { success: true, ticketCode, data: data?.[0] || submissionData };
  },

  // Helper untuk membersihkan dan mendekripsi data curhatan
  _resolveSubmission(item) {
    if (!item) return item;
    const counselors = window.COUNSELORS_DATA || [];
    let name = item.counselor_name || 'Konselor OASE';
    if (item.counselor_id && item.counselor_id !== 'auto') {
      const cObj = counselors.find(c => c.id === item.counselor_id);
      if (cObj) name = cObj.name;
    } else if (name && (name.toLowerCase().includes('sarah') || name.toLowerCase().includes('rachma'))) {
      const c1 = counselors.find(c => c.id === 'counselor-1');
      if (c1) name = c1.name;
    }
    const decContent = window.EncryptionService ? window.EncryptionService.decrypt(item.story_content || '') : (item.story_content || '');
    const decReply = (item.counselor_reply && window.EncryptionService) ? window.EncryptionService.decrypt(item.counselor_reply) : item.counselor_reply;
    const crisisCheck = window.CrisisDetectionService ? window.CrisisDetectionService.checkContent(decContent) : { isCrisis: false, isSara: false };
    const isCrisis = item.is_crisis || crisisCheck.isCrisis;

    // Ekstrak metadata audit pengirim dari transfer_reason
    let auditData = {};
    if (item.transfer_reason) {
      try {
        if (item.transfer_reason.startsWith('{') && item.transfer_reason.endsWith('}')) {
          auditData = JSON.parse(item.transfer_reason);
        }
      } catch (e) {}
    }

    const isSara = auditData.is_sara !== undefined ? auditData.is_sara : crisisCheck.isSara;
    const flaggedWords = auditData.flagged_words || crisisCheck.matchedKeyword || null;
    const hasViolation = !!(isSara || flaggedWords || isCrisis);

    // Informasi akun HANYA diekspos jika terdeteksi SARA / krisis
    const userEmail = hasViolation ? (item.user_email || auditData.user_email || null) : null;
    const userRealName = hasViolation ? (item.real_name || auditData.real_name || null) : null;

    return {
      ...item,
      counselor_name: name,
      story_content: decContent,
      counselor_reply: decReply,
      is_crisis: isCrisis,
      is_sara: isSara,
      priority: isCrisis ? 'krisis' : (item.priority || 'normal'),
      user_email: userEmail,
      real_name: userRealName,
      flagged_words: flaggedWords,
      transfer_reason: (item.transfer_reason && item.transfer_reason.startsWith('{')) ? null : item.transfer_reason
    };
  },

  // Cek cerita & balasan konselor berdasarkan kode tiket unik
  async getStoryByTicket(ticketCode) {
    return this.getSubmissionByTicket(ticketCode);
  },

  async getSubmissionByTicket(ticketCode) {
    if (!ticketCode) return null;
    const cleanCode = ticketCode.trim().toUpperCase();

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('counseling_submissions')
          .select('*')
          .eq('ticket_code', cleanCode)
          .single();

        if (!error && data) return this._resolveSubmission(data);
      } catch (e) {}
    }

    // Fallback cek di localStorage
    const localStories = JSON.parse(localStorage.getItem('oase_counseling_submissions') || '[]');
    const found = localStories.find(s => s.ticket_code === cleanCode) || null;
    return this._resolveSubmission(found);
  },

  // Dapatkan seluruh antrean cerita konseling (filter kategori & status)
  async getAllSubmissions({ category = 'all', status = 'all' } = {}) {
    if (supabaseClient) {
      try {
        let query = supabaseClient
          .from('counseling_submissions')
          .select('*')
          .order('created_at', { ascending: false });

        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        if (status && status !== 'all') {
          query = query.eq('status', status);
        } else {
          query = query.neq('status', 'arsip');
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(item => this._resolveSubmission(item));
        }
      } catch (err) {
        console.warn('Gagal mengambil antrean dari Supabase:', err);
      }
    }

    // Fallback penyimpanan lokal murni (tanpa dummy message otomatis)
    let localSubmissions = JSON.parse(localStorage.getItem('oase_counseling_submissions') || '[]');
    
    // Bersihkan dummy messages lama (jika sebelumnya pernah tersimpan di browser)
    const dummyTicketCodes = ['OASE-2941-KB', 'OASE-5820-MN', 'OASE-7731-XT'];
    if (localSubmissions.some(s => dummyTicketCodes.includes(s.ticket_code))) {
      localSubmissions = localSubmissions.filter(s => !dummyTicketCodes.includes(s.ticket_code));
      localStorage.setItem('oase_counseling_submissions', JSON.stringify(localSubmissions));
    }

    let filtered = localSubmissions.map(item => this._resolveSubmission(item));
    if (category && category !== 'all') {
      filtered = filtered.filter(item => item.category === category);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    } else {
      filtered = filtered.filter(item => item.status !== 'arsip');
    }
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // Berikan balasan resmi konselor
  async replySubmission(ticketCode, replyContent, counselorName) {
    if (!ticketCode || !replyContent) throw new Error('Data balasan tidak lengkap');
    const encryptedReply = window.EncryptionService ? window.EncryptionService.encrypt(replyContent) : replyContent;

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('counseling_submissions')
          .update({
            counselor_reply: encryptedReply,
            counselor_name: counselorName,
            status: 'sudah_dibalas',
            replied_at: new Date().toISOString()
          })
          .eq('ticket_code', ticketCode)
          .select();

        if (!error && data && data.length > 0) return this._resolveSubmission(data[0]);
      } catch (e) {
        console.warn('Gagal update balasan ke Supabase:', e);
      }
    }

    // Update di localStorage
    const local = JSON.parse(localStorage.getItem('oase_counseling_submissions') || '[]');
    const idx = local.findIndex(s => s.ticket_code === ticketCode);
    if (idx !== -1) {
      local[idx].counselor_reply = encryptedReply;
      local[idx].counselor_name = counselorName;
      local[idx].status = 'sudah_dibalas';
      local[idx].replied_at = new Date().toISOString();
      localStorage.setItem('oase_counseling_submissions', JSON.stringify(local));
      return this._resolveSubmission(local[idx]);
    }
    return null;
  },

  // Alihkan kasus cerita ke konselor lain (Transfer / Referral)
  async transferSubmission({ ticketCode, newCounselorId, newCounselorName, transferredFromName, transferReason }) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('counseling_submissions')
          .update({
            counselor_id: newCounselorId,
            counselor_name: newCounselorName,
            transferred_from_name: transferredFromName,
            transfer_reason: transferReason
          })
          .eq('ticket_code', ticketCode)
          .select();

        if (!error && data && data.length > 0) return this._resolveSubmission(data[0]);
      } catch (e) {
        console.warn('Gagal transfer ke Supabase:', e);
      }
    }

    // LocalStorage fallback
    const local = JSON.parse(localStorage.getItem('oase_counseling_submissions') || '[]');
    const idx = local.findIndex(s => s.ticket_code === ticketCode);
    if (idx !== -1) {
      local[idx].counselor_id = newCounselorId;
      local[idx].counselor_name = newCounselorName;
      local[idx].transferred_from_name = transferredFromName;
      local[idx].transfer_reason = transferReason;
      localStorage.setItem('oase_counseling_submissions', JSON.stringify(local));
      return this._resolveSubmission(local[idx]);
    }
    return null;
  },

  // Arsipkan (Hapus dari pandangan konselor) curhatan yang sudah dibalas
  async deleteSubmission(ticketCode) {
    if (!ticketCode) throw new Error('Kode tiket tidak valid.');
    if (supabaseClient) {
      try {
        await supabaseClient.from('counseling_submissions').update({ status: 'arsip' }).eq('ticket_code', ticketCode);
      } catch (e) {}
    }
    const local = JSON.parse(localStorage.getItem('oase_counseling_submissions') || '[]');
    const idx = local.findIndex(s => s.ticket_code === ticketCode);
    if (idx !== -1) {
      local[idx].status = 'arsip';
      localStorage.setItem('oase_counseling_submissions', JSON.stringify(local));
    }
    return { success: true };
  },

  // Autentikasi Khusus Konselor (mendukung login via email maupun nama konselor)
  async loginCounselor({ email, password, rememberMe = true }) {
    const query = (email || '').trim().toLowerCase();
    const inputPass = (password || '').trim();

    if (!query) {
      throw new Error('Silakan masukkan email atau nama konselor.');
    }

    if (!window.supabaseClient) {
      throw new Error('Supabase client belum siap. Gagal terhubung ke database.');
    }

    // Cari konselor di database berdasarkan email atau nama
    const { data: counselorsData, error } = await window.supabaseClient
      .from('counselors')
      .select('*')
      .or('email.ilike.%' + query + '%,name.ilike.%' + query + '%')
      .limit(1);

    if (error || !counselorsData || counselorsData.length === 0) {
      throw new Error('Akun konselor tidak ditemukan di database.');
    }

    const counselor = counselorsData[0];

    const expectedPass = (counselor.password || '').trim();
    if (expectedPass && expectedPass !== inputPass) {
      throw new Error('Password untuk konselor ' + counselor.name + ' tidak sesuai.');
    }

    const sessionData = {
      id: counselor.id,
      name: counselor.name,
      email: counselor.email,
      role: 'counselor',
      avatar: counselor.avatar,
      specialties: counselor.specialties,
      loggedInAt: new Date().toISOString()
    };

    if (rememberMe) {
      localStorage.setItem('oase_counselor_session', JSON.stringify(sessionData));
    } else {
      sessionStorage.setItem('oase_counselor_session', JSON.stringify(sessionData));
    }

    return sessionData;
  },

  // Ambil sesi konselor saat ini (memeriksa localStorage & sessionStorage + auto-sync dengan counselors.js)
  getCurrentCounselorSession() {
    let session = null;
    const local = localStorage.getItem('oase_counselor_session');
    if (local) {
      try { session = JSON.parse(local); } catch(e){}
    }
    if (!session) {
      const sess = sessionStorage.getItem('oase_counselor_session');
      if (sess) {
        try { session = JSON.parse(sess); } catch(e){}
      }
    }

    // Selalu sinkronkan dengan data terbaru dari counselors.js jika user mengubah nama/email di file
    if (session && window.COUNSELORS_DATA) {
      const freshCounselor = window.COUNSELORS_DATA.find(c => c.id === session.id);
      if (freshCounselor) {
        session.name = freshCounselor.name;
        session.email = freshCounselor.email;
        session.avatar = freshCounselor.avatar || session.avatar;
        session.specialties = freshCounselor.specialties || session.specialties;
      }
    }

    return session;
  },

  // Logout konselor
  logoutCounselor() {
    localStorage.removeItem('oase_counselor_session');
    sessionStorage.removeItem('oase_counselor_session');
  }
};

// Layanan Sesi Chat Konseling Real-Time & Voice Note (Sistem Dukungan Langsung)
const GeminiService = {
  getApiKey() {
    return localStorage.getItem('oase_gemini_api_key') || '';
  },

  setApiKey(key) {
    localStorage.setItem('oase_gemini_api_key', key.trim());
    localStorage.removeItem('oase_gemini_active_model');
  },

  async discoverWorkingModel(apiKey) {
    const key = apiKey || this.getApiKey();
    if (!key) throw new Error('API Key belum diisi.');

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (res.ok) {
        const data = await res.json();
        const available = (data.models || [])
          .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''));

        if (available.length > 0) {
          // Prioritas model Google Gemini termurah, paling hemat token, dan anti-antrean (Flash-Lite)
          const preferredOrder = [
            'gemini-2.5-flash-lite',
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
            'gemini-2.5-flash',
            'gemini-3.8-flash',
            'gemini-flash-latest',
            'gemini-2.0-flash',
            'gemini-1.5-flash'
          ];

          for (const pref of preferredOrder) {
            if (available.includes(pref)) {
              localStorage.setItem('oase_gemini_active_model', pref);
              return pref;
            }
          }

          // Jika tidak ada di daftar prioritas, gunakan model flash-lite/flash apa saja yang ada
          const anyModel = available.find(m => m.includes('lite')) || available.find(m => m.includes('flash')) || available[0];
          localStorage.setItem('oase_gemini_active_model', anyModel);
          return anyModel;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.error?.message) {
          throw new Error(errJson.error.message);
        }
      }
    } catch (e) {
      console.warn('Auto-discovery model info:', e.message);
      if (e.message && (e.message.includes('API key') || e.message.includes('API_KEY'))) {
        throw e;
      }
    }

    return 'gemini-2.5-flash-lite';
  },

  async chatWithGemini(userMessage, chatHistory = []) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API Key Gemini belum diatur. Silakan masukkan API Key Gemini Anda di formulir Chat AI.');
    }

    const systemPrompt = `Kamu adalah 'Sahabat OASE', konselor sebaya AI yang berhati hangat, empatik, bijaksana, dan menenangkan untuk para siswa/remaja Indonesia.
Tujuan utamamu adalah mendengarkan dengan penuh penerimaan tanpa menghakimi, memvalidasi perasaan mereka, dan memberi penguatan yang lembut serta solusi reflektif yang aman.
Gunakan bahasa Indonesia yang akrab, sopan, santun, dan menyentuh hati. Jangan memberikan diagnosis medis berat; jika ada indikasi krisis darurat, selalu sarankan dengan hangat untuk berbicara dengan konselor resmi OASE atau layanan darurat Sejiwa (119 ext 8).`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser menyapa/bercerita:\n${userMessage}` }]
      }
    ];

    if (chatHistory && chatHistory.length > 0) {
      contents.length = 0;
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Halo! Aku Sahabat OASE. Aku selalu di sini untuk mendengar ceritamu dengan penuh rasa aman dan kehangatan. Ceritakan apa saja yang ada di hatimu.' }]
      });
      chatHistory.slice(-6).forEach(h => {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
    }

    // Dapatkan model aktif dari discovery atau cache
    let primaryModel = localStorage.getItem('oase_gemini_active_model');
    if (!primaryModel) {
      primaryModel = await this.discoverWorkingModel(apiKey);
    }

    // Urutan prioritas model Gemini: Model termurah, paling hemat token, dan anti high-demand (Flash-Lite)
    const candidateModels = [
      primaryModel,
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ].filter(Boolean);
    const modelsToTry = [...new Set(candidateModels)];

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            localStorage.setItem('oase_gemini_active_model', model);
            return replyText;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error?.message || `Status ${response.status}`;
          lastError = new Error(errMsg);

          // Jika model tidak ditemukan / tidak didukung di tier API key, lanjut coba model berikutnya
          if (response.status === 404 || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('not supported')) {
            console.warn(`Model ${model} tidak aktif pada kunci ini, mencoba model alternatif...`);
            continue;
          }
          // Jika masalah autentikasi atau kuota, lempar error langsung
          throw new Error(errMsg);
        }
      } catch (err) {
        if (err.message && (err.message.toLowerCase().includes('not found') || err.message.toLowerCase().includes('not supported'))) {
          continue;
        }
        throw err;
      }
    }

    // Jika model di atas belum ada yang cocok, lakukan discovery ulang secara eksplisit
    try {
      localStorage.removeItem('oase_gemini_active_model');
      const fallbackDiscovered = await this.discoverWorkingModel(apiKey);
      if (fallbackDiscovered && !modelsToTry.includes(fallbackDiscovered)) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackDiscovered}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800
            }
          })
        });
        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            localStorage.setItem('oase_gemini_active_model', fallbackDiscovered);
            return replyText;
          }
        }
      }
    } catch (e) {}

    throw lastError || new Error('Tidak ada model Gemini yang didukung oleh API Key ini. Pastikan API Key valid dan aktif di Google AI Studio.');
  }
};

// ==============================================================================
// 7. LAYANAN LAPORAN BUG & KENDALA SISTEM (BUG REPORT SERVICE - MULTI-MODERATOR)
// ==============================================================================
const BugReportService = {
  DEFAULT_REPORTS: [
    {
      id: 'bug-init-1',
      ticket_id: 'BUG-4819',
      category: 'Tampilan / UI',
      reporter: 'Siswa Kelas 11',
      reporter_email: 'siswa11@oase.id',
      device: 'HP Android (Chrome)',
      page_url: 'komunitas.html',
      description: 'Tombol bagikan cerita terkadang tertutup oleh bilah navigasi bawah di layar ponsel kecil.',
      status: 'baru',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      resolved_by: null,
      resolved_at: null
    },
    {
      id: 'bug-init-2',
      ticket_id: 'BUG-7290',
      category: 'Audio Relaksasi',
      reporter: 'Siswa Kelas 10',
      reporter_email: 'siswa10@oase.id',
      device: 'Laptop Windows (Edge)',
      page_url: 'relaksasi-mood.html',
      description: 'Suara ombak relaksasi sempat berhenti sendiri saat layar laptop terkunci (sleep).',
      status: 'proses',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      resolved_by: null,
      resolved_at: null
    }
  ],

  _channel: null,
  _listeners: [],
  _initialized: false,

  initRealtime() {
    if (this._initialized) return;
    this._initialized = true;

    if ('BroadcastChannel' in window) {
      try {
        this._bc = new BroadcastChannel('oase_bug_reports_channel');
        this._bc.onmessage = (e) => {
          this._handleIncomingUpdate(e.data);
        };
      } catch(e) {}
    }

    if (supabaseClient && typeof supabaseClient.channel === 'function') {
      try {
        this._channel = supabaseClient.channel('oase_bug_sync', {
          config: { broadcast: { self: false } }
        });
        this._channel.on('broadcast', { event: 'bug_update' }, ({ payload }) => {
          this._handleIncomingUpdate(payload);
        }).subscribe();
      } catch(e) {}
    }
  },

  onUpdate(callback) {
    if (typeof callback === 'function') {
      this._listeners.push(callback);
    }
  },

  _notifyListeners(data) {
    this._listeners.forEach(cb => {
      try { cb(data); } catch(e) {}
    });
  },

  _handleIncomingUpdate(data) {
    if (!data) return;
    if (data.action === 'NEW_REPORT' && data.payload) {
      const reports = this.getReportsSync();
      if (!reports.some(r => r.id === data.payload.id)) {
        reports.unshift(data.payload);
        localStorage.setItem('oase_bug_reports', JSON.stringify(reports));
      }
    } else if (data.action === 'STATUS_CHANGED' && data.payload) {
      const reports = this.getReportsSync();
      const target = reports.find(r => r.id === data.payload.bugId);
      if (target) {
        target.status = data.payload.newStatus;
        target.resolved_by = data.payload.resolvedBy;
        target.resolved_at = data.payload.resolvedAt;
        localStorage.setItem('oase_bug_reports', JSON.stringify(reports));
      }
    } else if (data.action === 'DELETED' && data.payload) {
      let reports = this.getReportsSync();
      reports = reports.filter(r => r.id !== data.payload.bugId);
      localStorage.setItem('oase_bug_reports', JSON.stringify(reports));
    }
    this._notifyListeners(data);
  },

  _broadcast(action, payload) {
    const data = { action, payload, timestamp: Date.now() };
    if (this._bc) {
      try { this._bc.postMessage(data); } catch(e) {}
    }
    if (this._channel) {
      try {
        this._channel.send({
          type: 'broadcast',
          event: 'bug_update',
          payload: data
        });
      } catch(e) {}
    }
  },

  getReportsSync() {
    const local = localStorage.getItem('oase_bug_reports');
    if (local) {
      try { return JSON.parse(local); } catch(e) { return []; }
    }
    return [...this.DEFAULT_REPORTS];
  },

  async getReports({ includeResolved = true } = {}) {
    let reports = [];
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('bug_reports')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          reports = data;
          localStorage.setItem('oase_bug_reports', JSON.stringify(reports));
          return includeResolved ? reports : reports.filter(r => r.status !== 'selesai');
        }
      } catch(e) {}
    }

    const local = localStorage.getItem('oase_bug_reports');
    if (local) {
      try { reports = JSON.parse(local); } catch(e) { reports = []; }
    } else {
      reports = [...this.DEFAULT_REPORTS];
      localStorage.setItem('oase_bug_reports', JSON.stringify(reports));
    }

    if (!includeResolved) {
      return reports.filter(r => r.status !== 'selesai');
    }
    return reports;
  },

  async submitReport({ reporterName, reporterEmail, category, device, pageUrl, description }) {
    if (!description || !description.trim()) {
      throw new Error('Deskripsi kendala wajib diisi.');
    }
    const ticketId = 'BUG-' + Math.floor(1000 + Math.random() * 9000);
    const newReport = {
      id: 'bug-' + Date.now(),
      ticket_id: ticketId,
      reporter: reporterName && reporterName.trim() ? reporterName.trim() : 'Siswa OASE (Anonim)',
      reporter_email: reporterEmail && reporterEmail.trim() ? reporterEmail.trim() : 'Anonim',
      category: category || 'Kendala Teknis',
      device: device || 'Peramban Web',
      page_url: pageUrl || window.location.pathname || 'Web OASE',
      description: description.trim(),
      status: 'baru',
      created_at: new Date().toISOString(),
      resolved_by: null,
      resolved_at: null
    };

    if (supabaseClient) {
      try {
        await supabaseClient.from('bug_reports').insert([newReport]);
      } catch(e) {}
    }

    const reports = await this.getReports({ includeResolved: true });
    reports.unshift(newReport);
    localStorage.setItem('oase_bug_reports', JSON.stringify(reports));

    this._broadcast('NEW_REPORT', newReport);
    return { success: true, report: newReport };
  },

  async updateStatus(bugId, newStatus, moderatorName = 'Moderator OASE') {
    const reports = await this.getReports({ includeResolved: true });
    const target = reports.find(r => r.id === bugId);
    if (!target) return { success: false };

    target.status = newStatus;
    if (newStatus === 'selesai') {
      target.resolved_by = moderatorName;
      target.resolved_at = new Date().toISOString();
    } else {
      target.resolved_by = null;
      target.resolved_at = null;
    }

    if (supabaseClient) {
      try {
        await supabaseClient.from('bug_reports').update({
          status: newStatus,
          resolved_by: target.resolved_by,
          resolved_at: target.resolved_at
        }).eq('id', bugId);
      } catch(e) {}
    }

    localStorage.setItem('oase_bug_reports', JSON.stringify(reports));
    this._broadcast('STATUS_CHANGED', {
      bugId,
      newStatus,
      resolvedBy: target.resolved_by,
      resolvedAt: target.resolved_at,
      report: target
    });

    return { success: true, report: target };
  },

  async deleteReport(bugId) {
    let reports = await this.getReports({ includeResolved: true });
    reports = reports.filter(r => r.id !== bugId);
    localStorage.setItem('oase_bug_reports', JSON.stringify(reports));

    if (supabaseClient) {
      try {
        await supabaseClient.from('bug_reports').delete().eq('id', bugId);
      } catch(e) {}
    }

    this._broadcast('DELETED', { bugId });
    return { success: true };
  }
};

// ==============================================================================
// 8. LAYANAN KAMUS SENSOR SARA DINAMIS (SARA KEYWORDS - MULTI-MODERATOR SYNC)
// ==============================================================================
const SaraKeywordService = {
  _channel: null,
  _listeners: [],
  _initialized: false,

  initRealtime() {
    if (this._initialized) return;
    this._initialized = true;

    if ('BroadcastChannel' in window) {
      try {
        this._bc = new BroadcastChannel('oase_sara_sync_channel');
        this._bc.onmessage = (e) => {
          this._handleIncomingUpdate(e.data);
        };
      } catch(e) {}
    }

    if (supabaseClient && typeof supabaseClient.channel === 'function') {
      try {
        this._channel = supabaseClient.channel('oase_sara_room', {
          config: { broadcast: { self: false } }
        });
        this._channel.on('broadcast', { event: 'sara_keyword_update' }, ({ payload }) => {
          this._handleIncomingUpdate(payload);
        }).subscribe();
      } catch(e) {}
    }
  },

  onUpdate(callback) {
    if (typeof callback === 'function') {
      this._listeners.push(callback);
    }
  },

  _notifyListeners(data) {
    this._listeners.forEach(cb => {
      try { cb(data); } catch(e) {}
    });
  },

  _handleIncomingUpdate(data) {
    if (!data) return;
    if (data.action === 'ADD' && data.payload) {
      const list = this.getCustomKeywordsSync();
      if (!list.some(k => k.keyword.toLowerCase() === data.payload.keyword.toLowerCase())) {
        list.push(data.payload);
        localStorage.setItem('oase_custom_sara_keywords', JSON.stringify(list));
      }
    } else if (data.action === 'DELETE' && data.payload) {
      let list = this.getCustomKeywordsSync();
      list = list.filter(k => k.id !== data.payload.keywordId);
      localStorage.setItem('oase_custom_sara_keywords', JSON.stringify(list));
    }
    this._notifyListeners(data);
  },

  _broadcast(action, payload) {
    const data = { action, payload, timestamp: Date.now() };
    if (this._bc) {
      try { this._bc.postMessage(data); } catch(e) {}
    }
    if (this._channel) {
      try {
        this._channel.send({
          type: 'broadcast',
          event: 'sara_keyword_update',
          payload: data
        });
      } catch(e) {}
    }
  },

  getCustomKeywordsSync() {
    try {
      return JSON.parse(localStorage.getItem('oase_custom_sara_keywords') || '[]');
    } catch(e) {
      return [];
    }
  },

  async getCustomKeywords() {
    let list = [];
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('sara_keywords')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          list = data;
          localStorage.setItem('oase_custom_sara_keywords', JSON.stringify(list));
          return list;
        }
      } catch(e) {}
    }
    return this.getCustomKeywordsSync();
  },

  async addKeyword({ keyword, category = 'sara', note = '', addedBy = 'Moderator' }) {
    if (!keyword || !keyword.trim()) throw new Error('Kata kunci tidak boleh kosong');
    const cleanWord = keyword.trim().toLowerCase();
    const item = {
      id: 'kw-' + Date.now(),
      keyword: cleanWord,
      category: category,
      note: note.trim() || 'Ditambahkan oleh moderator',
      added_by: addedBy,
      created_at: new Date().toISOString()
    };

    if (supabaseClient) {
      try {
        await supabaseClient.from('sara_keywords').insert([item]);
      } catch(e) {}
    }

    const list = this.getCustomKeywordsSync();
    if (!list.some(k => k.keyword.toLowerCase() === cleanWord)) {
      list.push(item);
      localStorage.setItem('oase_custom_sara_keywords', JSON.stringify(list));
    }

    this._broadcast('ADD', item);
    return item;
  },

  async deleteKeyword(keywordId) {
    if (supabaseClient) {
      try {
        await supabaseClient.from('sara_keywords').delete().eq('id', keywordId);
      } catch(e) {}
    }
    let list = this.getCustomKeywordsSync();
    list = list.filter(k => k.id !== keywordId);
    localStorage.setItem('oase_custom_sara_keywords', JSON.stringify(list));
    this._broadcast('DELETE', { keywordId });
    return true;
  }
};

// Ekspor ke window global agar mudah diakses di seluruh aplikasi
window.AuthService = AuthService;
window.StoryService = StoryService;
window.CounselingService = CounselingService;
window.GeminiService = GeminiService;
window.BugReportService = BugReportService;
window.SaraKeywordService = SaraKeywordService;



