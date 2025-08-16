function getSettingsButton() {
  return document.getElementsByClassName("ytp-settings-button")[0];
}

function selectOriginalAudio() {
  const settingsButton = getSettingsButton();
  if (settingsButton) {
    settingsButton.click();
    clickAudioMenuItem();
  }
}

function clickAudioMenuItem() {
  const trackButton = document.querySelector(
    ".ytp-menuitem.ytp-audio-menu-item"
  );
  const settingsButton = getSettingsButton();

  if (!trackButton) {
    if (settingsButton) {
      settingsButton.click();
    }
    return;
  }

  const currentTrackContent = trackButton.getElementsByClassName(
    "ytp-menuitem-content"
  )[0];
  // Não seleciona se a faixa atual já é a original
  if (currentTrackContent.innerHTML.includes("original")) {
    if (settingsButton) {
      settingsButton.click();
    }
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
      const settingsButton = getSettingsButton();
      if (settingsButton) {
        settingsButton.click();
      }
    }
  }
}

(function () {
  function onVideoIdChange() {
    selectOriginalAudio();
  }

  function attachWatcherToFlexy(flexy) {
    if (!flexy) return;
    // evita múltiplos observers no mesmo elemento
    if (flexy._videoIdObserverAttached) return;
    flexy._videoIdObserverAttached = true;

    let previous = flexy.getAttribute("video-id");

    const attrObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "video-id") {
          const newId = flexy.getAttribute("video-id");
          if (newId !== previous) {
            previous = newId;
            onVideoIdChange();
          }
        }
      }
    });

    attrObserver.observe(flexy, {
      attributes: true,
      attributeFilter: ["video-id"],
    });

    const parentObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          for (const removed of m.removedNodes) {
            if (removed === flexy) {
              try {
                attrObserver.disconnect();
              } catch {}
              flexy._videoIdObserverAttached = false;
            }
          }
        }
      }
    });

    if (flexy.parentNode)
      parentObserver.observe(flexy.parentNode, { childList: true });
  }

  function findAndAttach() {
    const flexy = document.querySelector("ytd-watch-flexy");
    if (flexy) attachWatcherToFlexy(flexy);
    return !!flexy;
  }

  // Observador global para detectar mudanças no ytd-watch-flexy
  const globalObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        if (
          Array.from(m.addedNodes).some(
            (n) =>
              n.nodeType === 1 &&
              ((n.matches && n.matches("ytd-watch-flexy")) ||
                (n.querySelector && n.querySelector("ytd-watch-flexy")))
          )
        ) {
          findAndAttach();
        }
      }
      if (m.type === "attributes") {
        if (
          m.target &&
          m.target.matches &&
          m.target.matches("ytd-watch-flexy")
        ) {
          attachWatcherToFlexy(m.target);
        }
      }
    }
  });

  function startGlobalObserver() {
    if (!document.body) {
      // se o body não existe ainda, aguarda próximo frame
      return requestAnimationFrame(startGlobalObserver);
    }
    globalObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });
  }

  // YouTube SPA events
  function attachYouTubeEvents() {
    // Alguns eventos internos que o YouTube dispara em navegações SPA
    window.addEventListener("yt-navigate-finish", () => {
      // nova página carregou. Re-attach (imediato)
      setTimeout(findAndAttach, 0);
    });

    // popstate (back/forward)
    window.addEventListener("popstate", () => {
      setTimeout(findAndAttach, 0);
    });

    // O Youtube também atualiza o DOM sem esses eventos em alguns casos
    // 10 tentativas
    let shortRetry = 0;
    function shortScan() {
      if (shortRetry++ > 10) return;
      if (!findAndAttach()) {
        setTimeout(shortScan, 300);
      }
    }
    shortScan();
  }

  (function init() {
    findAndAttach();
    startGlobalObserver();
    attachYouTubeEvents();

    //  se por algum motivo o elemento existir mas não foi ligado, tenta periodicamente por 10s
    let tries = 0;
    const tryInterval = setInterval(() => {
      tries++;
      findAndAttach();
      if (tries > 20) clearInterval(tryInterval);
    }, 500);
  })();
})();
