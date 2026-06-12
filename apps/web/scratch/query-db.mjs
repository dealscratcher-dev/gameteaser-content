import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ghrnooiajxutntldybrb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdocm5vb2lhanh1dG50bGR5YnJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzNTQyMywiZXhwIjoyMDk2MjExNDIzfQ.G1LT2axsbj_OiGGYnXALT50TRDaxzqAkihBCFx3Tt-o"
);

async function main() {
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("status", "published");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${data?.length || 0} published content items:`);
  console.log(JSON.stringify(data.map(d => ({
    id: d.id,
    type: d.type,
    title: d.title,
    slug: d.slug,
    release_date: d.release_date,
    tags: d.tags,
    metadata: d.metadata
  })), null, 2));
}

main();
