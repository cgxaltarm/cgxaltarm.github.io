// Migration 002: Add DailyFlo managed API keys, quotas, sessions, and audit log tables
163	export default {
164	  version: 2,
165	  name: "dailyflo-managed-keys",
166	  up(db) {
167	    db.exec(`
168	      CREATE TABLE IF NOT EXISTS managed_api_keys (
169	        id TEXT PRIMARY KEY,
170	        public_id TEXT UNIQUE NOT NULL,
171	        secret_digest TEXT NOT NULL,
172	        label TEXT NOT NULL,
173	        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'revoked')),
174	        total_token_limit INTEGER,
175	        tokens_used INTEGER NOT NULL DEFAULT 0,
176	        reserved_tokens INTEGER NOT NULL DEFAULT 0,
177	        max_output_tokens INTEGER,
178	        requests_per_minute INTEGER,
179	        tokens_per_minute INTEGER,
180	        max_concurrent_requests INTEGER,
181	        expires_at TEXT,
182	        created_at TEXT NOT NULL,
183	        updated_at TEXT NOT NULL,
184	        last_used_at TEXT,
185	        revoked_at TEXT
186	      );
187	      CREATE INDEX IF NOT EXISTS idx_mak_public_id ON managed_api_keys(public_id);
188	      CREATE INDEX IF NOT EXISTS idx_mak_status ON managed_api_keys(status);
189
190	      CREATE TABLE IF NOT EXISTS managed_api_key_models (
191	        key_id TEXT NOT NULL REFERENCES managed_api_keys(id) ON DELETE CASCADE,
192	        model_id TEXT NOT NULL,
193	        PRIMARY KEY (key_id, model_id)
194	      );
195	      CREATE INDEX IF NOT EXISTS idx_makm_key ON managed_api_key_models(key_id);
196
197	      CREATE TABLE IF NOT EXISTS managed_key_usage_events (
198	        id TEXT PRIMARY KEY,
199	        key_id TEXT NOT NULL REFERENCES managed_api_keys(id) ON DELETE CASCADE,
200	        request_id TEXT UNIQUE NOT NULL,
201	        model TEXT NOT NULL,
202	        provider TEXT,
203	        input_tokens INTEGER NOT NULL DEFAULT 0,
204	        output_tokens INTEGER NOT NULL DEFAULT 0,
205	        cached_tokens INTEGER NOT NULL DEFAULT 0,
206	        reasoning_tokens INTEGER NOT NULL DEFAULT 0,
207	        charged_tokens INTEGER NOT NULL DEFAULT 0,
208	        usage_source TEXT NOT NULL DEFAULT 'unknown',
209	        charge_policy_version INTEGER NOT NULL DEFAULT 1,
210	        created_at TEXT NOT NULL
211	      );
212	      CREATE INDEX IF NOT EXISTS idx_mkue_key ON managed_key_usage_events(key_id);
213	      CREATE INDEX IF NOT EXISTS idx_mkue_req ON managed_key_usage_events(request_id);
214
215	      CREATE TABLE IF NOT EXISTS managed_key_quota_reservations (
216	        id TEXT PRIMARY KEY,
217	        key_id TEXT NOT NULL REFERENCES managed_api_keys(id) ON DELETE CASCADE,
218	        request_id TEXT UNIQUE NOT NULL,
219	        reserved_tokens INTEGER NOT NULL,
220	        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'released', 'expired')),
221	        created_at TEXT NOT NULL,
222	        settled_at TEXT
223	      );
224	      CREATE INDEX IF NOT EXISTS idx_mkqr_key ON managed_key_quota_reservations(key_id);
225	      CREATE INDEX IF NOT EXISTS idx_mkqr_req ON managed_key_quota_reservations(request_id);
226
227	      CREATE TABLE IF NOT EXISTS managed_key_concurrency_leases (
228	        id TEXT PRIMARY KEY,
229	        key_id TEXT NOT NULL REFERENCES managed_api_keys(id) ON DELETE CASCADE,
230	        request_id TEXT UNIQUE NOT NULL,
231	        created_at TEXT NOT NULL
232	      );
233	      CREATE INDEX IF NOT EXISTS idx_mkcl_key ON managed_key_concurrency_leases(key_id);
234
235	      CREATE TABLE IF NOT EXISTS managed_key_rate_buckets (
236	        key_id TEXT NOT NULL REFERENCES managed_api_keys(id) ON DELETE CASCADE,
237	        window_minute TEXT NOT NULL,
238	        request_count INTEGER NOT NULL DEFAULT 0,
239	        token_count INTEGER NOT NULL DEFAULT 0,
240	        PRIMARY KEY (key_id, window_minute)
241	      );
242
243	      CREATE TABLE IF NOT EXISTS managed_key_dashboard_sessions (
244	        id TEXT PRIMARY KEY,
245	        key_id TEXT NOT NULL REFERENCES managed_api_keys(id) ON DELETE CASCADE,
246	        token_hash TEXT UNIQUE NOT NULL,
247	        expires_at TEXT NOT NULL,
248	        created_at TEXT NOT NULL,
249	        last_seen_at TEXT NOT NULL
250	      );
251	      CREATE INDEX IF NOT EXISTS idx_mkds_hash ON managed_key_dashboard_sessions(token_hash);
252
253	      CREATE TABLE IF NOT EXISTS managed_key_audit_logs (
254	        id TEXT PRIMARY KEY,
255	        key_id TEXT REFERENCES managed_api_keys(id) ON DELETE SET NULL,
256	        action TEXT NOT NULL,
257	        actor TEXT NOT NULL,
258	        details TEXT NOT NULL,
259	        created_at TEXT NOT NULL
260	      );
261	      CREATE INDEX IF NOT EXISTS idx_mkal_key ON managed_key_audit_logs(key_id);
262	    `);
263	  },
264	};
265