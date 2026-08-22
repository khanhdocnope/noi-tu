import { Router } from 'express';
import { getSupabase } from '../../database/supabase/client.js';

export const speciesRouter = Router();

speciesRouter.get('/', async (_req, res) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('species')
    .select('*')
    .order('spawn_weight', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

speciesRouter.post('/', async (req, res) => {
  const supabase = getSupabase();
  const { id, name, description, rarity, spawn_weight, base_stats } = req.body;

  const { data, error } = await supabase
    .from('species')
    .insert({ id, name, description, rarity, spawn_weight, base_stats })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

speciesRouter.put('/:id', async (req, res) => {
  const supabase = getSupabase();
  const { name, description, rarity, spawn_weight, base_stats } = req.body;

  const { data, error } = await supabase
    .from('species')
    .update({ name, description, rarity, spawn_weight, base_stats })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

speciesRouter.delete('/:id', async (req, res) => {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('species')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
