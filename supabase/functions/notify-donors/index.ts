import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Invoked by the app (with the requester's session JWT) after a request is posted.
// Finds searchable donors whose blood is compatible with the patient, in the same
// governorate, that have a push token, and sends them an Expo push notification.
Deno.serve(async (req) => {
  const payload = await req.json().catch(() => null);
  const record = payload?.record;
  if (!record?.blood_group || !record?.recipient_governorate) {
    return Response.json({ error: 'missing record fields' }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: groups, error: groupsError } = await supabase.rpc('compatible_donor_types', {
    recipient: record.blood_group,
  });
  if (groupsError) {
    return Response.json({ step: 'compatible_donor_types', error: groupsError.message }, { status: 500 });
  }

  const { data: donors, error: donorsError } = await supabase
    .from('profiles')
    .select('push_token')
    .in('blood_group', groups ?? [])
    .eq('governorate', record.recipient_governorate)
    .eq('is_searchable', true)
    .not('push_token', 'is', null)
    .neq('id', record.requester_id);
  if (donorsError) {
    return Response.json({ step: 'profiles', error: donorsError.message }, { status: 500 });
  }

  const tokens = (donors ?? []).map((d) => d.push_token).filter(Boolean);

  if (tokens.length > 0) {
    const count = tokens.length;
    const nearby =
      count > 1 ? `You're 1 of ${count} compatible donors nearby.` : `You're a compatible donor nearby.`;
    const place = record.hospital_name || record.recipient_city;
    const messages = tokens.map((to) => ({
      to,
      sound: 'default',
      title: `${record.blood_group} needed near ${record.recipient_city}`,
      body: `${record.recipient_name} needs ${record.blood_group} at ${place}. ${nearby}`,
      data: { requestId: record.id },
    }));
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  }

  return Response.json({ compatibleGroups: groups, matched: tokens.length, sent: tokens.length });
});
