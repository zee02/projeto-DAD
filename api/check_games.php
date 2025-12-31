<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Game;

$total = Game::count();
echo "Total games: $total\n";

$multiplayer = Game::where('type', 'Multiplayer')->count();
echo "Multiplayer games: $multiplayer\n";

$withMatch = Game::whereNotNull('match_id')->count();
echo "Games with match_id: $withMatch\n";

$ended = Game::where('status', 'Ended')->count();
echo "Ended games: $ended\n";

$surrendered = Game::where('status', 'Surrendered')->count();
echo "Surrendered games: $surrendered\n";

echo "\nRecent multiplayer games:\n";
$recent = Game::where('type', 'Multiplayer')
    ->orderBy('id', 'desc')
    ->take(5)
    ->get(['id', 'type', 'status', 'match_id', 'winner_user_id', 'began_at']);

foreach ($recent as $game) {
    echo "ID: {$game->id} | Status: {$game->status} | Match: {$game->match_id} | Winner: {$game->winner_user_id} | Date: {$game->began_at}\n";
}
