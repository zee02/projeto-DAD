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
            'name' => 'sometimes|nullable|string|max:255',
            'nickname' => 'sometimes|nullable|string|max:255|unique:users,nickname,' . $this->user()->id,
            'bio' => 'sometimes|nullable|string|max:1000',
        ];
    }

    public function messages()
    {
        return [
            'nickname.unique' => 'This nickname is already taken.',
            'nickname.string' => 'Nickname must be a string.',
            'bio.string' => 'Bio must be a string.',
        ];
    }
}
