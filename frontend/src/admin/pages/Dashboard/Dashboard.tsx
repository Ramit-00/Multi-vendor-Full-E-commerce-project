import { useEffect, useState } from "react";
import AdminRoutes from "../../../routes/AdminRoutes";
import AdminNavbar from "../../components/AdminNavbar";
import AdminDrawer from "../../components/AdminDrawer";
import { Alert, Snackbar } from "@mui/material";
import { useAppSelector } from "../../../Redux Toolkit/Store";

const AdminDashboard = () => {
  const { deal, admin, adminPlatform } = useAppSelector((store) => store);
  const [snackbarOpen, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    if (adminPlatform?.successMessage) {
      setSnackbarMsg(adminPlatform.successMessage);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } else if (adminPlatform?.error) {
      setSnackbarMsg(adminPlatform.error);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } else if (deal.dealCreated || deal.dealUpdated || deal.error || admin.categoryUpdated) {
      const msg = deal.error
        ? deal.error
        : deal.dealCreated
        ? "Deal created successfully"
        : deal.dealUpdated
        ? "Deal updated successfully"
        : admin.categoryUpdated
        ? "Category updated successfully"
        : "";
      setSnackbarMsg(msg);
      setSnackbarSeverity(deal.error ? "error" : "success");
      setOpenSnackbar(true);
    }
  }, [
    adminPlatform?.successMessage,
    adminPlatform?.error,
    deal.dealCreated,
    deal.dealUpdated,
    deal.error,
    admin.categoryUpdated,
  ]);

  return (
    <div className="min-h-screen bg-slate-100/60">
      {/* Top Dedicated Admin Header */}
      <AdminNavbar DrawerList={AdminDrawer} />

      {/* Main Layout Area */}
      <div className="flex h-[calc(100vh-68px)] overflow-hidden">
        {/* Left: Dedicated Admin Sidebar */}
        <aside className="hidden lg:block h-full shrink-0">
          <AdminDrawer />
        </aside>

        {/* Right: Dynamic Admin Pages */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <AdminRoutes />
          </div>
        </main>
      </div>

      {/* Operation Feedback Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "12px",
          }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AdminDashboard;