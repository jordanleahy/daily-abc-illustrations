import { AgeGroupOptionManager } from './AgeGroupOptionManager';
import { CharacterThemeOptionManager } from './CharacterThemeOptionManager';
import { GradeLevelOptionManager } from './GradeLevelOptionManager';
import { CityOptionManager } from './CityOptionManager';

interface OptionManagerFactoryProps {
  tableName: string;
  questionId: string;
}

/**
 * Factory component that renders the appropriate option manager
 * based on the table name configured for the question
 */
export function OptionManagerFactory({ tableName, questionId }: OptionManagerFactoryProps) {
  switch (tableName) {
    case 'age_groups':
      return <AgeGroupOptionManager questionId={questionId} />;
    case 'character_themes':
      return <CharacterThemeOptionManager questionId={questionId} />;
    case 'grade_levels':
      return <GradeLevelOptionManager questionId={questionId} />;
    case 'cities':
      return <CityOptionManager questionId={questionId} />;
    default:
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>No option manager available for table: <code className="font-mono">{tableName}</code></p>
        </div>
      );
  }
}
