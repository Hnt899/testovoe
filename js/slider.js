class Slider {
  constructor(root, options = {}) {
    if (!root) {
      throw new Error('Slider root element is required');
    }

    this.root = root;
    this.options = Object.assign(
      {
        slidesToShow: 1,
        step: 1,
        breakpoints: [],
        loop: false,
      },
      options
    );

    this.viewport = root.querySelector('.slider__viewport');
    this.track = root.querySelector('.slider__track');
    this.slides = Array.from(root.querySelectorAll('.slider__slide'));
    this.prevButton = root.querySelector('.slider__control--prev');
    this.nextButton = root.querySelector('.slider__control--next');

    this.currentIndex = 0;
    this.slidesToShow = this.options.slidesToShow;
    this.isDragging = false;
    this.startX = 0;
    this.currentTranslate = 0;
    this.animationFrame = null;
    this.disableAnimation = false;

    this.breakpoints = [...this.options.breakpoints].sort(
      (a, b) => a.width - b.width
    );

    this.onResize = this.onResize.bind(this);
    this.onPrev = this.onPrev.bind(this);
    this.onNext = this.onNext.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    this.init();
  }

  init() {
    this.root.setAttribute('tabindex', '0');
    this.root.setAttribute('role', 'region');
    this.viewport.setAttribute('aria-live', 'polite');

    this.updateSettings();
    this.updateSlidesLayout();
    this.update();

    window.addEventListener('resize', this.onResize);
    this.root.addEventListener('keydown', this.onKeyDown);

    if (this.prevButton) {
      this.prevButton.addEventListener('click', this.onPrev);
    }

    if (this.nextButton) {
      this.nextButton.addEventListener('click', this.onNext);
    }

    this.viewport.addEventListener('pointerdown', this.onPointerDown, {
      passive: true,
    });
    this.viewport.addEventListener('pointerup', this.onPointerUp);
    this.viewport.addEventListener('pointercancel', this.onPointerUp);
    this.viewport.addEventListener('pointerleave', this.onPointerUp);
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    this.root.removeEventListener('keydown', this.onKeyDown);
    if (this.prevButton) {
      this.prevButton.removeEventListener('click', this.onPrev);
    }
    if (this.nextButton) {
      this.nextButton.removeEventListener('click', this.onNext);
    }
    this.viewport.removeEventListener('pointerdown', this.onPointerDown);
    this.viewport.removeEventListener('pointermove', this.onPointerMove);
    this.viewport.removeEventListener('pointerup', this.onPointerUp);
    this.viewport.removeEventListener('pointercancel', this.onPointerUp);
    this.viewport.removeEventListener('pointerleave', this.onPointerUp);
  }

  onResize() {
    this.updateSettings();
    this.updateSlidesLayout();
    this.goTo(this.currentIndex, false);
  }

  updateSettings() {
    const width = window.innerWidth;
    this.slidesToShow = this.options.slidesToShow;
    this.step = this.options.step || this.slidesToShow;

    for (const bp of this.breakpoints) {
      if (width >= bp.width) {
        this.slidesToShow = bp.slidesToShow ?? this.slidesToShow;
        this.step = bp.step ?? this.step;
      }
    }

    this.maxIndex = Math.max(this.slides.length - this.slidesToShow, 0);
    if (this.currentIndex > this.maxIndex) {
      this.currentIndex = this.maxIndex;
    }
  }

  updateSlidesLayout() {
    const slideWidth = 100 / this.slidesToShow;
    this.slides.forEach((slide) => {
      slide.style.flexBasis = `${slideWidth}%`;
      slide.style.maxWidth = `${slideWidth}%`;
    });
  }

  update() {
    const translatePercent = (this.currentIndex * 100) / this.slidesToShow;
    if (this.disableAnimation) {
      this.track.style.transition = 'none';
    } else {
      this.track.style.transition = 'transform 0.3s ease';
    }
    this.track.style.transform = `translateX(-${translatePercent}%)`;
    if (this.disableAnimation) {
      requestAnimationFrame(() => {
        this.track.style.transition = 'transform 0.3s ease';
        this.disableAnimation = false;
      });
    }
    this.updateControls();
  }

  updateControls() {
    const atStart = this.currentIndex <= 0;
    const atEnd = this.currentIndex >= this.maxIndex;

    if (this.prevButton) {
      this.prevButton.disabled = atStart && !this.options.loop;
    }
    if (this.nextButton) {
      this.nextButton.disabled = atEnd && !this.options.loop;
    }
  }

  onPrev() {
    this.goTo(this.currentIndex - this.step);
  }

  onNext() {
    this.goTo(this.currentIndex + this.step);
  }

  onKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.onPrev();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.onNext();
    }
  }

  normalizeIndex(index) {
    if (this.options.loop) {
      if (index < 0) {
        return this.maxIndex;
      }
      if (index > this.maxIndex) {
        return 0;
      }
    }
    return Math.max(0, Math.min(index, this.maxIndex));
  }

  goTo(index, animate = true) {
    this.currentIndex = this.normalizeIndex(index);
    if (!animate) {
      this.disableAnimation = true;
    }
    this.update();
  }

  onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    this.isDragging = true;
    this.startX = event.clientX;
    this.startTranslate = (this.currentIndex * 100) / this.slidesToShow;
    this.currentTranslate = this.startTranslate;
    if (event.pointerId !== undefined) {
      this.viewport.setPointerCapture(event.pointerId);
    }
    this.track.style.transition = 'none';
    this.viewport.addEventListener('pointermove', this.onPointerMove, {
      passive: true,
    });
  }

  onPointerMove(event) {
    if (!this.isDragging) return;
    const delta = ((event.clientX - this.startX) / this.viewport.offsetWidth) * 100;
    const translate = this.startTranslate - delta;
    this.track.style.transform = `translateX(-${translate}%)`;
    this.currentTranslate = translate;
  }

  onPointerUp(event) {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (event.pointerId !== undefined && this.viewport.hasPointerCapture(event.pointerId)) {
      this.viewport.releasePointerCapture(event.pointerId);
    }
    this.viewport.removeEventListener('pointermove', this.onPointerMove);
    const movedSlides = (this.currentTranslate - this.startTranslate) *
      (this.slidesToShow / 100);

    if (movedSlides > 0.2) {
      this.onNext();
    } else if (movedSlides < -0.2) {
      this.onPrev();
    } else {
      this.goTo(this.currentIndex);
    }
  }
}

export default Slider;
