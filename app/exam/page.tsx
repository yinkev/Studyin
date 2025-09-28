import { loadStudyItems } from '../../lib/getItems';
import { loadBlueprint } from '../../lib/getBlueprint';
import { loadLearningObjectives } from '../../lib/getLearningObjectives';
import { computeBlueprintTargets } from '../../lib/blueprintTargets';
import { ExamView } from '../../components/ExamView';

export default async function ExamPage() {
  const items = await loadStudyItems();
  const blueprint = await loadBlueprint();
  const los = await loadLearningObjectives();
  const labelLookup = new Map(los.map((lo) => [lo.id, lo.label]));
  const length = 20;
  const targets = computeBlueprintTargets(blueprint.weights, length).map((target) => ({
    ...target,
    label: labelLookup.get(target.loId) ?? target.loId
  }));

  return (
    <ExamView
      items={items}
      length={length}
      blueprint={{ id: blueprint.id, targets }}
      secondsPerItem={90}
    />
  );
}

