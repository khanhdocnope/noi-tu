-- Function to increment coin atomically
CREATE OR REPLACE FUNCTION increment_coin(p_user_id TEXT, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET coin = coin + p_amount WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
