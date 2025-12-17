/**
 * API Client for communicating with Laravel backend
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:8000/api';

/**
 * Save a game trick to the database
 */
export async function saveTrick(trickData) {
  try {
    const response = await fetch(`${API_BASE_URL}/game-tricks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(trickData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to save trick:', error);
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving trick:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save multiple tricks in batch
 */
export async function saveTricks(tricksData) {
  try {
    const response = await fetch(`${API_BASE_URL}/game-tricks/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ tricks: tricksData }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to save tricks:', error);
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving tricks:', error);
    return { success: false, error: error.message };
  }
}
