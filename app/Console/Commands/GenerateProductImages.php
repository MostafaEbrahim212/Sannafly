<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GenerateProductImages extends Command
{
    protected $signature = 'catalog:generate-images {--force : Regenerate images even if they already exist}';

    protected $description = 'Generate clean WebP product and variation images for existing catalog items';

    private array $palettes = [
        ['bg1' => [15, 118, 110], 'bg2' => [19, 78, 74], 'accent' => [94, 234, 212]],   // Teal
        ['bg1' => [30, 41, 59], 'bg2' => [15, 23, 42], 'accent' => [148, 163, 184]],     // Slate
        ['bg1' => [67, 56, 202], 'bg2' => [49, 46, 129], 'accent' => [165, 180, 252]],   // Indigo
        ['bg1' => [180, 83, 9], 'bg2' => [120, 53, 15], 'accent' => [253, 211, 77]],     // Amber
        ['bg1' => [190, 18, 60], 'bg2' => [136, 19, 55], 'accent' => [253, 164, 175]],   // Rose
        ['bg1' => [4, 120, 87], 'bg2' => [6, 78, 59], 'accent' => [110, 231, 183]],      // Emerald
    ];

    public function handle(): int
    {
        $force = (bool) $this->option('force');
        $disk = Storage::disk('public');

        $products = Product::with(['category', 'brand', 'images', 'variations.options'])->get();
        $createdBase = 0;
        $createdVars = 0;

        foreach ($products as $product) {
            $hasBase = $product->images()->whereNull('variation_id')->exists();

            if (! $hasBase || $force) {
                if ($force) {
                    $product->images()->whereNull('variation_id')->delete();
                }

                $palette = $this->palettes[$product->id % count($this->palettes)];
                $label = strtoupper(Str::limit(preg_replace('/[^A-Za-z0-9 ]/', '', $product->name) ?: $product->sku, 22, ''));
                $sub = strtoupper($product->category?->name ?? 'Sannafly');
                $sku = strtoupper($product->sku);

                $baseName = Str::uuid()->toString();
                $mainPath = "products/{$product->id}/{$baseName}.webp";
                $thumbPath = "products/{$product->id}/thumbs/{$baseName}.webp";

                [$bytes, $w, $h] = $this->renderCard($disk, $mainPath, $thumbPath, $palette, $label, $sub, $sku);

                ProductImage::create([
                    'product_id' => $product->id,
                    'variation_id' => null,
                    'path' => $mainPath,
                    'thumbnail_path' => $thumbPath,
                    'webp_path' => $mainPath,
                    'alt_text' => $product->name,
                    'is_main' => true,
                    'sort_order' => 0,
                    'size_bytes' => $bytes,
                    'width' => $w,
                    'height' => $h,
                ]);
                $createdBase++;
            }

            foreach ($product->variations as $idx => $variation) {
                if ($variation->images()->exists() && ! $force) {
                    continue;
                }
                if ($force) {
                    $variation->images()->delete();
                }

                $palette = $this->resolveVariationPalette($variation, $product->id + $idx + 1);
                $label = strtoupper(Str::limit(preg_replace('/[^A-Za-z0-9 \/]/', '', $variation->name ?: $variation->sku), 22, ''));
                $sub = strtoupper(Str::limit(preg_replace('/[^A-Za-z0-9 ]/', '', $product->name) ?: 'VARIANT', 20, ''));
                $sku = strtoupper($variation->sku);

                $baseName = Str::uuid()->toString();
                $mainPath = "products/{$product->id}/variations/{$variation->id}/{$baseName}.webp";
                $thumbPath = "products/{$product->id}/variations/{$variation->id}/thumbs/{$baseName}.webp";

                [$bytes, $w, $h] = $this->renderCard($disk, $mainPath, $thumbPath, $palette, $label, $sub, $sku);

                ProductImage::create([
                    'product_id' => $product->id,
                    'variation_id' => $variation->id,
                    'path' => $mainPath,
                    'thumbnail_path' => $thumbPath,
                    'webp_path' => $mainPath,
                    'alt_text' => "{$product->name} - {$variation->name}",
                    'is_main' => true,
                    'sort_order' => 0,
                    'size_bytes' => $bytes,
                    'width' => $w,
                    'height' => $h,
                ]);
                $createdVars++;
            }
        }

        $this->info("Generated {$createdBase} base product image(s) and {$createdVars} variation image(s).");

        return self::SUCCESS;
    }

    private function resolveVariationPalette(ProductVariation $variation, int $fallbackIndex): array
    {
        $hex = $variation->options->firstWhere('color_hex', '!=', null)?->color_hex;
        if (is_string($hex) && preg_match('/^#?([0-9a-fA-F]{6})$/', $hex, $m)) {
            $r = hexdec(substr($m[1], 0, 2));
            $g = hexdec(substr($m[1], 2, 2));
            $b = hexdec(substr($m[1], 4, 2));

            return [
                'bg1' => [$r, $g, $b],
                'bg2' => [max(0, (int) ($r * 0.65)), max(0, (int) ($g * 0.65)), max(0, (int) ($b * 0.65))],
                'accent' => [min(255, $r + 70), min(255, $g + 70), min(255, $b + 70)],
            ];
        }

        $name = strtolower((string) $variation->name);
        if (str_contains($name, 'black') || str_contains($name, 'dark')) {
            return ['bg1' => [30, 30, 36], 'bg2' => [12, 12, 16], 'accent' => [161, 161, 170]];
        }
        if (str_contains($name, 'silver') || str_contains($name, 'white') || str_contains($name, 'grey')) {
            return ['bg1' => [100, 116, 139], 'bg2' => [51, 65, 85], 'accent' => [226, 232, 240]];
        }
        if (str_contains($name, 'gold') || str_contains($name, 'amber')) {
            return ['bg1' => [180, 130, 30], 'bg2' => [113, 63, 18], 'accent' => [253, 224, 71]];
        }

        return $this->palettes[$fallbackIndex % count($this->palettes)];
    }

    private function renderCard($disk, string $mainPath, string $thumbPath, array $palette, string $title, string $subtitle, string $sku): array
    {
        $width = 800;
        $height = 800;
        $img = imagecreatetruecolor($width, $height);
        imagealphablending($img, true);

        [$r1, $g1, $b1] = $palette['bg1'];
        [$r2, $g2, $b2] = $palette['bg2'];
        [$ra, $ga, $ba] = $palette['accent'];

        // Vertical gradient background
        for ($y = 0; $y < $height; $y++) {
            $ratio = $y / ($height - 1);
            $r = (int) round($r1 + ($r2 - $r1) * $ratio);
            $g = (int) round($g1 + ($g2 - $g1) * $ratio);
            $b = (int) round($b1 + ($b2 - $b1) * $ratio);
            $lineColor = imagecolorallocate($img, $r, $g, $b);
            imageline($img, 0, $y, $width - 1, $y, $lineColor);
        }

        $accent = imagecolorallocatealpha($img, $ra, $ga, $ba, 90);
        $white = imagecolorallocate($img, 255, 255, 255);
        $muted = imagecolorallocatealpha($img, 255, 255, 255, 45);
        $cardBg = imagecolorallocatealpha($img, 255, 255, 255, 112);

        // Decorative geometric circles
        imagefilledellipse($img, 640, 170, 340, 340, $accent);
        imagefilledellipse($img, 140, 680, 260, 260, $accent);

        // Center showcase card
        imagefilledrectangle($img, 90, 220, 710, 580, $cardBg);
        imagerectangle($img, 90, 220, 710, 580, $muted);

        // Centered product/variant typography using GD built-in crisp font 5 (scaled)
        $this->drawCenteredText($img, 5, 310, $subtitle ?: 'Sannafly', $accent);
        $this->drawCenteredText($img, 5, 390, $title ?: 'PRODUCT', $white);
        $this->drawCenteredText($img, 4, 470, "SKU: {$sku}", $muted);

        ob_start();
        imagewebp($img, null, 88);
        $mainBinary = ob_get_clean();

        // Thumbnail 400x400
        $thumb = imagecreatetruecolor(400, 400);
        imagecopyresampled($thumb, $img, 0, 0, 0, 0, 400, 400, $width, $height);
        ob_start();
        imagewebp($thumb, null, 82);
        $thumbBinary = ob_get_clean();

        imagedestroy($thumb);
        imagedestroy($img);

        $disk->put($mainPath, $mainBinary);
        $disk->put($thumbPath, $thumbBinary);

        return [strlen($mainBinary), $width, $height];
    }

    private function drawCenteredText($img, int $font, int $y, string $text, int $color): void
    {
        $text = substr($text, 0, 34);
        $fw = imagefontwidth($font);
        $textWidth = $fw * strlen($text);
        $x = max(20, (int) ((imagesx($img) - $textWidth) / 2));
        imagestring($img, $font, $x, $y, $text, $color);
    }
}
