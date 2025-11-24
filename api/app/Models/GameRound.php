<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameRound extends Model
{
    protected $table = 'game_rounds';
    protected $fillable = [
        'game_id',
        'trick_number',
        'led_by_user_id',
        'first_card_id',
        'second_card_id',
        'winner_user_id',
        'points_won',
        'completed_at',
    ];

    protected $casts = [
        'trick_number' => 'integer',
        'points_won' => 'integer',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function ledBy()
    {
        return $this->belongsTo(User::class, 'led_by_user_id');
    }

    public function firstCard()
    {
        return $this->belongsTo(GameCard::class, 'first_card_id');
    }

    public function secondCard()
    {
        return $this->belongsTo(GameCard::class, 'second_card_id');
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }
}
