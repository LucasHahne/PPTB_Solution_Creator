import { useState } from 'react';
import type {
  LookupRelationshipDraft,
  ManyToManyRelationshipDraft,
} from '../../types/relationship';
import { useProjectStore } from '../../store/projectStore';
import { StepContainer } from '../layout/StepContainer';
import { RelationshipList } from './RelationshipList';
import { RelationshipEditor } from './RelationshipEditor';
import { ManyToManyList } from './ManyToManyList';
import { ManyToManyEditor } from './ManyToManyEditor';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export function RelationshipsStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const tables = useProjectStore((s) => s.project.tables);
  const hasBusinessTables = tables.some((t) => !t.bridge);

  const [lookupEditorOpen, setLookupEditorOpen] = useState(false);
  const [editingLookup, setEditingLookup] = useState<LookupRelationshipDraft | null>(null);

  const [m2mEditorOpen, setM2mEditorOpen] = useState(false);
  const [editingM2m, setEditingM2m] = useState<ManyToManyRelationshipDraft | null>(null);

  function openNewLookup() {
    setEditingLookup(null);
    setLookupEditorOpen(true);
  }

  function openEditLookup(rel: LookupRelationshipDraft) {
    setEditingLookup(rel);
    setLookupEditorOpen(true);
  }

  function openNewM2m() {
    setEditingM2m(null);
    setM2mEditorOpen(true);
  }

  function openEditM2m(m2m: ManyToManyRelationshipDraft) {
    setEditingM2m(m2m);
    setM2mEditorOpen(true);
  }

  return (
    <StepContainer
      title="Add relationships"
      description="Relate your tables with 1:N lookups or M:N (many-to-many) relationships."
      onBack={onBack}
      onNext={onNext}
      nextLabel="Review"
    >
      <div className="space-y-8">
        {!hasBusinessTables ? (
          <Alert tone="warning" title="No tables yet">
            Add tables before defining relationships.
          </Alert>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  1:N lookups
                </h3>
                <Button size="sm" onClick={openNewLookup}>
                  + Add lookup
                </Button>
              </div>
              <Alert tone="info">
                A 1:N lookup creates a column on the child table that points at a single parent record.
              </Alert>
              <RelationshipList onEdit={openEditLookup} />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  M:N via bridge table
                </h3>
                <Button size="sm" onClick={openNewM2m}>
                  + Add M:N
                </Button>
              </div>
              <Alert tone="info">
                Dataverse has no direct many-to-many lookup. This creates a bridge table (named
                BRIDGE_Table1_Table2 by default) with one lookup to each side. You can add extra
                columns to the bridge on the Fields step.
              </Alert>
              <ManyToManyList onEdit={openEditM2m} />
            </section>
          </>
        )}
      </div>

      <RelationshipEditor
        open={lookupEditorOpen}
        editing={editingLookup}
        onClose={() => setLookupEditorOpen(false)}
      />
      <ManyToManyEditor
        open={m2mEditorOpen}
        editing={editingM2m}
        onClose={() => setM2mEditorOpen(false)}
      />
    </StepContainer>
  );
}
