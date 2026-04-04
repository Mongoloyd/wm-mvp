SELECT cron.schedule(
  'process-webhooks-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wkrcyxcnzhwjtdpmfpaf.supabase.co/functions/v1/process-webhook',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcmN5eGNuemh3anRkcG1mcGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTIxMDksImV4cCI6MjA4OTI4ODEwOX0._5MdqzJgBCDaGNvfqPbbrrDxAhM0Th4E9CMa6YL0aww"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);