import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

export enum Theme {
  LaraLightBlue = 'lara-light-blue',
  LaraDarkBlue = 'lara-dark-blue',
  Nano = 'nano',
  Mira = 'mira',
  Fluent = 'fluent-light',
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  public themes: { label: string; value: Theme }[] = [
    { label: 'Mira', value: Theme.Mira },
    { label: 'Lara (Light)', value: Theme.LaraLightBlue },
    { label: 'Lara (Dark)', value: Theme.LaraDarkBlue },
    { label: 'Fluent', value: Theme.Fluent },
    { label: 'Nano', value: Theme.Nano },
  ];

  public fontSizes: { label: string; value: number }[] = [
    { label: 'Tiny', value: 10 },
    { label: 'Small', value: 13 },
    { label: 'Medium', value: 14},
    { label: 'Kinda big', value: 16 },
    { label: 'Large', value: 18 },
  ];

  public theme = (localStorage.getItem('theme') as Theme) || Theme.LaraDarkBlue;
  public fontSize = parseInt(localStorage.getItem('fontSize') || '14');

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.switchTheme(this.theme);
    this.switchFontSize(this.fontSize);
  }

  switchTheme(theme: Theme) {
    this.theme = theme;
    const themeLink = this.document.getElementById(
      'app-theme'
    ) as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = theme + '.css';
    }
    localStorage.setItem('theme', theme);
  }

  switchFontSize(fontSize: number) {
    this.fontSize = fontSize;
    const html = this.document.querySelector('html');
    if (html) {
      html.style.fontSize = fontSize + 'px';
    }
    localStorage.setItem('fontSize', fontSize.toString());
  }
}
