import { useCallback, useState } from "react";

export function useCrmMainDashboardUiState() {
  const [activeTab, setActiveTab] = useState("Summary");
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTaskFilter, setActiveTaskFilter] = useState("All tasks");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  return {
    activeTab,
    setActiveTab,
    showCreate,
    setShowCreate,
    editId,
    setEditId,
    saving,
    setSaving,
    activeTaskFilter,
    setActiveTaskFilter,
    collapsedSections,
    toggleSection,
    isModalOpen,
    setIsModalOpen,
  };
}
