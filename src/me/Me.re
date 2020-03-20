[@bs.module "../analytics.js"] external gaPageView: string => React.element = "GAPageView";

[@react.component]
let make = () => {
  gaPageView("me") |> ignore;

  <div className="md:h-screen font-mono bg-gray-700">
    <Header />
  </div>
};