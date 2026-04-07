import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return { url, serviceKey }
}

let _admin: SupabaseClient | null = null

function initAdminClient(): SupabaseClient {
  if (_admin) return _admin
  const { url, serviceKey } = getEnv()
  if (!url) {
    throw new Error('supabaseUrl is required. Set NEXT_PUBLIC_SUPABASE_URL.')
  }
  if (!serviceKey) {
    throw new Error('supabase service key is required. Set SUPABASE_SERVICE_ROLE_KEY.')
  }
  _admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
  return _admin
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = initAdminClient()
    // @ts-expect-error - proxying SupabaseClient properties
    return client[prop]
  },
})
