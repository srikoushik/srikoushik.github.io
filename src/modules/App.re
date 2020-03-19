[@bs.module "../analytics.js"] external gaInitialize: unit => React.element = "GAInitialize";

[@react.component]
let make = () => {

  gaInitialize();

  let route = Router.useRouter();

  switch (route) {
  | Some(Home) => <Home />
  | Some(Me) => <Me />
  | None => <NotFound />
  };
};