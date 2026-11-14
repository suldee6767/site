import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart,
  Timer,
  Trophy,
  RotateCcw,
  Sparkles,
  Smile,
  Image as ImageIcon,
  UserCheck,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Eye,
  LogIn,
  Crown,
  Save
} from 'lucide-react';
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { useFirebase } from '../contexts/FirebaseContext.tsx';
import rawGameData from '../data/data.json';
import { resolveAssetImage } from '../data/imageAssets.ts';
import {
  AnimeGameData,
  AnimeQuestion,
  CharacterQuestion,
  DifficultyMode,
  GameMode
} from '../types.ts';

interface LeaderboardEntry {
  id: string;
  userId: string;
  playerName: string;
  mode: GameMode;
  difficulty: DifficultyMode;
  score: number;
  correctCount: number;
  totalQuestions: number;
  peakSpeed: number;
}

const GAME_DATA = rawGameData as AnimeGameData;

interface NormalizedRoundItem {
  id: string;
  emoji?: string;
  image?: string;
  answer: string;
  options: string[];
  subtitle?: string;
}

type GameStatus = 'menu' | 'playing' | 'feedback' | 'gameover';

interface DifficultyConfig {
  id: DifficultyMode;
  label: string;
  baseSeconds: number;
  baseSpeed: number;
  questionAccel: number;
  intraQuestionAccel: number;
  maxSpeed: number;
  summary: string;
}

const DIFFICULTIES: Record<DifficultyMode, DifficultyConfig> = {
  normal: {
    id: 'normal',
    label: 'Энгийн',
    baseSeconds: 15,
    baseSpeed: 1.0,
    questionAccel: 0,
    intraQuestionAccel: 0,
    maxSpeed: 1.0,
    summary: '15 сек · Тогтмол хурд'
  },
  hard: {
    id: 'hard',
    label: 'Хэцүү',
    baseSeconds: 10,
    baseSpeed: 1.15,
    questionAccel: 0.08,
    intraQuestionAccel: 0.45,
    maxSpeed: 2.1,
    summary: '10 сек · Хурдсах цаг'
  },
  god: {
    id: 'god',
    label: 'Бурхан',
    baseSeconds: 7,
    baseSpeed: 1.4,
    questionAccel: 0.14,
    intraQuestionAccel: 0.85,
    maxSpeed: 3.0,
    summary: '7 сек · Хэт хурдсах цаг'
  }
};

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const AnimeGuessGame: React.FC = () => {
  const { user, authReady, authLoading, signInWithGoogle } = useFirebase();

  const [status, setStatus] = useState<GameStatus>('menu');
  const [mode, setMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyMode>('normal');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [deck, setDeck] = useState<NormalizedRoundItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [peakSpeed, setPeakSpeed] = useState<number>(1.0);

  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [elapsedRealSec, setElapsedRealSec] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [imageReady, setImageReady] = useState<boolean>(true);

  // Leaderboard & persistence state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | GameMode>('all');
  const [scoreSaveState, setScoreSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const hasSavedRoundRef = useRef<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const lastTickSecRef = useRef<number>(-1);

  const playTone = useCallback(
    (type: 'correct' | 'wrong' | 'tick' | 'gameover') => {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'correct') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.26);
        } else if (type === 'wrong') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
          osc.start(now);
          osc.stop(now + 0.27);
        } else if (type === 'tick') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.06);
        } else if (type === 'gameover') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(660, now + 0.3);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.46);
        }
      } catch {
        // Ignore audio context restrictions
      }
    },
    [soundEnabled]
  );

  const clearPendingFeedback = () => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };

  const buildDeckForMode = (chosenMode: GameMode): NormalizedRoundItem[] => {
    if (chosenMode === 'emoji') {
      const items: NormalizedRoundItem[] = GAME_DATA.questions.map((q: AnimeQuestion, idx: number) => ({
        id: `emoji-${idx}-${q.answer}`,
        emoji: q.emoji,
        answer: q.answer,
        options: shuffleArray(q.options)
      }));
      return shuffleArray(items);
    }

    if (chosenMode === 'anime') {
      const valid = GAME_DATA.questions.filter(
        (q: AnimeQuestion) => typeof q.image === 'string' && q.image.trim().length > 0
      );
      const items: NormalizedRoundItem[] = valid.map((q: AnimeQuestion, idx: number) => ({
        id: `anime-${idx}-${q.answer}`,
        image: resolveAssetImage(q.image),
        answer: q.answer,
        options: shuffleArray(q.options)
      }));
      return shuffleArray(items);
    }

    // character mode
    const items: NormalizedRoundItem[] = GAME_DATA.characters.map((c: CharacterQuestion, idx: number) => ({
      id: `char-${idx}-${c.name}`,
      image: resolveAssetImage(c.image),
      answer: c.answer || c.name,
      options: shuffleArray(c.options),
      subtitle: c.anime
    }));
    return shuffleArray(items);
  };

  const startGame = (chosenMode: GameMode, chosenDiff: DifficultyMode = difficulty) => {
    clearPendingFeedback();
    const preparedDeck = buildDeckForMode(chosenMode);
    const diffCfg = DIFFICULTIES[chosenDiff];

    hasSavedRoundRef.current = false;
    setScoreSaveState('idle');
    setMode(chosenMode);
    setDifficulty(chosenDiff);
    setDeck(preparedDeck);
    setCurrentIndex(0);
    setScore(0);
    setLives(3);
    setCorrectCount(0);
    setBestStreak(0);
    setCurrentStreak(0);
    setSelectedOption(null);
    setIsTimedOut(false);
    setImageReady(true);
    setTimeLeft(diffCfg.baseSeconds);
    setElapsedRealSec(0);
    setCurrentSpeed(diffCfg.baseSpeed);
    setPeakSpeed(diffCfg.baseSpeed);
    lastTickSecRef.current = Math.ceil(diffCfg.baseSeconds);
    setStatus('playing');
  };

  const advanceRound = useCallback(
    (nextLives: number, indexToCheck: number, activeDeckLength: number) => {
      if (nextLives <= 0 || indexToCheck + 1 >= activeDeckLength) {
        playTone('gameover');
        setStatus('gameover');
        return;
      }

      const diffCfg = DIFFICULTIES[difficulty];
      const nextIdx = indexToCheck + 1;
      const nextInitialSpeed = Math.min(
        diffCfg.maxSpeed,
        Number((diffCfg.baseSpeed + nextIdx * diffCfg.questionAccel).toFixed(2))
      );

      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsTimedOut(false);
      setImageReady(true);
      setTimeLeft(diffCfg.baseSeconds);
      setElapsedRealSec(0);
      setCurrentSpeed(nextInitialSpeed);
      setPeakSpeed((prev) => Math.max(prev, nextInitialSpeed));
      lastTickSecRef.current = Math.ceil(diffCfg.baseSeconds);
      setStatus('playing');
    },
    [difficulty, playTone]
  );

  const handleOptionSelect = useCallback(
    (option: string | null, timedOut = false) => {
      if (status !== 'playing' || deck.length === 0) return;

      const currentItem = deck[currentIndex];
      if (!currentItem) return;

      const isCorrect = !timedOut && option === currentItem.answer;
      setSelectedOption(option);
      setIsTimedOut(timedOut);
      setStatus('feedback');

      let updatedLives = lives;
      if (isCorrect) {
        playTone('correct');
        setScore((prev) => prev + 10);
        setCorrectCount((prev) => prev + 1);
        setCurrentStreak((prev) => {
          const next = prev + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        playTone('wrong');
        updatedLives = Math.max(0, lives - 1);
        setLives(updatedLives);
        setCurrentStreak(0);
      }

      clearPendingFeedback();
      feedbackTimerRef.current = window.setTimeout(() => {
        advanceRound(updatedLives, currentIndex, deck.length);
      }, 1350);
    },
    [advanceRound, currentIndex, deck, lives, playTone, status]
  );

  // Skip broken/unloaded image in Anime mode automatically without penalizing player
  const handleImageError = () => {
    if (mode !== 'anime' || status !== 'playing') {
      setImageReady(false);
      return;
    }
    const remaining = deck.filter((_, idx) => idx !== currentIndex);
    if (remaining.length === 0 || currentIndex >= remaining.length) {
      setStatus('gameover');
      return;
    }
    const diffCfg = DIFFICULTIES[difficulty];
    setDeck(remaining);
    setTimeLeft(diffCfg.baseSeconds);
    setElapsedRealSec(0);
    setSelectedOption(null);
    setIsTimedOut(false);
  };

  // Accelerating countdown timer effect
  useEffect(() => {
    if (status !== 'playing') return;

    const diffCfg = DIFFICULTIES[difficulty];
    let lastTs = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const dtSec = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;

      setElapsedRealSec((prev) => prev + dtSec);

      setTimeLeft((prevLeft) => {
        const progress = 1 - prevLeft / diffCfg.baseSeconds;
        const dynamicSpeed = Math.min(
          diffCfg.maxSpeed,
          diffCfg.baseSpeed +
            currentIndex * diffCfg.questionAccel +
            progress * diffCfg.intraQuestionAccel
        );
        const roundedSpeed = Number(dynamicSpeed.toFixed(2));
        setCurrentSpeed(roundedSpeed);
        setPeakSpeed((p) => Math.max(p, roundedSpeed));

        const nextLeft = prevLeft - dtSec * dynamicSpeed;
        const ceilLeft = Math.ceil(nextLeft);

        if (ceilLeft <= 3 && ceilLeft >= 1 && ceilLeft !== lastTickSecRef.current) {
          lastTickSecRef.current = ceilLeft;
          playTone('tick');
        }

        if (nextLeft <= 0) {
          handleOptionSelect(null, true);
          return 0;
        }
        return nextLeft;
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [status, difficulty, currentIndex, handleOptionSelect, playTone]);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => clearPendingFeedback();
  }, []);

  // Load public leaderboard: snapshot when authenticated, getDocs for visitors
  useEffect(() => {
    if (!authReady) return;

    const scoresQuery = query(
      collection(db, 'scores'),
      where('isPublic', '==', true),
      limit(60)
    );

    const mapSnapshot = (docs: Array<{ id: string; data: () => Record<string, unknown> }>) => {
      const parsed: LeaderboardEntry[] = docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: String(data.userId || ''),
          playerName: String(data.playerName || 'Тоглогч'),
          mode: (data.mode as GameMode) || 'emoji',
          difficulty: (data.difficulty as DifficultyMode) || 'normal',
          score: Number(data.score || 0),
          correctCount: Number(data.correctCount || 0),
          totalQuestions: Number(data.totalQuestions || 1),
          peakSpeed: Number(data.peakSpeed || 1),
        };
      });
      parsed.sort((a, b) => b.score - a.score || b.correctCount - a.correctCount);
      setLeaderboard(parsed);
      setLeaderboardLoading(false);
    };

    setLeaderboardLoading(true);

    if (user) {
      const unsubscribe = onSnapshot(
        scoresQuery,
        (snapshot) => {
          mapSnapshot(snapshot.docs);
        },
        (error) => {
          setLeaderboardLoading(false);
          handleFirestoreError(error, OperationType.LIST, 'scores');
        }
      );
      return () => unsubscribe();
    } else {
      getDocs(scoresQuery)
        .then((snapshot) => {
          mapSnapshot(snapshot.docs);
        })
        .catch((error) => {
          setLeaderboardLoading(false);
          handleFirestoreError(error, OperationType.LIST, 'scores');
        });
    }
  }, [authReady, user]);

  const persistRoundScore = useCallback(
    async (activeUser = user) => {
      if (
        !activeUser ||
        !activeUser.emailVerified ||
        !mode ||
        deck.length === 0 ||
        hasSavedRoundRef.current
      ) {
        return;
      }

      hasSavedRoundRef.current = true;
      setScoreSaveState('saving');

      const safeName = (activeUser.displayName || 'Тоглогч').trim().slice(0, 80) || 'Тоглогч';
      const safeTotal = Math.max(1, Math.min(100, Math.trunc(deck.length)));
      const safeCorrect = Math.max(0, Math.min(safeTotal, Math.trunc(correctCount)));
      const safeScore = Math.max(0, Math.min(1000, Math.trunc(score)));
      const safePeak = Math.max(1, Math.min(5, Number(peakSpeed.toFixed(2))));

      try {
        await addDoc(collection(db, 'scores'), {
          userId: activeUser.uid,
          playerName: safeName,
          mode,
          difficulty,
          score: safeScore,
          correctCount: safeCorrect,
          totalQuestions: safeTotal,
          peakSpeed: safePeak,
          isPublic: true,
          createdAt: serverTimestamp(),
        });
        setScoreSaveState('saved');
      } catch (error) {
        hasSavedRoundRef.current = false;
        setScoreSaveState('error');
        handleFirestoreError(error, OperationType.CREATE, 'scores');
      }
    },
    [correctCount, deck.length, difficulty, mode, peakSpeed, score, user]
  );

  useEffect(() => {
    if (status === 'gameover' && user && user.emailVerified && !hasSavedRoundRef.current) {
      persistRoundScore(user).catch((err) => {
        console.error('Оноо хадгалахад алдаа гарлаа:', err);
      });
    }
  }, [status, user, persistRoundScore]);

  const currentItem = deck[currentIndex];
  const diffConfig = DIFFICULTIES[difficulty];
  const timePercent = Math.max(0, Math.min(100, (timeLeft / diffConfig.baseSeconds) * 100));

  // Unblur every 3 seconds in Anime mode
  const blurStep = Math.floor(elapsedRealSec / 3);
  const getBlurClass = () => {
    if (mode !== 'anime') return 'blur-none';
    if (status === 'feedback') return 'blur-none scale-100';
    if (blurStep === 0) return 'blur-2xl scale-110';
    if (blurStep === 1) return 'blur-lg scale-105';
    if (blurStep === 2) return 'blur-xs scale-102';
    return 'blur-none scale-100';
  };

  const getBlurLabel = () => {
    if (status === 'feedback' || blurStep >= 3) return 'Бүрэн тодорсон';
    if (blurStep === 0) return '1-р шат · Маш бүдэг';
    if (blurStep === 1) return '2-р шат · Тодорч байна';
    return '3-р шат · Бараг тод';
  };

  const getModeLabel = (m: GameMode | null) => {
    if (m === 'emoji') return 'Emoji таах';
    if (m === 'anime') return 'Anime зураг таах';
    if (m === 'character') return 'Баатар таах';
    return '';
  };

  const availableAnimeCount = GAME_DATA.questions.filter(
    (q) => typeof q.image === 'string' && q.image.trim().length > 0
  ).length;

  return (
    <div className="relative rounded-3xl bg-slate-950/25 border border-white/15 backdrop-blur-md shadow-2xl overflow-hidden">
      {/* Top Game Bar */}
      <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-slate-950/25">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">Anime Guess</h3>
            <p className="text-xs text-slate-300">
              {status === 'menu'
                ? 'Ямар горимоор тоглох вэ?'
                : `${getModeLabel(mode)} · ${diffConfig.label} горим`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {status !== 'menu' && (
            <button
              onClick={() => {
                clearPendingFeedback();
                setStatus('menu');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/70 border border-white/15 text-xs font-medium text-slate-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Горим солих</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Дуу хаах' : 'Дуу нээх'}
            className="p-2 rounded-xl bg-slate-950/50 hover:bg-slate-900/70 border border-white/15 text-slate-200 hover:text-amber-300 transition cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="p-6 sm:p-8">
        {/* 1. MENU STATE */}
        {status === 'menu' && (
          <div className="space-y-8">
            {/* Step 1: Difficulty Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-amber-300 tracking-wide">
                  1. Хүндрэлийн түвшин сонгох
                </span>
                <span className="text-xs text-slate-400">3 амь · Зөв хариулт +10 оноо</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['normal', 'hard', 'god'] as DifficultyMode[]).map((diffId) => {
                  const cfg = DIFFICULTIES[diffId];
                  const isActive = difficulty === diffId;
                  return (
                    <button
                      key={diffId}
                      onClick={() => setDifficulty(diffId)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isActive
                          ? diffId === 'god'
                            ? 'bg-rose-500/20 border-rose-400 shadow-lg shadow-rose-500/15'
                            : diffId === 'hard'
                            ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/15'
                            : 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/15'
                          : 'bg-slate-950/35 border-white/10 hover:border-white/25 hover:bg-slate-950/50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          diffId === 'god'
                            ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                            : diffId === 'hard'
                            ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                            : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                        }`}
                      >
                        {diffId === 'god' ? (
                          <Flame className="w-4 h-4" />
                        ) : diffId === 'hard' ? (
                          <Zap className="w-4 h-4" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white">{cfg.label}</div>
                        <div className="text-xs text-slate-300 mt-0.5 tabular-nums">{cfg.summary}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: 3 Game Mode Selection */}
            <div className="space-y-3">
              <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Ямар горимоор тоглох вэ?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Mode 1: Emoji */}
                <button
                  onClick={() => startGame('emoji', difficulty)}
                  className="group p-6 rounded-2xl bg-slate-950/35 hover:bg-slate-900/55 border border-white/15 hover:border-amber-400/70 text-left transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                      <Smile className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                        1. Emoji
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Том эможи дүрсээр анимийг таана. Нийт {GAME_DATA.questions.length} холимог асуулт.
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center justify-between">
                    <span>Тоглох</span>
                    <span>→</span>
                  </div>
                </button>

                {/* Mode 2: Anime */}
                <button
                  onClick={() => startGame('anime', difficulty)}
                  className="group p-6 rounded-2xl bg-slate-950/35 hover:bg-slate-900/55 border border-white/15 hover:border-cyan-400/70 text-left transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        2. Anime
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Бүдэг зургийг 3 сек тутам тодруулан таана. Зурагтай {availableAnimeCount} асуулт бэлэн.
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10 text-xs font-semibold text-cyan-300 flex items-center justify-between">
                    <span>Тоглох</span>
                    <span>→</span>
                  </div>
                </button>

                {/* Mode 3: Баатар */}
                <button
                  onClick={() => startGame('character', difficulty)}
                  className="group p-6 rounded-2xl bg-slate-950/35 hover:bg-slate-900/55 border border-white/15 hover:border-rose-400/70 text-left transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-300 group-hover:scale-105 transition-transform">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                        3. Баатар
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Баатрын зургийг харж 4 сонголтоос нэрийг нь таана ({GAME_DATA.characters.length} баатар).
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10 text-xs font-semibold text-rose-300 flex items-center justify-between">
                    <span>Тоглох</span>
                    <span>→</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Live Leaderboard Preview */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Шилдэг тоглогчдын самбар</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {(['all', 'emoji', 'anime', 'character'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setLeaderboardFilter(tab)}
                      className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        leaderboardFilter === tab
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-950/40 text-slate-300 border-white/10 hover:text-white'
                      }`}
                    >
                      {tab === 'all'
                        ? 'Бүгд'
                        : tab === 'emoji'
                        ? 'Emoji'
                        : tab === 'anime'
                        ? 'Anime'
                        : 'Баатар'}
                    </button>
                  ))}
                </div>
              </div>

              {leaderboardLoading ? (
                <div className="text-xs text-slate-400 py-4 text-center">
                  Самбар ачааллаж байна...
                </div>
              ) : (
                (() => {
                  const filteredBoard = leaderboard
                    .filter((item) => leaderboardFilter === 'all' || item.mode === leaderboardFilter)
                    .slice(0, 6);
                  if (filteredBoard.length === 0) {
                    return (
                      <div className="text-xs text-slate-400 py-4 px-4 rounded-xl bg-slate-950/30 border border-white/10 text-center">
                        Одоогоор хадгалагдсан оноо алга. Эхэлж тоглоод нэрээ бичүүлээрэй!
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {filteredBoard.map((entry, idx) => (
                        <div
                          key={entry.id}
                          className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            user && entry.userId === user.uid
                              ? 'bg-amber-500/15 border-amber-400/50'
                              : 'bg-slate-950/35 border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-400 text-slate-950'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-950'
                                  : idx === 2
                                  ? 'bg-orange-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">
                                {entry.playerName}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {entry.mode === 'emoji'
                                  ? 'Emoji'
                                  : entry.mode === 'anime'
                                  ? 'Anime'
                                  : 'Баатар'}{' '}
                                · {DIFFICULTIES[entry.difficulty]?.label || entry.difficulty}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-extrabold text-amber-300 font-mono tabular-nums">
                              {entry.score}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {entry.correctCount}/{entry.totalQuestions}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

        {/* 2. ACTIVE PLAY & FEEDBACK STATE */}
        {(status === 'playing' || status === 'feedback') && currentItem && (
          <div className="space-y-6">
            {/* Persistent HUD Strip: Score, Lives, Question Progress, Accelerating Timer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Score */}
              <div className="p-3.5 rounded-2xl bg-slate-950/45 border border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Оноо</span>
                <span className="text-lg font-extrabold text-amber-300 font-mono tabular-nums">
                  {score}
                </span>
              </div>

              {/* Lives */}
              <div className="p-3.5 rounded-2xl bg-slate-950/45 border border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Амь</span>
                <div className="flex items-center gap-1" aria-label={`Үлдсэн амь: ${lives}`}>
                  {[0, 1, 2].map((idx) => (
                    <Heart
                      key={idx}
                      className={`w-4 h-4 transition-all ${
                        idx < lives
                          ? 'text-rose-500 fill-rose-500 scale-100'
                          : 'text-slate-600 scale-90'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Question Counter */}
              <div className="p-3.5 rounded-2xl bg-slate-950/45 border border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Асуулт</span>
                <span className="text-sm font-bold text-white font-mono tabular-nums">
                  {currentIndex + 1} / {deck.length}
                </span>
              </div>

              {/* Countdown Timer + Dynamic Speed */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                  timeLeft <= 3
                    ? 'bg-rose-500/20 border-rose-400/60'
                    : 'bg-slate-950/45 border-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <Timer className={`w-4 h-4 ${timeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
                  <span>{currentSpeed > 1.05 ? `${currentSpeed.toFixed(1)}x` : 'Цаг'}</span>
                </div>
                <span
                  className={`text-lg font-extrabold font-mono tabular-nums ${
                    timeLeft <= 3 ? 'text-rose-300' : 'text-cyan-300'
                  }`}
                >
                  {timeLeft.toFixed(1)}с
                </span>
              </div>
            </div>

            {/* Timer Bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-slate-950/60 border border-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    timeLeft <= 3
                      ? 'bg-gradient-to-r from-rose-500 to-orange-500'
                      : difficulty === 'god'
                      ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                      : 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                  }`}
                  style={{ width: `${timePercent}%` }}
                />
              </div>
              {difficulty !== 'normal' && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{diffConfig.label} горим · Цаг хурдсаж байна</span>
                  <span className="text-amber-300 tabular-nums">Хурд: {currentSpeed.toFixed(2)}x</span>
                </div>
              )}
            </div>

            {/* Question Display Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Visual Prompt Area */}
              <div className="lg:col-span-6">
                {mode === 'emoji' && (
                  <div className="min-h-[240px] rounded-2xl bg-slate-950/45 border border-white/15 flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-xs text-slate-400 mb-3">Энэ ямар аниме вэ?</div>
                    <div className="text-6xl sm:text-7xl tracking-widest select-none drop-shadow-lg py-2">
                      {currentItem.emoji}
                    </div>
                  </div>
                )}

                {mode === 'anime' && (
                  <div className="relative h-[340px] sm:h-[380px] w-full rounded-2xl bg-slate-950/60 border border-white/15 overflow-hidden flex items-center justify-center p-3">
                    {currentItem.image && imageReady ? (
                      <img
                        src={currentItem.image}
                        alt="Таах аниме зураг"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                        className={`max-h-full max-w-full object-contain rounded-xl transition-all duration-700 ${getBlurClass()}`}
                      />
                    ) : (
                      <div className="text-xs text-slate-400">Зураг ачааллаж байна...</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>3 сек тутам тодорно</span>
                      </span>
                      <span className="font-mono text-cyan-300">{getBlurLabel()}</span>
                    </div>
                  </div>
                )}

                {mode === 'character' && (
                  <div className="relative h-[340px] sm:h-[380px] w-full rounded-2xl bg-slate-950/60 border border-white/15 overflow-hidden flex items-center justify-center p-3">
                    {currentItem.image ? (
                      <img
                        src={currentItem.image}
                        alt="Аниме баатар"
                        referrerPolicy="no-referrer"
                        onError={() => setImageReady(false)}
                        className="max-h-full max-w-full object-contain rounded-xl"
                      />
                    ) : (
                      <div className="text-xs text-slate-400">Баатрын зураг</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 text-center text-xs text-slate-200 px-3 py-1.5 rounded-xl bg-slate-950/75 backdrop-blur-md border border-white/10">
                      Энэ баатрын нэр хэн бэ?
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Answer Options + Feedback */}
              <div className="lg:col-span-6 space-y-3">
                <div className="text-xs font-medium text-slate-300 mb-1">
                  {mode === 'character'
                    ? 'Зөв баатрын нэрийг сонгоно уу:'
                    : 'Зөв анимийн нэрийг сонгоно уу:'}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {currentItem.options.map((opt) => {
                    const isSelected = selectedOption === opt;
                    const isAnswer = opt === currentItem.answer;

                    let buttonStyle =
                      'bg-slate-950/45 hover:bg-slate-900/70 border-white/15 hover:border-amber-400/60 text-white';

                    if (status === 'feedback') {
                      if (isAnswer) {
                        buttonStyle =
                          'bg-emerald-500/30 border-emerald-400 text-emerald-100 shadow-lg shadow-emerald-500/20';
                      } else if (isSelected && !isAnswer) {
                        buttonStyle =
                          'bg-rose-500/30 border-rose-400 text-rose-100 shadow-lg shadow-rose-500/20';
                      } else {
                        buttonStyle = 'bg-slate-950/25 border-white/10 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={opt}
                        disabled={status !== 'playing'}
                        onClick={() => handleOptionSelect(opt, false)}
                        className={`w-full min-h-[52px] px-4 py-3 rounded-xl border font-semibold text-sm text-left transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${buttonStyle}`}
                      >
                        <span className="truncate">{opt}</span>
                        {status === 'feedback' && isAnswer && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                        )}
                        {status === 'feedback' && isSelected && !isAnswer && (
                          <XCircle className="w-5 h-5 text-rose-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Result Banner on Feedback */}
                {status === 'feedback' && (
                  <div
                    className={`mt-3 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
                      !isTimedOut && selectedOption === currentItem.answer
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                        : 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                    }`}
                  >
                    <span>
                      {!isTimedOut && selectedOption === currentItem.answer
                        ? 'Зөв хариуллаа! +10 оноо'
                        : isTimedOut
                        ? `Хугацаа дууслаа! Зөв хариу: ${currentItem.answer}`
                        : `Буруу! Зөв хариу: ${currentItem.answer}`}
                    </span>
                    <span className="text-[11px] opacity-80 font-mono">Дараагийнх...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. GAME OVER SUMMARY STATE */}
        {status === 'gameover' && (
          <div className="py-6 text-center max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mx-auto shadow-lg shadow-amber-500/20">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-2xl sm:text-3xl font-extrabold text-white">
                {lives <= 0 ? 'Тоглоом дууслаа!' : 'Баяр хүргэе, дуусгалаа!'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {getModeLabel(mode)} · {diffConfig.label} горим
              </p>
            </div>

            {/* Final Score & Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/45 border border-white/15">
                <div className="text-2xl font-extrabold text-amber-300 font-mono tabular-nums">
                  {score}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">Нийт оноо</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/45 border border-white/15">
                <div className="text-2xl font-extrabold text-emerald-300 font-mono tabular-nums">
                  {correctCount}/{deck.length}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">Зөв хариулт</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/45 border border-white/15">
                <div className="text-2xl font-extrabold text-cyan-300 font-mono tabular-nums">
                  {difficulty === 'normal' ? `${bestStreak}` : `${peakSpeed.toFixed(1)}x`}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  {difficulty === 'normal' ? 'Дараалсан зөв' : 'Дээд хурд'}
                </div>
              </div>
            </div>

            {/* Cloud Score Save Status / Sign-in Prompt */}
            <div className="flex flex-col items-center justify-center gap-2">
              {user ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/50 border border-white/15 text-xs">
                  {scoreSaveState === 'saving' ? (
                    <>
                      <Save className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span className="text-slate-200">Оноог мэдээллийн санд хадгалж байна...</span>
                    </>
                  ) : scoreSaveState === 'saved' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-200">Таны оноо тэргүүлэгчдийн самбарт хадгалагдлаа!</span>
                    </>
                  ) : scoreSaveState === 'error' ? (
                    <button
                      onClick={() => persistRoundScore(user)}
                      className="text-rose-300 hover:underline cursor-pointer"
                    >
                      Хадгалахад алдаа гарлаа — Дахин хадгалах
                    </button>
                  ) : null}
                </div>
              ) : (
                <button
                  disabled={authLoading}
                  onClick={async () => {
                    const loggedInUser = await signInWithGoogle();
                    if (loggedInUser) {
                      await persistRoundScore(loggedInUser);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-900/75 border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Google-ээр нэвтэрч оноогоо самбарт хадгалах</span>
                </button>
              )}
            </div>

            {/* Restart & Switch Mode Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => mode && startGame(mode, difficulty)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Дахин тоглох</span>
              </button>

              <button
                onClick={() => setStatus('menu')}
                className="px-6 py-3 rounded-xl bg-slate-950/50 hover:bg-slate-900/75 border border-white/20 text-white font-semibold text-sm flex items-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Горим солих</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
