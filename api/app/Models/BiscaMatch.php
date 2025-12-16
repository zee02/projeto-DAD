<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiscaMatch extends Model
{
    protected $table = 'bisca_matches';

    protected $fillable = [
        'player1_user_id',
        'player2_user_id',
        'winner_user_id',
        'game_type',
        'bet_per_game',
        'max_wins',
        'player1_wins',
        'player2_wins',
        'player1_coins_bet',
        'player2_coins_bet',
        'player1_coins_won',
        'player2_coins_won',
        'status',
        'games_data',
    ];

    protected $casts = [
        'games_data' => 'array',
    ];

    public function player1()
    {
        return $this->belongsTo(User::class, 'player1_user_id');
    }

    public function player2()
    {
        return $this->belongsTo(User::class, 'player2_user_id');
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }
}
