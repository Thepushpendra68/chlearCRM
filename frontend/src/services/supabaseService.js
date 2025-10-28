/**
 * Supabase API Service
 * Base service for making API calls to the Supabase-enabled backend
 * This service handles authentication and provides common API utilities
 */

import supabase from '../config/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Base API service class with Supabase authentication
 */
class SupabaseService {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
  }

  /**
   * Get current user's auth token
   */
  async getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  /**
   * Make authenticated API request
   */
  async apiRequest(endpoint, options = {}) {
    const token = await this.getAuthToken()

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    }

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, finalOptions)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint

    return this.apiRequest(url, {
      method: 'GET'
    })
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.apiRequest(endpoint, {
      method: 'DELETE'
    })
  }

  /**
   * Direct Supabase operations (bypassing backend API)
   */

  /**
   * Get data from Supabase table
   */
  async getFromTable(tableName, options = {}) {
    let query = supabase.from(tableName).select(options.select || '*')

    // Apply filters
    if (options.filters) {
      options.filters.forEach(filter => {
        query = query[filter.method](...filter.args)
      })
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending })
    }

    // Apply pagination
    if (options.range) {
      query = query.range(options.range.from, options.range.to)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return { data, count }
  }

  /**
   * Insert data into Supabase table
   */
  async insertToTable(tableName, data) {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()

    if (error) {
      throw error
    }

    return result
  }

  /**
   * Update data in Supabase table
   */
  async updateTable(tableName, data, filter) {
    let query = supabase.from(tableName).update(data)

    // Apply filter
    if (filter) {
      query = query[filter.method](...filter.args)
    }

    const { data: result, error } = await query.select()

    if (error) {
      throw error
    }

    return result
  }

  /**
   * Delete from Supabase table
   */
  async deleteFromTable(tableName, filter) {
    let query = supabase.from(tableName).delete()

    // Apply filter
    if (filter) {
      query = query[filter.method](...filter.args)
    }

    const { error } = await query

    if (error) {
      throw error
    }

    return true
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToTable(tableName, callback, options = {}) {
    let channel = supabase.channel(`${tableName}-changes`)

    const subscription = channel.on(
      'postgres_changes',
      {
        event: options.event || '*',
        schema: 'public',
        table: tableName,
        ...(options.filter && { filter: options.filter })
      },
      callback
    )

    subscription.subscribe()

    return {
      unsubscribe: () => channel.unsubscribe()
    }
  }
}

// Export singleton instance
export default new SupabaseService()