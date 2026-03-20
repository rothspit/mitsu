const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://nuxojcydwxhecncbwjpb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51eG9qY3lkd3hoZWNuY2J3anBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODcxMTA1MywiZXhwIjoyMDg0Mjg3MDUzfQ.o7Ao02AkoQ6mhryIeiHVqVWZseZ35_l4x61-SaXhBC8';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
(async () => {
  const { data, error } = await supabase.storage.listBuckets();
  console.log(error ? error : data.map(b => b.name));
})();
