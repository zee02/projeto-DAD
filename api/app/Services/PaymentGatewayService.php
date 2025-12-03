<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PaymentGatewayService
{
    /**
     * Process payment through external gateway
     * This is a simulated payment gateway service
     * 
     * @param array $paymentData
     * @return array ['success' => bool, 'transaction_id' => string, 'message' => string]
     */
    public function processPayment($paymentData)
    {
        try {
            // Simulated API call to external payment gateway
            // In production, this would call a real payment provider
            $response = $this->callPaymentGateway($paymentData);

            if ($response['success']) {
                return [
                    'success' => true,
                    'transaction_id' => $response['transaction_id'] ?? $this->generateTransactionId(),
                    'message' => 'Payment processed successfully',
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $response['message'] ?? 'Payment failed',
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Payment gateway error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Simulated payment gateway API call
     * 
     * @param array $paymentData
     * @return array
     */
    private function callPaymentGateway($paymentData)
    {
        // In a real scenario, you would do something like:
        // $response = Http::withHeaders([
        //     'Authorization' => 'Bearer ' . config('services.payment_gateway.token'),
        // ])->post(config('services.payment_gateway.url') . '/process', $paymentData);
        
        // For now, we simulate the response
        // Success rate: 95% (5% of payments fail randomly)
        $successRate = rand(1, 100);
        
        if ($successRate <= 95) {
            // Simulate successful payment
            return [
                'success' => true,
                'transaction_id' => $this->generateTransactionId(),
                'message' => 'Payment authorized',
            ];
        } else {
            // Simulate payment failure
            return [
                'success' => false,
                'message' => 'Payment declined by card issuer',
            ];
        }
    }

    /**
     * Generate unique transaction ID
     * 
     * @return string
     */
    private function generateTransactionId()
    {
        return 'TXN_' . strtoupper(uniqid('', true)) . '_' . time();
    }

    /**
     * Validate payment data format
     * 
     * @param string $paymentType
     * @param string $paymentReference
     * @return bool
     */
    public function validatePaymentFormat($paymentType, $paymentReference)
    {
        switch ($paymentType) {
            case 'MBWAY':
                return preg_match('/^\d{9}$/', $paymentReference);
            case 'VISA':
                return preg_match('/^\d{16}$/', $paymentReference);
            case 'IBAN':
                return preg_match('/^[A-Z]{2}\d{23}$/', $paymentReference);
            case 'MB':
                return preg_match('/^\d{14}$/', $paymentReference);
            case 'PAYPAL':
                return filter_var($paymentReference, FILTER_VALIDATE_EMAIL);
            default:
                return false;
        }
    }

    /**
     * Calculate coins based on euros (1 euro = 10 coins)
     * 
     * @param float $euros
     * @return int
     */
    public function calculateCoins($euros)
    {
        return (int)($euros * 10);
    }
}
