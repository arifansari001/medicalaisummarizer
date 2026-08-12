// client/src/components/DietaryAdviceCard.tsx
// This file belongs in your CLIENT folder only — never in server/src/services.

interface DietaryAdvice {
  eat: string[];
  avoid: string[];
  generalOnly: boolean;
  disclaimer: string;
}

export default function DietaryAdviceCard({ advice }: { advice?: DietaryAdvice }) {
  const {
    eat = [],
    avoid = [],
    generalOnly = false,
    disclaimer = "This is general wellness guidance, not medical advice. Please consult your doctor or a registered dietitian before making dietary changes.",
  } = advice || ({} as DietaryAdvice);

  return (
    <div className="mt-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 mb-3">
        ⚠️ {disclaimer}
      </div>

      {generalOnly && (
        <p className="text-xs text-slate-500 mb-3">
          This condition can require individualized dietary restrictions —
          the tips below are intentionally kept general. Please follow your
          doctor or dietitian's specific plan.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">
            Generally okay to include
          </h3>
          <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
            {eat.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            Generally worth limiting
          </h3>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            {avoid.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}