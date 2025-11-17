import { ClientJourneyStage, TutorialDefinition } from "../types";
import { claimTrackingTutorials } from "./claim-tracking";
import { documentTutorials } from "./documents";
import { onboardingTutorials } from "./onboarding";
import { recaFormTutorials } from "./reca-form";

export const tutorialDefinitions: TutorialDefinition[] = [
  ...onboardingTutorials,
  ...documentTutorials,
  ...recaFormTutorials,
  ...claimTrackingTutorials,
];

export const tutorialDefinitionMap = new Map(
  tutorialDefinitions.map((definition) => [definition.key, definition])
);

export function getTutorialDefinition(
  key: string
): TutorialDefinition | undefined {
  return tutorialDefinitionMap.get(key);
}

export function getTutorialsForStage(
  stage: ClientJourneyStage
): TutorialDefinition[] {
  return tutorialDefinitions.filter(
    (definition) =>
      !definition.journeyStages || definition.journeyStages.includes(stage)
  );
}
