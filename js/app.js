import Slider from './slider.js';
import FormModule from './form.js';

document.addEventListener('DOMContentLoaded', () => {
  const valuesSliderEl = document.querySelector('[data-slider="values"]');
  if (valuesSliderEl) {
    new Slider(valuesSliderEl, {
      slidesToShow: 1,
      step: 1,
      breakpoints: [
        { width: 600, slidesToShow: 2, step: 1 },
        { width: 1024, slidesToShow: 4, step: 1 },
      ],
    });
  }

  const feedSliderEl = document.querySelector('[data-slider="feed"]');
  if (feedSliderEl) {
    new Slider(feedSliderEl, {
      slidesToShow: 1,
      step: 1,
      breakpoints: [
        { width: 640, slidesToShow: 2, step: 1 },
        { width: 900, slidesToShow: 3, step: 1 },
        { width: 1200, slidesToShow: 4, step: 1 },
      ],
    });
  }

  // FormModule is imported for side effects; exposing validate for potential debugging
  if (FormModule && typeof FormModule.validate === 'function') {
    FormModule.validate();
  }
});
