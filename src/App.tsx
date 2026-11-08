/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Globe,
  Briefcase,
  Youtube,
  Gamepad2,
  Trophy,
  Mail,
  Layers,
  Code2,
  Sparkles,
  Settings2,
  RotateCcw,
  User,
  Send,
  Monitor,
  Flame,
  CheckCircle2,
  ArrowRight,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { PROJECTS_LIST, SKILLS_LIST } from './data/projects.ts';
import { ProjectItem } from './types.ts';
import { BlackHoleVideoBackground } from './components/BlackHoleVideoBackground.tsx';

export default function App() {
  // Netlify subdomain state - defaults to '[НЕТЛИФАЙ]'
  const [netlifySubdomain, setNetlifySubdomain] = useState<string>(() => {
    return localStorage.getItem('user_netlify_subdomain') || '[НЕТЛИФАЙ]';
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempSubdomain, setTempSubdomain] = useState(netlifySubdomain);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [imgError, setImgError] = useState(false);
  const [failedCardImages, setFailedCardImages] = useState<Record<string, boolean>>({});
  const [isCosmicView, setIsCosmicView] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const defaultSubdomain = '[НЕТЛИФАЙ]';

  // Construct base Netlify URL
  const baseNetlifyUrl = `https://${netlifySubdomain}.netlify.app`;
  const photoUrl = `${baseNetlifyUrl}/my-photo.png`;

  const handleSaveSubdomain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tempSubdomain.trim() || defaultSubdomain;
    setNetlifySubdomain(cleaned);
    localStorage.setItem('user_netlify_subdomain', cleaned);
    setIsConfigOpen(false);
    setImgError(false);
  };

  const handleResetSubdomain = () => {
    setNetlifySubdomain(defaultSubdomain);
    setTempSubdomain(defaultSubdomain);
    localStorage.removeItem('user_netlify_subdomain');
    setIsConfigOpen(false);
    setImgError(false);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const getProjectUrl = (project: ProjectItem) => {
    if (project.customFullUrl) {
      return project.customFullUrl;
    }
    return `${baseNetlifyUrl}/${project.path}`;
  };

  // Filter projects by category and search query
  const filteredProjects = PROJECTS_LIST.filter((proj) => {
    const matchesCategory =
      activeCategory === 'all' || proj.category === activeCategory;
    const matchesSearch =
      proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-indigo-400" />;
      case 'Youtube':
        return <Youtube className="w-5 h-5 text-rose-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
      default:
        return <Globe className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getAccentBorder = (color: string) => {
    switch (color) {
      case 'indigo':
        return 'hover:border-indigo-400/60 hover:shadow-indigo-500/20';
      case 'rose':
        return 'hover:border-rose-400/60 hover:shadow-rose-500/20';
      case 'emerald':
        return 'hover:border-emerald-400/60 hover:shadow-emerald-500/20';
      case 'amber':
        return 'hover:border-amber-400/60 hover:shadow-amber-500/20';
      case 'cyan':
        return 'hover:border-cyan-400/60 hover:shadow-cyan-500/20';
      default:
        return 'hover:border-cyan-400/60 hover:shadow-cyan-500/20';
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden font-sans">
      {/* 1. REAL INTERSTELLAR SUPERMASSIVE BLACK HOLE VIDEO BACKGROUND */}
      <BlackHoleVideoBackground isCosmicView={isCosmicView} />

      {/* Toast Notification for Link Copying */}
      {copiedId && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-amber-400 text-slate-950 px-4 py-3 rounded-xl font-medium shadow-2xl shadow-amber-500/30 transition-all backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>Холбоос амжилттай санах ойд хуулагдлаа!</span>
        </div>
      )}

      {/* Cosmic View Mode Return Bar (When user wants to see the whole black hole) */}
      {isCosmicView && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-950/80 border border-amber-500/40 backdrop-blur-xl shadow-2xl shadow-amber-500/20">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-semibold text-amber-200">
            Сансрын горим идэвхжсэн: Хар нүх & Одод тод харагдаж байна
          </span>
          <button
            onClick={() => setIsCosmicView(false)}
            className="ml-2 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Агуулгыг харуулах</span>
          </button>
        </div>
      )}

      {/* Top Navbar - Ultra Transparent Glass */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-xl bg-slate-950/20 border-b border-white/10 transition-all duration-500 ${
          isCosmicView ? 'opacity-15 hover:opacity-100' : 'opacity-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo / Monogram */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform border border-white/20">
              <span className="text-xl tracking-tighter">С</span>
            </div>
            <div>
              <div className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2 drop-shadow-md">
                Сүлдээ
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                  Портфолио
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium drop-shadow">Веб хөгжүүлэгч & Бүтээгч</p>
            </div>
          </a>

          {/* Desktop Nav Links - Clean Transparent Text */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-200">
            <a href="#about" className="hover:text-amber-300 transition-colors drop-shadow">
              Миний тухай
            </a>
            <a href="#projects" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 drop-shadow">
              <span>Миний бүтээлүүд</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {PROJECTS_LIST.length}
              </span>
            </a>
            <a href="#skills" className="hover:text-amber-300 transition-colors drop-shadow">
              Ур чадвар
            </a>
            <a href="#contact" className="hover:text-amber-300 transition-colors drop-shadow">
              Холбоо барих
            </a>
          </nav>

          {/* Action Area: Cosmic View Toggle, Netlify Config, Main Site */}
          <div className="flex items-center gap-2.5">
            {/* Cosmic Black Hole View Toggle */}
            <button
              onClick={() => setIsCosmicView(!isCosmicView)}
              title="Хар нүхийг бүтэн дэлгэцээр харах"
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-slate-950/30 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-sm"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline font-medium">Хар нүх харах</span>
            </button>

            {/* Quick Netlify Domain Config Trigger */}
            <button
              onClick={() => {
                setTempSubdomain(netlifySubdomain);
                setIsConfigOpen(true);
              }}
              title="Netlify домэйн хаяг тохируулах"
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-slate-950/30 border border-white/15 hover:border-amber-500/50 text-slate-200 hover:text-amber-300 transition-all cursor-pointer shadow-sm backdrop-blur-md"
            >
              <Settings2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-mono font-medium max-w-[130px] truncate">
                {netlifySubdomain}.netlify.app
              </span>
              <span className="sm:hidden font-mono">Тохиргоо</span>
            </button>

            {/* Main Netlify Site Button */}
            <a
              href={baseNetlifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-white/20"
            >
              <Globe className="w-4 h-4" />
              <span>Үндсэн сайт</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-90" />
            </a>
          </div>
        </div>
      </header>

      {/* Netlify Domain Settings Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
                <Settings2 className="w-5 h-5" />
                <h3>Netlify домэйн хаяг тохируулах</h3>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-200 mb-4 leading-relaxed">
              Таны бүх бүтээлүүд болон үндсэн сайтын холбоос Netlify дээр байршсан байдаг. Хэрэв та өөрийн жинхэнэ дэд нэрээ (жишээ нь: <code className="text-amber-300 font-mono">suldee</code> эсвэл <code className="text-amber-300 font-mono">inquisitive-griffin-2bf5da</code>) туршиж холбохыг хүсвэл доор өөрчилж болно.
            </p>

            <form onSubmit={handleSaveSubdomain} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Netlify дэд нэр (Subdomain)
                </label>
                <div className="flex items-center rounded-xl bg-slate-950/80 border border-white/20 focus-within:border-amber-400 overflow-hidden px-3 py-2 text-sm">
                  <span className="text-slate-400 font-mono">https://</span>
                  <input
                    type="text"
                    value={tempSubdomain}
                    onChange={(e) => setTempSubdomain(e.target.value)}
                    placeholder="[НЕТЛИФАЙ]"
                    className="bg-transparent text-white font-mono outline-none px-1 flex-1 min-w-0"
                  />
                  <span className="text-slate-400 font-mono">.netlify.app</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Үндсэн анхдагч утга: <code className="text-amber-300">[НЕТЛИФАЙ]</code>
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 text-xs text-slate-300 space-y-1">
                <div className="font-medium text-slate-200">Үүсэх жишээ холбоосууд:</div>
                <div className="font-mono text-cyan-300 truncate">
                  {`https://${tempSubdomain || '[НЕТЛИФАЙ]'}.netlify.app/my-photo.png`}
                </div>
                <div className="font-mono text-amber-300 truncate">
                  {`https://${tempSubdomain || '[НЕТЛИФАЙ]'}.netlify.app/dream-job.html`}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetSubdomain}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Анхдагч руу шилжүүлэх</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    Болих
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    Хадгалах
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Transparent UI Container */}
      <main
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-24 relative z-10 transition-all duration-500 ${
          isCosmicView ? 'opacity-15 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* HERO SECTION - Ultra-Transparent Glass */}
        <section id="hero" className="relative pt-6 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content (Text & CTAs) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/30 border border-white/20 text-xs font-semibold text-slate-200 shadow-sm backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Супер аварга хар нүх & Одот сансар</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-lg">
                  Сайн байна уу? Намайг{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400">
                    Сүлдээ
                  </span>{' '}
                  гэдэг.
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-slate-200 drop-shadow-md">
                  Веб хөгжүүлэгч, интерактив тоглоом & төсөл бүтээгч
                </p>
              </div>

              {/* Mongolian Bio */}
              <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed drop-shadow-sm">
                Би орчин үеийн веб технологи, интерактив хуудсууд, мини тоглоомууд болон бүтээлч контентуудыг урлан бүтээдэг. Бүх картууд бүрэн тунгалаг тул арын дэвсгэрийн эргэлдэх хар нүх болон олон өнгийн оддыг нэвт харах боломжтой.
              </p>

              {/* Quick Netlify Domain Info Pill */}
              <div className="inline-flex items-center gap-2 p-2.5 px-3.5 rounded-xl bg-slate-950/30 border border-white/20 text-xs text-slate-200 font-mono backdrop-blur-md shadow-sm">
                <Globe className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-slate-300">Үндсэн домэйн:</span>
                <span className="text-amber-300 font-semibold">{baseNetlifyUrl}</span>
                <button
                  onClick={() => setIsConfigOpen(true)}
                  className="ml-1 text-[11px] underline text-slate-300 hover:text-amber-300 cursor-pointer"
                >
                  солих
                </button>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#projects"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer border border-white/25"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Миний бүтээлүүд үзэх</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href={baseNetlifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-slate-950/30 hover:bg-slate-900/50 border border-white/20 hover:border-amber-400 text-slate-100 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer group backdrop-blur-md shadow-sm"
                >
                  <Globe className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Үндсэн сайт нээх</span>
                  <ExternalLink className="w-4 h-4 text-slate-300" />
                </a>

                <a
                  href="#contact"
                  className="px-5 py-3.5 rounded-xl text-slate-200 hover:text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer drop-shadow"
                >
                  <Mail className="w-4 h-4" />
                  <span>Холбоо барих</span>
                </a>
              </div>

              {/* Highlights Metric Strip */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-xl">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono drop-shadow">5</div>
                  <div className="text-xs text-slate-300 font-medium">Онцлох бүтээл</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono drop-shadow">100%</div>
                  <div className="text-xs text-slate-300 font-medium">Тунгалаг шилэн UI</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono drop-shadow">60 FPS</div>
                  <div className="text-xs text-slate-300 font-medium">Эргэлдэх хар нүх</div>
                </div>
              </div>
            </div>

            {/* Right Content (User Photo & Avatar Showcase) - Ultra-Transparent Glass Frame */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group max-w-sm w-full">
                {/* Decorative Burning Accretion Ring Halo */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />

                {/* Profile Card Frame: Ultra Transparent */}
                <div className="relative bg-slate-950/25 border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center backdrop-blur-2xl">
                  {/* Photo Container */}
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden bg-slate-950/50 border-2 border-white/25 mb-5 shadow-inner flex items-center justify-center">
                    {!imgError ? (
                      <img
                        src={photoUrl}
                        alt="Миний зураг"
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      /* Elegant Fallback Avatar */
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950/40 to-slate-900/40 text-slate-300 p-4">
                        <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-3xl mb-3 shadow-lg">
                          С
                        </div>
                        <span className="text-xs font-semibold text-white">Сүлдээ</span>
                        <span className="text-[11px] text-slate-400 mt-1 font-mono truncate max-w-[180px]">
                          my-photo.png
                        </span>
                      </div>
                    )}

                    {/* Badge over photo */}
                    <div className="absolute bottom-2 left-2 right-2 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[11px] text-slate-200 flex items-center justify-between font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        my-photo.png
                      </span>
                      <a
                        href={photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-300 hover:underline flex items-center gap-0.5"
                      >
                        үзэх <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Photo Caption & Info */}
                  <h3 className="text-lg font-bold text-white mb-1 drop-shadow">Сүлдээ</h3>
                  <p className="text-xs text-slate-300 mb-4">
                    Монгол | Вэб хөгжүүлэлт & Төслүүд
                  </p>

                  <div className="w-full pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1 text-slate-200 font-medium">
                      <Flame className="w-4 h-4 text-amber-400" />
                      Бүтээлч хандлага
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/40 border border-white/10 text-amber-300 font-mono text-[11px]">
                      Netlify Hosted
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: МИНИЙ ҮНДСЭН САЙТ БАННЕР - Ultra-Transparent Glass */}
        <section className="relative rounded-3xl p-8 sm:p-10 bg-slate-950/25 border border-white/20 shadow-2xl overflow-hidden backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
                <Globe className="w-3.5 h-3.5" />
                <span>Миний үндсэн сайт</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow">
                Netlify дээр байршсан миний үндсэн сайт руу зочлоорой
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed drop-shadow-sm">
                Энэхүү портфолио дээрх бүх бүтээлүүд болон төслүүдийн төв эх үүсвэр болсон үндсэн хуудас:
              </p>
              <div className="font-mono text-sm text-amber-300 bg-slate-950/40 px-4 py-2 rounded-xl inline-block border border-white/15 backdrop-blur-md">
                {baseNetlifyUrl}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => copyToClipboard(baseNetlifyUrl, 'main-site')}
                className="px-4 py-3 rounded-xl bg-slate-950/40 hover:bg-slate-900/60 border border-white/15 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-md"
              >
                {copiedId === 'main-site' ? (
                  <>
                    <Check className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400">Хуулагдлаа!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Холбоос хуулах</span>
                  </>
                )}
              </button>

              <a
                href={baseNetlifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <span>Үндсэн сайт нээх</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* SECTION: МИНИЙ БҮТЭЭЛҮҮД (5 ULTRA-TRANSPARENT CARDS WITH IMAGES) */}
        <section id="projects" className="space-y-8 scroll-mt-24">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2 drop-shadow">
                <Sparkles className="w-4 h-4" />
                <span>Бүтээлүүдийн цуглуулга</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                Миний бүтээлүүд
              </h2>
              <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed drop-shadow-sm">
                Доорх бүтээл бүр нь Netlify дээр байршсан бие даасан хуудас бөгөөд тус бүрдээ зориулсан бодит өнгөлөг зурагтай. Картууд тунгалаг шилэн хийцтэй тул арын эргэлдэх хар нүх нэвт харагдана.
              </p>
            </div>

            {/* Total Count Badge */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300">Нийт:</span>
              <span className="px-3 py-1 rounded-xl bg-slate-950/30 border border-white/20 text-amber-300 font-mono font-bold text-sm backdrop-blur-md">
                {PROJECTS_LIST.length} төсөл
              </span>
            </div>
          </div>

          {/* Filtering and Search Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'Бүгд' },
                { id: 'creative', label: 'Шинэ вэб төсөл' },
                { id: 'games', label: 'Тоглоомууд' },
                { id: 'career', label: 'Мөрөөдлийн ажил' },
                { id: 'media', label: 'YouTube & Медиа' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer backdrop-blur-md ${
                    activeCategory === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold'
                      : 'bg-slate-950/30 text-slate-200 hover:text-white hover:bg-slate-900/50 border border-white/15'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Бүтээл хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/30 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Projects Cards Grid: Ultra-Transparent Glass Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {filteredProjects.map((project: ProjectItem) => {
              const fullProjectUrl = getProjectUrl(project);
              const isCopied = copiedId === project.id;
              const hasImageFailed = failedCardImages[project.id];

              return (
                <div
                  key={project.id}
                  className={`group relative bg-slate-950/25 backdrop-blur-xl rounded-3xl border border-white/15 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-950/35 ${getAccentBorder(
                    project.accentColor
                  )}`}
                >
                  {/* Top Image Showcase Banner */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950/40 border-b border-white/10">
                    {project.imageUrl && !hasImageFailed ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedCardImages((prev) => ({ ...prev, [project.id]: true }))
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                      />
                    ) : (
                      /* Styled Fallback container */
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/40 text-slate-300 p-6 backdrop-blur-md">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-2">
                          {getIcon(project.icon)}
                        </div>
                        <span className="text-xs font-semibold text-white">{project.title}</span>
                      </div>
                    )}

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                    {/* Floating Badges over the Image */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-amber-300 border border-white/20 font-mono shadow-md">
                        {project.tag}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-md text-slate-200 border border-white/20 uppercase tracking-wider">
                        {project.categoryLabel}
                      </span>
                    </div>

                    {/* Bottom-left title teaser over image */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-950/80 border border-white/20 flex items-center justify-center shadow backdrop-blur-md">
                        {getIcon(project.icon)}
                      </div>
                      <span className="text-xs font-medium text-slate-200 font-mono truncate drop-shadow">
                        {project.path || 'inquisitive-griffin-2bf5da.netlify.app'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Area - Ultra Transparent */}
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title */}
                      <h3 className="text-2xl font-bold text-white group-hover:text-amber-300 transition-colors mb-2 drop-shadow">
                        {project.title}
                      </h3>

                      {/* Short Description */}
                      <p className="text-slate-200 text-sm leading-relaxed mb-4 drop-shadow-sm">
                        {project.description}
                      </p>

                      {/* Long Description Excerpt */}
                      <p className="text-slate-300 text-xs leading-relaxed mb-5 bg-slate-950/40 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                        {project.longDescription}
                      </p>

                      {/* Feature highlights */}
                      <div className="space-y-1.5 mb-5">
                        <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                          Онцлог давуу талууд:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {project.features.map((feat, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 text-xs text-slate-200"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {project.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-950/40 text-slate-300 border border-white/10 font-mono backdrop-blur-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Area: Exact URL & Open in New Window Button */}
                    <div className="pt-4 border-t border-white/10 space-y-3">
                      {/* Exact Netlify Link Display */}
                      <div className="flex items-center justify-between gap-2 p-2 px-3 rounded-xl bg-slate-950/40 border border-white/15 text-xs font-mono backdrop-blur-md">
                        <span className="text-slate-300 truncate text-[11px]">
                          {fullProjectUrl}
                        </span>
                        <button
                          onClick={() => copyToClipboard(fullProjectUrl, project.id)}
                          title="Холбоос хуулах"
                          className="text-slate-300 hover:text-amber-300 flex items-center gap-1 flex-shrink-0 cursor-pointer transition"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-[10px] text-amber-400 font-sans font-medium">Хуулав</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-sans font-medium">Хуулах</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Open in New Window Button (target="_blank") */}
                      <a
                        href={fullProjectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-slate-950/40 hover:bg-amber-500 border border-white/20 text-slate-100 hover:text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md group-hover:shadow-amber-500/20 cursor-pointer backdrop-blur-md"
                      >
                        <span>Шинэ цонхонд үзэх</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12 bg-slate-950/30 rounded-2xl border border-white/15 p-6 backdrop-blur-md">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-200 font-medium">Хайлтад тохирох бүтээл олдсонгүй.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-3 text-xs text-amber-300 hover:underline cursor-pointer"
              >
                Бүх бүтээлийг харах
              </button>
            </div>
          )}
        </section>

        {/* SECTION: МИНИЙ ТУХАЙ & УР ЧАДВАР - Ultra-Transparent Glass */}
        <section id="about" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start scroll-mt-24">
          {/* About Me Column */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest drop-shadow">
              <User className="w-4 h-4" />
              <span>Танилцуулга</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              Миний тухай
            </h2>
            <div className="space-y-4 text-slate-200 text-sm sm:text-base leading-relaxed drop-shadow-sm">
              <p>
                Сайн байна уу! Би веб хөгжүүлэлт, интерактив дижитал бүтээлүүд болон сонирхолтой контент бүтээх чин хүсэл эрмэлзэлтэй хөгжүүлэгч юм.
              </p>
              <p>
                Миний гол зорилго бол хэрэглэгчдэд ойлгомжтой, хурдан, үзэмжтэй бөгөөд ашиглахад зугаатай дижитал туршлагыг бий болгох явдал юм. "Шинэ бүтээлч вэб төсөл", "Мөрөөдлийн ажил", "Миний YouTube", "Тоглоомын сайт", болон Монгол ахуйг тусгасан "Малаа хашаандаа" зэрэг төслүүдээрээ дамжуулан шинэ технологиудыг туршиж, суралцаж байна.
              </p>
              <p>
                Бүтээл бүрээ бие даан төлөвлөж, дизайн болон кодын бүтцийг чанартай хийхийг эрхэмлэдэг.
              </p>
            </div>

            {/* Core Values - Ultra Transparent */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="p-3.5 rounded-2xl bg-slate-950/25 border border-white/15 backdrop-blur-md">
                <div className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Бүтээлч сэтгэлгээ</span>
                </div>
                <p className="text-xs text-slate-300">Шинэ санааг бодит веб болгох чадвар</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/25 border border-white/15 backdrop-blur-md">
                <div className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>Цэвэр код</span>
                </div>
                <p className="text-xs text-slate-300">Ойлгомжтой, стандартын дагуу бичилт</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/25 border border-white/15 backdrop-blur-md">
                <div className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                  <Gamepad2 className="w-4 h-4 text-emerald-400" />
                  <span>Интерактив</span>
                </div>
                <p className="text-xs text-slate-300">Хөгжилтэй веб тоглоом & мини аппууд</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/25 border border-white/15 backdrop-blur-md">
                <div className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                  <Monitor className="w-4 h-4 text-rose-400" />
                  <span>Responsive</span>
                </div>
                <p className="text-xs text-slate-300">Утас, таблет, комьпютер бүрт нийцтэй</p>
              </div>
            </div>
          </div>

          {/* Skills Column - Ultra Transparent */}
          <div id="skills" className="lg:col-span-6 space-y-5 scroll-mt-24">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest drop-shadow">
              <Layers className="w-4 h-4" />
              <span>Технологиуд</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              Ур чадвар & Хэрэглэдэг багажууд
            </h2>
            <p className="text-slate-200 text-sm leading-relaxed drop-shadow-sm">
              Миний эзэмшсэн технологи, веб боловсруулах чадваруудын ерөнхий түвшин:
            </p>

            <div className="space-y-4 pt-2">
              {SKILLS_LIST.map((skill, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-100">{skill.name}</span>
                    <span className="font-mono text-amber-300 font-medium">{skill.level}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-950/40 border border-white/15 overflow-hidden backdrop-blur-md">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-700"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: ХОЛБОО БАРИХ (CONTACT) - Ultra-Transparent Glass */}
        <section id="contact" className="relative rounded-3xl bg-slate-950/25 border border-white/20 p-8 sm:p-12 overflow-hidden scroll-mt-24 backdrop-blur-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Info */}
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest drop-shadow">
                <Mail className="w-4 h-4" />
                <span>Холбоо барих</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                Хамтран ажиллах уу?
              </h2>
              <p className="text-slate-200 text-sm leading-relaxed drop-shadow-sm">
                Танд шинэ веб төсөл, санал хүсэлт, эсвэл хамтран ажиллах сонирхол байвал надтай шууд холбогдож болно.
              </p>

              <div className="space-y-3 pt-2">
                {/* Email Box */}
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/15 flex items-center justify-between gap-3 backdrop-blur-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-400">Имэйл хаяг</div>
                      <div className="text-sm font-semibold text-white truncate">
                        suldee.TA@gmail.com
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard('suldee.TA@gmail.com', 'email')}
                    title="Имэйл хуулах"
                    className="p-2 rounded-xl bg-slate-950/40 hover:bg-slate-900/60 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
                  >
                    {copiedId === 'email' ? (
                      <Check className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Main Netlify Box */}
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/15 flex items-center justify-between gap-3 backdrop-blur-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-300 flex-shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-400">Үндсэн сайт</div>
                      <div className="text-sm font-mono text-amber-300 truncate">
                        {baseNetlifyUrl}
                      </div>
                    </div>
                  </div>
                  <a
                    href={baseNetlifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-950/40 hover:bg-slate-900/60 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Message Form - Ultra Transparent */}
            <div className="lg:col-span-7 bg-slate-950/35 rounded-2xl border border-white/15 p-6 sm:p-8 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 drop-shadow">
                <Send className="w-4 h-4 text-amber-400" />
                <span>Зурвас илгээх</span>
              </h3>
              <p className="text-xs text-slate-300 mb-5">
                Мэдээллээ үлдээнэ үү. Би танд шуурхай хариу илгээх болно.
              </p>

              {messageSent ? (
                <div className="p-6 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-center space-y-2 animate-fade-in backdrop-blur-md">
                  <CheckCircle2 className="w-10 h-10 text-amber-400 mx-auto" />
                  <h4 className="font-bold text-white text-base">Зурвас амжилттай хүлээн авлаа!</h4>
                  <p className="text-xs text-slate-200">
                    Баярлалаа. Би таны имэйлээр удахгүй холбогдох болно.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Таны нэр
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Нэрээ оруулна уу"
                        className="w-full bg-slate-950/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition backdrop-blur-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Таны имэйл хаяг
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="example@mail.com"
                        className="w-full bg-slate-950/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition backdrop-blur-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Зурвасын агуулга
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Таны санал, асуулт эсвэл ажлын санал..."
                      className="w-full bg-slate-950/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition resize-none backdrop-blur-md"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer border border-white/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>Зурвас илгээх</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER - Ultra-Transparent Glass */}
      <footer
        className={`border-t border-white/10 bg-slate-950/30 backdrop-blur-xl mt-20 py-10 relative z-10 transition-opacity duration-500 ${
          isCosmicView ? 'opacity-15' : 'opacity-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-xs border border-white/20">
              С
            </div>
            <span>© 2026 Сүлдээ. Бүх эрх хуулиар хамгаалагдсан.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsCosmicView(!isCosmicView)}
              className="hover:text-amber-300 transition text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isCosmicView ? 'Агуулга харах' : 'Хар нүх харах'}</span>
            </button>
            <a href="#hero" className="hover:text-amber-300 transition">
              Дээш буцах ↑
            </a>
            <a href="#projects" className="hover:text-amber-300 transition">
              Бүтээлүүд ({PROJECTS_LIST.length})
            </a>
            <a
              href={baseNetlifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 hover:underline flex items-center gap-1"
            >
              Үндсэн сайт ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
