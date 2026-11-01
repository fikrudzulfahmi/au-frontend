#!/usr/bin/env bash
#
# Menukar rilis SPA secara ATOMIK di server.
#
# Dijalankan DI SERVER oleh workflow, dengan variabel lingkungan:
#   LIVE_DIR      document root situs (wajib)
#   RELEASES_DIR  folder tempat rilis diunggah (wajib)
#   RELEASE_ID    id rilis (wajib)
#   DOMAIN        domain untuk pemeriksaan kesehatan (opsional)
#
# Urutan sengaja dipilih agar tidak pernah ada momen halaman menunjuk berkas yang
# belum ada:
#   1. aset disalin lebih dulu (nama berkas Vite ber-hash → tidak menimpa versi lama)
#   2. service worker & manifest ditukar
#   3. index.html ditukar PALING AKHIR dengan `install` + `mv` (atomik satu filesystem)
#   4. bila situs tidak sehat setelah swap, index.html lama dipulihkan otomatis
#
# Sengaja tidak memakai `set -x`: jangan pernah mencetak nilai rahasia.

set -euo pipefail

: "${LIVE_DIR:?LIVE_DIR kosong}"
: "${RELEASES_DIR:?RELEASES_DIR kosong}"
: "${RELEASE_ID:?RELEASE_ID kosong}"

RILIS="$RELEASES_DIR/$RELEASE_ID"
CADANGAN="$RELEASES_DIR/cadangan-index.html"

# Hasil unggahan bisa berada langsung di folder rilis (bila workflow mengekstrak tar
# di sana) atau di dalam subfolder `dist/`. Keduanya diterima.
if [ -f "$RILIS/dist/index.html" ]; then
  SUMBER="$RILIS/dist"
elif [ -f "$RILIS/index.html" ]; then
  SUMBER="$RILIS"
else
  echo "GAGAL: index.html tidak ditemukan di $RILIS" >&2
  ls -la "$RILIS" >&2 || true
  exit 1
fi

[ -d "$SUMBER/assets" ] || { echo "GAGAL: folder assets tidak ada di $SUMBER" >&2; exit 1; }
[ -d "$LIVE_DIR" ]      || { echo "GAGAL: docroot tidak ditemukan: $LIVE_DIR" >&2; exit 1; }

echo "sumber rilis : $SUMBER"
echo "docroot      : $LIVE_DIR"

# --- 1. Aset lebih dulu.
mkdir -p "$LIVE_DIR/assets"
cp -a "$SUMBER/assets/." "$LIVE_DIR/assets/"
if [ -d "$SUMBER/icons" ]; then
  mkdir -p "$LIVE_DIR/icons"
  cp -a "$SUMBER/icons/." "$LIVE_DIR/icons/"
fi
echo "aset tersalin"

# --- 2. Service worker & manifest sebelum index.html.
for f in sw.js registerSW.js manifest.webmanifest; do
  if [ -f "$SUMBER/$f" ]; then
    install -m 644 "$SUMBER/$f" "$LIVE_DIR/$f.baru"
    mv -f "$LIVE_DIR/$f.baru" "$LIVE_DIR/$f"
    echo "$f ditukar"
  fi
done

# --- 3. Cadangkan index lama, lalu TITIK ATOMIK.
if [ -f "$LIVE_DIR/index.html" ]; then
  cp -a "$LIVE_DIR/index.html" "$CADANGAN"
fi
install -m 644 "$SUMBER/index.html" "$LIVE_DIR/index.html.baru"
mv -f "$LIVE_DIR/index.html.baru" "$LIVE_DIR/index.html"
echo "index.html DITUKAR secara atomik"

# --- 4. Pemeriksaan kesehatan + rollback.
if [ -n "${DOMAIN:-}" ]; then
  kode="000"
  for _ in 1 2 3 4 5; do
    kode=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "https://$DOMAIN/" || echo 000)
    [ "$kode" = "200" ] && break
    sleep 3
  done
  if [ "$kode" != "200" ]; then
    echo "GAGAL: situs menjawab $kode setelah swap — mengembalikan versi sebelumnya" >&2
    if [ -f "$CADANGAN" ]; then
      install -m 644 "$CADANGAN" "$LIVE_DIR/index.html.kembali"
      mv -f "$LIVE_DIR/index.html.kembali" "$LIVE_DIR/index.html"
      echo "rollback selesai" >&2
    fi
    exit 1
  fi
  echo "kesehatan lolos (HTTP $kode)"
fi

# --- 5. Sisakan 5 rilis terakhir agar disk tidak penuh.
n=0
for d in $(ls -1dt "$RELEASES_DIR"/*/ 2>/dev/null); do
  n=$((n + 1))
  if [ "$n" -gt 5 ]; then rm -rf "$d"; fi
done
echo "pemangkasan rilis selesai (menyisakan 5)"

# --- 6. Izin: HANYA berkas yang baru dipasang. Berkas milik server (.htaccess,
#        .well-known, konfigurasi PHP) tidak boleh ikut diubah.
chmod 755 "$LIVE_DIR/assets" 2>/dev/null || true
find "$LIVE_DIR/assets" -type f -exec chmod 644 {} + 2>/dev/null || true
if [ -d "$LIVE_DIR/icons" ]; then
  chmod 755 "$LIVE_DIR/icons" 2>/dev/null || true
  find "$LIVE_DIR/icons" -type f -exec chmod 644 {} + 2>/dev/null || true
fi
for f in index.html sw.js registerSW.js manifest.webmanifest; do
  [ -f "$LIVE_DIR/$f" ] && chmod 644 "$LIVE_DIR/$f"
done

echo "SELESAI: rilis $RELEASE_ID aktif"
