<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'type',
        'player1_user_id',
        'player2_user_id',
        'is_draw',
        'winner_user_id',
        'loser_user_id',
        'surrendered_by',
        'match_id',
        'status',
        'began_at',
        'ended_at',
        'total_time',
        'player1_points',
        'player2_points',
        'custom',
    ];

    protected $casts = [
        'is_draw' => 'boolean',
        'began_at' => 'datetime',
        'ended_at' => 'datetime',
        'total_time' => 'float',
        'custom' => 'array',
    ];

    // Relationships
    public function winner()
    {
        return $this->belongsTo(User::class, "winner_user_id");
    }

    public function loser()
    {
        return $this->belongsTo(User::class, "loser_user_id");
    }

    public function player1()
    {
        return $this->belongsTo(User::class, 'player1_user_id');
    }

    public function player2()
    {
        return $this->belongsTo(User::class, 'player2_user_id');
    }

    public function gameMatch()
    {
        return $this->belongsTo(\App\Models\Match::class, 'match_id');
    }

    public function transactions()
    {
        return $this->hasMany(CoinTransaction::class);
    }

    public function tricks()
    {
        return $this->hasMany(GameTrick::class)->orderBy('trick_number');
    }
}
