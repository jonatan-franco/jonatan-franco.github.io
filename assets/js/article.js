document.addEventListener('DOMContentLoaded', () => {

  // ================== TEMA CLARO/ESCURO (CORRIGIDO) ==================
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;
  const htmlRoot = document.getElementById('htmlRoot') || document.documentElement;

  // Lemos o tema salvo pelo utilizador. Se for a primeira visita, o padrão é 'light' (modo leitura)
  let currentTheme = localStorage.getItem('article-theme') || 'light';

  // Função que aplica as cores e atualiza o ícone
  function applyTheme(theme) {
    htmlRoot.setAttribute('data-theme', theme);     // Para o nosso CSS customizado
    htmlRoot.setAttribute('data-bs-theme', theme);  // Para sobrescrever o Bootstrap
    
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // Aplica o tema logo que a página carrega
  applyTheme(currentTheme);

  // Escuta o clique no botão do menu
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      // Alterna entre light e dark
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      // Salva no navegador para as próximas visitas
      localStorage.setItem('article-theme', currentTheme);
      // Executa a mudança visual
      applyTheme(currentTheme);
    });
  }

  // ================== CONTROLE DE FONTE ==================
  const fontSizes = ['small', 'medium', 'large'];
  let currentSize = localStorage.getItem('article-font-size') || 'medium';
  htmlRoot.setAttribute('data-font-size', currentSize);

  const btnIncrease = document.getElementById('fontIncrease');
  const btnDecrease = document.getElementById('fontDecrease');
  const btnReset = document.getElementById('fontReset');

  if(btnIncrease) btnIncrease.addEventListener('click', () => changeFont(1));
  if(btnDecrease) btnDecrease.addEventListener('click', () => changeFont(-1));
  if(btnReset) {
    btnReset.addEventListener('click', () => {
      currentSize = 'medium';
      applyFontSize();
      localStorage.setItem('article-font-size', currentSize);
    });
  }

  function changeFont(delta) {
    let idx = fontSizes.indexOf(currentSize) + delta;
    if (idx < 0) idx = 0;
    if (idx >= fontSizes.length) idx = fontSizes.length - 1;
    currentSize = fontSizes[idx];
    applyFontSize();
    localStorage.setItem('article-font-size', currentSize);
  }

  function applyFontSize() {
    htmlRoot.setAttribute('data-font-size', currentSize);
  }

  // ================== MARCAÇÃO DE TEXTO (HIGHLIGHT) ==================
  // (Mantido idêntico ao seu original para garantir que as marcações funcionam)
  const articleContent = document.getElementById('articleContent');
  const tooltip = document.getElementById('highlightTooltip');
  const highlightBtn = document.getElementById('highlightBtn');
  const pageKey = 'highlights_' + window.location.pathname;
  
  loadHighlights();

  document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    if (selection.isCollapsed || !selection.toString().trim()) {
      if(tooltip) tooltip.style.display = 'none';
      return;
    }
    if (!articleContent || !articleContent.contains(selection.anchorNode)) {
      if(tooltip) tooltip.style.display = 'none';
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if(tooltip) {
      tooltip.style.display = 'block';
      tooltip.style.top = (rect.top + window.scrollY - 40) + 'px';
      tooltip.style.left = (rect.left + rect.width/2 - 60) + 'px';
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (tooltip && !tooltip.contains(e.target)) {
      tooltip.style.display = 'none';
    }
  });

  if(highlightBtn) {
    highlightBtn.addEventListener('click', () => {
      const selection = window.getSelection();
      if (selection.isCollapsed || !selection.toString().trim()) return;
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();
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
  }

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
      highlights.push({ text: mark.textContent, xpath: getXPathForElement(mark) });
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
    try { return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; } 
    catch(e) { return null; }
  }
  // ================== SUMÁRIO AUTOMÁTICO (TOC) ==================
  const article = document.querySelector('#articleContent article');
  const tocNav = document.getElementById('toc');
  const sidebar = document.querySelector('.article-sidebar');

  if (article && tocNav) {
    // Procura todos os H2 e H3 dentro do texto do artigo
    const headers = article.querySelectorAll('h2, h3');
    
    if (headers.length > 0) {
      headers.forEach((header, index) => {
        // Se o título não tiver um ID natural, damos-lhe um
        if (!header.id) {
          header.id = 'secao-' + index;
        }
        
        // Criamos o link para o menu
        const link = document.createElement('a');
        link.href = '#' + header.id;
        link.textContent = header.textContent;
        // Adicionamos classes para o CSS saber se é h2 ou h3
        link.className = 'toc-link ' + header.tagName.toLowerCase();
        
        tocNav.appendChild(link);
      });

      // API Intersection Observer (Observa que título está no ecrã ao fazer scroll)
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80% 0px', // Ativa o link quando o título chega perto do topo
        threshold: 0
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Remove a classe "active" de todos
            document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
            // Pinta de vermelho o link correspondente ao título no ecrã
            const activeLink = document.querySelector(`.toc-link[href="#${entry.target.id}"]`);
            if (activeLink) activeLink.classList.add('active');
          }
        });
      }, observerOptions);

      // Começa a observar todos os títulos
      headers.forEach(header => observer.observe(header));
    } else {
      // Se o artigo for muito pequeno e não tiver títulos, esconde a barra lateral
      if (sidebar) sidebar.style.display = 'none';
      document.querySelector('.article-layout-container').style.gridTemplateColumns = '1fr';
    }
  }
});