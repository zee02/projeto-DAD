<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'sometimes|string|max:255',
            'nickname' => 'sometimes|string|max:255|unique:users,nickname,' . $this->user()->id,
            'bio' => 'sometimes|string|max:1000',
        ];
    }
}
