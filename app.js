// ===== N4 Kanji Flashcards App =====

const STORAGE_KEY = 'n4_kanji_progress_v1';

class KanjiApp {
  constructor() {
    this.allKanji = [...KANJI_DATA];
    this.deck = [];
    this.currentIndex = 0;
    this.knew = new Set();
    this.dontKnow = new Set();
    this.isFlipped = false;
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;
    this.startY = 0;

    this.cacheDOM();
    this.loadProgress();
    this.buildDeck();
    this.bindEvents();
    this.showCard();
    this.updateUI();
  }

  cacheDOM() {
    this.flashcard = document.getElementById('flashcard');
    this.kanjiChar = document.getElementById('kanjiChar');
    this.onyomiEl = document.getElementById('onyomi');
    this.kunyomiEl = document.getElementById('kunyomi');
    this.meaningEl = document.getElementById('meaning');
    this.progressText = document.getElementById('progressText');
    this.progressFill = document.getElementById('progressFill');
    this.knewBadge = document.getElementById('knewBadge');
    this.dontKnowBadge = document.getElementById('dontKnowBadge');
    this.knewGrid = document.getElementById('knewGrid');
    this.dontKnowGrid = document.getElementById('dontKnowGrid');
    this.knewEmpty = document.getElementById('knewEmpty');
    this.dontKnowEmpty = document.getElementById('dontKnowEmpty');
    this.main = document.getElementById('main');
    this.knewView = document.getElementById('knewView');
    this.dontknowView = document.getElementById('dontknowView');
    this.tabs = document.querySelectorAll('.tab');
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.knew = new Set(data.knew || []);
        this.dontKnow = new Set(data.dontKnow || []);
      }
    } catch (e) {
      console.warn('Could not load progress', e);
    }
  }

  saveProgress() {
    const data = {
      knew: [...this.knew],
      dontKnow: [...this.dontKnow]
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  buildDeck() {
    this.deck = this.allKanji.filter(k => 
      !this.knew.has(k.kanji) && !this.dontKnow.has(k.kanji)
    );
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
    this.currentIndex = 0;
  }

  get currentCard() {
    return this.deck[this.currentIndex] || null;
  }

  showCard() {
    const card = this.currentCard;
    if (!card) {
      this.kanjiChar.textContent = '完';
      this.onyomiEl.textContent = 'All done!';
      this.kunyomiEl.textContent = '';
      this.meaningEl.textContent = 'Great job! Reset to study again.';
      this.flashcard.classList.remove('flipped');
      this.isFlipped = false;
      return;
    }

    this.kanjiChar.textContent = card.kanji;
    this.onyomiEl.textContent = card.onyomi;
    this.kunyomiEl.textContent = card.kunyomi === '—' ? '—' : card.kunyomi;
    this.meaningEl.textContent = card.english;

    this.flashcard.classList.remove('flipped', 'slide-left', 'slide-right');
    this.flashcard.style.transform = '';
    this.flashcard.style.transition = '';
    this.isFlipped = false;
  }

  flipCard() {
    if (!this.currentCard) return;
    this.isFlipped = !this.isFlipped;
    this.flashcard.classList.toggle('flipped', this.isFlipped);
  }

  markCard(isKnew) {
    const card = this.currentCard;
    if (!card) return;

    if (isKnew) {
      this.knew.add(card.kanji);
      this.dontKnow.delete(card.kanji);
    } else {
      this.dontKnow.add(card.kanji);
      this.knew.delete(card.kanji);
    }

    this.saveProgress();

    const direction = isKnew ? 'slide-right' : 'slide-left';
    this.flashcard.classList.add(direction);

    setTimeout(() => {
      this.currentIndex++;
      if (this.currentIndex >= this.deck.length) {
        this.buildDeck();
      }
      this.showCard();
      this.updateUI();
    }, 320);
  }

  updateUI() {
    const total = this.allKanji.length;
    const done = this.knew.size + this.dontKnow.size;

    this.progressText.textContent = `${done} / ${total}`;
    this.progressFill.style.width = `${(done / total) * 100}%`;

    this.knewBadge.textContent = this.knew.size;
    this.dontKnowBadge.textContent = this.dontKnow.size;

    this.renderList('knew');
    this.renderList('dontknow');
  }

  renderList(type) {
    const set = type === 'knew' ? this.knew : this.dontKnow;
    const grid = type === 'knew' ? this.knewGrid : this.dontKnowGrid;
    const empty = type === 'knew' ? this.knewEmpty : this.dontKnowEmpty;

    grid.innerHTML = '';
    if (set.size === 0) {
      empty.classList.add('show');
      return;
    }
    empty.classList.remove('show');

    [...set].sort().forEach(k => {
      const item = document.createElement('div');
      item.className = 'kanji-item';
      item.textContent = k;
      item.title = 'Tap to move back to study';
      item.addEventListener('click', () => {
        this.knew.delete(k);
        this.dontKnow.delete(k);
        this.saveProgress();
        this.buildDeck();
        this.showCard();
        this.updateUI();
      });
      grid.appendChild(item);
    });
  }

  switchTab(tabName) {
    this.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));

    this.main.style.display = tabName === 'study' ? 'flex' : 'none';
    this.knewView.classList.toggle('hidden', tabName !== 'knew');
    this.dontknowView.classList.toggle('hidden', tabName !== 'dontknow');
  }

  bindEvents() {
    this.flashcard.addEventListener('click', (e) => {
      if (this.isDragging) return;
      this.flipCard();
    });

    document.getElementById('flipBtn').addEventListener('click', () => this.flipCard());
    document.getElementById('knewBtn').addEventListener('click', () => this.markCard(true));
    document.getElementById('dontKnowBtn').addEventListener('click', () => this.markCard(false));

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        this.knew.clear();
        this.dontKnow.clear();
        this.saveProgress();
        this.buildDeck();
        this.showCard();
        this.updateUI();
      }
    });

    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    document.querySelectorAll('.clear-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.clear;
        if (confirm(`Clear all ${type === 'knew' ? 'Knew' : "Don't Know"} kanji?`)) {
          if (type === 'knew') this.knew.clear();
          else this.dontKnow.clear();
          this.saveProgress();
          this.buildDeck();
          this.showCard();
          this.updateUI();
        }
      });
    });

    // Touch Swipe that follows finger
    const card = this.flashcard;

    card.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      this.isDragging = false;
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.currentX = 0;
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.startX;
      const deltaY = e.touches[0].clientY - this.startY;

      if (!this.isDragging && Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        this.isDragging = true;
      }

      if (this.isDragging) {
        e.preventDefault();
        this.currentX = deltaX;
        const rotate = deltaX * 0.08;
        card.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg)`;

        if (deltaX > 40) {
          card.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.4)';
        } else if (deltaX < -40) {
          card.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.4)';
        } else {
          card.style.boxShadow = '';
        }
      }
    }, { passive: false });

    card.addEventListener('touchend', () => {
      if (!this.isDragging) {
        card.style.transition = '';
        return;
      }

      card.style.transition = 'transform 0.3s ease, box-shadow 0.3s';
      card.style.boxShadow = '';

      const threshold = 90;

      if (this.currentX > threshold) {
        this.markCard(true);
      } else if (this.currentX < -threshold) {
        this.markCard(false);
      } else {
        card.style.transform = '';
      }

      setTimeout(() => {
        this.isDragging = false;
      }, 50);
    });

    // Mouse support
    let mouseDown = false;
    card.addEventListener('mousedown', (e) => {
      mouseDown = true;
      this.isDragging = false;
      this.startX = e.clientX;
      this.currentX = 0;
      card.style.transition = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!mouseDown) return;
      const deltaX = e.clientX - this.startX;
      if (Math.abs(deltaX) > 10) this.isDragging = true;
      if (this.isDragging) {
        this.currentX = deltaX;
        const rotate = deltaX * 0.08;
        card.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg)`;
      }
    });

    window.addEventListener('mouseup', () => {
      if (!mouseDown) return;
      mouseDown = false;
      card.style.transition = 'transform 0.3s ease';

      if (this.currentX > 90) this.markCard(true);
      else if (this.currentX < -90) this.markCard(false);
      else card.style.transform = '';

      setTimeout(() => { this.isDragging = false; }, 50);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new KanjiApp();
});