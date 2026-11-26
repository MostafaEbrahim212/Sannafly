<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AdminRealtimeAlert implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

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
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.realtime'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'admin.alert';
    }
}
