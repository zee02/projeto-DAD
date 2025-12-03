<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'transaction_datetime',
        'user_id',
        'match_id',
        'game_id',
        'coin_transaction_type_id',
        'coins',
    ];

    protected $casts = [
        'transaction_datetime' => 'datetime',
        'coins' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactionType()
    {
        return $this->belongsTo(CoinTransactionType::class, 'coin_transaction_type_id');
    }
}
