[@bs.module "../analytics.js"] external gaPageView: string => React.element = "GAPageView";

gaPageView("me")

[@react.component]
let make = () => {
  <div className="md:h-screen font-mono bg-gray-700">
    <Header />
  </div>
};