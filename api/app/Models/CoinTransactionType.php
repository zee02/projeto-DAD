<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CoinTransactionType extends Model
{
    use SoftDeletes;

    public $timestamps = false;

    protected $fillable = [
        'name',
        'type',
    ];

    public function transactions()
    {
        return $this->hasMany(CoinTransaction::class, 'coin_transaction_type_id');
    }
}
