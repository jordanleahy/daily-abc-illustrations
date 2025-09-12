import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface SystemPrompt {
  id: string;
  content: string;
  versionNumber: number;
  isDeployed: boolean;
  lastModified: string;
  deployedAt?: string;
}

export interface SystemPromptVersion {
  id: string;
  content: string;
  versionNumber: number;
  createdAt: string;
  isDeployed: boolean;
  deployedAt?: string;
}

// Mock data for development - this will be replaced with real API calls
const mockSystemPrompts: Record<string, SystemPrompt> = {
  'book-1': {
    id: 'prompt-1',
    content: `You are an AI illustration director for children's alphabet books. Create detailed, consistent visual descriptions for book illustrations.

## Visual Guidelines:
- Illustration Style: Watercolor with soft, dreamy qualities
- Color Palette: Warm, inviting colors with high contrast for readability
- Character Design: Friendly, approachable characters with expressive faces
- Background Style: Simple, uncluttered backgrounds that support the main subject
- Composition: Centered subjects with plenty of white space around edges

## Technical Requirements:
- High resolution suitable for print (300 DPI equivalent)
- Safe margins for text overlay
- Consistent lighting and shadow direction
- Child-safe content only

## Content Guidelines:
- Each letter should be prominently featured
- Objects should be easily recognizable by young children
- Avoid scary, violent, or inappropriate imagery
- Include diverse representation when featuring people
- Maintain educational value while being entertaining

When creating prompts, always specify:
1. The letter being illustrated
2. The main object/concept
3. Specific style elements from the guidelines above
4. Composition and framing details
5. Any special visual elements that reinforce learning`,
    versionNumber: 2,
    isDeployed: true,
    lastModified: '2024-01-15T10:30:00Z',
    deployedAt: '2024-01-15T10:45:00Z'
  }
};

const mockVersions: Record<string, SystemPromptVersion[]> = {
  'book-1': [
    {
      id: 'prompt-1',
      content: mockSystemPrompts['book-1'].content,
      versionNumber: 2,
      createdAt: '2024-01-15T10:30:00Z',
      isDeployed: true,
      deployedAt: '2024-01-15T10:45:00Z'
    },
    {
      id: 'prompt-0',
      content: `You are an AI illustration director. Create visual descriptions for children's alphabet book illustrations.

Style: Watercolor
Colors: Bright and cheerful
Characters: Friendly and approachable
Background: Simple

For each illustration:
- Show the letter clearly
- Make objects recognizable
- Keep content child-appropriate
- Use consistent style`,
      versionNumber: 1,
      createdAt: '2024-01-12T14:20:00Z',
      isDeployed: false
    }
  ]
};

export const useSystemPrompt = (bookId: string) => {
  const [currentPrompt, setCurrentPrompt] = useState<SystemPrompt | null>(null);
  const [versions, setVersions] = useState<SystemPromptVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Load initial data
  useEffect(() => {
    const loadSystemPrompt = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Load current prompt
        const prompt = mockSystemPrompts[bookId] || null;
        setCurrentPrompt(prompt);
        
        // Load versions
        const versionHistory = mockVersions[bookId] || [];
        setVersions(versionHistory);
        
        if (prompt) {
          setEditedContent(prompt.content);
        }
      } catch (error) {
        toast.error('Failed to load system prompt');
        console.error('Error loading system prompt:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSystemPrompt();
  }, [bookId]);

  const startEdit = () => {
    if (currentPrompt) {
      setEditedContent(currentPrompt.content);
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    if (currentPrompt) {
      setEditedContent(currentPrompt.content);
    }
    setIsEditing(false);
  };

  const saveEdit = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      const newVersionNumber = (currentPrompt?.versionNumber || 0) + 1;
      
      // Create new version
      const newPrompt: SystemPrompt = {
        id: `prompt-${newVersionNumber}`,
        content: editedContent,
        versionNumber: newVersionNumber,
        isDeployed: false,
        lastModified: now
      };
      
      // Add to versions history
      const newVersion: SystemPromptVersion = {
        id: newPrompt.id,
        content: newPrompt.content,
        versionNumber: newPrompt.versionNumber,
        createdAt: now,
        isDeployed: false
      };
      
      setCurrentPrompt(newPrompt);
      setVersions(prev => [newVersion, ...prev]);
      setIsEditing(false);
      
      toast.success('System prompt saved successfully');
    } catch (error) {
      toast.error('Failed to save system prompt');
      console.error('Error saving system prompt:', error);
    }
  };

  const deployVersion = async (versionId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const now = new Date().toISOString();
      
      // Update current prompt
      if (currentPrompt && currentPrompt.id === versionId) {
        setCurrentPrompt(prev => prev ? {
          ...prev,
          isDeployed: true,
          deployedAt: now
        } : null);
      }
      
      // Update versions
      setVersions(prev => prev.map(version => 
        version.id === versionId 
          ? { ...version, isDeployed: true, deployedAt: now }
          : { ...version, isDeployed: false, deployedAt: undefined }
      ));
      
      toast.success('Version deployed successfully');
    } catch (error) {
      toast.error('Failed to deploy version');
      console.error('Error deploying version:', error);
    }
  };

  const revertToVersion = async (versionId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const targetVersion = versions.find(v => v.id === versionId);
      if (!targetVersion) return;
      
      const now = new Date().toISOString();
      const newVersionNumber = (currentPrompt?.versionNumber || 0) + 1;
      
      // Create new prompt based on target version
      const newPrompt: SystemPrompt = {
        id: `prompt-${newVersionNumber}`,
        content: targetVersion.content,
        versionNumber: newVersionNumber,
        isDeployed: false,
        lastModified: now
      };
      
      // Add to versions history
      const newVersion: SystemPromptVersion = {
        id: newPrompt.id,
        content: newPrompt.content,
        versionNumber: newPrompt.versionNumber,
        createdAt: now,
        isDeployed: false
      };
      
      setCurrentPrompt(newPrompt);
      setVersions(prev => [newVersion, ...prev]);
      setEditedContent(newPrompt.content);
      
      toast.success(`Reverted to version ${targetVersion.versionNumber}`);
    } catch (error) {
      toast.error('Failed to revert to version');
      console.error('Error reverting to version:', error);
    }
  };

  const updateEditedContent = (content: string) => {
    setEditedContent(content);
  };

  return {
    currentPrompt,
    versions,
    isLoading,
    isEditing,
    editedContent,
    startEdit,
    cancelEdit,
    saveEdit,
    deployVersion,
    revertToVersion,
    updateEditedContent
  };
};