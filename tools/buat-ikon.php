<?php
/**
 * Membuat ikon PWA SIPANDU (manifest, apple-touch-icon, favicon) memakai GD.
 * Jalankan: C:\php83\php.exe tools\buat-ikon.php
 */

declare(strict_types=1);

function lerp(int $a, int $b, float $t): int
{
    return (int) round($a + ($b - $a) * $t);
}

function ikon(int $ukuran, int $radius, bool $maskable, string $tujuan): void
{
    $im = imagecreatetruecolor($ukuran, $ukuran);
    imagealphablending($im, false);
    imagesavealpha($im, true);

    $transparan = imagecolorallocatealpha($im, 0, 0, 0, 127);
    imagefilledrectangle($im, 0, 0, $ukuran, $ukuran, $transparan);

    // Sudut membulat (maskable: penuh agar aman pada semua bentuk topeng)
    $r = $maskable ? 0 : $radius;
    $isi = imagecolorallocatealpha($im, 38, 70, 176, 0);

    if ($r <= 0) {
        imagefilledrectangle($im, 0, 0, $ukuran, $ukuran, $isi);
    } else {
        imagefilledrectangle($im, $r, 0, $ukuran - $r, $ukuran, $isi);
        imagefilledrectangle($im, 0, $r, $ukuran, $ukuran - $r, $isi);
        imagefilledellipse($im, $r, $r, $r * 2, $r * 2, $isi);
        imagefilledellipse($im, $ukuran - $r, $r, $r * 2, $r * 2, $isi);
        imagefilledellipse($im, $r, $ukuran - $r, $r * 2, $r * 2, $isi);
        imagefilledellipse($im, $ukuran - $r, $ukuran - $r, $r * 2, $r * 2, $isi);
    }

    // Gradien vertikal dari #2646B0 ke #1E2A8A
    $atas = [38, 70, 176];
    $bawah = [26, 34, 112];
    for ($y = 0; $y < $ukuran; $y++) {
        $t = $y / max(1, $ukuran - 1);
        $warna = imagecolorallocatealpha(
            $im,
            lerp($atas[0], $bawah[0], $t),
            lerp($atas[1], $bawah[1], $t),
            lerp($atas[2], $bawah[2], $t),
            0
        );
        imageline($im, 0, $y, $ukuran, $y, $warna);
        // pulihkan transparansi sudut
        if ($r > 0) {
            imagefilledellipse($im, 0, 0, $r * 2, $r * 2, $transparan);
            imagefilledellipse($im, $ukuran, 0, $r * 2, $r * 2, $transparan);
            imagefilledellipse($im, 0, $ukuran, $r * 2, $r * 2, $transparan);
            imagefilledellipse($im, $ukuran, $ukuran, $r * 2, $r * 2, $transparan);
        }
    }

    imagealphablending($im, true);

    // Marka sidik jari putih
    $putih = imagecolorallocate($im, 255, 255, 255);
    $cx = (int) ($ukuran / 2);
    $cy = (int) ($ukuran * 0.56);
    $tebal = max(2, (int) round($ukuran * 0.052));
    imagesetthickness($im, $tebal);

    $busur = [
        [0.325, 197, 343],
        [0.255, 205, 335],
        [0.185, 213, 327],
        [0.115, 221, 319],
    ];
    foreach ($busur as [$rasio, $mulai, $akhir]) {
        $d = (int) round($ukuran * $rasio * 2);
        imagearc($im, $cx, $cy, $d, $d, (int) $mulai, (int) $akhir, $putih);
    }

    // Garis tengah pendek
    $y1 = $cy - (int) round($ukuran * 0.04);
    $y2 = $cy + (int) round($ukuran * 0.11);
    imageline($im, $cx, $y1, $cx, $y2, $putih);

    // Dua lengkung bawah kiri-kanan
    imagesetthickness($im, max(2, (int) round($ukuran * 0.042)));
    $d = (int) round($ukuran * 0.82);
    imagearc($im, $cx, $cy - (int) round($ukuran * 0.10), $d, $d, 40, 74, $putih);
    imagearc($im, $cx, $cy - (int) round($ukuran * 0.10), $d, $d, 106, 140, $putih);

    imagepng($im, $tujuan);
    imagedestroy($im);
}

/** Ikon PWA per ukuran; $prosentaseLogo mengikuti aturan maskable (safe zone 80%). */
function logo(int $ukuran, string $tujuan): void
{
    ikon($ukuran, (int) round($ukuran * 0.24), false, $tujuan);
}

$dir = __DIR__ . '/../au-frontend/public/icons';
if (!is_dir($dir)) {
    mkdir($dir, 0775, true);
}

logo(192, $dir . '/pwa-192.png');
logo(512, $dir . '/pwa-512.png');
ikon(512, 0, true, $dir . '/pwa-512-maskable.png');
logo(180, $dir . '/apple-touch-icon.png');
logo(64, $dir . '/favicon-64.png');

echo "Ikon PWA dibuat di: {$dir}\n";
foreach (glob($dir . '/*.png') ?: [] as $f) {
    printf("  %-26s %6.1f KB\n", basename($f), filesize($f) / 1024);
}
