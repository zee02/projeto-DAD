<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CoinPurchaseRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'euros' => 'required|integer|min:1|max:99',
            'payment_type' => 'required|in:MBWAY,PAYPAL,IBAN,MB,VISA',
            'payment_reference' => 'required|string|max:30',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $this->validatePaymentReference($validator);
        });
    }

    private function validatePaymentReference($validator)
    {
        $paymentType = $this->payment_type;
        $reference = $this->payment_reference;

        switch ($paymentType) {
            case 'MBWAY':
                // MBWAY: 9 digits
                if (!preg_match('/^\d{9}$/', $reference)) {
                    $validator->errors()->add('payment_reference', 'MBWAY must be 9 digits.');
                }
                break;

            case 'VISA':
                // VISA: 16 digits
                if (!preg_match('/^\d{16}$/', $reference)) {
                    $validator->errors()->add('payment_reference', 'VISA card must be 16 digits.');
                }
                break;

            case 'IBAN':
                // IBAN: 2 letters + 23 digits
                if (!preg_match('/^[A-Z]{2}\d{23}$/', $reference)) {
                    $validator->errors()->add('payment_reference', 'IBAN must be 2 letters followed by 23 digits.');
                }
                break;

            case 'MB':
                // MB (Multibanco): 5 digits (entity) + 9 digits (reference) = 14 digits total
                if (!preg_match('/^\d{5}\d{9}$/', $reference)) {
                    $validator->errors()->add('payment_reference', 'Multibanco must be 5 digits (entity) + 9 digits (reference).');
                }
                break;

            case 'PAYPAL':
                // PAYPAL: email format
                if (!filter_var($reference, FILTER_VALIDATE_EMAIL)) {
                    $validator->errors()->add('payment_reference', 'PayPal must be a valid email address.');
                }
                break;
        }
    }

    public function messages()
    {
        return [
            'euros.required' => 'Amount in euros is required.',
            'euros.integer' => 'Amount must be an integer.',
            'euros.min' => 'Minimum amount is €1.',
            'euros.max' => 'Maximum amount is €99.',
            'payment_type.required' => 'Payment type is required.',
            'payment_type.in' => 'Invalid payment type.',
            'payment_reference.required' => 'Payment reference is required.',
            'payment_reference.max' => 'Payment reference cannot exceed 30 characters.',
        ];
    }
}
