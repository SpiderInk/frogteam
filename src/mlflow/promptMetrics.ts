import { fleschKincaidReadingEase, colemanLiauIndex } from 'text-readability';

interface ReadabilityScores {
  fleschReadingEase: number;
  gradeLevel: number;
}

interface MetricScores {
  readabilityScore: number;
  gradeLevel: number;
  accuracyScore: number;
  hallucinationScore: number;
  groundednessScore: number;
}

export class ContentEvaluator {

  private calculateReadability(text: string): ReadabilityScores {
    return {
      fleschReadingEase: fleschKincaidReadingEase(text),
      gradeLevel: colemanLiauIndex(text)
    };
  }

  private calculateGroundedness(text: string, context: string): number {
    const textWords = new Set(text.toLowerCase().split(/\s+/));
    const contextWords = new Set(context.toLowerCase().split(/\s+/));
    const intersection = new Set([...textWords].filter(x => contextWords.has(x)));
    return intersection.size / textWords.size;
  }

  async evaluateContent(
    text: string,
    context?: string,
    reference?: string
  ): Promise<MetricScores> {
    const readabilityScores = this.calculateReadability(text);
    
    const scores: MetricScores = {
      readabilityScore: readabilityScores.fleschReadingEase,
      gradeLevel: readabilityScores.gradeLevel,
      accuracyScore: 0,
      hallucinationScore: 0,
      groundednessScore: 0
    };

    if (context) {
      scores.groundednessScore = this.calculateGroundedness(text, context);
    }

    return scores;
  }
}