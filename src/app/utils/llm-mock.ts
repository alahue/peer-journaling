// Mock LLM service to simulate AI-mediated content modification

export function modifyEntryForSharing(
  content: string,
  intention: 'support' | 'accountability' | 'perspective'
): string {
  // Simulate LLM processing based on intention
  const lowerContent = content.toLowerCase();
  
  switch (intention) {
    case 'support':
      // Focus on emotional aspects, make it more vulnerable
      if (lowerContent.includes('struggling') || lowerContent.includes('challenging')) {
        return `I'm going through a difficult time and could use some support. ${content.split('.')[0]}.`;
      }
      return `Seeking support: ${content}`;
      
    case 'accountability':
      // Focus on goals and actions
      if (lowerContent.includes('procrastination') || lowerContent.includes('need to')) {
        const sentences = content.split('.');
        return sentences.slice(0, 2).join('.') + '. Looking for accountability to stay on track.';
      }
      return `Accountability check: ${content.substring(0, 150)}${content.length > 150 ? '...' : ''}`;
      
    case 'perspective':
      // Summarize and ask for insights
      const firstSentence = content.split('.')[0];
      return `${firstSentence}. I'd appreciate a fresh perspective on this situation.`;
      
    default:
      return content;
  }
}
