[@react.component]
let make = () => {

  let route = Router.useRouter();

  switch (route) {
  | Some(Home) => <Home />
  | Some(Me) => <Me />
  | None => <NotFound />
  };
};