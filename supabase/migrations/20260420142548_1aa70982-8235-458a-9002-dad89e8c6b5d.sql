
-- Reports storage bucket (privado, somente o dono lê)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can write reports"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Service role can update reports"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'reports');
