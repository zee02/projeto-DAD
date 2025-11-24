<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GameState extends Model
{
    use SoftDeletes;

    protected $table = 'game_states';
    protected $fillable = [
        'game_id',
        'current_player_user_id',
        'trump_suit',
        'trump_rank',
        'dealt_cards_count',
        'stock_remaining_count',
        'game_phase',
        'current_trick_number',
        'current_trick_led_card_id',
    ];

    protected $casts = [
        'dealt_cards_count' => 'integer',
        'stock_remaining_count' => 'integer',
        'trump_suit' => 'integer',
        'trump_rank' => 'integer',
        'current_trick_number' => 'integer',
    ];

    // Relationships
    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function currentPlayer()
    {
        return $this->belongsTo(User::class, 'current_player_user_id');
    }

    public function currentTrickLedCard()
    {
        return $this->belongsTo(GameCard::class, 'current_trick_led_card_id');
    }

    // Helper methods
    public function getTrumpSuitName()
    {
        $suits = ['Copas', 'Ouros', 'Paus', 'Espadas'];
        return $suits[$this->trump_suit] ?? 'Unknown';
    }

    public function getCardRankName($rank)
    {
        $ranks = [
            1 => 'Ás',
            2 => '2', 3 => '3', 4 => '4', 5 => '5', 6 => '6',
            7 => 'Sete',
            8 => 'Dama',
            9 => 'Valete',
            10 => 'Rei'
        ];
        return $ranks[$rank] ?? 'Unknown';
    }
}
