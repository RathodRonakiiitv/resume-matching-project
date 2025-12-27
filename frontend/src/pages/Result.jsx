import ScoreGauge from "../components/ScoreGauge";
import SkillChips from "../components/SkillChips";
import SectionStatus from "../components/SectionStatus";
import RecommendationBox from "../components/RecommendationBox";

export default function Result({ data }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ScoreGauge score={data.matchScore} />

      <SectionStatus sections={data.resumeSections} />

      <SkillChips
        title="Matched Skills"
        skills={data.matchedSkills}
        type="match"
      />

      <SkillChips
        title="Missing Skills"
        skills={data.missingSkills}
        type="missing"
      />

      <RecommendationBox tips={data.recommendations} />
    </div>
  );
}
