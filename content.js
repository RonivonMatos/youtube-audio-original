let success = false;

function selectOriginalAudio() {
  const settingsButton = document.getElementsByClassName(
    "ytp-settings-button"
  )[0];
  if (settingsButton) {
    settingsButton.click();
    clickAudioMenuItem();
  }
}

function clickAudioMenuItem() {
  const trackButton = document.querySelector(
    ".ytp-menuitem.ytp-audio-menu-item"
  );

  if (!trackButton) return;

  const currentTrackContent = trackButton.getElementsByClassName(
    "ytp-menuitem-content"
  )[0];

  if (currentTrackContent.innerHTML.includes("original")) {
    success = true;
    return;
  } else {
    trackButton.click();
    clickOriginalAudio();
  }
}

function clickOriginalAudio() {
  const options = document.getElementsByClassName("ytp-menuitem-label");
  for (const option of options) {
    if (option.innerHTML.includes("original")) {
      option.parentElement.click();
      success = true;
    }
  }
}

selectOriginalAudio();

const observer = new MutationObserver(() => {
  if (success) {
    observer.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
