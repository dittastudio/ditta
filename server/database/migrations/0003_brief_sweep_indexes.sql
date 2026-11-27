-- The sweep's queries (server/tasks/brief/sweep.ts), each read through an index of only the rows it's after. D1 counts
-- rows read, so without these every run read the whole table. Partial, since the sweep only ever asks one shape of
-- question of each status.
DROP INDEX briefs_status_created;

-- Failed PDF renders, so the sweep stops trying a brief whose PDF won't render (after BRIEF_PDF_MAX_ATTEMPTS)
ALTER TABLE briefs ADD COLUMN pdf_attempts INTEGER NOT NULL DEFAULT 0;

CREATE INDEX briefs_pending_updated ON briefs (updated_at) WHERE status = 'pending';
CREATE INDEX briefs_confirmed_at ON briefs (confirmed_at) WHERE status = 'confirmed';
CREATE INDEX briefs_unnotified ON briefs (confirmed_at) WHERE status = 'confirmed' AND notified_at IS NULL;
CREATE INDEX briefs_unarchived ON briefs (confirmed_at)
  WHERE status = 'confirmed' AND notified_at IS NOT NULL AND pdf_key IS NULL AND pdf_attempts < 3;
