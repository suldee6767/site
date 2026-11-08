import { ProjectItem } from '../types.ts';

/**
 * Бүтээлүүдийн үндсэн жагсаалт (Array)
 * Нийт 5 төсөл:
 * 1. Шинэ бүтээлч вэб төсөл — https://inquisitive-griffin-2bf5da.netlify.app
 * 2. Мөрөөдлийн ажил — https://[НЕТЛИФАЙ].netlify.app/dream-job.html
 * 3. Миний YouTube — https://[НЕТЛИФАЙ].netlify.app/my-youtube.html
 * 4. Тоглоомын сайт — https://[НЕТЛИФАЙ].netlify.app/tusul.html
 * 5. Малаа хашаандаа — https://[НЕТЛИФАЙ].netlify.app/togloom.html
 */
export const PROJECTS_LIST: ProjectItem[] = [
  {
    id: 'creative-web',
    title: 'Шинэ бүтээлч вэб төсөл',
    path: '',
    customFullUrl: 'https://inquisitive-griffin-2bf5da.netlify.app',
    imageUrl: '/src/assets/images/project_creative_web_1794108003612.jpg',
    description: 'Орчин үеийн загварлаг интерфэйс, бүтээлч шийдэл бүхий шинээр нийтлэгдсэн Netlify вэб төсөл.',
    longDescription: 'Энэхүү төсөл нь орчин үеийн вэб технологи, интерактив өнгө төрх болон шинэлэг бүтэцтэйгээр бүтээгдсэн бөгөөд Netlify дээр шууд байршин ажиллаж буй шинэ бүтээл юм.',
    category: 'creative',
    categoryLabel: 'Вэб төсөл & Дизайн',
    tag: 'Шинэ бүтээл',
    icon: 'Sparkles',
    accentColor: 'cyan',
    features: [
      'Орчин үеийн глассморфизм & цэвэр UI',
      'Netlify платформоор шууд нийтлэгдсэн',
      'Хөдөлгөөнт элементүүдийн зохицол',
      'Бүх төхөөрөмжид бүрэн нийцсэн'
    ],
    tags: ['Шинэ төсөл', 'Netlify', 'Вэб дизайн', 'Интерактив']
  },
  {
    id: 'dream-job',
    title: 'Мөрөөдлийн ажил',
    path: 'dream-job.html',
    imageUrl: '/src/assets/images/project_dream_job_1794108005400.jpg',
    description: 'Ирээдүйн мэргэжил, зорилго болон ур чадварын хөгжлийн замын зураглалыг харуулсан интерактив хуудас.',
    longDescription: 'Энэхүү төсөл нь миний ирээдүйд хүрэхээр зорьж буй мөрөөдлийн ажил, мэргэжлийн чиг баримжаа, эзэмших шаардлагатай чадварууд болон хувийн зорилтуудыг эмх цэгцтэй, ойлгомжтойгоор танилцуулсан бүтээл юм.',
    category: 'career',
    categoryLabel: 'Карьер & Зорилго',
    tag: 'Интерактив танилцуулга',
    icon: 'Briefcase',
    accentColor: 'indigo',
    features: [
      'Мэргэжлийн чиг баримжааны төлөвлөгөө',
      'Чадваруудын дэлгэрэнгүй жагсаалт',
      'Зорилгод хүрэх алхмууд',
      'Цэвэр, минимал бүтэц'
    ],
    tags: ['HTML5', 'CSS3', 'Карьер', 'Танилцуулга']
  },
  {
    id: 'my-youtube',
    title: 'Миний YouTube',
    path: 'my-youtube.html',
    imageUrl: '/src/assets/images/project_youtube_creator_1794108004774.jpg',
    description: 'Бүтээлч видео бичлэгүүд, сонирхолтой контент болон YouTube сувгийн холбоосуудыг төвлөрүүлсэн вэб хуудас.',
    longDescription: 'Миний YouTube сувгийн шилдэг бичлэгүүд, танин мэдэхүйн болон бүтээлч контентуудыг нэг дороос үзэх боломжтой хуудас. Видео бүтээх сонирхлоо веб технологитой хослуулан хөгжүүлсэн төсөл.',
    category: 'media',
    categoryLabel: 'Видео & Контент',
    tag: 'Медиа төв',
    icon: 'Youtube',
    accentColor: 'rose',
    features: [
      'Сүүлийн үеийн бичлэгүүдийн жагсаалт',
      'Шууд үзэх боломжтой видео тоглуулагч',
      'Сувгийн товч танилцуулга',
      'YouTube рүү шууд шилжих холбоос'
    ],
    tags: ['Медиа', 'YouTube', 'Видео', 'Контент']
  },
  {
    id: 'game-site',
    title: 'Тоглоомын сайт',
    path: 'tusul.html',
    imageUrl: '/src/assets/images/project_web_games_1794108005222.jpg',
    description: 'Веб технологи дээр суурилсан хөгжилтэй мини тоглоомууд, интерактив веб туршилтуудыг агуулсан төслийн хуудас.',
    longDescription: 'Веб орчинд ажилладаг бүтээлч төслүүд болон сонирхолтой мини тоглоомуудыг багтаасан төв сайт. Хэрэглэгчийн оролцоог хангасан интерактив шийдлүүдийг туршин бүтээсэн юм.',
    category: 'games',
    categoryLabel: 'Тоглоом & Төсөл',
    tag: 'Мини тоглоомууд',
    icon: 'Gamepad2',
    accentColor: 'emerald',
    features: [
      'Веб мини тоглоомуудын цуглуулга',
      'Хэрэглэгчийн интерактив үйлдлүүд',
      'Онооны систем & тоглоомын логик',
      'Бүх төрлийн төхөөрөмжид тохирсон'
    ],
    tags: ['JavaScript', 'Тоглоом', 'Интерактив', 'HTML5 Canvas']
  },
  {
    id: 'pasture-game',
    title: 'Малаа хашаандаа',
    path: 'togloom.html',
    imageUrl: '/src/assets/images/project_pasture_game_1794108005198.jpg',
    description: 'Монгол уламжлалт мал аж ахуйн сэдэвтэй, логик сэтгэлгээ ба авхаалж самбаа шаардсан сонирхолтой тоглоом.',
    longDescription: 'Монгол соёл, ахуйн өвөрмөц онцлогийг тусгасан "Малаа хашаандаа" веб тоглоом. Малаа зөв хашаанд нь оруулах логик даалгавар, түвшин ахих систем бүхий зугаатай веб тоглоом юм.',
    category: 'games',
    categoryLabel: 'Монгол тоглоом',
    tag: 'Логик & Соёл',
    icon: 'Trophy',
    accentColor: 'amber',
    features: [
      'Монгол ахуйн сонирхолтой сэдэв',
      'Түвшин бүхий логик сорилтууд',
      'Хөгжилтэй дуу, хөдөлгөөнт дүрслэл',
      'Шууд хөтөч дээрээ тоглох боломж'
    ],
    tags: ['Монгол тоглоом', 'Логик', 'Авхаалж самбаа', 'Web Game']
  }
];

export const SKILLS_LIST = [
  { name: 'HTML5 & Семантик бүтэц', level: 95, category: 'Frontend' },
  { name: 'CSS3 & Tailwind CSS', level: 90, category: 'Frontend' },
  { name: 'JavaScript (ES6+) & Логик', level: 85, category: 'Frontend' },
  { name: 'React & Интерактив UI', level: 80, category: 'Frontend' },
  { name: 'Вэб тоглоом & Canvas логик', level: 78, category: 'Interactive' },
  { name: 'Responsive (Утас, Таблет) дизайн', level: 92, category: 'Design' },
  { name: 'Git & GitHub хувилбар удирдлага', level: 82, category: 'Tools' },
  { name: 'Netlify веб байршуулалт & Host', level: 88, category: 'DevOps' }
];
