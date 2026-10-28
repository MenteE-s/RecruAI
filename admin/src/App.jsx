import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout, { RequireSuperadmin } from "./components/Layout";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Users from "./pages/Users";
import Organizations from "./pages/Organizations";
import Plans from "./pages/Plans";
import AIProviders from "./pages/AIProviders";
import Outbox from "./pages/Outbox";
import Content from "./pages/Content";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireSuperadmin>
              <Layout />
            </RequireSuperadmin>
          }
        >
          <Route path="/" element={<Overview />} />
          <Route path="/users" element={<Users />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/ai-providers" element={<AIProviders />} />
          <Route path="/outbox" element={<Outbox />} />
          <Route path="/content" element={<Content />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
