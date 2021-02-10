type eventAnalytics = {
  category: string,
  action: string
};
[@bs.module] external myImage: string = "../../assets/me.jpg";
[@bs.module "../analytics.js"] external gaPageView: string => React.element = "GAPageView";
[@bs.module "../analytics.js"] external gaEvent: eventAnalytics => unit = "GAEvent";

[@react.component]
let make = () => {
  gaPageView("/") |> ignore;
  let meButtonAnalytics = {
    category: "home",
    action: "tap_me_button"
  };

  let blogButtonAnalytics = {
    category: "home",
    action: "tap_blog_button"
  };

  let githubButtonAnalytics = {
    category: "home",
    action: "tap_github_button"
  };

  let linkedInButtonAnalytics = {
    category: "home",
    action: "tap_linkedin_button"
  };

  <div className="flex justify-center h-screen items-center font-mono bg-gray-700">
    <img className="h-32 w-32 rounded-full border-gray-400 border-4 border" alt="koushik" src=myImage/>
    <div className="text-sm pl-8">
        <p className="text-gray-200 text-3xl cursor-default">{ReasonReact.string("Koushik")}</p>
        <div className="flex mb-2">
          <p className="text-gray-300 text-base p-1 rounded md:hover:bg-blue-500 cursor-pointer" 
          onClick={ _ => {
            gaEvent(meButtonAnalytics)
            ReasonReactRouter.push("#me")
          }}>
          {ReasonReact.string("Me")}
          </p>
          <a className="text-gray-300 text-base p-1 ml-2 rounded md:hover:bg-blue-500 cursor-pointer" href="https://medium.com/@srikoushik" target="_blank" 
          onClick={ _ => {
            gaEvent(blogButtonAnalytics)
          }}>
          {ReasonReact.string("Blog")}
          </a>
          // <p className="text-gray-300 text-base p-1 ml-2 rounded md:hover:bg-blue-500 cursor-pointer">{ReasonReact.string("Contact")}</p>
        </div>
        <div className="flex">
          <a href="https://github.com/srikoushik" target="_blank" className="p-1 mr-4 fill-current text-gray-300 md:hover:text-black cursor-pointer"
          onClick={ _ => {
            gaEvent(githubButtonAnalytics)
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
              <path d="M12 .296c-6.627 0-12 5.372-12 12 0 5.302 3.438 9.8 8.206 11.387.6.111.82-.26.82-.577 0-.286-.011-1.231-.016-2.234-3.339.726-4.043-1.416-4.043-1.416-.546-1.387-1.332-1.756-1.332-1.756-1.089-.745.082-.729.082-.729 1.205.085 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.666-.303-5.467-1.332-5.467-5.93 0-1.31.469-2.381 1.237-3.221-.125-.302-.536-1.523.116-3.176 0 0 1.008-.322 3.301 1.23a11.516 11.516 0 013.004-.404c1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.243 2.873.118 3.176.769.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.814 1.103.814 2.222 0 1.606-.014 2.898-.014 3.293 0 .319.216.694.824.576 4.765-1.588 8.199-6.085 8.199-11.385 0-6.628-5.373-12-12-12z"/>
            </svg>
          </a>

          <a href="http://linkedin.com/in/srikoushik/" target="_blank" className="p-1 mr-4 fill-current text-gray-300 md:hover:text-blue-700 cursor-pointer"
          onClick={ _ => {
            gaEvent(linkedInButtonAnalytics)
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
              <path d="M9 9h4.151v2.128h.059C13.787 10.092 15.201 9 17.308 9c4.382 0 5.192 2.728 5.192 6.275V22.5h-4.327v-6.405c0-1.528-.031-3.493-2.251-3.493-2.253 0-2.597 1.664-2.597 3.382V22.5H9V9zM1.5 9H6v13.5H1.5V9zM6 5.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
            </svg>
          </a>
        </div>
    </div>
  </div>
};