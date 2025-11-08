
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AIAgentIdea } from './types';
import { generateAgentIdeas, addImagesToIdeas, expandAgentIdea, generateAudioPitch, generateCodeScaffold } from './services/geminiService';
import { IdeaCard } from './components/IdeaCard';
import { Loader } from './components/Loader';
import { BrainCircuitIcon } from './components/icons/BrainCircuitIcon';

const IDEAS_STORAGE_KEY = 'aiAgentIdeas';

// Audio decoding utilities from @google/genai guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [ideas, setIdeas] = useState<AIAgentIdea[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean>(false);
  const [expandingIdeaIndex, setExpandingIdeaIndex] = useState<number | null>(null);
  const [generatingCodeIndex, setGeneratingCodeIndex] = useState<number | null>(null);
  const [audioLoadingIndex, setAudioLoadingIndex] = useState<number | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);


  // Load ideas from localStorage on initial render and fetch images
  useEffect(() => {
    const loadAndEnhanceIdeas = async () => {
      try {
        const savedIdeasRaw = localStorage.getItem(IDEAS_STORAGE_KEY);
        if (savedIdeasRaw) {
          const savedIdeas = JSON.parse(savedIdeasRaw) as Omit<AIAgentIdea, 'imageUrl' | 'expansion' | 'audioPitchBase64' | 'codeScaffold'>[];
          if (savedIdeas && savedIdeas.length > 0) {
            setIdeas(savedIdeas.map(idea => ({ ...idea, imageUrl: undefined }))); // Display text content immediately
            setIsGeneratingImages(true);
            setError(null);
            try {
              const ideasWithImages = await addImagesToIdeas(savedIdeas);
              setIdeas(ideasWithImages);
            } catch (err) {
              console.error("Failed to generate images for saved ideas", err);
              setError("فشل تحميل الصور للأفكار المحفوظة.");
            } finally {
              setIsGeneratingImages(false);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load or parse ideas from localStorage", err);
        localStorage.removeItem(IDEAS_STORAGE_KEY);
      }
    };
    loadAndEnhanceIdeas();
  }, []);

  // Save ideas to localStorage whenever they change (without dynamic data)
  useEffect(() => {
    if (ideas === null) return; 

    if (ideas.length === 0) {
      localStorage.removeItem(IDEAS_STORAGE_KEY);
    } else {
      try {
        const ideasForStorage = ideas.map(({ imageUrl, expansion, audioPitchBase64, codeScaffold, ...rest }) => rest);
        localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideasForStorage));
      } catch (err) {
        console.error("Failed to save ideas to localStorage. The data might be too large.", err);
        setError("حدث خطأ أثناء حفظ الأفكار. قد تكون مساحة التخزين ممتلئة.");
      }
    }
  }, [ideas]);


  const handleGenerateIdeas = useCallback(async () => {
    if (!userInput.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setIdeas(null);

    try {
      const generatedIdeas = await generateAgentIdeas(userInput);
      setIdeas(generatedIdeas);
      setFilter('all');
    } catch (err) {
      setError('حدث خطأ أثناء توليد الأفكار. الرجاء المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading]);
  
  const handleExpandIdea = useCallback(async (index: number) => {
    if (!ideas || expandingIdeaIndex !== null) return;
    if (ideas[index].expansion) return;

    setExpandingIdeaIndex(index);
    setError(null);

    try {
      const ideaToExpand = ideas[index];
      const expansionData = await expandAgentIdea(ideaToExpand);
      
      const newIdeas = [...ideas];
      newIdeas[index] = { ...newIdeas[index], expansion: expansionData };
      setIdeas(newIdeas);

    } catch (err) {
      setError('حدث خطأ أثناء توسيع الفكرة. الرجاء المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setExpandingIdeaIndex(null);
    }
  }, [ideas, expandingIdeaIndex]);

  const handleGenerateCodeScaffold = useCallback(async (index: number) => {
    if (!ideas || generatingCodeIndex !== null || !ideas[index].expansion) return;
    if (ideas[index].codeScaffold) return; 

    setGeneratingCodeIndex(index);
    setError(null);

    try {
        const ideaToScaffold = ideas[index];
        const codeFiles = await generateCodeScaffold(ideaToScaffold);
        
        const newIdeas = [...ideas];
        newIdeas[index] = { ...newIdeas[index], codeScaffold: codeFiles };
        setIdeas(newIdeas);

    } catch (err) {
        setError('حدث خطأ أثناء إنشاء الهيكل البرمجي. الرجاء المحاولة مرة أخرى.');
        console.error(err);
    } finally {
        setGeneratingCodeIndex(null);
    }
}, [ideas, generatingCodeIndex]);

  const handlePlayAudio = useCallback(async (index: number) => {
    if (!ideas) return;

    // Stop any currently playing audio
    if (currentAudioSourceRef.current) {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current = null;
    }

    // If the user clicked the currently playing item, just stop it and reset.
    if (playingIndex === index) {
        setPlayingIndex(null);
        return;
    }

    let audioData = ideas[index].audioPitchBase64;

    try {
      if (!audioData) {
        setAudioLoadingIndex(index);
        const generatedAudio = await generateAudioPitch(ideas[index]);
        audioData = generatedAudio;

        // Update ideas state with the new audio data
        const newIdeas = [...ideas];
        newIdeas[index] = { ...newIdeas[index], audioPitchBase64: audioData };
        setIdeas(newIdeas);
      }

      if (!audioData) {
        throw new Error("Audio generation returned no data.");
      }
      
      // Lazily create AudioContext
      if (!audioCtxRef.current) {
        // FIX: Cast window to any to allow access to webkitAudioContext for older browser compatibility, resolving TypeScript error.
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioCtx = audioCtxRef.current;
      
      const decodedBytes = decode(audioData);
      const audioBuffer = await decodeAudioData(decodedBytes, audioCtx, 24000, 1);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => {
        setPlayingIndex(null);
        currentAudioSourceRef.current = null;
      };
      source.start();
      
      currentAudioSourceRef.current = source;
      setPlayingIndex(index);

    } catch (err) {
      setError('حدث خطأ أثناء توليد أو تشغيل الصوت.');
      console.error(err);
    } finally {
      setAudioLoadingIndex(null);
    }

  }, [ideas, playingIndex]);

  const handleToggleFavorite = useCallback((index: number) => {
    if (!ideas) return;
    const newIdeas = [...ideas];
    newIdeas[index] = { ...newIdeas[index], isFavorite: !newIdeas[index].isFavorite };
    setIdeas(newIdeas);
  }, [ideas]);

  const handleClearIdeas = useCallback(() => {
    setIdeas([]);
  }, []);

  const handleExportIdea = useCallback((idea: AIAgentIdea) => {
    let markdownContent = `# ${idea.name}\n\n`;
    markdownContent += `## 📜 الوصف\n${idea.description}\n\n`;
    markdownContent += `## 🎯 الجمهور المستهدف\n${idea.targetAudience}\n\n`;
    markdownContent += `## 💰 استراتيجية الربح\n${idea.monetization}\n\n`;

    if (idea.expansion) {
      markdownContent += `## 🚀 خطة عمل المشروع\n\n`;
      markdownContent += `### ⭐ الميزات الرئيسية (MVP)\n`;
      idea.expansion.mvpFeatures.forEach(feature => {
        markdownContent += `- ${feature}\n`;
      });
      markdownContent += `\n`;

      markdownContent += `### 💻 الحزمة التقنية\n`;
      idea.expansion.techStack.forEach(stack => {
        markdownContent += `- ${stack}\n`;
      });
      markdownContent += `\n`;

      markdownContent += `### ⚠️ التحديات المحتملة\n`;
      idea.expansion.potentialChallenges.forEach(challenge => {
        markdownContent += `- ${challenge}\n`;
      });
      markdownContent += `\n`;
    }
    
    if (idea.codeScaffold && idea.codeScaffold.length > 0) {
        markdownContent += `## 💻 الهيكل البرمجي الأولي\n\n`;
        idea.codeScaffold.forEach(file => {
            markdownContent += `### \`${file.fileName}\`\n`;
            markdownContent += "```python\n";
            markdownContent += `${file.code}\n`;
            markdownContent += "```\n\n";
        });
    }

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `${idea.name.replace(/[^\u0621-\u064A\w\s]/gi, '').replace(/ /g, '_')}.md`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);
  
  const filteredIdeas = ideas?.filter(idea => filter === 'all' || idea.isFavorite);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        
        <header className="text-center mb-10">
          <div className="inline-block bg-gradient-to-r from-sky-400 to-indigo-500 p-3 rounded-full mb-4">
            <BrainCircuitIcon className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-sky-300 to-indigo-400 text-transparent bg-clip-text">
            مصمم مشاريع Agent AI
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            العقل المدبر لتوليد أفكار مشاريع وكلاء ذكاء اصطناعي (AI Agent) مبتكرة ومربحة.
          </p>
        </header>

        <main>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="أدخل مجالاً، مشكلة، أو فكرة أولية (مثال: التجارة الإلكترونية)"
                className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                disabled={isLoading}
              />
              <button
                onClick={handleGenerateIdeas}
                disabled={isLoading || !userInput.trim()}
                className="px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                {isLoading ? '...جاري التوليد' : 'ولّد الأفكار'}
              </button>
            </div>
          </div>

          <div className="mt-12">
            {isLoading && <Loader />}
            {isGeneratingImages && !isLoading && (
              <div className="text-center text-slate-400 mb-4">
                جاري تحميل الصور للأفكار المحفوظة...
              </div>
            )}
            {error && <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>}
            
            {!isLoading && (!ideas || ideas.length === 0) && !error && (
              <div className="text-center text-slate-500 p-8 border-2 border-dashed border-slate-700 rounded-xl">
                <h3 className="text-xl font-semibold text-slate-300">مرحباً بك في مصمم المشاريع</h3>
                <p className="mt-2">الأفكار التي سيتم إنشاؤها أو تحميلها من الجلسات السابقة ستظهر هنا.</p>
                <p className="mt-1">ابدأ بكتابة شيء ما في الأعلى لتوليد أفكار جديدة!</p>
              </div>
            )}

            {ideas && ideas.length > 0 && (
               <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
                      <button 
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-300 ${filter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                      >
                        كل الأفكار
                      </button>
                       <button 
                        onClick={() => setFilter('favorites')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-300 ${filter === 'favorites' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                      >
                        المفضلة
                      </button>
                  </div>
                  <button
                    onClick={handleClearIdeas}
                    className="px-4 py-2 text-sm bg-red-900/40 text-red-300 font-semibold rounded-lg hover:bg-red-800/60 hover:text-red-200 transition-colors duration-300"
                    aria-label="Clear all saved ideas"
                  >
                    مسح الأفكار المحفوظة
                  </button>
                </div>

                {filteredIdeas && filteredIdeas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ideas.map((idea, index) => {
                        if (filter === 'favorites' && !idea.isFavorite) return null;
                        return (
                            <IdeaCard 
                            key={index} 
                            idea={idea} 
                            onExpand={() => handleExpandIdea(index)}
                            isExpanding={expandingIdeaIndex === index}
                            onPlayAudio={() => handlePlayAudio(index)}
                            isGeneratingAudio={audioLoadingIndex === index}
                            isPlayingAudio={playingIndex === index}
                            onGenerateCode={() => handleGenerateCodeScaffold(index)}
                            isGeneratingCode={generatingCodeIndex === index}
                            onExport={() => handleExportIdea(idea)}
                            onToggleFavorite={() => handleToggleFavorite(index)}
                            />
                        )
                    })}
                    </div>
                ) : (
                    <div className="text-center text-slate-500 p-8 border-2 border-dashed border-slate-700 rounded-xl">
                        <h3 className="text-xl font-semibold text-slate-300">قائمة المفضلة فارغة</h3>
                        <p className="mt-2">انقر على أيقونة النجمة ⭐ في أي فكرة لإضافتها هنا.</p>
                    </div>
                )}
              </>
            )}
          </div>
        </main>
        
        <footer className="text-center mt-16 text-slate-600 text-sm">
            <p>مدعوم بواسطة Gemini API</p>
        </footer>

      </div>
    </div>
  );
};

export default App;