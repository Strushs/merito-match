const { createClient } = require("@supabase/supabase-js");

// USAGE:
// 1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local
// 2. npx tsx scripts/verify-match.ts (or node if converted)
// We will use standard JS for simplicity.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env vars. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log("🔄 Starting verification...");

  // 1. Create User A
  const emailA = `test_a_${Date.now()}@student.gdansk.merito.pl`;
  const {
    data: { user: userA },
    error: errA,
  } = await supabase.auth.admin.createUser({
    email: emailA,
    email_confirm: true,
    user_metadata: {},
  });
  if (errA) throw errA;
  console.log(`✅ Created User A: ${emailA} (${userA.id})`);

  // 2. Create User B
  const emailB = `test_b_${Date.now()}@student.gdansk.merito.pl`;
  const {
    data: { user: userB },
    error: errB,
  } = await supabase.auth.admin.createUser({
    email: emailB,
    email_confirm: true,
  });
  if (errB) throw errB;
  console.log(`✅ Created User B: ${emailB} (${userB.id})`);

  // 3. Create Profiles
  await supabase.from("profiles").insert([
    {
      id: userA.id,
      email: emailA,
      semester: 1,
      study_field: "Computer Science",
      intent: "Relationship",
      bio: "I am User A",
      avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${emailA}`,
    },
    {
      id: userB.id,
      email: emailB,
      semester: 3,
      study_field: "Psychology",
      intent: "Relationship",
      bio: "I am User B",
      avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${emailB}`,
    },
  ]);
  console.log("✅ Profiles Created");

  // 4. User A likes User B
  console.log("🔄 User A liking User B...");
  // Logic from `likeUser` action:
  // Check if B liked A? No.
  // Insert Like.
  await supabase.from("likes").insert({
    from_user: userA.id,
    to_user: userB.id,
    status: "pending",
  });
  console.log("✅ User A liked User B");

  // 5. User B likes User A (Trigger Match)
  console.log("🔄 User B liking User A (Should Match)...");

  // Check if A liked B? Yes.
  const { data: likedBack } = await supabase
    .from("likes")
    .select("*")
    .eq("from_user", userA.id)
    .eq("to_user", userB.id)
    .single();

  if (likedBack) {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        user_a: userB.id,
        user_b: userA.id,
      })
      .select()
      .single();

    if (matchError) throw matchError;

    // Update A's like status
    await supabase
      .from("likes")
      .update({ status: "accepted" })
      .eq("id", likedBack.id);

    // Insert B's like as accepted
    await supabase.from("likes").insert({
      from_user: userB.id,
      to_user: userA.id,
      status: "accepted",
    });

    console.log(`🎉 MATCH CREATED! Match ID: ${match.id}`);

    // 6. Send Message
    console.log("🔄 User A sending message...");
    await supabase.from("messages").insert({
      match_id: match.id,
      sender_id: userA.id,
      content: "Hello World!",
    });
    console.log("✅ Message sent");
  } else {
    console.error("❌ Failed to detect like back.");
  }

  // Cleanup (optional)
  // await supabase.auth.admin.deleteUser(userA.id);
  // await supabase.auth.admin.deleteUser(userB.id);
}

main().catch((e) => console.error(e));
