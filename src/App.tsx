import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import MobileBottomNav from "./components/MobileBottomNav";
import AppHeader from "./components/AppHeader";
import ScrollToTop from "./components/ScrollToTop";

import HomePage from "./HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import KitchenPage from "./pages/KitchenPage";
import SavedPage from "./pages/SavedPage";
import ProfilePage from "./pages/ProfilePage";
import RecipePage from "./pages/RecipePage";
import AuthPage from "./pages/AuthPage";
import CreatorApplicationPage from "./pages/CreatorApplicationPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import MyRecipesPage from "./pages/MyRecipesPage";
import CreateRecipePage from "./pages/CreateRecipePage";
import CookServicesPage from "./pages/CookServicesPage";
import CookRequestsPage from "./pages/CookRequestsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminRecipeReviewPage from "./pages/AdminRecipeReviewPage";
import AdminCookApplicationsPage from "./pages/AdminCookApplicationsPage";
import PublicCookPage from "./pages/PublicCookPage";
import ServiceRequestPage from "./pages/ServiceRequestPage";
import MyServiceRequestsPage from "./pages/MyServiceRequestsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";

function App() {
  return (
    <BrowserRouter>
    <ScrollToTop />
      <div className="app-shell">
        <AppHeader />

        <Routes>
          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
  path="/privacy"
  element={<PrivacyPolicyPage />}
/>

<Route
  path="/terms"
  element={<TermsPage />}
/>

          <Route
            path="/discover"
            element={<DiscoverPage />}
          />

          <Route
            path="/kitchen"
            element={<KitchenPage />}
          />

          <Route
            path="/saved"
            element={<SavedPage />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/recipe/:id"
            element={<RecipePage />}
          />

          <Route
            path="/auth"
            element={<AuthPage />}
          />

          <Route
            path="/reset-password"
            element={
              <ResetPasswordPage />
            }
          />

          <Route
            path="/become-creator"
            element={
              <CreatorApplicationPage />
            }
          />

          <Route
            element={
              <ProtectedRoute access="cook" />
            }
          >
            <Route
              path="/cook/recipes"
              element={
                <MyRecipesPage />
              }
            />

            <Route
              path="/cook/recipes/new"
              element={
                <CreateRecipePage />
              }
            />

            <Route
              path="/cook/recipes/:id/edit"
              element={
                <CreateRecipePage />
              }
            />

            <Route
              path="/cook/services"
              element={
                <CookServicesPage />
              }
            />

            <Route
              path="/cook/requests"
              element={
                <CookRequestsPage />
              }
            />
          </Route>

        <Route
  element={
    <ProtectedRoute access="admin" />
  }
>
  <Route
    path="/admin"
    element={
      <AdminDashboardPage />
    }
  />

  <Route
    path="/admin/recipes"
    element={
      <AdminRecipeReviewPage />
    }
  />

  <Route
    path="/admin/cook-applications"
    element={
      <AdminCookApplicationsPage />
    }
  />
</Route>

          <Route
            path="/cooks/:username"
            element={
              <PublicCookPage />
            }
          />

          <Route element={<ProtectedRoute />}>
  <Route
    path="/settings"
    element={<SettingsPage />}
  />

  <Route
    path="/services/:serviceId/request"
    element={<ServiceRequestPage />}
  />

  <Route
    path="/my-requests"
    element={<MyServiceRequestsPage />}
  />
</Route>


        </Routes>

        <MobileBottomNav />
      </div>
    </BrowserRouter>
    
  );
}

export default App;