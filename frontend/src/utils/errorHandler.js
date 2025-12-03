/**
 * Extract user-friendly error message from various error types
 */
export const getErrorMessage = (error) => {
  // Handle validation errors (422)
  if (error.response?.status === 422 && error.response?.data?.errors) {
    const errors = error.response.data.errors
    // Get first error from validation errors
    for (const field in errors) {
      if (Array.isArray(errors[field]) && errors[field].length > 0) {
        return errors[field][0]
      }
    }
  }

  // Handle API message response
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  // Handle custom error messages
  if (error.message) {
    return error.message
  }

  // Network errors
  if (!error.response) {
    return 'Network error. Please check your connection.'
  }

  // Generic error
  return 'An error occurred. Please try again.'
}

/**
 * Extract all validation errors as an object
 */
export const getValidationErrors = (error) => {
  if (error.response?.status === 422 && error.response?.data?.errors) {
    return error.response.data.errors
  }
  return {}
}
