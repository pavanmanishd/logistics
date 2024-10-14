import ProtectedRoute from "@/validation/ProtectedRoute";
export default function Home() {
  return (
    <ProtectedRoute>
      <div>
        Home
      </div>
    </ProtectedRoute>
  );
}
