import { Injectable } from '@angular/core';
import { ComparableNumber } from '../../items/comparable-number-input.component/comparable-number-input.component';
import { Item } from '../../items/item.entity';
import { Log } from '../../logs/log.entity';

export interface ItemTracker {
  item?: Item;
  price: ComparableNumber;
  wts?: boolean;
  silent?: boolean;
  matchingLogs: Log[];
  onSelectItem?: (item: Item) => void;
  saved: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SpeechService {
  speechSynthesis?: SpeechSynthesis;

  constructor() {}

  public speak(message: string): void {
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
      const allVoices = this.speechSynthesis.getVoices();
      const defaultVoice = allVoices[0];
      const preferredVoice = allVoices.filter(
        (voice) => voice.name === 'Google US English'
      )[0];
      let utterance = new SpeechSynthesisUtterance(message);
      utterance.voice = preferredVoice || defaultVoice;

      this.speechSynthesis?.speak(utterance);
    }
  }
}
