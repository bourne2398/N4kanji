// ===== N4 Kanji + Example Flashcards =====

const STORAGE_KEY = 'n4_kanji_progress_v2';

class KanjiApp {
  constructor() {
    this.allCards = this.buildAllCards();
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

  buildAllCards() {
    const cards = [];

    KANJI_DATA.forEach(k => {
      cards.push({
        id: `k-${k.kanji}`,
        type: 'kanji',
        front: k.kanji,
        onyomi: k.onyomi,
        kunyomi: k.kunyomi,
        meaning: k.english,
        parent: null
      });

      if (k.examples && k.examples.length) {
        k.examples.forEach((ex, i) => {
          cards.push({
            id: `e-${k.kanji}-${i}`,
            type: 'example',
            front: ex.word,
            reading: ex.reading,
            meaning: ex.meaning,
            parent: k.kanji
          });
        });
      }
    });

    return cards;
  }

  cacheDOM() {
    this.flashcard = document.getElementById('flashcard');
    this.cardType = document.getElementById('cardType');
    this.mainText = document.getElementById('mainText');
    this.subText = document.getElementById('subText');
    this.backLabel1 = document.getElementById('backLabel1');
    this.backVal1 = document.getElementById('backVal1');
    this.backLabel2 = document.getElementById('backLabel2');
    this.backVal2 = document.getElementById('backVal2');
    this.backMeaning = document.getElementById('backMeaning');
    this.parentKanji = document.getElementById('parentKanji');
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
    this.deck = this.allCards.filter(c =>
      !this.knew.has(c.id) && !this.dontKnow.has(c.id)
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
        this.cardType.textContent = '';
        this.mainText.textContent = '完';
        this.mainText.classList.remove('word');
        this.subText.textContent = '';
        this.backLabel1.textContent = '';
        this.backVal1.textContent = 'Done!';
        this.backLabel2.textContent = '';
        this.backVal2.textContent = '';
        this.backMeaning.textContent = 'Reset to study again';
        this.parentKanji.innerHTML = '';
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

    if (card.type === 'kanji') {
      this.cardType.textContent = 'KANJI';
      this.mainText.textContent = card.front;
      this.mainText.classList.remove('word');
      this.subText.textContent = '';

      this.backLabel1.textContent = '音';
      this.backVal1.textContent = card.onyomi;
      this.backLabel2.textContent = '訓';
      this.backVal2.textContent = card.kunyomi === '—' ? '—' : card.kunyomi;
      this.backMeaning.textContent = card.meaning;
      this.parentKanji.innerHTML = '';
    } else {
      this.cardType.textContent = 'WORD';
      this.mainText.textContent = card.front;
      this.mainText.classList.add('word');
      this.subText.textContent = '';

      this.backLabel1.textContent = '読み';
      this.backVal1.textContent = card.reading;
      this.backLabel2.textContent = '';
      this.backVal2.textContent = '';
      this.backMeaning.textContent = card.meaning;
      this.parentKanji.innerHTML = card.parent
        ? `from <span>${card.parent}</span>`
        : '';
    }

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

  speakCard() {
    const card = this.getCurrentCard();
    if (!card) return;

    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      alert('Audio pronunciation is not supported by this browser.');
      return;
    }

    // Vocabulary cards use their supplied reading; single-kanji cards use the
    // character itself so the device's Japanese voice can choose a reading.
    const text = card.type === 'example' && card.reading
      ? card.reading
      : card.front;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.82;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const japaneseVoice = voices.find(voice => /^ja(-|_)/i.test(voice.lang));
    if (japaneseVoice) utterance.voice = japaneseVoice;

    window.speechSynthesis.speak(utterance);
  }

  markCard(isKnew) {
    if (this.currentTab !== 'study') return;
    const card = this.getCurrentCard();
    if (!card) return;

    if (isKnew) {
      this.knew.add(card.id);
      this.dontKnow.delete(card.id);
    } else {
      this.dontKnow.add(card.id);
      this.knew.delete(card.id);
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

    if (this.currentTab === 'knew') this.knew.delete(card.id);
    else this.dontKnow.delete(card.id);

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
    this.reviewList = this.allCards.filter(c => set.has(c.id));
    if (this.reviewIndex >= this.reviewList.length) this.reviewIndex = 0;
  }

  updateProgressText() {
    if (this.currentTab === 'study') {
      const done = this.knew.size + this.dontKnow.size;
      this.progressText.textContent = `${done}/${this.allCards.length}`;
      this.progressFill.style.width = `${(done / this.allCards.length) * 100}%`;
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
    document.getElementById('speakBtn').addEventListener('click', () => this.speakCard());
    document.getElementById('reviewSpeakBtn').addEventListener('click', () => this.speakCard());
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
