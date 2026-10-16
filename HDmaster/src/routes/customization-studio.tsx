import { createFileRoute } from "@tanstack/react-router";
import { UmarOsVisualCustomizationStudio } from "@/components/customization/UmarOsVisualCustomizationStudio";

export const Route = createFileRoute("/customization-studio")({
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
