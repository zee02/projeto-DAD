<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Game;
use App\Models\User;

$userId = 433; // User from the match games we saw

echo "Checking games for user $userId:\n\n";

$user = User::find($userId);
if (!$user) {
    echo "User not found!\n";
    exit;
}

echo "User: {$user->name} (ID: {$user->id})\n\n";

$games = Game::with(['player1', 'player2', 'winner', 'loser'])
    ->where(function ($q) use ($userId) {
        $q->where('player1_user_id', $userId)
          ->orWhere('player2_user_id', $userId);
    })
    ->orderBy('id', 'desc')
    ->take(10)
    ->get();

echo "Total games for this user: " . $games->count() . "\n\n";

foreach ($games as $game) {
    $opponent = $game->player1_user_id === $userId ? $game->player2 : $game->player1;
    $oppName = $opponent ? ($opponent->nickname ?? $opponent->name) : 'Unknown';
    $result = $game->is_draw ? 'Draw' : ($game->winner_user_id === $userId ? 'Victory' : 'Defeat');
    $matchInfo = $game->match_id ? " | Match: {$game->match_id}" : "";
    
    echo "ID: {$game->id} | Type: {$game->type} | Status: {$game->status} | Result: {$result} | vs {$oppName}{$matchInfo}\n";
}
