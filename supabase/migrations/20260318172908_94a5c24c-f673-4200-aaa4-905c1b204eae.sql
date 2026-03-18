CREATE TABLE public.password_setup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_setup_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_password_setup_tokens_token ON public.password_setup_tokens (token);
CREATE INDEX idx_password_setup_tokens_user_id ON public.password_setup_tokens (user_id);