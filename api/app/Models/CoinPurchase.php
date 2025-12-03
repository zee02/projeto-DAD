<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinPurchase extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'purchase_datetime',
        'user_id',
        'coin_transaction_id',
        'euros',
        'payment_type',
        'payment_reference',
    ];

    protected $casts = [
        'purchase_datetime' => 'datetime',
        'euros' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transaction()
    {
        return $this->belongsTo(CoinTransaction::class, 'coin_transaction_id');
    }
}
