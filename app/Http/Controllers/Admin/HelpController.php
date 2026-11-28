<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HelpController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Help/Index');
    }

    public function videos(): Response
    {
        return Inertia::render('Admin/Help/Videos');
    }

    public function streamVideo(Request $request, string $filename): StreamedResponse
    {
        $safeName = basename($filename);
        if (! preg_match('/^[a-zA-Z0-9._-]+\.(mp4|webm)$/', $safeName)) {
            abort(404);
        }

        $path = public_path("docs/videos/{$safeName}");
        if (! is_file($path)) {
            abort(404);
        }

        $size = filesize($path);
        $mime = str_ends_with($safeName, '.webm') ? 'video/webm' : 'video/mp4';
        $start = 0;
        $end = $size - 1;
        $status = 200;

        $headers = [
            'Content-Type' => $mime,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'public, max-age=86400',
        ];

        $range = $request->header('Range');
        if ($range && preg_match('/bytes=(\d*)-(\d*)/', $range, $matches)) {
            $start = $matches[1] !== '' ? (int) $matches[1] : 0;
            $end = $matches[2] !== '' ? min((int) $matches[2], $size - 1) : $size - 1;

            if ($start > $end || $start >= $size) {
                abort(416, 'Requested Range Not Satisfiable');
            }

            $status = 206;
            $headers['Content-Range'] = "bytes {$start}-{$end}/{$size}";
        }

        $length = $end - $start + 1;
        $headers['Content-Length'] = (string) $length;

        return response()->stream(function () use ($path, $start, $length) {
            $handle = fopen($path, 'rb');
            if (! $handle) {
                return;
            }
            fseek($handle, $start);
            $remaining = $length;
            while ($remaining > 0 && ! feof($handle)) {
                $chunk = fread($handle, min(65536, $remaining));
                if ($chunk === false) {
                    break;
                }
                echo $chunk;
                $remaining -= strlen($chunk);
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            }
            fclose($handle);
        }, $status, $headers);
    }
}
