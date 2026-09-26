// SpeechSynthesis (Text-to-Speech) Controller with natural voice selection & cancellation safety

class SpeechFeedbackController {
  private synth: SpeechSynthesis | null = null;
  public isVoiceFeedbackEnabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize natural high quality English voices (Google US English, Samantha, Daniel, Natural)
    const naturalVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Ava'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (naturalVoice) {
      this.selectedVoice = naturalVoice;
    }
  }

  speak(text: string, onEnd?: () => void) {
    if (!this.synth || !this.isVoiceFeedbackEnabled) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any previous utterances
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = 1.05; // Slightly brisk, modern assistant tempo
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    this.synth.speak(utterance);
  }

  cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }
}

export const speechFeedback = new SpeechFeedbackController();
