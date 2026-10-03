import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout";
import { BookingsPage } from "@/pages/BookingsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FiltersPage } from "@/pages/FiltersPage";
import { LiveEventsPage } from "@/pages/LiveEventsPage";
import { ReviewsPage } from "@/pages/ReviewsPage";
import { RolesPage } from "@/pages/RolesPage";
import { RollsPage } from "@/pages/RollsPage";
import { RulesPage } from "@/pages/RulesPage";
import { SectionsPage } from "@/pages/SectionsPage";
import { TitlesPage } from "@/pages/TitlesPage";
import { UsersPage } from "@/pages/UsersPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/movies" element={<TitlesPage key="movie" kind="movie" />} />
        <Route path="/shows" element={<TitlesPage key="drama" kind="drama" />} />
        <Route path="/live" element={<LiveEventsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/rolls" element={<RollsPage />} />
        <Route path="/filters" element={<FiltersPage />} />
        <Route path="/sections" element={<SectionsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
      </Routes>
    </AppShell>
  );
}
