import { Router } from 'express';
import { getSupabase } from '../../database/supabase/client.js';

export const usersRouter = Router();

usersRouter.get('/', async (_req, res) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('coin', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

usersRouter.get('/:userId', async (req, res) => {
  const supabase = getSupabase();
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', req.params.userId)
    .single();

  if (userError) return res.status(404).json({ error: 'User not found' });

  const { data: pet } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', req.params.userId)
    .single();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false })
    .limit(50);

  res.json({ ...user, pet, transactions });
});

usersRouter.get('/:userId/transactions', async (req, res) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
