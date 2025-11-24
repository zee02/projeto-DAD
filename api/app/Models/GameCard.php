<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GameCard extends Model
{
    use SoftDeletes;

    protected $table = 'game_cards';
    protected $fillable = [
        'game_id',
        'card_suit',
        'card_rank',
        'points_value',
        'dealt_to_user_id',
        'current_owner_user_id',
        'trick_id',
        'stock_position',
        'is_in_stock',
        'is_in_hand',
    ];

    protected $casts = [
        'card_suit' => 'integer',
        'card_rank' => 'integer',
        'points_value' => 'integer',
        'stock_position' => 'integer',
        'is_in_stock' => 'boolean',
        'is_in_hand' => 'boolean',
    ];

    // Relationships
    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function dealtTo()
    {
        return $this->belongsTo(User::class, 'dealt_to_user_id');
    }

    public function currentOwner()
    {
        return $this->belongsTo(User::class, 'current_owner_user_id');
    }

    public function trick()
    {
        return $this->belongsTo(GameRound::class, 'trick_id');
    }

    // Helper methods
    public function getSuitName()
    {
        $suits = ['Copas', 'Ouros', 'Paus', 'Espadas'];
        return $suits[$this->card_suit] ?? 'Unknown';
    }

    public function getRankName()
    {
        $ranks = [
            1 => 'Ás',
            2 => '2', 3 => '3', 4 => '4', 5 => '5', 6 => '6',
            7 => 'Sete',
            8 => 'Dama',
            9 => 'Valete',
            10 => 'Rei'
        ];
        return $ranks[$this->card_rank] ?? 'Unknown';
    }

    public function getDisplayName()
    {
        return $this->getRankName() . ' de ' . $this->getSuitName();
    }

    // Static method to calculate points value
    public static function calculatePointsValue($rank)
    {
        return match($rank) {
            1 => 11,        // Ás
            7 => 10,        // Sete (Bisca/Manilha)
            10 => 4,        // Rei
            9 => 3,         // Valete
            8 => 2,         // Dama
            default => 0    // All others
        };
    }
}
