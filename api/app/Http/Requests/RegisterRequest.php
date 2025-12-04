<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|max:255',
            'nickname' => 'nullable|string|max:255|unique:users,nickname',
            'password' => 'required|string|min:3|confirmed',
        ];
    }
}
