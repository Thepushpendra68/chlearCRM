const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Get user preferences (create default if not exists)
 */
const getUserPreferences = async (userId) => {
  try {
    const supabase = supabaseAdmin;

    // Try to get existing preferences
    let { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If not found, create default preferences
    if (error && error.code === 'PGRST116') {
      const { data: newPreferences, error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          // Defaults are set by database
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default preferences:', insertError);
        throw new ApiError('Failed to create user preferences', 500);
      }

      preferences = newPreferences;
    } else if (error) {
      console.error('Error fetching user preferences:', error);
      throw new ApiError('Failed to fetch user preferences', 500);
    }

    return preferences;
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    throw new ApiError('Failed to get user preferences', 500);
  }
};

/**
 * Update user preferences
 */
const updateUserPreferences = async (userId, preferencesData) => {
  try {
    const supabase = supabaseAdmin;

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Only update provided fields
    const allowedFields = [
      'theme',
      'items_per_page',
      'default_view',
      'dashboard_widgets',
      'email_notifications',
      'email_lead_assigned',
      'email_lead_updated',
      'email_task_assigned',
      'email_task_due',
      'email_daily_digest',
      'email_weekly_digest',
      'in_app_notifications',
      'date_format',
      'time_format'
    ];

    allowedFields.forEach(field => {
      if (preferencesData[field] !== undefined) {
        updateData[field] = preferencesData[field];
      }
    });

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    let preferences;

    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user preferences:', error);
        throw new ApiError('Failed to update user preferences', 500);
      }

      preferences = data;
    } else {
      // Create new preferences with provided data
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...updateData
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user preferences:', error);
        throw new ApiError('Failed to create user preferences', 500);
      }

      preferences = data;
    }

    return preferences;
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    throw new ApiError('Failed to update user preferences', 500);
  }
};

/**
 * Reset user preferences to defaults
 */
const resetUserPreferences = async (userId) => {
  try {
    const supabase = supabaseAdmin;

    // Delete existing preferences (will be recreated with defaults on next fetch)
    const { error: deleteError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting user preferences:', deleteError);
      throw new ApiError('Failed to reset user preferences', 500);
    }

    // Create new default preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating default preferences:', error);
      throw new ApiError('Failed to reset user preferences', 500);
    }

    return preferences;
  } catch (error) {
    console.error('Error in resetUserPreferences:', error);
    throw new ApiError('Failed to reset user preferences', 500);
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  resetUserPreferences
};
