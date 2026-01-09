import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all queued items ordered by created_at (FIFO - first created should publish first)
    const { data: queuedItems, error: fetchError } = await supabase
      .from("daily_published")
      .select("id, title, created_at, publish_date")
      .eq("status", "queued")
      .order("created_at", { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch queued items: ${fetchError.message}`);
    }

    if (!queuedItems || queuedItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No queued items to resequence", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Start from tomorrow
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    const updates: { id: string; oldDate: string; newDate: string; title: string }[] = [];

    // Update each item with consecutive dates
    for (let i = 0; i < queuedItems.length; i++) {
      const item = queuedItems[i];
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + i);
      
      const newDateStr = newDate.toISOString().split("T")[0]; // YYYY-MM-DD format

      const { error: updateError } = await supabase
        .from("daily_published")
        .update({ publish_date: newDateStr })
        .eq("id", item.id);

      if (updateError) {
        console.error(`Failed to update item ${item.id}:`, updateError);
        continue;
      }

      updates.push({
        id: item.id,
        oldDate: item.publish_date,
        newDate: newDateStr,
        title: item.title,
      });
    }

    // Calculate new end date
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + queuedItems.length - 1);
    const endDateStr = endDate.toISOString().split("T")[0];

    return new Response(
      JSON.stringify({
        success: true,
        message: `Resequenced ${updates.length} queued items`,
        updated: updates.length,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: endDateStr,
        },
        // Show first and last few updates for verification
        sampleUpdates: {
          first: updates.slice(0, 3),
          last: updates.slice(-3),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error resequencing queue:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
