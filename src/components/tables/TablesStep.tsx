import { useProjectStore } from '../../store/projectStore';
import { StepContainer } from '../layout/StepContainer';
import { TableList } from './TableList';
import { TableEditor } from './TableEditor';
import { Button } from '../ui/Button';

export function TablesStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const tables = useProjectStore((s) => s.project.tables);
  const selectedId = useProjectStore((s) => s.selectedTableId);
  const addTable = useProjectStore((s) => s.addTable);
  const selected = tables.find((t) => t.id === selectedId);

  return (
    <StepContainer
      title="Design your tables"
      description="Add one or more custom tables. Each table starts with a primary name column."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={tables.length === 0}
    >
      <div className="flex h-[28rem] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <TableList />
        {selected ? (
          <TableEditor table={selected} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-slate-400">
            <p>No table selected.</p>
            <Button onClick={() => addTable()}>Add your first table</Button>
          </div>
        )}
      </div>
    </StepContainer>
  );
}
