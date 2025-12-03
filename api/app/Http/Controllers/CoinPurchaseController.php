<?php

namespace App\Http\Controllers;

use App\Http\Requests\CoinPurchaseRequest;
use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CoinPurchaseController extends Controller
{
    private $paymentGateway;

    public function __construct(PaymentGatewayService $paymentGateway)
    {
        $this->paymentGateway = $paymentGateway;
    }

    /**
     * Process coin purchase
     * POST /coin-purchase/buy
     */
    public function buy(CoinPurchaseRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        try {
            // Process payment through gateway
            $paymentResult = $this->paymentGateway->processPayment($validated);

            if (!$paymentResult['success']) {
                return response()->json([
                    'message' => $paymentResult['message'],
                ], 422);
            }

            // Use transaction to ensure data consistency
            $purchase = DB::transaction(function () use ($user, $validated, $paymentResult) {
                // Calculate coins from euros (1 euro = 10 coins)
                $coins = $this->paymentGateway->calculateCoins($validated['euros']);

                // Create coin transaction (Credit)
                $transaction = CoinTransaction::create([
                    'transaction_datetime' => now(),
                    'user_id' => $user->id,
                    'coin_transaction_type_id' => 2, // Coin purchase type ID
                    'coins' => $coins,
                ]);

                // Create coin purchase record
                $purchase = CoinPurchase::create([
                    'purchase_datetime' => now(),
                    'user_id' => $user->id,
                    'coin_transaction_id' => $transaction->id,
                    'euros' => $validated['euros'],
                    'payment_type' => $validated['payment_type'],
                    'payment_reference' => $validated['payment_reference'],
                ]);

                // Update user coins balance
                $user->increment('coins_balance', $coins);

                return $purchase;
            });

            return response()->json([
                'message' => 'Coins purchased successfully!',
                'transaction_id' => $paymentResult['transaction_id'],
                'coins_purchased' => $this->paymentGateway->calculateCoins($validated['euros']),
                'new_balance' => $user->fresh()->coins_balance,
                'purchase' => $purchase,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get purchase history for authenticated user
     * GET /coin-purchase/history
     */
    public function history(Request $request)
    {
        $user = $request->user();

        $purchases = CoinPurchase::where('user_id', $user->id)
            ->with('transaction')
            ->orderBy('purchase_datetime', 'desc')
            ->get()
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'purchase_datetime' => $purchase->purchase_datetime,
                    'euros' => $purchase->euros,
                    'coins' => $purchase->transaction->coins,
                    'payment_type' => $purchase->payment_type,
                    'status' => 'Completed', // All purchases are completed if they exist
                ];
            });

        return response()->json([
            'message' => 'Purchase history retrieved',
            'total_purchases' => $purchases->count(),
            'total_spent_euros' => $purchases->sum('euros'),
            'total_coins_purchased' => $purchases->sum('coins'),
            'purchases' => $purchases,
        ]);
    }
}
