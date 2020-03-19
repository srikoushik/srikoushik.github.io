[@bs.module "../analytics.js"] external gAInitialize: unit = "GAInitialize";

[@react.component]
let make = () => {

  gAInitialize

  let route = Router.useRouter();

  switch (route) {
  | Some(Home) => <Home />
  | Some(Me) => <Me />
  | None => <NotFound />
  };
};