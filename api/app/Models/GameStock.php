<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameStock extends Model
{
    protected $table = 'game_stock';
    protected $fillable = [
        'game_id',
        'card_id',
        'position_in_deck',
        'is_drawn',
        'drawn_at',
    ];

    protected $casts = [
        'position_in_deck' => 'integer',
        'is_drawn' => 'boolean',
        'drawn_at' => 'datetime',
    ];

    // Relationships
    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function card()
    {
        return $this->belongsTo(GameCard::class);
    }
}
