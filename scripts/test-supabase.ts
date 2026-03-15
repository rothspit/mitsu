import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  const brandId = 'a1876a1a-1b51-4970-b25e-893ce0910690'
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  if (jstNow.getUTCHours() < 8) jstNow.setUTCDate(jstNow.getUTCDate() - 1)
  const today = jstNow.toISOString().slice(0, 10)
  
  console.log('Query date:', today)
  const { data, error } = await supabase
    .from('schedules')
    .select('*, girl:girls(*), area:areas(id, name, slug)')
    .eq('brand_id', brandId)
    .eq('date', today)
    .eq('status', 'working')
    .not('start_time', 'is', null)

  if (error) { console.error(error); return; }
  
  console.log('Total schedules:', data.length)
  console.log('Null area:', data.filter(d => !d.area_id).length)
  console.log('Nishifuna area:', data.filter(d => d.area?.slug === 'nishifunabashi').length)
  console.log('Kasai area:', data.filter(d => d.area?.slug === 'kasai').length)
}

test()
