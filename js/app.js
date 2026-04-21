/**
 * Phone Word Converter — Application
 *
 * Wires UI events to converter logic. No framework dependencies.
 *
 * @license MIT
 * @see https://github.com/calloza/phone-word-converter
 */

(function () {
  'use strict';

  // ── DOM references ──

  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.panel');

  const wordInput = document.getElementById('word-input');
  const numberResult = document.getElementById('number-result');
  const keypadKeys = document.querySelectorAll('.key[data-digit]');

  const digitInput = document.getElementById('digit-input');
  const wordCount = document.getElementById('word-count');
  const wordList = document.getElementById('word-list');

  // ── Clear buttons ──

  document.querySelectorAll('.clear-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.for);
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        input.focus();
      }
    });
  });

  // ── Pre-build word index for fast partial matching ──

  const wordIndex = buildWordIndex(DICTIONARY);

  const shareWordBtn = document.getElementById('share-word');
  const shareDigitBtn = document.getElementById('share-digit');

  // ── Tab switching ──

  /**
   * Activate a tab by its data-tab value.
   * @param {string} tabId - The panel id to activate (e.g. 'panel-word')
   */
  function activateTab(tabId) {
    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    panels.forEach(p => p.classList.remove('active'));

    const btn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    }
    document.getElementById(tabId).classList.add('active');
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // ── Word → Number ──

  wordInput.addEventListener('input', () => {
    const value = wordInput.value;
    const converted = wordToNumber(value);

    // If input contains a mix of digits and letters (e.g. "1-800-FLOWERS"),
    // preserve the original structure. Otherwise format the digits neatly.
    const hasLetters = /[a-zA-Z]/.test(value);
    const hasDigits = /\d/.test(value);

    if (hasLetters && hasDigits) {
      // Mixed input — preserve separators, convert letters to digits
      numberResult.textContent = converted;
    } else if (hasLetters) {
      // Pure letters — format the resulting digits
      const digitsOnly = converted.replace(/\D/g, '');
      numberResult.textContent = digitsOnly ? formatNumber(digitsOnly) : '';
    } else {
      numberResult.textContent = '';
    }

    highlightKeypad(value.toUpperCase());
  });

  /**
   * Highlight keypad keys that correspond to letters in the input.
   * @param {string} text - Uppercase text to highlight
   */
  function highlightKeypad(text) {
    const activeDigits = new Set();

    for (const char of text) {
      const digit = getDigitForLetter(char);
      if (digit) activeDigits.add(digit);
    }

    keypadKeys.forEach(key => {
      const digit = key.dataset.digit;
      key.classList.toggle('highlighted', activeDigits.has(digit));
    });
  }

  // ── Clickable keypad ──

  keypadKeys.forEach(key => {
    key.addEventListener('click', () => {
      const digit = key.dataset.digit;
      if (!digit) return;

      // Determine which panel is active and append to the right input
      const wordPanel = document.getElementById('panel-word');
      const numberPanel = document.getElementById('panel-number');

      if (wordPanel.classList.contains('active')) {
        // In Word → Number mode, show the letters on press (cycle-style: just append first letter)
        const letters = getLettersForDigit(digit);
        if (letters.length > 0) {
          wordInput.value += letters[0];
        } else {
          wordInput.value += digit;
        }
        wordInput.dispatchEvent(new Event('input'));
      } else if (numberPanel.classList.contains('active')) {
        digitInput.value += digit;
        digitInput.dispatchEvent(new Event('input'));
      }

      // Brief press animation
      key.classList.add('pressed');
      setTimeout(() => key.classList.remove('pressed'), 150);
    });
  });

  // ── Number → Words ──

  digitInput.addEventListener('input', () => {
    const value = digitInput.value.replace(/[^0-9]/g, '');
    digitInput.value = value;

    if (!value) {
      wordCount.textContent = '';
      wordList.innerHTML = '';
      return;
    }

    if (value.length > 10) {
      wordCount.textContent = 'Enter up to 10 digits.';
      wordList.innerHTML = '';
      return;
    }

    const matches = findPartialWords(value, wordIndex);

    if (matches.length === 0) {
      wordCount.textContent = 'No matching words found.';
      wordList.innerHTML = '<li class="empty-state">Try different digits</li>';
      return;
    }

    // Cap displayed results to avoid overwhelming the UI
    const limit = 50;
    const shown = matches.slice(0, limit);
    const total = matches.length;

    const label = total === 1
      ? '1 match found'
      : total + ' matches found' + (total > limit ? ' (showing first ' + limit + ')' : '');

    wordCount.textContent = label;
    wordList.innerHTML = shown
      .map(m => '<li>' + escapeHtml(m.display) + '</li>')
      .join('');
  });

  /**
   * Escape HTML special characters to prevent XSS.
   * @param {string} str - Raw string
   * @returns {string} Escaped string safe for innerHTML
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Share ──

  /**
   * Copy a shareable URL to the clipboard and show brief feedback.
   * @param {string} mode - 'word' or 'number'
   * @param {string} value - The input value to encode
   * @param {HTMLButtonElement} btn - The share button for feedback
   */
  function shareLink(mode, value, btn) {
    if (!value) return;

    const url = new URL(window.location.href.split('?')[0]);
    url.searchParams.set('m', mode);
    url.searchParams.set('q', value);

    var linkText = url.toString();

    function showCopied() {
      var original = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('copied');
      }, 1500);
    }

    // Try modern clipboard API first, fall back to execCommand
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(linkText).then(showCopied).catch(function () {
        fallbackCopy(linkText);
        showCopied();
      });
    } else {
      fallbackCopy(linkText);
      showCopied();
    }
  }

  /**
   * Fallback clipboard copy using a temporary textarea (for non-HTTPS contexts).
   * @param {string} text - Text to copy
   */
  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  shareWordBtn.addEventListener('click', () => {
    shareLink('word', wordInput.value, shareWordBtn);
  });

  shareDigitBtn.addEventListener('click', () => {
    shareLink('number', digitInput.value, shareDigitBtn);
  });

  // ── Restore from URL on load ──

  (function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('m');
    const query = params.get('q');

    if (!mode || !query) return;

    if (mode === 'word') {
      activateTab('panel-word');
      wordInput.value = query;
      wordInput.dispatchEvent(new Event('input'));
    } else if (mode === 'number') {
      activateTab('panel-number');
      digitInput.value = query;
      digitInput.dispatchEvent(new Event('input'));
    }
  })();
})();

