import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useKidProfiles, KidProfile } from '@/hooks/useKidProfiles';

interface KidSelectionContextType {
  selectedKidId: string | null;
  selectedKid: KidProfile | null;
  availableKids: KidProfile[];
  isLoading: boolean;
  setSelectedKidId: (kidId: string) => void;
}

const KidSelectionContext = createContext<KidSelectionContextType | undefined>(undefined);

export function KidSelectionProvider({ children }: { children: ReactNode }) {
  const { data: availableKids = [], isLoading } = useKidProfiles();
  const [selectedKidId, setSelectedKidIdState] = useState<string | null>(null);

  // Smart auto-selection and persistence
  useEffect(() => {
    if (isLoading || availableKids.length === 0) return;

    // Try to restore from sessionStorage
    const storedKidId = sessionStorage.getItem('selectedKidId');
    
    // Validate stored kid still exists
    if (storedKidId && availableKids.some(kid => kid.id === storedKidId)) {
      setSelectedKidIdState(storedKidId);
      return;
    }

    // Auto-select first kid if none selected or stored kid invalid
    if (!selectedKidId || !availableKids.some(kid => kid.id === selectedKidId)) {
      setSelectedKidIdState(availableKids[0].id);
      sessionStorage.setItem('selectedKidId', availableKids[0].id);
    }
  }, [availableKids, isLoading, selectedKidId]);

  // Validated setter - only allows selecting kids that belong to the parent
  const setSelectedKidId = (kidId: string) => {
    // Validate kid belongs to parent
    if (!availableKids.some(kid => kid.id === kidId)) {
      console.warn(`Attempted to select invalid kid: ${kidId}`);
      return;
    }

    setSelectedKidIdState(kidId);
    sessionStorage.setItem('selectedKidId', kidId);
  };

  // Get the selected kid object
  const selectedKid = selectedKidId 
    ? availableKids.find(kid => kid.id === selectedKidId) || null
    : null;

  return (
    <KidSelectionContext.Provider
      value={{
        selectedKidId,
        selectedKid,
        availableKids,
        isLoading,
        setSelectedKidId,
      }}
    >
      {children}
    </KidSelectionContext.Provider>
  );
}

export function useKidSelection() {
  const context = useContext(KidSelectionContext);
  if (context === undefined) {
    throw new Error('useKidSelection must be used within a KidSelectionProvider');
  }
  return context;
}
