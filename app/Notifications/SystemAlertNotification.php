<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SystemAlertNotification extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $meta
     */
    public function __construct(
        public readonly string $category,
        public readonly string $titleEn,
        public readonly string $titleAr,
        public readonly string $bodyEn,
        public readonly string $bodyAr,
        public readonly string $url,
        public readonly array $meta = [],
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'category' => $this->category,
            'title_en' => $this->titleEn,
            'title_ar' => $this->titleAr,
            'body_en' => $this->bodyEn,
            'body_ar' => $this->bodyAr,
            'url' => $this->url,
            'meta' => $this->meta,
        ];
    }
}
