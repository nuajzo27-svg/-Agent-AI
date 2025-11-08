export interface IdeaExpansion {
  mvpFeatures: string[];
  techStack: string[];
  potentialChallenges: string[];
}

export interface CodeScaffold {
  fileName: string;
  code: string;
}

export interface AIAgentIdea {
  name: string;
  description: string;
  targetAudience: string;
  monetization: string;
  imagePrompt: string;
  imageUrl?: string;
  expansion?: IdeaExpansion;
  audioPitchBase64?: string;
  codeScaffold?: CodeScaffold[];
  isFavorite?: boolean;
}