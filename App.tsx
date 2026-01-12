
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, Layers, Printer, Users, Palette, Info, X, Wand2, Box, Image as ImageIcon,
  History, Lock, Download, RotateCcw, Mic, MicOff, MessageSquare, Sliders, Cpu,
  CheckCircle, LayoutGrid, Copy, Upload
} from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { MajorArcana, TarotCardData, ProjectSettings, TeamMember, CardVersion, ImageSize, ModelType, BackMode } from './types';
import { MAJOR_ARCANA_LIST, DEFAULT_STYLE, CARD_SIZES } from './constants';
import { TarotCard } from './components/TarotCard';
import { CollaborationPanel } from './components/CollaborationPanel';
import { PrintOptions } from './components/PrintOptions';
import { generateTarotArt, editTarotArt, decodeBase64, decodeAudioData, encodeBase64 } from './services/gemini';

const INITIAL_TEAM: TeamMember[] = [
  { id: '1', name: 'Master Designer', role: 'Admin', lastSeen: Date.now() },
  { id: '2', name: 'Elena Mystique', role: 'Designer', lastSeen: Date.now() - 500000 },
];

const App: React.FC = () => {
  const [cards, setCards] = useState<TarotCardData[]>(
    MAJOR_ARCANA_LIST.map((title, idx) => ({
      id: `card-${idx}`,
      title: title as MajorArcana,
      imageUrl: null,
      prompt: '',
      isCompleted: false,
      designer: 'Elena Mystique',
      lastUpdated: Date.now(),
      history: [],
      backImageUrl: null,
      backPrompt: 'Intricate symmetrical mystical card back design, ornate patterns, celestial geometry',
      backHistory: [],
    }))
  );

  const [settings, setSettings] = useState<ProjectSettings>({
    name: "Golden Dawn Revival",
    globalArtStyle: DEFAULT_STYLE,
    cardSize: 'standard',
    backMode: 'uniform',
    backImageUrl: null,
    backPrompt: 'Intricate symmetrical mystical card back design, ornate patterns, celestial geometry',
    backHistory: [],
    boxDesignUrl: null,
    preferredModel: 'flash',
    preferredSize: '1K'
  });

  const [activeTab, setActiveTab] = useState<'arcana' | 'backs' | 'box' | 'print' | 'collab'>('arcana');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState('');

  // Live API States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCard = cards.find(c => c.id === selectedCardId);

  const ensureProAccess = async () => {
    if (settings.preferredModel === 'pro') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await ensureProAccess();
      
      const isBackEdit = activeTab === 'backs';
      const promptToUse = isBackEdit 
        ? (settings.backMode === 'uniform' ? settings.backPrompt : selectedCard?.backPrompt)
        : selectedCard?.prompt || selectedCard?.title;

      if (!promptToUse) throw new Error("No prompt available");

      const imageUrl = await generateTarotArt(
        promptToUse, 
        settings.globalArtStyle, 
        settings.preferredModel, 
        settings.preferredSize
      );
      
      if (isBackEdit) {
        if (settings.backMode === 'uniform') {
          setSettings(prev => ({
            ...prev,
            backImageUrl: imageUrl,
            backHistory: [{ imageUrl: prev.backImageUrl, prompt: prev.backPrompt, timestamp: Date.now() }, ...prev.backHistory].slice(0, 10)
          }));
        } else if (selectedCard) {
          updateCardBack(selectedCard.id, imageUrl, selectedCard.backPrompt);
        }
      } else if (selectedCard) {
        updateCard(selectedCard.id, imageUrl, selectedCard.prompt);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate art.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const isBackEdit = activeTab === 'backs';
      
      if (isBackEdit) {
        if (settings.backMode === 'uniform') {
          setSettings(prev => ({
            ...prev,
            backImageUrl: base64String,
            backHistory: [{ imageUrl: prev.backImageUrl, prompt: prev.backPrompt, timestamp: Date.now() }, ...prev.backHistory].slice(0, 10)
          }));
        } else if (selectedCard) {
          updateCardBack(selectedCard.id, base64String, selectedCard.backPrompt);
        }
      } else if (selectedCard) {
        updateCard(selectedCard.id, base64String, selectedCard.prompt);
      }
    };
    reader.readAsDataURL(file);
    // Reset input value to allow uploading same file again
    e.target.value = '';
  };

  const handleEdit = async () => {
    const isBackEdit = activeTab === 'backs';
    const currentImageUrl = isBackEdit 
      ? (settings.backMode === 'uniform' ? settings.backImageUrl : selectedCard?.backImageUrl)
      : selectedCard?.imageUrl;

    if (!currentImageUrl || !editInstruction) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await editTarotArt(currentImageUrl, editInstruction, settings.globalArtStyle);
      
      if (isBackEdit) {
        if (settings.backMode === 'uniform') {
          setSettings(prev => ({
            ...prev,
            backImageUrl: imageUrl,
            backHistory: [{ imageUrl: prev.backImageUrl, prompt: prev.backPrompt, timestamp: Date.now() }, ...prev.backHistory].slice(0, 10)
          }));
        } else if (selectedCard) {
          updateCardBack(selectedCard.id, imageUrl, selectedCard.backPrompt);
        }
      } else if (selectedCard) {
        updateCard(selectedCard.id, imageUrl, selectedCard.prompt);
      }
      setEditInstruction('');
    } catch (err: any) {
      setError(err.message || "Failed to edit image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateCard = (id: string, imageUrl: string, prompt: string) => {
    setCards(prev => prev.map(c => {
      if (c.id === id) {
        const newHistory: CardVersion[] = c.isCompleted ? [
          { imageUrl: c.imageUrl, prompt: c.prompt, timestamp: c.lastUpdated },
          ...c.history
        ].slice(0, 10) : c.history;

        return {
          ...c,
          imageUrl,
          isCompleted: true,
          lastUpdated: Date.now(),
          history: newHistory
        };
      }
      return c;
    }));
  };

  const updateCardBack = (id: string, imageUrl: string, prompt: string) => {
    setCards(prev => prev.map(c => {
      if (c.id === id) {
        const newHistory: CardVersion[] = c.backImageUrl ? [
          { imageUrl: c.backImageUrl, prompt: c.backPrompt, timestamp: c.lastUpdated },
          ...c.backHistory
        ].slice(0, 10) : c.backHistory;

        return {
          ...c,
          backImageUrl: imageUrl,
          lastUpdated: Date.now(),
          backHistory: newHistory
        };
      }
      return c;
    }));
  };

  const handleRevert = (version: CardVersion) => {
    const isBackEdit = activeTab === 'backs';
    
    if (isBackEdit && settings.backMode === 'uniform') {
      setSettings(prev => {
        const newHistory = [{ imageUrl: prev.backImageUrl, prompt: prev.backPrompt, timestamp: Date.now() }, ...prev.backHistory.filter(v => v.timestamp !== version.timestamp)].slice(0, 10);
        return { ...prev, backImageUrl: version.imageUrl, backPrompt: version.prompt, backHistory: newHistory };
      });
      return;
    }

    if (!selectedCard) return;

    setCards(prev => prev.map(c => {
      if (c.id === selectedCard.id) {
        if (isBackEdit) {
          const newHistoryItem: CardVersion = { imageUrl: c.backImageUrl, prompt: c.backPrompt, timestamp: c.lastUpdated };
          const updatedHistory = [newHistoryItem, ...c.backHistory.filter(v => v.timestamp !== version.timestamp)].slice(0, 10);
          return { ...c, backImageUrl: version.imageUrl, backPrompt: version.prompt, lastUpdated: Date.now(), backHistory: updatedHistory };
        } else {
          const newHistoryItem: CardVersion = { imageUrl: c.imageUrl, prompt: c.prompt, timestamp: c.lastUpdated };
          const updatedHistory = [newHistoryItem, ...c.history.filter(v => v.timestamp !== version.timestamp)].slice(0, 10);
          return { ...c, imageUrl: version.imageUrl, prompt: version.prompt, lastUpdated: Date.now(), history: updatedHistory, isCompleted: !!version.imageUrl };
        }
      }
      return c;
    }));
  };

  const toggleLive = async () => {
    if (isLiveActive) {
      liveSessionRef.current?.close();
      setIsLiveActive(false);
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputNode = audioContextRef.current.createGain();
      outputNode.connect(audioContextRef.current.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const buffer = await decodeAudioData(decodeBase64(audioData), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNode);
              const playTime = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              source.start(playTime);
              nextStartTimeRef.current = playTime + buffer.duration;
            }
          },
          onclose: () => setIsLiveActive(false),
          onerror: (e) => console.error(e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are the ArcaneAI assistant. Help the user design their tarot deck."
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Live API failed", err);
    }
  };

  const renderBacksTab = () => (
    <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-cinzel text-white mb-2">Deck Back Design</h2>
          <p className="text-stone-400 text-sm">Choose between a uniform design for the whole deck or unique artwork for every card.</p>
        </div>
        <div className="bg-stone-900 p-1 rounded-xl flex border border-stone-800 self-start">
          <button 
            onClick={() => { setSettings(s => ({...s, backMode: 'uniform'})); setSelectedCardId(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${settings.backMode === 'uniform' ? 'bg-purple-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
          >
            <Copy className="w-4 h-4" /> Uniform
          </button>
          <button 
            onClick={() => setSettings(s => ({...s, backMode: 'individual'}))}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${settings.backMode === 'individual' ? 'bg-purple-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Individual
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
        {settings.backMode === 'uniform' ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[500px] space-y-8">
            <div 
              onClick={() => setSelectedCardId(null)}
              className="group relative aspect-[2.75/4.75] w-64 bg-stone-900 rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-purple-500 transition-all card-shadow shadow-purple-900/10"
            >
              {settings.backImageUrl ? (
                <img src={settings.backImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Card Back Uniform" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                  <ImageIcon className="w-16 h-16 text-stone-700 mb-4" />
                  <p className="text-xs uppercase tracking-widest font-bold">No design yet</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[10px] uppercase font-bold text-white tracking-widest">Edit Uniform Design</span>
              </div>
            </div>
            <div className="text-center max-w-md">
              <p className="text-stone-500 text-xs italic">"This design will be printed on the back of all cards in your deck."</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {cards.map(card => (
              <div 
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`group relative aspect-[2.75/4.75] bg-stone-900 rounded-xl overflow-hidden cursor-pointer border-2 transition-all card-shadow ${selectedCardId === card.id ? 'border-purple-500' : 'border-transparent hover:border-purple-500/50'}`}
              >
                {card.backImageUrl ? (
                  <img src={card.backImageUrl} className="w-full h-full object-cover" alt={`${card.title} Back`} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-stone-950/50">
                    <ImageIcon className="w-6 h-6 text-stone-700 mb-2" />
                    <span className="text-[8px] text-stone-600 uppercase tracking-widest leading-tight">{card.title} Back</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black to-transparent flex items-center justify-center">
                  <span className="font-cinzel text-[8px] px-2 text-center text-stone-400">{card.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-stone-950 overflow-hidden">
      <header className="h-16 border-b border-stone-800 bg-stone-900/50 backdrop-blur-md px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 mystic-gradient rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-cinzel text-xl font-bold tracking-tight text-white leading-none">ArcaneAI</h1>
            <span className="text-[10px] text-stone-500 uppercase tracking-widest font-medium">Tarot Deck Studio</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {['arcana', 'backs', 'box', 'collab', 'print'].map(id => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === id ? 'bg-stone-800 text-purple-400 font-medium' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              {id === 'arcana' && <Layers className="w-4 h-4" />}
              {id === 'backs' && <ImageIcon className="w-4 h-4" />}
              {id === 'box' && <Box className="w-4 h-4" />}
              {id === 'collab' && <Users className="w-4 h-4" />}
              {id === 'print' && <Printer className="w-4 h-4" />}
              <span className="text-sm capitalize">
                {id === 'arcana' ? 'Major Arcana' : id === 'backs' ? 'Card Backs' : id === 'box' ? 'Box Design' : id === 'collab' ? 'Invite & Team' : id}
              </span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              isLiveActive ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
            }`}
          >
            {isLiveActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            {isLiveActive ? 'Assistant Active' : 'Voice Assistant'}
          </button>
          <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20">
            <Download className="w-4 h-4" /> Export Deck
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {activeTab === 'arcana' && (
            <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 max-w-7xl mx-auto pb-24">
              {cards.map(card => (
                <TarotCard key={card.id} card={card} onClick={() => setSelectedCardId(card.id)} isGenerating={isGenerating && selectedCardId === card.id && activeTab === 'arcana'} />
              ))}
            </div>
          )}
          {activeTab === 'backs' && renderBacksTab()}
          {activeTab === 'collab' && <div className="p-8 h-full max-w-4xl mx-auto"><CollaborationPanel members={INITIAL_TEAM} settings={settings} onUpdateSettings={setSettings} /></div>}
          {activeTab === 'print' && <div className="p-8 max-w-4xl mx-auto py-12"><PrintOptions /></div>}
          {activeTab === 'box' && (
             <div className="p-8 max-w-4xl mx-auto py-12 text-center">
                <h2 className="text-4xl font-cinzel text-white mb-8">Professional Box Packaging</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-stone-900/50 aspect-square rounded-2xl border border-stone-800 flex flex-col items-center justify-center p-12 transition-all hover:bg-stone-900 hover:border-stone-700">
                      <Box className="w-20 h-20 text-stone-700 mb-6" />
                      <h3 className="text-xl font-bold text-stone-200 mb-2">Tuck Box</h3>
                      <p className="text-sm text-stone-500 mb-6">Standard lightweight card storage used by MPC and The Game Crafter.</p>
                      <button className="px-6 py-2 border border-stone-700 rounded-full text-stone-400 hover:text-white hover:border-stone-500 transition-all text-sm">Configure Template</button>
                   </div>
                   <div className="bg-stone-900/50 aspect-square rounded-2xl border-2 border-purple-500/20 flex flex-col items-center justify-center p-12 relative overflow-hidden transition-all hover:bg-stone-900 hover:border-purple-500/40">
                      <div className="absolute top-4 right-4 bg-purple-600 px-3 py-1 text-[10px] font-bold rounded-full text-white">PREMIUM</div>
                      <Box className="w-20 h-20 text-purple-900/40 mb-6" />
                      <h3 className="text-xl font-bold text-stone-200 mb-2">Two-Piece Rigid Box</h3>
                      <p className="text-sm text-stone-500 mb-6">Durable luxury housing with custom lining. Available at PrintNinja and Shuffledink.</p>
                      <button className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-all text-sm font-bold">Design with AI</button>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Editor Sidebar */}
        {(selectedCard || (activeTab === 'backs' && settings.backMode === 'uniform')) && (
          <aside className="w-96 bg-stone-900 border-l border-stone-800 flex flex-col z-50 animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-stone-800 flex items-center justify-between">
              <h2 className="font-cinzel text-lg text-white">
                {activeTab === 'backs' 
                  ? (settings.backMode === 'uniform' ? 'Uniform Back' : `${selectedCard?.title} Back`)
                  : selectedCard?.title}
              </h2>
              <button onClick={() => setSelectedCardId(null)} className="p-1 hover:bg-stone-800 rounded-lg text-stone-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="aspect-[2.75/4.75] w-full bg-stone-950 rounded-2xl overflow-hidden relative border border-stone-800 shadow-2xl">
                {(activeTab === 'backs' ? (settings.backMode === 'uniform' ? settings.backImageUrl : selectedCard?.backImageUrl) : selectedCard?.imageUrl) 
                  ? <img src={(activeTab === 'backs' ? (settings.backMode === 'uniform' ? settings.backImageUrl : selectedCard?.backImageUrl) : selectedCard?.imageUrl)!} className="w-full h-full object-cover" /> 
                  : <div className="w-full h-full flex items-center justify-center"><Palette className="w-12 h-12 text-stone-800" /></div>}
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                    <div className="relative mb-4">
                      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-xs font-bold text-white uppercase tracking-widest animate-pulse">Channeling Art...</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-1"><Cpu className="w-3 h-3" /> Model</span>
                    {settings.preferredModel === 'pro' && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold">PRO</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setSettings(s => ({...s, preferredModel: 'flash'}))} className={`py-2 text-[10px] uppercase font-bold tracking-widest rounded-lg border transition-all ${settings.preferredModel === 'flash' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-300'}`}>Flash</button>
                    <button onClick={() => setSettings(s => ({...s, preferredModel: 'pro'}))} className={`py-2 text-[10px] uppercase font-bold tracking-widest rounded-lg border transition-all ${settings.preferredModel === 'pro' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-300'}`}>Pro</button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2 block">Prompt Description</label>
                  <textarea 
                    value={activeTab === 'backs' 
                      ? (settings.backMode === 'uniform' ? settings.backPrompt : selectedCard?.backPrompt) 
                      : selectedCard?.prompt} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (activeTab === 'backs') {
                        if (settings.backMode === 'uniform') setSettings(s => ({...s, backPrompt: val}));
                        else setCards(prev => prev.map(c => c.id === selectedCard?.id ? { ...c, backPrompt: val } : c));
                      } else {
                        setCards(prev => prev.map(c => c.id === selectedCard?.id ? { ...c, prompt: val } : c));
                      }
                    }} 
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-sm text-stone-200 h-28 resize-none focus:border-purple-500 transition-all" 
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating} 
                    className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50"
                  >
                    <Wand2 className="w-5 h-5" /> {isGenerating ? 'Manifesting...' : 'Manifest AI Art'}
                  </button>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center gap-2 border border-stone-700 transition-all"
                    >
                      <Upload className="w-4 h-4" /> Replace with Image
                    </button>
                  </div>
                </div>
              </div>

              {(activeTab === 'backs' ? (settings.backMode === 'uniform' ? settings.backImageUrl : selectedCard?.backImageUrl) : selectedCard?.imageUrl) && (
                <div className="pt-6 border-t border-stone-800 space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2 block flex items-center gap-1"><Sliders className="w-3 h-3" /> AI Quick Edit</label>
                    <div className="flex gap-2">
                      <input value={editInstruction} onChange={(e) => setEditInstruction(e.target.value)} placeholder="e.g. 'Add gold foil highlights'" className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-300" />
                      <button onClick={handleEdit} disabled={isGenerating || !editInstruction} className="bg-stone-800 hover:bg-stone-700 p-2.5 rounded-lg text-purple-400 disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-stone-800">
                <div className="flex items-center gap-2 text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-4"><History className="w-4 h-4" /> History</div>
                <div className="space-y-3">
                  {(activeTab === 'backs' ? (settings.backMode === 'uniform' ? settings.backHistory : selectedCard?.backHistory) : selectedCard?.history)?.map((version, idx) => (
                    <div key={version.timestamp} className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex gap-3 group/history hover:border-purple-500/30 transition-all">
                      <div className="w-12 aspect-[2.75/4.75] bg-stone-900 rounded overflow-hidden flex-shrink-0">
                        {version.imageUrl && <img src={version.imageUrl} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] font-bold text-stone-400">v{((activeTab === 'backs' ? (settings.backMode === 'uniform' ? settings.backHistory : selectedCard?.backHistory) : selectedCard?.history)?.length || 0) - idx}</span>
                          <span className="text-[8px] text-stone-600">{new Date(version.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <button onClick={() => handleRevert(version)} className="text-[10px] text-purple-400 font-bold flex items-center gap-1 opacity-0 group-hover/history:opacity-100 transition-opacity"><RotateCcw className="w-3 h-3" /> Revert</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>

      <footer className="h-10 bg-stone-900 border-t border-stone-800 px-6 flex items-center justify-between text-[10px] text-stone-500 uppercase font-medium z-50">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Server Online</span>
          <span>Arcana: {cards.filter(c => c.isCompleted).length} / 22</span>
          <span>Backs: {settings.backMode === 'uniform' ? (settings.backImageUrl ? '1/1' : '0/1') : `${cards.filter(c => c.backImageUrl).length} / 22`}</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-stone-400">Active Designer: {INITIAL_TEAM[0].name}</span>
          <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Revision 4.2</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
