-- The confirmed brief's PDF in R2 (server/utils/briefPdf.ts), once it has been rendered. Null until then: the emails
-- go without it if rendering fails, and the sweep archives it later.
ALTER TABLE briefs ADD COLUMN pdf_key TEXT;
