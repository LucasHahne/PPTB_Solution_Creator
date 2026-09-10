import { useState } from 'react';
import type { LookupRelationshipDraft } from '../../types/relationship';
import type { ManyToManyRelationshipDraft } from '../../types/relationship';
import { useProjectStore } from '../../store/projectStore';
import { StepContainer } from '../layout/StepContainer';
import { RelationshipList } from './RelationshipList';
import { RelationshipEditor } from './RelationshipEditor';
import { ManyToManyList } from './ManyToManyList';
import { ManyToManyEditor } from './ManyToManyEditor';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { cn } from '../ui/cn';

type Tab = '1n' | 'mn';

export function RelationshipsStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const tables = useProjectStore((s) => s.project.tables);
  const [tab, setTab] = useState<Tab>('1n');
  const [oneToManyOpen, setOneToManyOpen] = useState(false);
  const [editingOneToMany, setEditingOneToMany] = useState<LookupRelationshipDraft | null>(null);
  const [manyToManyOpen, setManyToManyOpen] = useState(false);
  const [editingManyToMany, setEditingManyToMany] = useState<ManyToManyRelationshipDraft | null>(
    null,
  );

  function openNewOneToMany() {
    setEditingOneToMany(null);
    setOneToManyOpen(true);
  }

  function openNewManyToMany() {
    setEditingManyToMany(null);
    setManyToManyOpen(true);
  }

  return (
    <StepContainer
      title="Add relationships"
      description="1:N lookups add a column on the child table. M:N creates a bridge table with an autonumber primary and two lookups."
      onBack={onBack}
      onNext={onNext}
      nextLabel="Review"
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openNewOneToMany} disabled={tables.length === 0}>
            + Add 1:N
          </Button>
          <Button onClick={openNewManyToMany} disabled={tables.length < 2}>
            + Add M:N
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {tables.length === 0 ? (
          <Alert tone="warning" title="No tables yet">
            Add tables before defining relationships.
          </Alert>
        ) : (
          <>
            <div className="flex gap-2">
              <TabButton active={tab === '1n'} onClick={() => setTab('1n')}>
                1:N lookups
              </TabButton>
              <TabButton active={tab === 'mn'} onClick={() => setTab('mn')}>
                M:N (bridge)
              </TabButton>
            </div>

            {tab === '1n' ? (
              <>
                <Alert tone="info">
                  A 1:N lookup creates a column on the child (many) table that points at a single
                  parent record.
                </Alert>
                <RelationshipList
                  onEdit={(rel) => {
                    setEditingOneToMany(rel);
                    setOneToManyOpen(true);
                  }}
                />
              </>
            ) : (
              <>
                <Alert tone="info">
                  M:N creates an intersect bridge table. Defaults: display{' '}
                  <code className="text-xs">Bridge {'{Left}'} {'{Right}'}</code>, schema{' '}
                  <code className="text-xs">Bridge{'{Left}'}{'{Right}'}</code>, lookups{' '}
                  <code className="text-xs">Lookup{'{Side}'}</code>, primary autonumber{' '}
                  <code className="text-xs">BRG-{'{SEQNUM:5}'}</code>.
                </Alert>
                {tables.length < 2 ? (
                  <Alert tone="warning" title="Need two tables">
                    Add at least two project tables before creating an M:N relationship.
                  </Alert>
                ) : (
                  <ManyToManyList
                    onEdit={(rel) => {
                      setEditingManyToMany(rel);
                      setManyToManyOpen(true);
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      <RelationshipEditor
        open={oneToManyOpen}
        editing={editingOneToMany}
        onClose={() => setOneToManyOpen(false)}
      />
      <ManyToManyEditor
        open={manyToManyOpen}
        editing={editingManyToMany}
        onClose={() => setManyToManyOpen(false)}
      />
    </StepContainer>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm transition-colors',
        active
          ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-200'
          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
      )}
    >
      {children}
    </button>
  );
}
