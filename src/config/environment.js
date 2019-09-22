export const environment = {
  test: {
    port: 4000,
    host: "http://localhost",
    graphqlPath: "/graphql",
    origin: "*"
  },
  development: {
    port: 4000,
    host: "http://localhost",
    graphqlPath: "/graphql",
    origin: "http://localhost:3000"
  },
  production: {
    port: "",
    host: "",
    graphqlPath: "",
    origin: ""
  }
};
