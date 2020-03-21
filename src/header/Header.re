type eventAnalytics = {
  category: string,
  action: string
};
[@bs.module "../analytics.js"] external gaEvent: eventAnalytics => unit = "GAEvent";
[@bs.module] external myImage: string = "../../assets/me.jpg";

[@react.component]
let make = () => {
  let blogButtonAnalytics = {
    category: "me",
    action: "tap_blog_button"
  };

  <div className="flex flex-col w-9/12 container mx-auto">
    <div className="flex flex-col">
      <div className="flex mt-4 mb-4">
        <img className="h-6 w-6 rounded-full border-gray-400 border-4 border cursor-pointer" alt="koushik" src=myImage onClick={ _ => ReasonReactRouter.push("/") }/>
        <p className="text-gray-300 pl-2 text-lg cursor-pointer" onClick={ _ => ReasonReactRouter.push("/") }>"Koushik"->React.string</p>
        <p className="text-gray-300 text-base ml-4 pl-2 pr-2 mr-2 rounded bg-blue-500 cursor-default">"Me"->React.string</p>
        <a href="https://medium.com/@srikoushik" target="_blank" className="text-gray-300 ml-2 text-base cursor-pointer"
          onClick={ _ => {
            gaEvent(blogButtonAnalytics)
          }}>
          "Blog"->React.string
        </a>
      </div>
      <div className="h-px bg-gray-300" />
      <div className="text-center mb-4">        
        <p className="mt-4 text-gray-300 cursor-default">
          "As a software engineer, I am involved in building application from scratch, designing application architecture and onboarding new team members."->React.string
        </p>
        <p className="mt-4 text-gray-300 cursor-default">
          "Chennai by native and living in Bangalore."->React.string
        </p>
        <p className="mt-4 text-gray-300 font-bold cursor-default text-xl text-center">
          "Interests"->React.string
        </p>
        <p className="mt-4 text-gray-300 cursor-default">
          "Working with scalable distributed systems and practicing functional programming are my current interest. In my free time, I do adventure travel and scribble blogs."->React.string
        </p>
        <p className="mt-4 text-gray-300 font-bold cursor-default text-xl text-center">
          "Tech Stack"->React.string
        </p>
        <div className="md:flex mt-4">
          <p className="text-gray-300 cursor-default text-lg">
            "Languages:"->React.string
          </p>
          <p className="mt-px text-gray-300 cursor-default text-base md:whitespace-pre">
            " Python3, Javascript, ReasonML/OCaml (Practicing)"->React.string
          </p>
        </div>
        <div className="md:flex mt-2">
          <p className="text-gray-300 cursor-default text-lg">
            {ReasonReact.string("Technologies:")}
          </p>
          <p className="mt-px text-gray-300 cursor-default text-base md:whitespace-pre">
            " Node JS, Android, React JS"->React.string
          </p>
        </div>
        <div className="md:flex mt-2">
          <p className="text-gray-300 cursor-default text-lg">
            "Databases:"->React.string
          </p>
          <p className="mt-px text-gray-300 cursor-default text-base md:whitespace-pre">
            " MongoDB, Redis"->React.string
          </p>
        </div>
        <div className="md:flex mt-2">
          <p className="text-gray-300 cursor-default text-lg">
            "DevOps & Infra:"->React.string
          </p>
          <p className="mt-px text-gray-300 cursor-default text-base md:whitespace-pre">
            " AWS, Docker, Kubernetes"->React.string
          </p>
        </div>
        <div className="md:flex mt-4 justify-center">
          <a href="http://linkedin.com/in/srikoushik/" target="_blank" className="text-gray-300 md:whitespace-pre text-base cursor-pointer underline">
            "Tap here"->React.string
          </a>
          <p className="text-gray-300 cursor-default text-base md:whitespace-pre">
            " to know more about my projects."->React.string
          </p>
        </div>
      </div>
    </div>
  </div>
}