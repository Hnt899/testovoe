const FormModule = (() => {
  const form = document.querySelector('.form');
  if (!form) return;

  const nameInput = form.querySelector('#name');
  const phoneInput = form.querySelector('#phone');
  const emailInput = form.querySelector('#email');
  const positionInput = form.querySelector('#position');
  const questionsInput = form.querySelector('#questions');
  const employmentRadios = Array.from(form.querySelectorAll('input[name="employment"]'));
  const submitButton = form.querySelector('button[type="submit"]');
  const toastContainer = document.querySelector('.toast-container');

  const fileUploadWrapper = form.querySelector('[data-file-upload]');
  const fileInput = fileUploadWrapper.querySelector('input[type="file"]');
  const fileTrigger = fileUploadWrapper.querySelector('[data-file-trigger]');
  const fileDropArea = fileUploadWrapper.querySelector('.file-upload');
  const filePreview = fileUploadWrapper.querySelector('.file-upload__preview');
  const fileError = fileUploadWrapper.querySelector('#resume-error');

  let selectedFile = null;

  const counters = form.querySelectorAll('[data-counter]');

  const showToast = (type, message) => {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const normalizePhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    let normalized = digits;
    if (normalized.startsWith('8')) {
      normalized = '7' + normalized.slice(1);
    }
    if (!normalized.startsWith('7')) {
      normalized = '7' + normalized;
    }
    return normalized.slice(0, 11);
  };

  const formatPhone = (value) => {
    const digits = normalizePhone(value);
    if (!digits) return '';
    const parts = [digits[0]];
    if (digits.length > 1) parts.push(' (' + digits.slice(1, 4));
    if (digits.length >= 4) parts[parts.length - 1] += ')';
    if (digits.length >= 4) parts.push(' ' + digits.slice(4, 7));
    if (digits.length >= 7) parts[parts.length - 1] = parts[parts.length - 1].slice(0, 4);
    if (digits.length >= 7) parts.push('-' + digits.slice(7, 9));
    if (digits.length >= 9) parts.push('-' + digits.slice(9, 11));
    return '+' + parts.join('');
  };

  const getDigitsCount = (value) => normalizePhone(value).length;

  const validators = {
    name(value) {
      if (!value.trim()) {
        return 'Укажите ваше имя';
      }
      if (!/^[А-ЯЁа-яёA-Za-z\s]{2,}$/.test(value.trim())) {
        return 'Введите не менее двух букв';
      }
      return '';
    },
    phone(value) {
      const digits = normalizePhone(value);
      if (digits.length !== 11) {
        return 'Введите номер полностью';
      }
      return '';
    },
    email(value) {
      if (!value.trim()) {
        return 'Укажите email';
      }
      const regex = /^[\w-.]+@[\w-]+\.[a-z]{2,}$/i;
      if (!regex.test(value.trim())) {
        return 'Неверный формат email';
      }
      return '';
    },
    position(value) {
      if (!value) return '';
      if (value.trim().length < 2) {
        return 'Минимум два символа';
      }
      return '';
    },
    questions(value) {
      if (value.length > 500) {
        return 'Максимум 500 символов';
      }
      return '';
    },
  };

  const getErrorElement = (input) => {
    const field = input.closest('.form-field');
    return field ? field.querySelector('.form-field__error') : null;
  };

  const setFieldState = (input, errorMessage) => {
    const field = input.closest('.form-field');
    if (!field) return;
    const errorEl = getErrorElement(input);
    if (errorEl) {
      errorEl.textContent = errorMessage || '';
    }
    field.classList.remove('form-field--valid', 'form-field--invalid');
    if (errorMessage) {
      field.classList.add('form-field--invalid');
    } else if (input.value.trim()) {
      field.classList.add('form-field--valid');
    }
  };

  const validateField = (input) => {
    const name = input.name;
    if (!validators[name]) {
      setFieldState(input, '');
      return true;
    }
    const errorMessage = validators[name](input.value);
    setFieldState(input, errorMessage);
    return !errorMessage;
  };

  const validateEmployment = () => {
    const fieldset = form.querySelector('.form-field--fieldset');
    const errorEl = fieldset.querySelector('.form-field__error');
    const isChecked = employmentRadios.some((radio) => radio.checked);
    if (!isChecked) {
      errorEl.textContent = 'Выберите формат занятости';
      fieldset.classList.add('form-field--invalid');
      fieldset.classList.remove('form-field--valid');
    } else {
      errorEl.textContent = '';
      fieldset.classList.add('form-field--valid');
      fieldset.classList.remove('form-field--invalid');
    }
    return isChecked;
  };

  const validateFile = () => {
    if (!selectedFile) {
      fileError.textContent = '';
      return true;
    }
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isAllowed = allowed.includes(selectedFile.type);
    const isSizeOk = selectedFile.size <= 5 * 1024 * 1024;
    if (!isAllowed) {
      fileError.textContent = 'Только PDF/DOC/DOCX';
      return false;
    }
    if (!isSizeOk) {
      fileError.textContent = 'Файл больше 5 МБ';
      return false;
    }
    fileError.textContent = '';
    return true;
  };

  const updateSubmitState = () => {
    const validName = validateField(nameInput);
    const validPhone = validateField(phoneInput);
    const validEmail = validateField(emailInput);
    const validPosition = validateField(positionInput);
    const validQuestions = validateField(questionsInput);
    const validEmployment = validateEmployment();
    const validFile = validateFile();
    const isFormValid =
      validName &&
      validPhone &&
      validEmail &&
      validPosition &&
      validQuestions &&
      validEmployment &&
      validFile;

    submitButton.disabled = !isFormValid;
    return isFormValid;
  };

  const updateCounter = () => {
    counters.forEach((counter) => {
      const max = parseInt(questionsInput.getAttribute('maxlength'), 10);
      const remaining = Math.max(max - questionsInput.value.length, 0);
      counter.textContent = `Осталось ${remaining}`;
    });
  };

  const handlePhoneInput = () => {
    const cursorPosition = phoneInput.selectionStart ?? phoneInput.value.length;
    const oldLength = phoneInput.value.length;
    phoneInput.value = formatPhone(phoneInput.value);
    const newLength = phoneInput.value.length;
    const diff = newLength - oldLength;
    const nextCursor = Math.max(0, cursorPosition + diff);
    requestAnimationFrame(() => {
      phoneInput.setSelectionRange(nextCursor, nextCursor);
    });
    const digits = getDigitsCount(phoneInput.value);
    const error = validators.phone(phoneInput.value);
    setFieldState(phoneInput, error);
    updateSubmitState();
    return digits === 11 && !error;
  };

  const handleEmailInput = () => {
    const error = validators.email(emailInput.value);
    setFieldState(emailInput, error);
    updateSubmitState();
  };

  const handleNameInput = () => {
    validateField(nameInput);
    updateSubmitState();
  };

  const handlePositionInput = () => {
    validateField(positionInput);
    updateSubmitState();
  };

  const handleQuestionsInput = () => {
    updateCounter();
    validateField(questionsInput);
    updateSubmitState();
  };

  const clearFile = () => {
    selectedFile = null;
    fileInput.value = '';
    filePreview.innerHTML = '';
    validateFile();
    updateSubmitState();
  };

  const renderFileChip = () => {
    filePreview.innerHTML = '';
    if (!selectedFile) return;
    const chip = document.createElement('div');
    chip.className = 'file-chip';
    const sizeKb = (selectedFile.size / 1024).toFixed(1);
    chip.innerHTML = `
      <span>${selectedFile.name} • ${sizeKb} КБ</span>
      <button type="button" class="file-chip__remove" aria-label="Удалить файл">×</button>
    `;
    chip.querySelector('button').addEventListener('click', clearFile);
    filePreview.appendChild(chip);
  };

  const handleFileSelect = (file) => {
    selectedFile = file;
    if (!validateFile()) {
      selectedFile = null;
      fileInput.value = '';
      filePreview.innerHTML = '';
      updateSubmitState();
      return;
    }
    renderFileChip();
    updateSubmitState();
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    fileDropArea.classList.remove('is-dragover');
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    fileDropArea.classList.add('is-dragover');
  };

  const handleDragLeave = () => {
    fileDropArea.classList.remove('is-dragover');
  };

  const fakeSubmit = async (formData) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (Math.random() < 0.85) {
      return { success: true };
    }
    throw new Error('Что-то пошло не так');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!updateSubmitState()) {
      return;
    }
    submitButton.classList.add('button--loading');
    submitButton.disabled = true;
    try {
      const formData = new FormData(form);
      if (selectedFile) {
        formData.set('resume', selectedFile);
      }
      await fakeSubmit(formData);
      showToast('success', 'Заявка успешно отправлена');
      form.reset();
      clearFile();
      updateCounter();
      Array.from(form.querySelectorAll('.form-field')).forEach((field) => {
        field.classList.remove('form-field--valid', 'form-field--invalid');
      });
    } catch (error) {
      showToast('error', error.message || 'Не удалось отправить заявку');
    } finally {
      submitButton.classList.remove('button--loading');
      updateSubmitState();
    }
  };

  // Event bindings
  nameInput.addEventListener('input', handleNameInput);
  phoneInput.addEventListener('input', handlePhoneInput);
  emailInput.addEventListener('input', handleEmailInput);
  positionInput.addEventListener('input', handlePositionInput);
  questionsInput.addEventListener('input', handleQuestionsInput);
  employmentRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      validateEmployment();
      updateSubmitState();
    });
  });

  fileTrigger.addEventListener('click', () => fileInput.click());
  fileDropArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileInputChange);
  fileDropArea.addEventListener('dragover', handleDragOver);
  fileDropArea.addEventListener('dragleave', handleDragLeave);
  fileDropArea.addEventListener('drop', handleDrop);
  fileDropArea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  });

  form.addEventListener('submit', handleSubmit);

  updateCounter();
  updateSubmitState();

  return {
    validate: updateSubmitState,
  };
})();

export default FormModule;
