export interface Pet {
  user_id: string;
  species: string;
  name: string;
  level: number;
  xp: number;
  health: number;
  hunger: number;
  energy: number;
  mood: number;
  bond: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePetInput {
  user_id: string;
  species: string;
  name: string;
}

export interface UpdatePetInput {
  level?: number;
  xp?: number;
  health?: number;
  hunger?: number;
  energy?: number;
  mood?: number;
  bond?: number;
}

export interface Species {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  spawn_weight: number;
  base_stats: {
    health: number;
    hunger: number;
    energy: number;
    mood: number;
  };
}

export interface PetStats {
  health: number;
  hunger: number;
  energy: number;
  mood: number;
  bond: number;
}
