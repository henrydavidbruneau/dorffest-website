import type { GastbeitragEinladungOeffentlich } from '#shared/types/gastbeitrag'

/** Einladung zum privaten Gastbeitrags-Link; `error` (404), wenn es ihn nicht (mehr) gibt */
export function useGastbeitrag(schluessel: MaybeRefOrGetter<string>) {
  return useFetch<GastbeitragEinladungOeffentlich>(() => `/api/gastbeitrag/${encodeURIComponent(toValue(schluessel))}`, {
    key: `gastbeitrag-${toValue(schluessel)}`,
  })
}

/** Foto im Browser verkleinern (lange Kante max. 2000 px, JPEG), damit der Upload klein bleibt */
export async function fotoVerkleinern(datei: File, kante = 2000): Promise<Blob> {
  const bild = await createImageBitmap(datei, { imageOrientation: 'from-image' })
  const faktor = Math.min(1, kante / Math.max(bild.width, bild.height))
  const leinwand = document.createElement('canvas')
  leinwand.width = Math.round(bild.width * faktor)
  leinwand.height = Math.round(bild.height * faktor)
  leinwand.getContext('2d')!.drawImage(bild, 0, 0, leinwand.width, leinwand.height)
  bild.close()
  return new Promise((fertig, fehler) =>
    leinwand.toBlob(b => (b ? fertig(b) : fehler(new Error('Foto konnte nicht gelesen werden'))), 'image/jpeg', 0.85))
}
