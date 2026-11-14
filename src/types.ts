export interface ProjectItem {
  id: string;
  title: string;
  path: string;
  customFullUrl?: string;
  imageUrl?: string;
  description: string;
  longDescription: string;
  projectType: 'website' | 'game';
  category: 'career' | 'media' | 'games' | 'creative';
  categoryLabel: string;
  tag: string;
  icon: string;
  accentColor: 'indigo' | 'rose' | 'emerald' | 'amber' | 'cyan';
  features: string[];
  tags: string[];
}

export interface SkillItem {
  name: string;
  category: string;
  level: number;
}

export interface AnimeQuestion {
  emoji: string;
  image: string;
  answer: string;
  options: string[];
}

export interface CharacterQuestion {
  name: string;
  anime: string;
  image: string;
  answer: string;
  options: string[];
}

export interface AnimeGameData {
  questions: AnimeQuestion[];
  characters: CharacterQuestion[];
}

export type GameMode = 'emoji' | 'anime' | 'character';
export type DifficultyMode = 'normal' | 'hard' | 'god';
