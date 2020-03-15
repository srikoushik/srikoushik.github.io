type route = 
    | Home
    | Me

let fromUrl = (url: ReasonReactRouter.url) =>
    switch (url.path) {
    | [] => Home->Some
    | ["me"] => Me->Some
    | _ => None
    };

let toString =
    fun
    | Home => "/"
    | Me => "/me"