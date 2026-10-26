import { matchRoute, usePath } from "./router";
import HomePage from "./pages/HomePage";
import SessionsPage from "./pages/SessionsPage";
import SessionNewPage from "./pages/SessionNewPage";
import OverviewPage from "./pages/OverviewPage";
import ChecklistPage from "./pages/ChecklistPage";
import DefectsPage from "./pages/DefectsPage";
import DefectNewPage from "./pages/DefectNewPage";
import DefectDetailPage from "./pages/DefectDetailPage";
import AnalysisPage from "./pages/AnalysisPage";
import ReportPage from "./pages/ReportPage";
import PendingPage from "./pages/PendingPage";

export default function App() {
  const route = matchRoute(usePath());
  // key: 같은 화면 종류에서 세션·하자만 바뀌어도 상태(폼·선택 탭)를 새로 시작한다
  switch (route.name) {
    case "home":
      return <HomePage />;
    case "sessions":
      return <SessionsPage />;
    case "sessionNew":
      return <SessionNewPage />;
    case "overview":
      return <OverviewPage key={route.sessionId} />;
    case "checklist":
      return <ChecklistPage key={route.sessionId} sessionId={route.sessionId} />;
    case "defects":
      return <DefectsPage key={route.sessionId} sessionId={route.sessionId} />;
    case "defectNew":
      return <DefectNewPage key={route.sessionId} sessionId={route.sessionId} />;
    case "defectDetail":
      return (
        <DefectDetailPage
          key={`${route.sessionId}/${route.defectId}`}
          sessionId={route.sessionId}
          defectId={route.defectId}
        />
      );
    case "analysis":
      return <AnalysisPage key={route.sessionId} sessionId={route.sessionId} />;
    case "report":
      return <ReportPage key={route.sessionId} sessionId={route.sessionId} />;
    default:
      return <PendingPage path={route.path} />;
  }
}
