export default function RecommendationBox({ tips }) {
  return (
    <div className="bg-indigo-50 p-4 rounded-xl">
      <h3 className="font-semibold mb-2">Recommendations</h3>
      <ul className="list-disc list-inside text-sm text-gray-700">
        {tips.map((tip, idx) => (
          <li key={idx}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
