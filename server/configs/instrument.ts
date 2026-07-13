import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://88adc3d0eb4460b4ec8ec68f3051cff3@o4511703646339072.ingest.de.sentry.io/4511703664099408",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});
