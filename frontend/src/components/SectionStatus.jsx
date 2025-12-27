export default function SectionStatus({ sections }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">Resume Sections</h3>
      <ul className="space-y-2">
        {sections.presentSections.map(sec => (
          <li key={sec} className="text-green-600">✔ {sec}</li>
        ))}
        {sections.missingSections.map(sec => (
          <li key={sec} className="text-red-500">✖ {sec}</li>
        ))}
      </ul>
    </div>
  );
}
