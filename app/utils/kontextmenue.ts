/** Eintrag im Rechtsklick-Menü (<VereinsheimKontextmenue>) */
export interface KontextEintrag { text: string, aktion: () => unknown, gefahr?: boolean }
