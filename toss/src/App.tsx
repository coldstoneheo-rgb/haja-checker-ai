import { matchRoute, usePath } from "./router";
import SessionsPage from "./pages/SessionsPage";
import PendingPage from "./pages/PendingPage";

export default function App() {
  const route = matchRoute(usePath());
  switch (route.name) {
    case "sessions":
      return <SessionsPage />;
    default:
      return <PendingPage path={route.path} />;
  }
}
