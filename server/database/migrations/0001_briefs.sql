-- Sent briefs (docs/plans/brief-builder.md, "Storage"). A brief is pending until its email link is clicked, then
-- confirmed and locked. Times are Unix milliseconds.
CREATE TABLE briefs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  -- The parsed answers as JSON, so the table stays the same as the questions change
  answers TEXT NOT NULL,
  -- SHA-256 of the email link's token, never the token. Replaced on every send, and kept once confirmed so a second
  -- click can say when the brief arrived.
  token_hash TEXT NOT NULL,
  token_expires_at INTEGER NOT NULL,
  -- SHA-256 of the draft cookie, tying resends and edits to the browser that sent the brief
  owner_hash TEXT NOT NULL,
  send_count INTEGER NOT NULL DEFAULT 1,
  last_sent_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  -- When the team's email and the client's copy went. Null on a confirmed brief means they're still to retry.
  notified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX briefs_token_hash ON briefs (token_hash);
CREATE INDEX briefs_status_created ON briefs (status, created_at);
