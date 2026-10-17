export function useFaq() {
  return useFetch<Faq[]>('/api/faq', { default: () => [] })
}
