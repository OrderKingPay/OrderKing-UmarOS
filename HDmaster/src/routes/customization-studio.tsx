import { createFileRoute, redirect } from "@tanstack/react-router";
import { UmarOsVisualCustomizationStudio } from "@/components/customization/UmarOsVisualCustomizationStudio";
import { verifyAdminSessionFn } from "@/lib/auth/server-session";

export const Route = createFileRoute("/customization-studio")({
  beforeLoad: async () => {
    try {
      const res = await verifyAdminSessionFn();
      if (!res?.ok) throw redirect({ to: "/login" });
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: CustomizationStudioRoutePage,
});

export function CustomizationStudioRoutePage() {
  return (
    <div className="min-h-screen bg-slate-100/70 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <UmarOsVisualCustomizationStudio />
      </div>
    </div>
  );
}

export default CustomizationStudioRoutePage;
