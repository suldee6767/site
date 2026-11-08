export interface ProjectItem {
  id: string;
  title: string;
  path: string;
  customFullUrl?: string;
  imageUrl?: string;
  description: string;
  longDescription: string;
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
