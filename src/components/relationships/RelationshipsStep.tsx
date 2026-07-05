import { useState } from 'react';
import type { LookupRelationshipDraft } from '../../types/relationship';
import { useProjectStore } from '../../store/projectStore';
import { StepContainer } from '../layout/StepContainer';
import { RelationshipList } from './RelationshipList';
import { RelationshipEditor } from './RelationshipEditor';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export function RelationshipsStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const tables = useProjectStore((s) => s.project.tables);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<LookupRelationshipDraft | null>(null);

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(rel: LookupRelationshipDraft) {
    setEditing(rel);
    setEditorOpen(true);
  }

  return (
    <StepContainer
      title="Add lookups (1:N)"
      description="Relate your tables with lookup columns. The lookup is added to the child (many) table."
      onBack={onBack}
      onNext={onNext}
      nextLabel="Review"
      actions={<Button onClick={openNew} disabled={tables.length === 0}>+ Add lookup</Button>}
    >
      <div className="space-y-4">
        {tables.length === 0 ? (
          <Alert tone="warning" title="No tables yet">
            Add tables before defining lookups.
          </Alert>
        ) : (
          <>
            <Alert tone="info">
              Lookups are optional. A 1:N lookup creates a column on the child table that points at
              a single parent record. Many-to-many requires a bridge table and is out of scope here.
            </Alert>
            <RelationshipList onEdit={openEdit} />
          </>
        )}
      </div>

      <RelationshipEditor open={editorOpen} editing={editing} onClose={() => setEditorOpen(false)} />
    </StepContainer>
  );
}
