const diagrams = Object.freeze({
  'eddy-loops': '도체 내부의 닫힌 전류 경로',
  'eddy-flux': '안쪽 자속 증가와 반시계 방향 와전류'
});

function diagramImage(id, prefix = '') {
  if (!Object.hasOwn(diagrams, id)) return null;
  const image = document.createElement('img');
  image.src = prefix + 'diagrams/' + id + '.svg';
  image.alt = diagrams[id];
  image.className = 'block w-full max-h-40 object-contain rounded-lg';
  return image;
}
