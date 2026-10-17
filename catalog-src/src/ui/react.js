import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
/** mount a React tree whose only input is t. flushSync makes each frame paint synchronously, like a film frame. */
export function reactStage(host, Comp, extra = {}) {
  const root = createRoot(host);
  let props = { t: 0, w: host.clientWidth || 600, ...extra };
  const draw = p => { props = { ...props, ...p }; flushSync(() => root.render(<Comp {...props} />)); };
  return { draw, get props() { return props; } };
}
