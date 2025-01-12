declare module 'text-readability' {
    export function fleschKincaidReadingEase(text: string): number;
    export function colemanLiauIndex(text: string): number;
    export function fleschKincaidGradeLevel(text: string): number;
    export function automatedReadabilityIndex(text: string): number;
    export function daleChallReadabilityScore(text: string): number;
    export function textStandard(text: string): string;
    export function syllableCount(text: string): number;
    export function lexiconCount(text: string, removePunctuation?: boolean): number;
    export function sentenceCount(text: string): number;
    export function averageSentenceLength(text: string): number;
    export function averageSyllablesPerWord(text: string): number;
    export function averageWordsPerSentence(text: string): number;
}