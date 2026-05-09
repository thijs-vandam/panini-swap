// js/api.js
// Read-only Supabase client. Uses the public anon key.
// All writes go through Netlify Functions (service key, never in browser).

(function () {
  let _client = null;

  function getClient() {
    if (_client) return _client;
    _client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return _client;
  }

  window.api = {
    async fetchListings() {
      const { data, error } = await getClient()
        .from('listings')
        .select('id, display_name, neighborhood, doubles, missing, last_active')
        .eq('active', true)
        .gt('expires_at', new Date().toISOString());
      if (error) throw error;
      return data || [];
    },

    async getCount() {
      const { count, error } = await getClient()
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('active', true)
        .gt('expires_at', new Date().toISOString());
      if (error) return 0;
      return count || 0;
    },

    async callFunction(name, body) {
      const res = await fetch(`/.netlify/functions/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unknown error');
      return json;
    },
  };
})();
