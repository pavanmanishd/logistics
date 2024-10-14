import ProtectedRoute from "@/validation/ProtectedRoute";
export default function Home() {
  return (
    <ProtectedRoute element={<div>Home</div>} />
  );
}
