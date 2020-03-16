[@bs.module] external myImage: string = "../../assets/me.png";
[@bs.module] external myImage: string = "../../assets/me.png";

[@react.component]
let make = () => {
  <div className="flex flex-col h-screen w-2/3 container mx-auto">
    <div className="flex flex-col">
      <div className="flex mt-4 mb-4">
        <img className="h-6 w-6 rounded-full border-gray-400 border-4 border cursor-pointer" alt="koushik" src=myImage onClick={ _ => ReasonReactRouter.push("/") }/>
        <p className="text-gray-300 pl-2 text-lg cursor-pointer" onClick={ _ => ReasonReactRouter.push("/") }>"Koushik"->React.string</p>
        <p className="text-gray-300 text-base ml-8 pl-2 pr-2 mr-2 rounded bg-blue-600 cursor-default">"Me"->React.string</p>
        <a href="https://medium.com/@srikoushik" target="_blank" className="text-gray-300 ml-4 text-base cursor-pointer">
          "Blog"->React.string
        </a>
      </div>
      <div className="h-px bg-gray-300" />
      <div className="mt-4 text-gray-300 cursor-default">
        "Lorem Ipsom"->React.string
      </div>
    </div>
  </div>
}