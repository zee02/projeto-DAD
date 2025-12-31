<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Game;

echo "Distinct game types in database:\n";
$types = Game::select('type')->distinct()->get();
foreach ($types as $t) {
    $count = Game::where('type', $t->type)->count();
    echo "Type: '{$t->type}' | Count: $count\n";
}

echo "\nRecent 5 games:\n";
$recent = Game::orderBy('id', 'desc')
    ->take(5)
    ->get(['id', 'type', 'status', 'match_id', 'began_at']);

foreach ($recent as $game) {
    echo "ID: {$game->id} | Type: '{$game->type}' | Status: {$game->status} | Match: {$game->match_id}\n";
}
