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
            // Call external payment gateway (debit API)
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
     * External payment gateway API call (debit)
     * 
     * @param array $paymentData
     * @return array
     */
    private function callPaymentGateway($paymentData)
    {
        $payload = [
            'type' => $paymentData['payment_type'] ?? null,
            'reference' => $paymentData['payment_reference'] ?? null,
            'value' => isset($paymentData['euros']) ? (int)$paymentData['euros'] : null,
        ];

        $baseUrl = config('services.payment_gateway.url');
        $token = config('services.payment_gateway.token');

        $http = Http::acceptJson();
        if (!empty($token)) {
            $http = $http->withToken($token);
        }

        $response = $http->post(rtrim($baseUrl, '/') . '/api/debit', $payload);

        if ($response->status() === 201) {
            $json = $response->json();
            return [
                'success' => true,
                'transaction_id' => $json['id'] ?? $json['transaction_id'] ?? null,
                'message' => $json['message'] ?? 'Payment authorized',
            ];
        }

        if ($response->status() === 422) {
            $json = $response->json();
            $message = $json['message'] ?? 'Payment validation failed';
            $errors = $json['errors'] ?? null;
            return [
                'success' => false,
                'message' => $message,
                'errors' => $errors,
            ];
        }

        return [
            'success' => false,
            'message' => 'Payment gateway returned status ' . $response->status(),
        ];
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
