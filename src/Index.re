[@bs.module "./analytics.js"] external gaInitialize: unit => React.element = "GAInitialize";

gaInitialize()

ReactDOMRe.renderToElementWithId(<App />, "app");