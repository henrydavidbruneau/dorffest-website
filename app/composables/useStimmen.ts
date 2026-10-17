export function useStimmen() {
  return useFetch<Stimme[]>('/api/stimmen', { default: () => [] })
}
