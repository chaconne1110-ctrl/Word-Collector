// Web-only duplicate request guard. An abort does not guarantee the upstream
// Gemini request was stopped or that it did not incur charges.
(function(root) {
  'use strict';
  const WINDOW_MS = 3000;
  function create({now = () => Date.now(), windowMs = WINDOW_MS,
      makeController = () => new AbortController()} = {}) {
    let startedAt = -Infinity, generation = 0, controller = null, pending = false;
    function remainingMs() {
      return Math.max(0, Math.ceil(windowMs - (now() - startedAt)));
    }
    function begin() {
      const remaining = remainingMs();
      if (remaining) return {allowed:false, remainingMs:remaining};
      const replaced = pending;
      if (controller) controller.abort();
      controller = makeController();
      startedAt = now();
      pending = true;
      generation += 1;
      return {allowed:true, id:generation, signal:controller.signal, replaced};
    }
    function isCurrent(id) {return id === generation;}
    function finish(id) {
      if (!isCurrent(id)) return false;
      controller = null;
      pending = false;
      return true;
    }
    function cancel() {
      if (controller) controller.abort();
      controller = null;
      pending = false;
      generation += 1;
    }
    return {begin, remainingMs, isCurrent, finish, cancel, isPending:() => pending};
  }
  const api = {create, WINDOW_MS};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.WordCollectorRequestGate = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
