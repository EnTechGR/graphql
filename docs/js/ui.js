// docs/js/ui.js

function setButtonLoading(button, isLoading) {
  if (!button) return;
  const spinner = button.querySelector(".btn__spinner");

  if (isLoading) {
    button.disabled = true;
    if (spinner) spinner.style.display = "inline-block";
  } else {
    button.disabled = false;
    if (spinner) spinner.style.display = "none";
  }
}

function setFieldError(inputEl, message) {
  if (!inputEl) return;
  const name = inputEl.getAttribute("name");
  const errorEl = document.querySelector(`[data-error-for="${name}"]`);
  if (!errorEl) return;
  errorEl.textContent = message || "";
}

function setFormError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
}

window.UI = {
  setButtonLoading,
  setFieldError,
  setFormError,
};