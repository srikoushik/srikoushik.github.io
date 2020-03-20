import ReactGA from 'react-ga';
let isInitialised = false;

const isLocalhost
  = window.location.hostname === 'localhost'
  // [::1] is the IPv6 localhost address.
  || window.location.hostname === '[::1]'
  // 127.0.0.1/8 is considered localhost for IPv4.
  || window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/);

export const GAInitialize = () => {
  if (!isLocalhost) {
      ReactGA.initialize('UA-161006761-1');
      isInitialised = true;
  }
};

export const GAPageView = (props) => {
  if (!isLocalhost && isInitialised) {
    switch (props) {
      case '/':
        ReactGA.pageview('/home');
        break;
      case 'me':
        ReactGA.pageview('/#me');
        break;
      default:
        break;
    }
  }
};

export const GAEvent = (config) => {
  if (!isLocalhost && isInitialised) {
    ReactGA.event({
      category: config[0],
      action: config[1]
    });
  }
};