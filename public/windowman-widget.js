(function () {
  const SCRIPT_ATTR = 'data-windowman-widget';

  function findCurrentScript() {
    if (document.currentScript) return document.currentScript;
    const tagged = document.querySelector(`script[${SCRIPT_ATTR}]`);
    if (tagged) return tagged;
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1] || null;
  }

  const currentScript = findCurrentScript();
  if (!currentScript) return;

  const scriptSrc = currentScript.getAttribute('src') || '';
  const resolvedScriptUrl = new URL(scriptSrc, window.location.href);
  const assetBaseUrl = resolvedScriptUrl.origin;

  const data = currentScript.dataset || {};
  const config = {
    tenantSlug: data.tenantSlug || 'default',
    brandName: data.brandName || 'WindowMan Partner',
    headline: data.headline || 'Upload your competitor quote for a free AI audit',
    subheadline:
      data.subheadline ||
      'See hidden scope gaps, warranty traps, and fine-print issues before you sign.',
    buttonLabel: data.buttonLabel || 'Free Quote Audit',
    accentColor: data.accentColor || '#0ea5e9',
    position: data.position || 'bottom-right',
    mode: data.mode || 'modal',
    zIndex: data.zIndex || '2147483000',
    hostUrl: data.hostUrl || assetBaseUrl,
    width: data.width || '420',
    height: data.height || '760',
  };

  if (window.WindowManWidget && typeof window.WindowManWidget.destroy === 'function') {
    window.WindowManWidget.destroy();
  }

  const query = new URLSearchParams({
    tenantSlug: config.tenantSlug,
    brandName: config.brandName,
    headline: config.headline,
    subheadline: config.subheadline,
    buttonLabel: config.buttonLabel,
    accentColor: config.accentColor,
    hostOrigin: window.location.origin,
  });

  const iframeUrl = `${config.hostUrl.replace(/\/$/, '')}/widget-host.html?${query.toString()}`;

  const style = document.createElement('style');
  style.setAttribute('data-windowman-widget-style', 'true');
  style.textContent = `
    .wmw-launcher {
      position: fixed;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 56px;
      padding: 0 18px;
      border: 0;
      border-radius: 999px;
      cursor: pointer;
      font: 700 14px/1.1 Inter, Arial, sans-serif;
      color: #04131f;
      background: ${config.accentColor};
      box-shadow: 0 20px 50px rgba(2, 6, 23, 0.28);
      z-index: ${config.zIndex};
    }
    .wmw-launcher:hover { transform: translateY(-1px); }
    .wmw-launcher--bottom-right { right: 20px; bottom: 20px; }
    .wmw-launcher--bottom-left { left: 20px; bottom: 20px; }
    .wmw-launcher__dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: rgba(4, 19, 31, 0.72);
    }
    .wmw-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.6);
      backdrop-filter: blur(6px);
      z-index: calc(${config.zIndex} + 1);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .wmw-frame-wrap {
      position: relative;
      width: min(100%, ${config.width}px);
      height: min(100%, ${config.height}px);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.45);
      background: #ffffff;
    }
    .wmw-frame {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
      background: #ffffff;
    }
    .wmw-close {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 999px;
      cursor: pointer;
      font: 700 18px/1 Inter, Arial, sans-serif;
      color: #0f172a;
      background: rgba(255,255,255,0.92);
      box-shadow: 0 8px 20px rgba(2, 6, 23, 0.18);
      z-index: 2;
    }
    @media (max-width: 640px) {
      .wmw-overlay { padding: 0; }
      .wmw-frame-wrap {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
      }
      .wmw-launcher {
        left: 14px !important;
        right: 14px !important;
        bottom: 14px !important;
        width: calc(100vw - 28px);
      }
    }
  `;

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = `wmw-launcher wmw-launcher--${config.position}`;
  launcher.setAttribute('aria-label', config.buttonLabel);
  launcher.innerHTML = '<span class="wmw-launcher__dot"></span><span></span>';
  launcher.lastElementChild.textContent = config.buttonLabel;

  let overlay = null;

  function closeWidget() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    document.body.style.overflow = '';
  }

  function openWidget() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'wmw-overlay';

    const frameWrap = document.createElement('div');
    frameWrap.className = 'wmw-frame-wrap';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'wmw-close';
    closeButton.setAttribute('aria-label', 'Close WindowMan widget');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', closeWidget);

    const iframe = document.createElement('iframe');
    iframe.className = 'wmw-frame';
    iframe.src = iframeUrl;
    iframe.title = `${config.brandName} quote audit widget`;
    iframe.loading = 'eager';

    frameWrap.appendChild(closeButton);
    frameWrap.appendChild(iframe);
    overlay.appendChild(frameWrap);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeWidget();
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  launcher.addEventListener('click', openWidget);
  document.head.appendChild(style);
  document.body.appendChild(launcher);

  window.addEventListener('message', function (event) {
    if (!event || !event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'WINDOWMAN_WIDGET_CLOSE') closeWidget();
  });

  window.WindowManWidget = {
    open: openWidget,
    close: closeWidget,
    destroy: function () {
      closeWidget();
      if (launcher.parentNode) launcher.parentNode.removeChild(launcher);
      if (style.parentNode) style.parentNode.removeChild(style);
    },
    config,
  };
})();
