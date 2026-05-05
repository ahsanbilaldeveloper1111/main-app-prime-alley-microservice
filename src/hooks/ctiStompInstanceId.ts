let ctiStompInstanceCounter = 0;

export function generateCtiStompInstanceId(): string {
  ctiStompInstanceCounter++;
  return `cti-stomp-${ctiStompInstanceCounter}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 11)}`;
}
