(function() {
  // ================== TEMA CLARO/ESCURO ==================
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle.querySelector('i');
  const currentTheme = localStorage.getItem('article-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('article-theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  // ================== CONTROLE DE FONTE ==================
  const fontSizes = ['small', 'medium', 'large'];
  let currentSize = localStorage.getItem('article-font-size') || 'medium';
  document.documentElement.setAttribute('data-font-size', currentSize);

  document.getElementById('fontIncrease').addEventListener('click', () => changeFont(1));
  document.getElementById('fontDecrease').addEventListener('click', () => changeFont(-1));
  document.getElementById('fontReset').addEventListener('click', () => {
    currentSize = 'medium';
    applyFontSize();
    localStorage.setItem('article-font-size', currentSize);
  });

  function changeFont(delta) {
    let idx = fontSizes.indexOf(currentSize) + delta;
    if (idx < 0) idx = 0;
    if (idx >= fontSizes.length) idx = fontSizes.length - 1;
    currentSize = fontSizes[idx];
    applyFontSize();
    localStorage.setItem('article-font-size', currentSize);
  }

  function applyFontSize() {
    document.documentElement.setAttribute('data-font-size', currentSize);
  }

  // ================== MARCAÇÃO DE TEXTO (HIGHLIGHT) ==================
  const articleContent = document.getElementById('articleContent');
  const tooltip = document.getElementById('highlightTooltip');
  const highlightBtn = document.getElementById('highlightBtn');

  // Carregar highlights salvos
  const pageKey = 'highlights_' + window.location.pathname;
  loadHighlights();

  // Evento de seleção de texto
  document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    if (selection.isCollapsed || !selection.toString().trim()) {
      tooltip.style.display = 'none';
      return;
    }
    // Verifica se a seleção está dentro do conteúdo do artigo
    if (!articleContent || !articleContent.contains(selection.anchorNode)) {
      tooltip.style.display = 'none';
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    tooltip.style.display = 'block';
    tooltip.style.top = (rect.top + window.scrollY - 40) + 'px';
    tooltip.style.left = (rect.left + rect.width/2 - 60) + 'px';
  });

  // Esconder tooltip ao clicar fora
  document.addEventListener('mousedown', (e) => {
    if (!tooltip.contains(e.target)) {
      tooltip.style.display = 'none';
    }
  });

  // Ação de highlight
  highlightBtn.addEventListener('click', () => {
    const selection = window.getSelection();
    if (selection.isCollapsed || !selection.toString().trim()) return;
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    // Criar elemento mark
    const mark = document.createElement('mark');
    mark.textContent = selectedText;
    mark.dataset.highlight = 'true';
    try {
      range.deleteContents();
      range.insertNode(mark);
    } catch (e) {
      console.warn('Não foi possível marcar:', e);
    }
    selection.removeAllRanges();
    tooltip.style.display = 'none';
    saveHighlights();
  });

  // Remover highlight ao clicar em um mark existente
  if (articleContent) {
    articleContent.addEventListener('click', (e) => {
      if (e.target.tagName === 'MARK') {
        if (confirm('Remover esta marcação?')) {
          const text = e.target.textContent;
          const textNode = document.createTextNode(text);
          e.target.parentNode.replaceChild(textNode, e.target);
          saveHighlights();
        }
      }
    });
  }

  function saveHighlights() {
    if (!articleContent) return;
    const marks = articleContent.querySelectorAll('mark[data-highlight]');
    const highlights = [];
    marks.forEach(mark => {
      highlights.push({
        text: mark.textContent,
        xpath: getXPathForElement(mark)
      });
    });
    localStorage.setItem(pageKey, JSON.stringify(highlights));
  }

  function loadHighlights() {
    const data = localStorage.getItem(pageKey);
    if (!data) return;
    try {
      const highlights = JSON.parse(data);
      highlights.forEach(h => {
        const element = getElementByXPath(h.xpath);
        if (element && element.textContent === h.text) {
          const mark = document.createElement('mark');
          mark.dataset.highlight = 'true';
          mark.textContent = h.text;
          element.parentNode.replaceChild(mark, element);
        }
      });
    } catch (e) {}
  }

  function getXPathForElement(element) {
    if (element.id !== '') return '//*[@id="' + element.id + '"]';
    if (element === document.body) return '/html/body';
    let ix = 0;
    const siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) return getXPathForElement(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
    }
  }

  function getElementByXPath(xpath) {
    try {
      return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    } catch(e) {
      return null;
    }
  }
})();