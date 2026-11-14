import projectCreativeWeb from '../assets/images/project_creative_web_1794108003612.jpg';
import projectDreamJob from '../assets/images/project_dream_job_1794108005400.jpg';
import projectYoutubeCreator from '../assets/images/project_youtube_creator_1794108004774.jpg';
import projectWebGames from '../assets/images/project_web_games_1794108005222.jpg';
import projectPastureGame from '../assets/images/project_pasture_game_1794108005198.jpg';

import realCharLuffy from '../assets/images/real/char_luffy.jpg';
import realCharNaruto from '../assets/images/real/char_naruto.jpg';
import realCharGoku from '../assets/images/real/char_goku.jpg';

import realAnimeNaruto from '../assets/images/real/anime_naruto.jpg';
import realAnimeOnePiece from '../assets/images/real/anime_one_piece.jpg';
import realAnimeDeathNote from '../assets/images/real/anime_death_note.jpg';
import realAnimeDemonSlayer from '../assets/images/real/anime_demon_slayer.jpg';
import realAnimeOnePunchMan from '../assets/images/real/anime_one_punch_man.jpg';
import realAnimeMyHeroAcademia from '../assets/images/real/anime_my_hero_academia.jpg';
import realAnimeJujutsuKaisen from '../assets/images/real/anime_jujutsu_kaisen.jpg';
import realAnimeDragonBallZ from '../assets/images/real/anime_dragon_ball_z.jpg';
import realAnimeBlueLock from '../assets/images/real/anime_blue_lock.jpg';
import realAnimeHaikyuu from '../assets/images/real/anime_haikyuu.jpg';
import realAnimeChainsawMan from '../assets/images/real/anime_chainsaw_man.jpg';
import realAnimeAnother from '../assets/images/real/anime_another.jpg';
import realAnimeDrStone from '../assets/images/real/anime_dr_stone.jpg';
import realAnimeSteinsGate from '../assets/images/real/anime_steins_gate.jpg';
import realAnimeFoodWars from '../assets/images/real/anime_food_wars.jpg';
import realAnimeHellsing from '../assets/images/real/anime_hellsing.jpg';
import realAnimeKiki from '../assets/images/real/anime_kiki.jpg';
import realAnimeMobPsycho100 from '../assets/images/real/anime_mob_psycho_100.jpg';
import realAnimeAssassinationClassroom from '../assets/images/real/anime_assassination_classroom.jpg';
import realAnimeSpyXFamily from '../assets/images/real/anime_spy_x_family.jpg';

const ASSET_MAP: Record<string, string> = {
  '/src/assets/images/project_creative_web_1794108003612.jpg': projectCreativeWeb,
  '/src/assets/images/project_dream_job_1794108005400.jpg': projectDreamJob,
  '/src/assets/images/project_youtube_creator_1794108004774.jpg': projectYoutubeCreator,
  '/src/assets/images/project_web_games_1794108005222.jpg': projectWebGames,
  '/src/assets/images/project_pasture_game_1794108005198.jpg': projectPastureGame,

  '/src/assets/images/real/char_luffy.jpg': realCharLuffy,
  '/src/assets/images/real/char_naruto.jpg': realCharNaruto,
  '/src/assets/images/real/char_goku.jpg': realCharGoku,

  '/src/assets/images/real/anime_naruto.jpg': realAnimeNaruto,
  '/src/assets/images/real/anime_one_piece.jpg': realAnimeOnePiece,
  '/src/assets/images/real/anime_death_note.jpg': realAnimeDeathNote,
  '/src/assets/images/real/anime_demon_slayer.jpg': realAnimeDemonSlayer,
  '/src/assets/images/real/anime_one_punch_man.jpg': realAnimeOnePunchMan,
  '/src/assets/images/real/anime_my_hero_academia.jpg': realAnimeMyHeroAcademia,
  '/src/assets/images/real/anime_jujutsu_kaisen.jpg': realAnimeJujutsuKaisen,
  '/src/assets/images/real/anime_dragon_ball_z.jpg': realAnimeDragonBallZ,
  '/src/assets/images/real/anime_blue_lock.jpg': realAnimeBlueLock,
  '/src/assets/images/real/anime_haikyuu.jpg': realAnimeHaikyuu,
  '/src/assets/images/real/anime_chainsaw_man.jpg': realAnimeChainsawMan,
  '/src/assets/images/real/anime_another.jpg': realAnimeAnother,
  '/src/assets/images/real/anime_dr_stone.jpg': realAnimeDrStone,
  '/src/assets/images/real/anime_steins_gate.jpg': realAnimeSteinsGate,
  '/src/assets/images/real/anime_food_wars.jpg': realAnimeFoodWars,
  '/src/assets/images/real/anime_hellsing.jpg': realAnimeHellsing,
  '/src/assets/images/real/anime_kiki.jpg': realAnimeKiki,
  '/src/assets/images/real/anime_mob_psycho_100.jpg': realAnimeMobPsycho100,
  '/src/assets/images/real/anime_assassination_classroom.jpg': realAnimeAssassinationClassroom,
  '/src/assets/images/real/anime_spy_x_family.jpg': realAnimeSpyXFamily,
};

export function resolveAssetImage(path?: string): string {
  if (!path) return '';
  return ASSET_MAP[path] || path;
}
