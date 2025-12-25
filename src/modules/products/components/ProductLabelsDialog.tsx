'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { useProductLabels, type ProductLabel } from '../hooks/useProductLabels';
import { useAuthStore } from '@/core/store/authStore';
import { useModules } from '@/core/hooks/useModules';

interface ProductLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductLabelsDialog({ open, onOpenChange }: ProductLabelsDialogProps) {
  const { labels, loading, refetch } = useProductLabels();
  const { accessToken } = useAuthStore();
  const { findModuleByCode } = useModules();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', color: '#3b82f6' });

  const module = findModuleByCode('products');

  const handleCreate = async () => {
    if (!form.name.trim() || !module) return;

    try {
      const res = await fetch('/api/modules/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          moduleId: module.id,
          name: form.name.trim(),
          color: form.color,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create label');
      }

      toast.success('Label created successfully');
      setForm({ name: '', color: '#3b82f6' });
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create label');
    }
  };

  const handleUpdate = async (label: ProductLabel) => {
    if (!form.name.trim()) return;

    try {
      const res = await fetch('/api/modules/labels', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id: label.id,
          name: form.name.trim(),
          color: form.color,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update label');
      }

      toast.success('Label updated successfully');
      setEditingId(null);
      setForm({ name: '', color: '#3b82f6' });
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update label');
    }
  };

  const handleDelete = async (label: ProductLabel) => {
    if (!confirm(`Delete label "${label.name}"?`)) return;

    try {
      const res = await fetch('/api/modules/labels', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: label.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete label');
      }

      toast.success('Label deleted successfully');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete label');
    }
  };

  const startEdit = (label: ProductLabel) => {
    setEditingId(label.id);
    setForm({ name: label.name, color: label.color });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', color: '#3b82f6' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Product Labels</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Label name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="flex-1"
            />
            <Input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-20"
            />
            {editingId ? (
              <>
                <Button onClick={() => {
                  const label = labels.find((l) => l.id === editingId);
                  if (label) handleUpdate(label);
                }}>
                  Save
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            )}
          </div>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading labels...</div>
          ) : (
            <div className="space-y-2">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: label.color }}
                    />
                    <span>{label.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(label)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(label)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {labels.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No labels yet. Create one above.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


