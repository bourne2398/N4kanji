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
    this.currentTab = 'study';
    this.reviewList = [];
    this.reviewIndex = 0;

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
    this.headerTitle = document.getElementById('headerTitle');
    this.knewBadge = document.getElementById('knewBadge');
    this.dontKnowBadge = document.getElementById('dontKnowBadge');
    this.main = document.getElementById('main');
    this.actions = document.getElementById('actions');
    this.reviewControls = document.getElementById('reviewControls');
    this.emptyState = document.getElementById('emptyState');
    this.emptyIcon = document.getElementById('emptyIcon');
    this.emptyText = document.getElementById('emptyText');
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
    } catch (e) {}
  }

  saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      knew: [...this.knew],
      dontKnow: [...this.dontKnow]
    }));
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

  getCurrentCard() {
    if (this.currentTab === 'study') {
      return this.deck[this.currentIndex] || null;
    }
    return this.reviewList[this.reviewIndex] || null;
  }

  showCard() {
    const card = this.getCurrentCard();

    if (!card) {
      if (this.currentTab === 'study') {
        this.main.classList.remove('hidden');
        this.emptyState.classList.add('hidden');
        this.kanjiChar.textContent = '完';
        this.onyomiEl.textContent = 'Done!';
        this.kunyomiEl.textContent = '';
        this.meaningEl.textContent = 'Reset to study again';
      } else {
        this.main.classList.add('hidden');
        this.emptyState.classList.remove('hidden');
        this.emptyIcon.textContent = this.currentTab === 'knew' ? '✓' : '✕';
        this.emptyText.textContent = this.currentTab === 'knew'
          ? 'No cards yet — swipe right on cards you know'
          : 'No cards yet — swipe left on cards you don\'t know';
      }
      this.flashcard.classList.remove('flipped');
      this.isFlipped = false;
      return;
    }

    this.main.classList.remove('hidden');
    this.emptyState.classList.add('hidden');

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
    if (!this.getCurrentCard()) return;
    this.isFlipped = !this.isFlipped;
    this.flashcard.classList.toggle('flipped', this.isFlipped);
  }

  markCard(isKnew) {
    if (this.currentTab !== 'study') return;
    const card = this.getCurrentCard();
    if (!card) return;

    const k = card.kanji;
    if (isKnew) {
      this.knew.add(k);
      this.dontKnow.delete(k);
    } else {
      this.dontKnow.add(k);
      this.knew.delete(k);
    }
    this.saveProgress();
    this.updateUI();

    this.flashcard.classList.add(isKnew ? 'slide-right' : 'slide-left');
    setTimeout(() => {
      this.currentIndex++;
      if (this.currentIndex >= this.deck.length) this.buildDeck();
      this.showCard();
    }, 300);
  }

  reviewNext() {
    if (this.reviewList.length === 0) return;
    this.reviewIndex = (this.reviewIndex + 1) % this.reviewList.length;
    this.showCard();
    this.updateProgressText();
  }

  reviewPrev() {
    if (this.reviewList.length === 0) return;
    this.reviewIndex = (this.reviewIndex - 1 + this.reviewList.length) % this.reviewList.length;
    this.showCard();
    this.updateProgressText();
  }

  removeFromReview() {
    const card = this.getCurrentCard();
    if (!card) return;

    if (this.currentTab === 'knew') this.knew.delete(card.kanji);
    else this.dontKnow.delete(card.kanji);

    this.saveProgress();
    this.buildReviewList();
    this.updateUI();

    if (this.reviewList.length === 0) {
      this.showCard();
    } else {
      if (this.reviewIndex >= this.reviewList.length) this.reviewIndex = 0;
      this.showCard();
    }
  }

  buildReviewList() {
    const set = this.currentTab === 'knew' ? this.knew : this.dontKnow;
    this.reviewList = this.allKanji.filter(k => set.has(k.kanji));
    if (this.reviewIndex >= this.reviewList.length) this.reviewIndex = 0;
  }

  updateProgressText() {
    if (this.currentTab === 'study') {
      const done = this.knew.size + this.dontKnow.size;
      this.progressText.textContent = `${done}/${this.allKanji.length}`;
      this.progressFill.style.width = `${(done / this.allKanji.length) * 100}%`;
    } else {
      const total = this.reviewList.length;
      const pos = total === 0 ? 0 : this.reviewIndex + 1;
      this.progressText.textContent = `${pos}/${total}`;
      this.progressFill.style.width = total ? `${(pos / total) * 100}%` : '0%';
    }
  }

  updateUI() {
    this.knewBadge.textContent = this.knew.size;
    this.dontKnowBadge.textContent = this.dontKnow.size;
    this.updateProgressText();
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    this.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));

    if (tabName === 'study') {
      this.headerTitle.textContent = 'N4';
      this.actions.classList.remove('hidden');
      this.reviewControls.classList.add('hidden');
      this.buildDeck();
      this.showCard();
    } else {
      this.headerTitle.textContent = tabName === 'knew' ? '✓ Knew' : '✕ Don\'t Know';
      this.actions.classList.add('hidden');
      this.reviewControls.classList.remove('hidden');
      this.buildReviewList();
      this.reviewIndex = 0;
      this.showCard();
    }
    this.updateUI();
  }

  bindEvents() {
    this.flashcard.addEventListener('click', () => {
      if (this.isDragging) return;
      this.flipCard();
    });

    document.getElementById('flipBtn').addEventListener('click', () => this.flipCard());
    document.getElementById('reviewFlipBtn').addEventListener('click', () => this.flipCard());
    document.getElementById('knewBtn').addEventListener('click', () => this.markCard(true));
    document.getElementById('dontKnowBtn').addEventListener('click', () => this.markCard(false));
    document.getElementById('nextBtn').addEventListener('click', () => this.reviewNext());
    document.getElementById('prevBtn').addEventListener('click', () => this.reviewPrev());
    document.getElementById('removeBtn').addEventListener('click', () => this.removeFromReview());

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('Reset all progress?')) {
        this.knew.clear();
        this.dontKnow.clear();
        this.saveProgress();
        this.buildDeck();
        this.switchTab('study');
      }
    });

    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Touch swipe
    const card = this.flashcard;

    card.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      this.isDragging = false;
      this.startX = e.touches[0].clientX;
      this.currentX = 0;
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.startX;

      if (!this.isDragging && Math.abs(deltaX) > 12) {
        this.isDragging = true;
      }

      if (this.isDragging) {
        e.preventDefault();
        this.currentX = deltaX;
        card.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.07}deg)`;

        if (this.currentTab === 'study') {
          if (deltaX > 35) card.style.boxShadow = '0 0 28px rgba(34,197,94,0.45)';
          else if (deltaX < -35) card.style.boxShadow = '0 0 28px rgba(239,68,68,0.45)';
          else card.style.boxShadow = '';
        }
      }
    }, { passive: false });

    card.addEventListener('touchend', () => {
      if (!this.isDragging) {
        card.style.transition = '';
        return;
      }

      card.style.transition = 'transform 0.28s ease, box-shadow 0.28s';
      card.style.boxShadow = '';

      const threshold = 80;

      if (this.currentTab === 'study') {
        if (this.currentX > threshold) this.markCard(true);
        else if (this.currentX < -threshold) this.markCard(false);
        else card.style.transform = '';
      } else {
        if (this.currentX > threshold) this.reviewPrev();
        else if (this.currentX < -threshold) this.reviewNext();
        else card.style.transform = '';
      }

      setTimeout(() => { this.isDragging = false; }, 40);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new KanjiApp();
});
