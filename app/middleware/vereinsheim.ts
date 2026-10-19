// Vereinsheim-Seiten nur mit Anmeldung – sonst zur Tür
export default defineNuxtRouteMiddleware(async (to) => {
  const { ich, laden } = useVereinsheimIch()
  if (!ich.value && !(await laden())) return navigateTo({ path: '/vereinsheim/tuer', query: to.fullPath !== '/vereinsheim' ? { weiter: to.fullPath } : {} })
  // Mitglieder-Bereich nur für den Vorstand
  if (to.path.startsWith('/vereinsheim/mitglieder') && !ich.value?.vorstand) return navigateTo('/vereinsheim')
})
