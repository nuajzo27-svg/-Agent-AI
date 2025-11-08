
import React from 'react';
import { AIAgentIdea } from '../types';
import { TargetIcon } from './icons/TargetIcon';
import { MonetizationIcon } from './icons/MonetizationIcon';
import { FeaturesIcon } from './icons/FeaturesIcon';
import { TechStackIcon } from './icons/TechStackIcon';
import { ChallengesIcon } from './icons/ChallengesIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';
import { CodeIcon } from './icons/CodeIcon';
import { CodeBlock } from './CodeBlock';
import { ExportIcon } from './icons/ExportIcon';
import { StarIcon } from './icons/StarIcon';
import { ChatIcon } from './icons/ChatIcon';

interface IdeaCardProps {
  idea: AIAgentIdea;
  onExpand: () => void;
  isExpanding: boolean;
  onPlayAudio: () => void;
  isGeneratingAudio: boolean;
  isPlayingAudio: boolean;
  onGenerateCode: () => void;
  isGeneratingCode: boolean;
  onExport: () => void;
  onToggleFavorite: () => void;
  onStartChat: () => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ 
  idea, 
  onExpand, 
  isExpanding, 
  onPlayAudio, 
  isGeneratingAudio,
  isPlayingAudio,
  onGenerateCode,
  isGeneratingCode,
  onExport,
  onToggleFavorite,
  onStartChat,
}) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex flex-col transform transition-all duration-300 hover:scale-[1.02] hover:border-sky-500 overflow-hidden">
      
      {idea.imageUrl ? (
        <img src={idea.imageUrl} alt={`Visual representation for ${idea.name}`} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-slate-700 animate-pulse"></div>
      )}
      
      <div className="p-6 flex flex-col gap-4 flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 text-transparent bg-clip-text pr-2">
            {idea.name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0 -mt-1 -me-2">
            <button
                onClick={onToggleFavorite}
                className="p-2 bg-transparent text-slate-500 rounded-full hover:bg-slate-700 hover:text-amber-400 transition-colors duration-300"
                aria-label={idea.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
                <StarIcon className={`h-5 w-5 ${idea.isFavorite ? 'text-amber-400 fill-current' : ''}`} />
            </button>
            <button
              onClick={onExport}
              className="p-2 bg-transparent text-slate-500 rounded-full hover:bg-slate-700 hover:text-white transition-colors duration-300"
              aria-label="Export idea as Markdown"
            >
              <ExportIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="text-slate-300 leading-relaxed -mt-2">
          {idea.description}
        </p>
        
        <div className="mt-auto pt-4 border-t border-slate-700 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <TargetIcon className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200">الجمهور المستهدف</h4>
              <p className="text-slate-400">{idea.targetAudience}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <MonetizationIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200">استراتيجية الربح</h4>
              <p className="text-slate-400">{idea.monetization}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          {idea.expansion ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FeaturesIcon className="h-5 w-5 text-purple-400" />
                  <h4 className="font-bold text-slate-100">الميزات الرئيسية (MVP)</h4>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 ps-2">
                  {idea.expansion.mvpFeatures.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TechStackIcon className="h-5 w-5 text-amber-400" />
                  <h4 className="font-bold text-slate-100">الحزمة التقنية</h4>
                </div>
                 <ul className="list-disc list-inside space-y-1 text-slate-400 ps-2">
                  {idea.expansion.techStack.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ChallengesIcon className="h-5 w-5 text-rose-400" />
                  <h4 className="font-bold text-slate-100">التحديات المحتملة</h4>
                </div>
                 <ul className="list-disc list-inside space-y-1 text-slate-400 ps-2">
                  {idea.expansion.potentialChallenges.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

               <div className="mt-4 pt-4 border-t border-slate-700">
                {idea.codeScaffold ? (
                  <div>
                    <h4 className="flex items-center gap-2 font-bold text-slate-100 mb-2">
                      <CodeIcon className="h-5 w-5 text-emerald-400" />
                      <span>الهيكل البرمجي الأولي</span>
                    </h4>
                    {idea.codeScaffold.map((file, index) => (
                      <CodeBlock key={index} fileName={file.fileName} code={file.code} />
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={onGenerateCode}
                    disabled={isGeneratingCode || isExpanding || isGeneratingAudio}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-800/50 text-emerald-300 font-semibold rounded-lg hover:bg-emerald-700/70 hover:text-emerald-200 disabled:opacity-50 disabled:cursor-wait transition-colors duration-300"
                  >
                    <CodeIcon className="h-5 w-5" />
                    {isGeneratingCode ? '...جاري إنشاء الكود' : 'إنشاء الهيكل البرمجي'}
                  </button>
                )}
              </div>
               <div className="mt-4 pt-4 border-t border-slate-700">
                <button
                    onClick={onStartChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-800/50 text-indigo-300 font-semibold rounded-lg hover:bg-indigo-700/70 hover:text-indigo-200 disabled:opacity-50 disabled:cursor-wait transition-colors duration-300"
                >
                    <ChatIcon className="h-5 w-5" />
                    {'ناقش وحسّن هذه الفكرة'}
                </button>
              </div>

            </div>
          ) : (
             <div className="flex items-center gap-2">
                <button
                  onClick={onExpand}
                  disabled={isExpanding || isGeneratingAudio}
                  className="w-full px-4 py-2 bg-sky-800/50 text-sky-300 font-semibold rounded-lg hover:bg-sky-700/70 hover:text-sky-200 disabled:opacity-50 disabled:cursor-wait transition-colors duration-300"
                >
                  {isExpanding ? '...جاري التوسيع' : 'توسيع هذه الفكرة'}
                </button>
                <button
                    onClick={onPlayAudio}
                    disabled={isExpanding || isGeneratingAudio}
                    className="flex-shrink-0 p-2 bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-600/70 hover:text-white disabled:opacity-50 disabled:cursor-wait transition-colors duration-300"
                    aria-label={isPlayingAudio ? "Stop audio pitch" : "Play audio pitch"}
                >
                    {isGeneratingAudio ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                    ) : isPlayingAudio ? (
                        <StopIcon className="h-5 w-5 text-rose-400"/>
                    ) : (
                        <SpeakerIcon className="h-5 w-5" />
                    )}
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
