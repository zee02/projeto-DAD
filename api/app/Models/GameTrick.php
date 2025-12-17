<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameTrick extends Model
{
    protected $fillable = [
        'game_id',
        'trick_number',
        'card1_id',
        'card1_suit',
        'card1_rank',
        'card1_value',
        'card1_player_id',
        'card2_id',
        'card2_suit',
        'card2_rank',
        'card2_value',
        'card2_player_id',
        'winner_user_id',
        'points_won',
        'trump_suit',
    ];

    protected $casts = [
        'trick_number' => 'integer',
        'card1_value' => 'integer',
        'card2_value' => 'integer',
        'points_won' => 'integer',
    ];

    // Relationships
    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function card1Player()
    {
        return $this->belongsTo(User::class, 'card1_player_id');
    }

    public function card2Player()
    {
        return $this->belongsTo(User::class, 'card2_player_id');
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }
}
