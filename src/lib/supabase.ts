import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return { url, anonKey }
}

let _client: SupabaseClient | null = null

function initClient(): SupabaseClient {
  if (_client) return _client
  const { url, anonKey } = getEnv()
  if (!url) {
    throw new Error('supabaseUrl is required. Set NEXT_PUBLIC_SUPABASE_URL.')
  }
  if (!anonKey) {
    throw new Error('supabaseAnonKey is required. Set NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  _client = createClient(url, anonKey, {
    auth: { persistSession: false },
  })
  return _client
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = initClient()
    // @ts-expect-error - proxying SupabaseClient properties
    return client[prop]
  },
})
