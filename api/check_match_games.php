<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Game;

echo "Games with match_id:\n";
$withMatch = Game::whereNotNull('match_id')
    ->orderBy('id', 'desc')
    ->take(10)
    ->get(['id', 'type', 'status', 'match_id', 'player1_user_id', 'player2_user_id', 'winner_user_id', 'began_at']);

if ($withMatch->isEmpty()) {
    echo "No games with match_id found!\n";
} else {
    foreach ($withMatch as $game) {
        echo "ID: {$game->id} | Type: {$game->type} | Status: {$game->status} | Match: {$game->match_id} | P1: {$game->player1_user_id} | P2: {$game->player2_user_id} | Winner: {$game->winner_user_id}\n";
    }
}

echo "\nGames without match_id (recent 5):\n";
$withoutMatch = Game::whereNull('match_id')
    ->orderBy('id', 'desc')
    ->take(5)
    ->get(['id', 'type', 'status', 'player1_user_id', 'player2_user_id', 'began_at']);

foreach ($withoutMatch as $game) {
    echo "ID: {$game->id} | Type: {$game->type} | Status: {$game->status} | P1: {$game->player1_user_id} | P2: {$game->player2_user_id}\n";
}
