// ==========================================================================
// Browser sniffing
// Unfortunately, due to mixed support, UA sniffing is required
// ==========================================================================
const USER_AGENT = window.navigator.userAgent || "";
const isEdge = () => /Edg/i.test(USER_AGENT);
const isChrome = () =>
  !isEdge() && (/Chrome/i.test(USER_AGENT) || /CriOS/i.test(USER_AGENT));
const isAndroid = () => /Android/i.test(USER_AGENT);
const browser = {
  isIE: Boolean(window.document.documentMode),
  ieVersion: (function () {
    const result = /MSIE\s(\d+)\.\d/.exec(USER_AGENT);
    let version = result && parseFloat(result[1]);
    if (
      !version &&
      /Trident\/7.0/i.test(USER_AGENT) &&
      /rv:11.0/.test(USER_AGENT)
    ) {
      // IE 11 has a different user agent string than other IE versions
      version = 11.0;
    }

    return version;
  })(),
  isEdge: isEdge(),
  isFirefox: /Firefox/i.test(window.navigator.userAgent),
  isChrome: isChrome(),
  chromeVersion: (function () {
    const match = USER_AGENT.match(/(Chrome|CriOS)\/(\d+)/);

    if (match && match[2]) {
      return parseFloat(match[2]);
    }
    return null;
  })(),
  isWebkit:
    "WebkitAppearance" in document.documentElement.style &&
    !/Edge/.test(navigator.userAgent),
  isIPhone: /(iPhone|iPod)/gi.test(navigator.platform),
  isIos:
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
    /(iPad|iPhone|iPod)/gi.test(navigator.platform),
  iosVersion: (function () {
    const match = window.navigator.userAgent.match(/OS (\d+)_/i);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  })(),
  isIPod: /iPod/i.test(window.navigator.userAgent),
  isAndroid: isAndroid(),
  androidVersion: (function () {
    // This matches Android Major.Minor.Patch versions
    // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
    const match = window.navigator.userAgent.match(
      /Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i
    );

    if (!match) {
      return null;
    }

    const major = match[1] && parseFloat(match[1]);
    const minor = match[2] && parseFloat(match[2]);

    if (major && minor) {
      return parseFloat(match[1] + "." + match[2]);
    } else if (major) {
      return major;
    }
    return null;
  })(),
  isSafari:
    /Safari/i.test(USER_AGENT) && !isChrome() && !isAndroid() && !isEdge(),
  isWindows: /Windows/i.test(USER_AGENT)
};

export default browser;
