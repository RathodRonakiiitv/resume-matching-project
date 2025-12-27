export default function SkillChips({ title, skills, type }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span
            key={idx}
            className={`px-3 py-1 rounded-full text-sm ${
              type === "match"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
