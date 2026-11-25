<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class ImageService
{
    private ImageManager $manager;

    public function __construct(private readonly SettingsService $settings)
    {
        $this->manager = new ImageManager(new Driver);
    }

    /**
     * Optimize, resize, generate thumbnail + WebP, and store on the public disk.
     *
     * @return array{path: string, thumbnail_path: string, webp_path: string, size_bytes: int, width: int, height: int}
     */
    public function processAndStore(UploadedFile $file, string $directory = 'products'): array
    {
        $maxWidth = (int) $this->settings->get('image_max_width', 1600);
        $thumbWidth = (int) $this->settings->get('image_thumb_width', 400);
        $quality = (int) $this->settings->get('image_quality', 85);

        $uuid = Str::uuid()->toString();
        $disk = Storage::disk('public');

        $image = $this->manager->decodePath($file->getRealPath());
        $image->scaleDown(width: $maxWidth);

        $width = $image->width();
        $height = $image->height();

        $mainPath = "{$directory}/{$uuid}.webp";
        $encodedMain = (string) $image->encodeUsingMediaType('image/webp', quality: $quality);
        $disk->put($mainPath, $encodedMain);

        $thumb = $this->manager->decodePath($file->getRealPath());
        $thumb->scaleDown(width: $thumbWidth);
        $thumbPath = "{$directory}/thumbs/{$uuid}.webp";
        $disk->put($thumbPath, (string) $thumb->encodeUsingMediaType('image/webp', quality: $quality));

        return [
            'path' => $mainPath,
            'thumbnail_path' => $thumbPath,
            'webp_path' => $mainPath,
            'size_bytes' => strlen($encodedMain),
            'width' => $width,
            'height' => $height,
        ];
    }

    public function deleteFiles(array $paths): void
    {
        $disk = Storage::disk('public');
        foreach (array_filter($paths) as $path) {
            if ($disk->exists($path)) {
                $disk->delete($path);
            }
        }
    }
}
