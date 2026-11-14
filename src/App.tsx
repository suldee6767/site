/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  Search,
  Eye,
  EyeOff,
  Play,
  LogIn,
  LogOut,
  Inbox,
  Trash2
} from 'lucide-react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  limit,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import { useFirebase } from './contexts/FirebaseContext.tsx';
import { PROJECTS_LIST, SKILLS_LIST } from './data/projects.ts';
import { resolveAssetImage } from './data/imageAssets.ts';
import { ProjectItem } from './types.ts';
import { BlackHoleVideoBackground } from './components/BlackHoleVideoBackground.tsx';
import { AnimeGuessGame } from './components/AnimeGuessGame.tsx';

interface ContactMessageRecord {
  id: string;
  senderUid: string;
  senderName: string;
  senderEmail: string;
  message: string;
  status: 'new' | 'read' | 'archived';
}

type AppView = 'home' | 'websites' | 'games' | 'game-anime-guess';

function getInitialViewFromUrl(): AppView {
  if (typeof window === 'undefined') return 'home';
  const params = new URLSearchParams(window.location.search);
  const game = params.get('game');
  const view = params.get('view');
  if (game === 'anime-guess') return 'game-anime-guess';
  if (view === 'games') return 'games';
  if (view === 'websites') return 'websites';
  return 'home';
}

export default function App() {
  const {
    user,
    authReady,
    authLoading,
    authError,
    isAdmin,
    savedSubdomain,
    signInWithGoogle,
    signOutUser,
    saveUserSubdomain,
  } = useFirebase();

  const [activeView, setActiveView] = useState<AppView>(getInitialViewFromUrl);

  // Netlify subdomain state - defaults to '[НЕТЛИФАЙ]'
  const [netlifySubdomain, setNetlifySubdomain] = useState<string>(() => {
    return localStorage.getItem('user_netlify_subdomain') || '[НЕТЛИФАЙ]';
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempSubdomain, setTempSubdomain] = useState(netlifySubdomain);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [websiteSearch, setWebsiteSearch] = useState<string>('');
  const [imgError, setImgError] = useState(false);
  const [failedCardImages, setFailedCardImages] = useState<Record<string, boolean>>({});
  const [isCosmicView, setIsCosmicView] = useState(false);

  // Contact form & Firestore messages state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messagesList, setMessagesList] = useState<ContactMessageRecord[]>([]);

  const defaultSubdomain = '[НЕТЛИФАЙ]';

  // Construct base Netlify URL
  const baseNetlifyUrl = `https://${netlifySubdomain}.netlify.app`;
  const photoUrl = `${baseNetlifyUrl}/my-photo.png`;

  // Sync browser history back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      setActiveView(getInitialViewFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Sync Netlify subdomain and contact fields from authenticated user
  useEffect(() => {
    if (savedSubdomain) {
      setNetlifySubdomain(savedSubdomain);
      setTempSubdomain(savedSubdomain);
      localStorage.setItem('user_netlify_subdomain', savedSubdomain);
    }
  }, [savedSubdomain]);

  useEffect(() => {
    if (user) {
      if (!contactName && user.displayName) setContactName(user.displayName);
      if (!contactEmail && user.email) setContactEmail(user.email);
    }
  }, [user, contactName, contactEmail]);

  // Listen to messages only when auth is ready and user is authenticated & verified
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setMessagesList([]);
      return;
    }

    const messagesRef = collection(db, 'messages');
    const messagesQuery = isAdmin
      ? query(messagesRef, limit(50))
      : query(messagesRef, where('senderUid', '==', user.uid), limit(25));

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const items: ContactMessageRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            senderUid: String(data.senderUid || ''),
            senderName: String(data.senderName || ''),
            senderEmail: String(data.senderEmail || ''),
            message: String(data.message || ''),
            status: (data.status as 'new' | 'read' | 'archived') || 'new',
          };
        });
        setMessagesList(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'messages');
      }
    );

    return () => unsubscribe();
  }, [authReady, user, isAdmin]);

  const navigateTo = (view: AppView, hashSection?: string) => {
    setActiveView(view);
    const url = new URL(window.location.href);
    url.searchParams.delete('game');
    url.searchParams.delete('view');
    url.hash = '';

    if (view === 'game-anime-guess') {
      url.searchParams.set('game', 'anime-guess');
    } else if (view === 'games') {
      url.searchParams.set('view', 'games');
    } else if (view === 'websites') {
      url.searchParams.set('view', 'websites');
    } else if (hashSection) {
      url.hash = hashSection;
    }

    window.history.pushState({}, '', url.toString());

    if (hashSection && view === 'home') {
      setTimeout(() => {
        const el = document.getElementById(hashSection);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveSubdomain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = (tempSubdomain.trim() || defaultSubdomain).slice(0, 100);
    setNetlifySubdomain(cleaned);
    localStorage.setItem('user_netlify_subdomain', cleaned);
    if (user && user.emailVerified) {
      saveUserSubdomain(cleaned).catch((err) => {
        console.error('Домэйн хадгалахад алдаа гарлаа:', err);
      });
    }
    setIsConfigOpen(false);
    setImgError(false);
  };

  const handleResetSubdomain = () => {
    setNetlifySubdomain(defaultSubdomain);
    setTempSubdomain(defaultSubdomain);
    localStorage.removeItem('user_netlify_subdomain');
    if (user && user.emailVerified) {
      saveUserSubdomain(defaultSubdomain).catch((err) => {
        console.error('Домэйн шинэчлэхэд алдаа гарлаа:', err);
      });
    }
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

  // Separate Websites and Games
  const websiteProjects = PROJECTS_LIST.filter((p) => p.projectType === 'website');
  const gameProjects = PROJECTS_LIST.filter((p) => p.projectType === 'game');

  const filteredWebsites = websiteProjects.filter((proj) => {
    const q = websiteSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      proj.title.toLowerCase().includes(q) ||
      proj.description.toLowerCase().includes(q) ||
      proj.categoryLabel.toLowerCase().includes(q) ||
      proj.tags.some((tag) => tag.toLowerCase().includes(q))
    );
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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessageError(null);

    if (!user || !user.emailVerified) {
      setMessageError('Зурвас илгээхийн тулд эхлээд Google бүртгэлээрээ нэвтэрнэ үү.');
      return;
    }

    const safeName = contactName.trim().slice(0, 100);
    const safeEmail = contactEmail.trim().slice(0, 160);
    const safeMessage = contactMessage.trim().slice(0, 2000);

    if (safeName.length < 1 || safeEmail.length < 3 || safeMessage.length < 1) {
      setMessageError('Бүх талбарыг бөглөнө үү.');
      return;
    }

    setMessageSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        senderUid: user.uid,
        senderName: safeName,
        senderEmail: safeEmail,
        message: safeMessage,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setMessageSent(true);
      setContactMessage('');
      setTimeout(() => {
        setMessageSent(false);
      }, 4500);
    } catch (error) {
      setMessageError('Зурвас илгээхэд алдаа гарлаа.');
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    } finally {
      setMessageSending(false);
    }
  };

  const handleUpdateMessageStatus = async (
    messageId: string,
    nextStatus: 'read' | 'archived'
  ) => {
    if (!isAdmin) return;
    const msgPath = `messages/${messageId}`;
    try {
      await updateDoc(doc(db, 'messages', messageId), { status: nextStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, msgPath);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!isAdmin) return;
    const msgPath = `messages/${messageId}`;
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, msgPath);
    }
  };

  const animeGuessCover = resolveAssetImage(
    '/src/assets/images/real/anime_jujutsu_kaisen.jpg'
  );

  // Built-in Anime Guess launcher card (opens dedicated game window or new tab)
  const renderAnimeGuessCard = () => (
    <article
      key="anime-guess-builtin"
      className="group relative bg-slate-950/25 backdrop-blur-md rounded-3xl border border-amber-400/30 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-amber-400/70 hover:bg-slate-950/35"
    >
      {/* Top Image Banner */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950/40 border-b border-white/10">
        <img
          src={animeGuessCover}
          alt="Anime Guess тоглоом"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out opacity-95 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow backdrop-blur-md shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-xs font-medium text-amber-200 font-mono truncate drop-shadow">
              Интерактив тоглоом
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-200 font-mono shrink-0">
            3 горим · 3 түвшин
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-300 font-medium mb-1.5">
            <span>Аниме Таах Тоглоом</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-slate-300">Энгийн / Хэцүү / Бурхан</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-amber-300 transition-colors mb-2 drop-shadow">
            Anime Guess
          </h3>

          <p className="text-slate-200 text-sm leading-relaxed mb-4 drop-shadow-sm">
            Emoji, Бүдэг зураг (Anime) болон Баатар гэсэн 3 горимоор анимийг хурдсах цагийн эсрэг тааж тоглоорой.
          </p>

          <div className="space-y-2 mb-5">
            <div className="text-xs font-semibold text-slate-300">Онцлог давуу талууд:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                'Emoji · Anime · Баатар 3 горим',
                'Хэцүү & Бурхан хурдсах цаг',
                '3 амь · +10 онооны систем',
                'Асуулт бүр холигдоно'
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons: Enter Separate Game Window OR Open in New Tab */}
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <button
            onClick={() => navigateTo('game-anime-guess')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-orange-500/20 cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Тоглох</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="?game=anime-guess"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950/45 hover:bg-slate-900/70 border border-white/15 text-slate-200 hover:text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
          >
            <span>Шинэ цонхонд тоглох</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );

  const renderProjectCard = (project: ProjectItem) => {
    const fullProjectUrl = getProjectUrl(project);
    const isCopied = copiedId === project.id;
    const hasImageFailed = failedCardImages[project.id];
    const isGame = project.projectType === 'game';

    return (
      <article
        key={project.id}
        className={`group relative bg-slate-950/25 backdrop-blur-md rounded-3xl border border-white/15 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-950/35 ${getAccentBorder(
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
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/40 text-slate-300 p-6 backdrop-blur-md">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-2">
                {getIcon(project.icon)}
              </div>
              <span className="text-xs font-semibold text-white">{project.title}</span>
            </div>
          )}

          {/* Contrast scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-950/80 border border-white/20 flex items-center justify-center shadow backdrop-blur-md shrink-0">
              {getIcon(project.icon)}
            </div>
            <span className="text-xs font-medium text-slate-200 font-mono truncate drop-shadow">
              {project.path || 'inquisitive-griffin-2bf5da.netlify.app'}
            </span>
          </div>
        </div>

        {/* Card Content Area */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium mb-1.5">
              <span>{project.categoryLabel}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-300">{project.tag}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-amber-300 transition-colors mb-2 drop-shadow">
              {project.title}
            </h3>

            <p className="text-slate-200 text-sm leading-relaxed mb-4 drop-shadow-sm">
              {project.description}
            </p>

            <p className="text-slate-300 text-xs leading-relaxed mb-5 bg-slate-950/35 p-3.5 rounded-xl border border-white/10 backdrop-blur-md">
              {project.longDescription}
            </p>

            <div className="space-y-2 mb-5">
              <div className="text-xs font-semibold text-slate-300">
                Онцлог давуу талууд:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {project.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 font-mono mb-5">
              {project.tags.map((tag, idx) => (
                <span key={idx}>#{tag}</span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-3">
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
                    <span className="text-[11px] text-amber-400 font-sans font-medium">Хуулав</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-sans font-medium">Хуулах</span>
                  </>
                )}
              </button>
            </div>

            <a
              href={fullProjectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-slate-950/45 hover:bg-amber-500 border border-white/20 text-slate-100 hover:text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md group-hover:shadow-amber-500/20 cursor-pointer backdrop-blur-md whitespace-nowrap"
            >
              {isGame ? <Play className="w-4 h-4" /> : null}
              <span>{isGame ? 'Шинэ цонхонд тоглох' : 'Шинэ цонхонд үзэх'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden font-sans">
      {/* 1. REAL INTERSTELLAR SUPERMASSIVE BLACK HOLE VIDEO BACKGROUND */}
      <BlackHoleVideoBackground isCosmicView={isCosmicView} />

      {/* Toast Notification */}
      {copiedId && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-amber-400 text-slate-950 px-4 py-3 rounded-xl font-medium shadow-2xl shadow-amber-500/30 transition-all backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>Холбоос амжилттай санах ойд хуулагдлаа!</span>
        </div>
      )}

      {/* Cosmic View Mode Return Bar */}
      {isCosmicView && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-950/80 border border-amber-500/40 backdrop-blur-xl shadow-2xl shadow-amber-500/20">
          <span className="text-xs font-semibold text-amber-200 whitespace-nowrap">
            Сансрын горим: Хар нүх & Одод тод харагдаж байна
          </span>
          <button
            onClick={() => setIsCosmicView(false)}
            className="ml-2 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Агуулгыг харуулах</span>
          </button>
        </div>
      )}

      {/* Top Navbar - Clean 3-Zone Ultra Transparent Glass */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-xl bg-slate-950/20 border-b border-white/10 transition-all duration-500 ${
          isCosmicView ? 'opacity-15 hover:opacity-100' : 'opacity-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 group whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform border border-white/20">
              <span className="text-lg tracking-tighter">С</span>
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight drop-shadow-md">
              Сүлдээ
            </span>
          </button>

          {/* Zone 2: Clean single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-200">
            <button
              onClick={() => navigateTo('home')}
              className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'home' ? 'text-amber-300 font-semibold' : ''
              }`}
            >
              Нүүр
            </button>
            <button
              onClick={() => navigateTo('websites')}
              className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'websites' ? 'text-amber-300 font-semibold' : ''
              }`}
            >
              Вэб сайтууд
            </button>
            <button
              onClick={() => navigateTo('games')}
              className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeView === 'games' || activeView === 'game-anime-guess'
                  ? 'text-amber-300 font-semibold'
                  : ''
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              <span>Тоглоом</span>
            </button>
            <button
              onClick={() => navigateTo('home', 'about')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Миний тухай
            </button>
            <button
              onClick={() => navigateTo('home', 'contact')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Холбоо барих
            </button>
          </nav>

          {/* Zone 3: Auth & Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/50 border border-white/15 text-xs backdrop-blur-md">
                <span className="text-slate-100 font-semibold max-w-[110px] truncate hidden sm:inline">
                  {user.displayName || 'Хэрэглэгч'}
                </span>
                <button
                  disabled={authLoading}
                  onClick={() => signOutUser()}
                  title="Гарах"
                  className="text-slate-300 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Гарах</span>
                </button>
              </div>
            ) : (
              <button
                disabled={authLoading}
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/80 border border-white/20 text-slate-100 hover:text-amber-300 font-semibold text-xs transition cursor-pointer backdrop-blur-md whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Нэвтрэх</span>
              </button>
            )}

            <a
              href={baseNetlifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-white/20 whitespace-nowrap shrink-0"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Үндсэн сайт</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-90" />
            </a>
          </div>
        </div>
      </header>

      {/* Mobile Quick Switch Bar */}
      <div
        className={`md:hidden sticky top-20 z-30 backdrop-blur-xl bg-slate-950/35 border-b border-white/10 px-4 py-2 flex items-center justify-center gap-2 ${
          isCosmicView ? 'opacity-15 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          onClick={() => navigateTo('home')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
            activeView === 'home' ? 'bg-amber-500 text-slate-950' : 'text-slate-200'
          }`}
        >
          Нүүр
        </button>
        <button
          onClick={() => navigateTo('websites')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
            activeView === 'websites' ? 'bg-amber-500 text-slate-950' : 'text-slate-200'
          }`}
        >
          Вэб сайтууд
        </button>
        <button
          onClick={() => navigateTo('games')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 ${
            activeView === 'games' || activeView === 'game-anime-guess'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-200'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Тоглоом</span>
        </button>
      </div>

      {/* Netlify Domain Settings Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-950/85 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative backdrop-blur-md">
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
                <label className="block text-xs font-semibold text-slate-300 mb-2">
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

      {/* Main Content Area */}
      <main
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 transition-all duration-500 ${
          isCosmicView ? 'opacity-15 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* DEDICATED GAME WINDOW: ANIME GUESS */}
        {activeView === 'game-anime-guess' && (
          <div className="space-y-6 pb-16">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigateTo('games')}
                  className="px-4 py-2.5 rounded-xl bg-slate-950/45 hover:bg-slate-900/75 border border-white/20 text-slate-100 text-xs font-semibold flex items-center gap-2 transition cursor-pointer backdrop-blur-md whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-400" />
                  <span>Тоглоомын цонх руу буцах</span>
                </button>
                <button
                  onClick={() => navigateTo('home')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950/35 hover:bg-slate-900/60 border border-white/15 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer backdrop-blur-md whitespace-nowrap"
                >
                  Нүүр хуудас
                </button>
              </div>

              <button
                onClick={() => setIsCosmicView(!isCosmicView)}
                className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-slate-950/35 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white transition-all cursor-pointer backdrop-blur-md whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Хар нүх харах</span>
              </button>
            </div>

            <AnimeGuessGame />
          </div>
        )}

        {/* DEDICATED GAMES WINDOW ("ТОГЛООМ ЦОНХ") */}
        {activeView === 'games' && (
          <div className="space-y-10 pb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
              <div className="space-y-3">
                <button
                  onClick={() => navigateTo('home')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-amber-300 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Нүүр хуудас руу буцах</span>
                </button>
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 tracking-wide">
                  <Gamepad2 className="w-4 h-4" />
                  <span>Тоглоомуудын цонх</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                  Тоглоомууд
                </h1>
                <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
                  Дуртай тоглоомоо сонгон <strong className="text-amber-300 font-semibold">Тоглох</strong> товчийг дарснаар тусдаа тоглоомын цонх руу шилжинэ. Цаашид шинэ тоглоомууд энд нэмэгдэх болно.
                </p>
              </div>

              <span className="text-xs text-slate-300 font-mono tabular-nums">
                Нийт: <strong className="text-cyan-300">{gameProjects.length + 1}</strong> тоглоом
              </span>
            </div>

            {/* Games Launcher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {renderAnimeGuessCard()}
              {gameProjects.map((project) => renderProjectCard(project))}
            </div>
          </div>
        )}

        {/* DEDICATED WEBSITES WINDOW ("ВЭБ САЙТУУД ЦОНХ") */}
        {activeView === 'websites' && (
          <div className="space-y-10 pb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
              <div className="space-y-3">
                <button
                  onClick={() => navigateTo('home')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-amber-300 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Нүүр хуудас руу буцах</span>
                </button>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wide">
                  <Globe className="w-4 h-4" />
                  <span>Вэб сайтуудын цонх</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                  Вэб сайтууд
                </h1>
                <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
                  Миний хийсэн вэб хуудас болон танилцуулгын бүтээлүүд. Карт бүр шинэ цонхонд нээгдэнэ.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Вэб сайт хайх..."
                    value={websiteSearch}
                    onChange={(e) => setWebsiteSearch(e.target.value)}
                    className="w-full bg-slate-950/30 border border-white/15 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition backdrop-blur-md"
                  />
                  {websiteSearch && (
                    <button
                      onClick={() => setWebsiteSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <span className="text-xs text-slate-300 font-mono tabular-nums">
                  Нийт: <strong className="text-amber-300">{websiteProjects.length}</strong> сайт
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWebsites.map((project) => renderProjectCard(project))}
            </div>
          </div>
        )}

        {/* HOME PORTFOLIO VIEW */}
        {activeView === 'home' && (
          <div className="space-y-24">
            {/* HERO SECTION */}
            <section id="hero" className="relative pt-4 pb-8 lg:pt-10 lg:pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Content */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="text-xs font-medium text-amber-300/90 tracking-wide">
                    Веб хөгжүүлэгч · Интерактив тоглоом &amp; Төсөл бүтээгч
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-lg text-balance">
                      Сайн байна уу? Намайг{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400">
                        Сүлдээ
                      </span>{' '}
                      гэдэг.
                    </h1>
                    <p className="text-lg sm:text-xl font-semibold text-slate-200 drop-shadow-md">
                      Веб сайтууд, интерактив тоглоомууд болон бүтээлч төслүүд
                    </p>
                  </div>

                  <p className="text-base text-slate-200 max-w-2xl leading-relaxed drop-shadow-sm">
                    Би орчин үеийн веб технологи, интерактив хуудсууд, мини тоглоомууд болон бүтээлч контентуудыг урлан бүтээдэг. Доорх хэсгүүдээс миний веб сайтууд болон <strong className="text-amber-300 font-semibold">Тоглоом</strong> цонх руу орж шууд тоглоорой.
                  </p>

                  {/* Toolbar Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setIsCosmicView(!isCosmicView)}
                      className="flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-xl bg-slate-950/35 border border-amber-500/35 hover:border-amber-400 text-amber-300 hover:text-white transition-all cursor-pointer backdrop-blur-md whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>Хар нүхийг бүтнээр харах</span>
                    </button>

                    <button
                      onClick={() => {
                        setTempSubdomain(netlifySubdomain);
                        setIsConfigOpen(true);
                      }}
                      className="flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-xl bg-slate-950/35 border border-white/15 hover:border-amber-500/50 text-slate-200 hover:text-amber-300 transition-all cursor-pointer backdrop-blur-md font-mono whitespace-nowrap"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{netlifySubdomain}.netlify.app</span>
                    </button>
                  </div>

                  {/* Primary CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <button
                      onClick={() => navigateTo('games')}
                      className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-sm shadow-xl shadow-orange-500/25 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer border border-white/25 whitespace-nowrap"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>Тоглоом цонх нээх</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => navigateTo('websites')}
                      className="px-6 py-3.5 rounded-xl bg-slate-950/35 hover:bg-slate-900/55 border border-white/20 hover:border-amber-400 text-slate-100 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md whitespace-nowrap"
                    >
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span>Вэб сайтууд үзэх</span>
                    </button>
                  </div>

                  {/* Highlights Metric Strip */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-xl">
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums drop-shadow">
                        {websiteProjects.length}
                      </div>
                      <div className="text-xs text-slate-300 font-medium">Веб сайт бүтээл</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono tabular-nums drop-shadow">
                        {gameProjects.length + 1}
                      </div>
                      <div className="text-xs text-slate-300 font-medium">Веб тоглоомууд</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tabular-nums drop-shadow">
                        100%
                      </div>
                      <div className="text-xs text-slate-300 font-medium">Тунгалаг шилэн UI</div>
                    </div>
                  </div>
                </div>

                {/* Right Content (User Photo) */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative group max-w-sm w-full">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 rounded-3xl blur-xl opacity-35 group-hover:opacity-70 transition duration-1000" />

                    <div className="relative bg-slate-950/25 border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center backdrop-blur-md">
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

                        <div className="absolute bottom-2 left-2 right-2 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[11px] text-slate-200 flex items-center justify-between font-mono">
                          <span className="truncate">my-photo.png</span>
                          <a
                            href={photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-300 hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            үзэх <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-1 drop-shadow">Сүлдээ</h3>
                      <p className="text-xs text-slate-300 mb-4">
                        Монгол · Веб хөгжүүлэлт &amp; Тоглоом
                      </p>

                      <div className="w-full pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-200 font-medium">
                          <Flame className="w-4 h-4 text-amber-400" />
                          Бүтээлч хандлага
                        </span>
                        <span className="text-amber-300 font-mono text-[11px]">
                          Netlify Hosted
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION: МИНИЙ ҮНДСЭН САЙТ БАННЕР */}
            <section className="relative rounded-3xl p-8 sm:p-10 bg-slate-950/25 border border-white/20 shadow-2xl overflow-hidden backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-3 max-w-2xl">
                  <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
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
                    className="px-4 py-3 rounded-xl bg-slate-950/40 hover:bg-slate-900/60 border border-white/15 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-md whitespace-nowrap"
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
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer whitespace-nowrap"
                  >
                    <span>Үндсэн сайт нээх</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </section>

            {/* SECTION 1: ВЭБ САЙТУУД */}
            <section id="websites" className="space-y-8 scroll-mt-24">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wide mb-2 drop-shadow">
                    <Globe className="w-4 h-4" />
                    <span>Бүтээлүүд · 1-р хэсэг</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                    Вэб сайтууд
                  </h2>
                  <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed drop-shadow-sm">
                    Миний хийсэн вэб хуудас болон танилцуулгын бүтээлүүд. Карт бүр шинэ цонхонд нээгдэнэ.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Вэб сайт хайх..."
                      value={websiteSearch}
                      onChange={(e) => setWebsiteSearch(e.target.value)}
                      className="w-full bg-slate-950/30 border border-white/15 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition backdrop-blur-md"
                    />
                    {websiteSearch && (
                      <button
                        onClick={() => setWebsiteSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => navigateTo('websites')}
                    className="text-xs font-semibold text-amber-300 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span>Тусдаа цонхонд харах</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWebsites.map((project) => renderProjectCard(project))}
              </div>

              {filteredWebsites.length === 0 && (
                <div className="text-center py-12 bg-slate-950/30 rounded-2xl border border-white/15 p-6 backdrop-blur-md">
                  <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-200 font-medium">Хайлтад тохирох вэб сайт олдсонгүй.</p>
                  <button
                    onClick={() => setWebsiteSearch('')}
                    className="mt-3 text-xs text-amber-300 hover:underline cursor-pointer"
                  >
                    Бүх вэб сайтыг харах
                  </button>
                </div>
              )}
            </section>

            {/* SECTION 2: ТОГЛООМУУД (LAUNCHER CARDS -> OPENS SEPARATE GAME WINDOW) */}
            <section id="games" className="space-y-8 scroll-mt-24">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 tracking-wide mb-2 drop-shadow">
                    <Gamepad2 className="w-4 h-4" />
                    <span>Бүтээлүүд · 2-р хэсэг</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                    Тоглоомууд
                  </h2>
                  <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed drop-shadow-sm">
                    Тоглоом бүрийн <strong className="text-amber-300 font-semibold">Тоглох</strong> товчийг дарснаар өөр тоглоомын цонх руу орно. Мөн дээрээс &ldquo;Тоглоом&rdquo; цэсээр тусдаа цонх нээж болно.
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('games')}
                  className="px-4 py-2.5 rounded-xl bg-slate-950/45 hover:bg-amber-500 border border-white/20 text-slate-100 hover:text-slate-950 text-xs font-bold flex items-center gap-2 transition cursor-pointer backdrop-blur-md whitespace-nowrap shrink-0"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Тоглоомын цонх нээх</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderAnimeGuessCard()}
                {gameProjects.map((project) => renderProjectCard(project))}
              </div>
            </section>

            {/* SECTION: МИНИЙ ТУХАЙ & УР ЧАДВАР */}
            <section id="about" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start scroll-mt-24">
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wide drop-shadow">
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
                    Миний гол зорилго бол хэрэглэгчдэд ойлгомжтой, хурдан, үзэмжтэй бөгөөд ашиглахад зугаатай дижитал туршлагыг бий болгох явдал юм. Веб сайтууд болон &ldquo;Anime Guess&rdquo;, &ldquo;Тоглоомын сайт&rdquo;, &ldquo;Малаа хашаандаа&rdquo; зэрэг тоглоомуудаараа шинэ технологиудыг туршин хөгжүүлж байна.
                  </p>
                </div>

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
                    <p className="text-xs text-slate-300">Хөгжилтэй веб тоглоом &amp; мини аппууд</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/25 border border-white/15 backdrop-blur-md">
                    <div className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                      <Monitor className="w-4 h-4 text-rose-400" />
                      <span>Responsive</span>
                    </div>
                    <p className="text-xs text-slate-300">Утас, таблет, компьютер бүрт нийцтэй</p>
                  </div>
                </div>
              </div>

              <div id="skills" className="lg:col-span-6 space-y-5 scroll-mt-24">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wide drop-shadow">
                  <Layers className="w-4 h-4" />
                  <span>Технологиуд</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                  Ур чадвар &amp; Хэрэглэдэг багажууд
                </h2>
                <p className="text-slate-200 text-sm leading-relaxed drop-shadow-sm">
                  Миний эзэмшсэн технологи, веб боловсруулах чадваруудын ерөнхий түвшин:
                </p>

                <div className="space-y-4 pt-2">
                  {SKILLS_LIST.map((skill, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-100">{skill.name}</span>
                        <span className="font-mono tabular-nums text-amber-300 font-medium">{skill.level}%</span>
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

            {/* SECTION: ХОЛБОО БАРИХ */}
            <section id="contact" className="relative rounded-3xl bg-slate-950/25 border border-white/20 p-8 sm:p-12 overflow-hidden scroll-mt-24 backdrop-blur-md">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5 space-y-5">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wide drop-shadow">
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

                <div className="lg:col-span-7 bg-slate-950/35 rounded-2xl border border-white/15 p-6 sm:p-8 backdrop-blur-xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 drop-shadow">
                      <Send className="w-4 h-4 text-amber-400" />
                      <span>Зурвас илгээх</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Мэдээллээ үлдээнэ үү. Таны зурвас мэдээллийн санд аюулгүй хадгалагдана.
                    </p>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-xs text-rose-200">
                      {authError}
                    </div>
                  )}

                  {!user ? (
                    <div className="p-6 rounded-2xl bg-slate-950/45 border border-white/15 text-center space-y-4">
                      <p className="text-xs text-slate-200 leading-relaxed">
                        Хуурамч зурвасаас хамгаалахын тулд зурвас илгээхдээ Google бүртгэлээрээ нэвтэрнэ үү.
                      </p>
                      <button
                        disabled={authLoading}
                        onClick={() => signInWithGoogle()}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Google-ээр нэвтэрч зурвас илгээх</span>
                      </button>
                    </div>
                  ) : messageSent ? (
                    <div className="p-6 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-center space-y-2 backdrop-blur-md">
                      <CheckCircle2 className="w-10 h-10 text-amber-400 mx-auto" />
                      <h4 className="font-bold text-white text-base">Зурвас амжилттай хадгалагдлаа!</h4>
                      <p className="text-xs text-slate-200">
                        Баярлалаа. Таны зурвас мэдээллийн санд бүртгэгдлээ.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      {messageError && (
                        <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-xs text-rose-200">
                          {messageError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Таны нэр
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={100}
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
                            maxLength={160}
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
                          maxLength={2000}
                          rows={4}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Таны санал, асуулт эсвэл ажлын санал..."
                          className="w-full bg-slate-950/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition resize-none backdrop-blur-md"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={messageSending}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 disabled:opacity-60 text-slate-950 font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer border border-white/20"
                      >
                        <Send className="w-4 h-4" />
                        <span>{messageSending ? 'Илгээж байна...' : 'Зурвас илгээх'}</span>
                      </button>
                    </form>
                  )}

                  {/* User Sent Messages / Admin Inbox */}
                  {user && messagesList.length > 0 && (
                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Inbox className="w-4 h-4" />
                          <span>
                            {isAdmin ? 'Ирсэн зурвасууд (Админ)' : 'Таны илгээсэн зурвасууд'}
                          </span>
                        </span>
                        <span className="font-mono text-slate-400">{messagesList.length}</span>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {messagesList.map((msg) => (
                          <div
                            key={msg.id}
                            className="p-3 rounded-xl bg-slate-950/45 border border-white/10 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-white truncate">
                                {msg.senderName}{' '}
                                <span className="text-slate-400 font-normal">
                                  ({msg.senderEmail})
                                </span>
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                  msg.status === 'new'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : msg.status === 'read'
                                    ? 'bg-cyan-500/20 text-cyan-300'
                                    : 'bg-slate-700/50 text-slate-300'
                                }`}
                              >
                                {msg.status === 'new'
                                  ? 'Шинэ'
                                  : msg.status === 'read'
                                  ? 'Уншсан'
                                  : 'Архивласан'}
                              </span>
                            </div>
                            <p className="text-slate-200 leading-relaxed">{msg.message}</p>

                            {isAdmin && (
                              <div className="flex items-center justify-end gap-2 pt-1">
                                {msg.status === 'new' && (
                                  <button
                                    onClick={() => handleUpdateMessageStatus(msg.id, 'read')}
                                    className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
                                  >
                                    Уншсан болгох
                                  </button>
                                )}
                                {msg.status !== 'archived' && (
                                  <button
                                    onClick={() => handleUpdateMessageStatus(msg.id, 'archived')}
                                    className="text-[11px] text-amber-300 hover:underline cursor-pointer"
                                  >
                                    Архивлах
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  title="Устгах"
                                  className="text-rose-400 hover:text-rose-300 cursor-pointer p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* FOOTER */}
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

          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => setIsCosmicView(!isCosmicView)}
              className="hover:text-amber-300 transition text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isCosmicView ? 'Агуулга харах' : 'Хар нүх харах'}</span>
            </button>
            <button
              onClick={() => navigateTo('websites')}
              className="hover:text-amber-300 transition cursor-pointer"
            >
              Вэб сайтууд
            </button>
            <button
              onClick={() => navigateTo('games')}
              className="hover:text-amber-300 transition cursor-pointer"
            >
              Тоглоом
            </button>
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
