export type FocusColumnChoice = 'auto' | 1 | 2 | 3 | 4;
export type FocusFitMode = 'contain' | 'cover';

export type LayoutPreferences = {
  isFocusLayout: boolean;
  focusColumnsChoice: FocusColumnChoice;
  focusFitMode: FocusFitMode;
};

const STORAGE_KEY = 'campanel:layout-preferences';

const DEFAULT_PREFERENCES: LayoutPreferences = {
  isFocusLayout: true,
  focusColumnsChoice: 'auto',
  focusFitMode: 'contain'
};

export function loadLayoutPreferences(): LayoutPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<LayoutPreferences>;
    const isFocusLayout = typeof parsed.isFocusLayout === 'boolean'
      ? parsed.isFocusLayout
      : DEFAULT_PREFERENCES.isFocusLayout;

    const validChoices: FocusColumnChoice[] = ['auto', 1, 2, 3, 4];
    const focusColumnsChoice = validChoices.includes(parsed.focusColumnsChoice as FocusColumnChoice)
      ? (parsed.focusColumnsChoice as FocusColumnChoice)
      : DEFAULT_PREFERENCES.focusColumnsChoice;

    const focusFitMode = parsed.focusFitMode === 'cover' || parsed.focusFitMode === 'contain'
      ? parsed.focusFitMode
      : DEFAULT_PREFERENCES.focusFitMode;

    return {
      isFocusLayout,
      focusColumnsChoice,
      focusFitMode
    };
  } catch (error) {
    console.warn('Erro ao carregar preferências de layout:', error);
    return DEFAULT_PREFERENCES;
  }
}

export function saveLayoutPreferences(prefs: LayoutPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.warn('Erro ao salvar preferências de layout:', error);
  }
}
