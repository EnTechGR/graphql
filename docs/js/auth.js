// docs/js/auth.js

(function () {
  const form = document.getElementById("login-form");
  const identifierInput = document.getElementById("identifier");
  const passwordInput = document.getElementById("password");
  const submitButton = document.getElementById("login-submit");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const { setButtonLoading, setFieldError, setFormError } = window.UI;
    const { signin } = window.API;

    setFormError("login-error", "");
    setFieldError(identifierInput, "");
    setFieldError(passwordInput, "");

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;

    if (!identifier) {
      setFieldError(identifierInput, "Required");
      hasError = true;
    }

    if (!password) {
      setFieldError(passwordInput, "Required");
      hasError = true;
    }

    if (hasError) return;

    try {
      setButtonLoading(submitButton, true);
      await signin(identifier, password);
      // success → go to profile page
      window.location.href = "profile.html";
    } catch (err) {
      console.error("Signin error:", err);
      setFormError("login-error", err.message || "Login failed.");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });
})();