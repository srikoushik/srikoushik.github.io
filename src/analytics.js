import ReactGA from 'react-ga';
let isInitialised = false;

const isLocalhost
  = window.location.hostname === 'localhost'
  // [::1] is the IPv6 localhost address.
  || window.location.hostname === '[::1]'
  // 127.0.0.1/8 is considered localhost for IPv4.
  || window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/);

export const GAInitialize = () => {
  console.log("Yet to initialised");
  if (!isLocalhost) {
      ReactGA.initialize('UA-161006761-1');
      isInitialised = true;
      console.log("Initialised")
  }
  console.log("Initialised status", isInitialised);
};

export const GAPageView = (props) => {
  console.log("Initialised status from pageview", isInitialised);
  if (!isLocalhost && isInitialised) {
    console.log("This is page view props:", props);
    switch (props) {
      case '/':
        ReactGA.pageview('/home');
        break;
      case 'me':
        ReactGA.pageview('/me');
        break;
      default:
        break;
    }
  }
};