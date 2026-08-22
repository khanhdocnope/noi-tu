import { Router } from 'express';
import { getSupabase } from '../../database/supabase/client.js';

export const petsRouter = Router();

petsRouter.get('/', async (_req, res) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .order('level', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

petsRouter.get('/:userId', async (req, res) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', req.params.userId)
    .single();

  if (error) return res.status(404).json({ error: 'Pet not found' });
  res.json(data);
});

petsRouter.put('/:userId', async (req, res) => {
  const supabase = getSupabase();
  const { level, xp, health, hunger, energy, mood, bond } = req.body;

  const { data, error } = await supabase
    .from('pets')
    .update({ level, xp, health, hunger, energy, mood, bond, updated_at: new Date().toISOString() })
    .eq('user_id', req.params.userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

petsRouter.delete('/:userId', async (req, res) => {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('user_id', req.params.userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
